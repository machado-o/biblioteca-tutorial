import { expect, test } from "bun:test";
import { api, testAuthor, testIsbn } from "#tests/api";
import { createHashEmbedder } from "../../../infrastructure/hashEmbedder";
import { sql } from "../../../infrastructure/postgres";
import { catalogIntegration } from "../../../integration/catalogIntegration";
import type { Embedder } from "../../../shared/Embedder";
import { reconcileBookIndex, syncBookIndex } from "./bookVectors";

// a suíte roda com EMBEDDING_PROVIDER=hash: cada escrita de livro grava o vetor de verdade, sem rede
type VectorRow = { text: string; dims: number };

async function vectorOf(id: number): Promise<VectorRow | undefined> {
  const [row] = await sql`SELECT texto AS text, vector_dims(embedding) AS dims FROM livros_vetores WHERE livro_id = ${id}` as VectorRow[];
  return row;
}

async function columnType(): Promise<string | undefined> {
  const [row] = await sql`
    SELECT format_type(atttypid, atttypmod) AS type FROM pg_attribute
    WHERE attrelid = to_regclass('livros_vetores') AND attname = 'embedding'
  ` as { type: string }[];
  return row?.type;
}

async function createBook(title: string, authorId: number): Promise<{ id: number; isbn: string }> {
  const response = await api("POST", "/livros", { isbn: testIsbn(), titulo: title, autorId: authorId });
  expect(response.status).toBe(201);
  return response.json();
}

function token(): string {
  return crypto.randomUUID().slice(0, 8);
}

const base = createHashEmbedder();

test("UC24 pgvector: cadastrar grava o texto e um vetor da dimensão do embedder", async () => {
  const author = await testAuthor();
  const title = `Livro ${token()}`;
  const book = await createBook(title, author.id);
  expect(await vectorOf(book.id)).toEqual({ text: `${title} — ${author.nome}`, dims: base.dimensions });
});

test("UC24 pgvector: editar o título atualiza o texto e o vetor", async () => {
  const author = await testAuthor();
  const book = await createBook(`Livro ${token()}`, author.id);
  const [before] = await sql`SELECT embedding::text AS v FROM livros_vetores WHERE livro_id = ${book.id}` as { v: string }[];
  const title = `Novo título ${token()}`;
  expect((await api("PUT", `/livros/${book.id}`, { isbn: book.isbn, titulo: title, autorId: author.id })).status).toBe(200);
  const [after] = await sql`SELECT embedding::text AS v FROM livros_vetores WHERE livro_id = ${book.id}` as { v: string }[];
  expect((await vectorOf(book.id))?.text).toBe(`${title} — ${author.nome}`);
  expect(after!.v).not.toBe(before!.v);
});

test("UC24 pgvector: excluir o livro remove a linha (ON DELETE CASCADE)", async () => {
  const author = await testAuthor();
  const book = await createBook(`Livro ${token()}`, author.id);
  expect(await vectorOf(book.id)).toBeDefined();
  expect((await api("DELETE", `/livros/${book.id}`)).status).toBe(204);
  expect(await vectorOf(book.id)).toBeUndefined();
});

test("UC24 pgvector: renomear o autor atualiza o texto dos livros dele", async () => {
  const author = await testAuthor();
  const book = await createBook(`Livro ${token()}`, author.id);
  const name = `Autora ${token()}`;
  expect((await api("PUT", `/autores/${author.id}`, { nome: name, tipo: "literatura" })).status).toBe(200);
  expect((await vectorOf(book.id))?.text).toEndWith(`— ${name}`);
});

test("UC24 pgvector: livro inserido direto com SQL (seed) ganha vetor na reconciliação", async () => {
  const author = await testAuthor();
  const title = `Do seed ${token()}`;
  const [row] = await sql`
    INSERT INTO livros (isbn, titulo, autor_id, data_catalogacao)
    VALUES (${testIsbn()}, ${title}, ${author.id}, '2026-11-15') RETURNING id
  ` as { id: number }[];
  expect(await vectorOf(row!.id)).toBeUndefined();
  const { indexed } = await reconcileBookIndex(catalogIntegration, base);
  expect(indexed).toBeGreaterThanOrEqual(1);
  expect(await vectorOf(row!.id)).toEqual({ text: `${title} — ${author.nome}`, dims: base.dimensions });
});

test("UC24 pgvector: sincronizar de novo com o texto igual não chama o embedder", async () => {
  const author = await testAuthor();
  const book = await createBook(`Livro ${token()}`, author.id);
  let calls = 0;
  const counter: Embedder = { ...base, embed: (texts, purpose) => { calls++; return base.embed(texts, purpose); } };
  expect(await syncBookIndex([book.id], catalogIntegration, counter)).toEqual({ indexed: 0, removed: 0 });
  expect(calls).toBe(0);
});

test("UC24 pgvector: com o embedder fora do ar a sincronização não lança e o livro fica", async () => {
  const author = await testAuthor();
  const book = await createBook(`Livro ${token()}`, author.id);
  await sql`DELETE FROM livros_vetores WHERE livro_id = ${book.id}`;
  const down: Embedder = { ...base, embed: async () => { throw new Error("fora do ar"); } };
  expect(await syncBookIndex([book.id], catalogIntegration, down)).toEqual({ indexed: 0, removed: 0 });
  expect(await sql`SELECT id FROM livros WHERE id = ${book.id}`).toHaveLength(1);
  expect(await vectorOf(book.id)).toBeUndefined();
  // a próxima reconciliação, com o embedder de volta, recupera o vetor
  await reconcileBookIndex(catalogIntegration, base);
  expect(await vectorOf(book.id)).toBeDefined();
});

test("UC24 pgvector: um embedder de outra dimensão refaz a tabela e reindexa", async () => {
  const author = await testAuthor();
  const book = await createBook(`Livro ${token()}`, author.id);
  const other = createHashEmbedder(512);
  try {
    await reconcileBookIndex(catalogIntegration, other);
    expect(await columnType()).toBe("vector(512)");
    expect((await vectorOf(book.id))?.dims).toBe(512);
    const [row] = await sql`
      SELECT count(*)::int AS missing FROM livros l
      LEFT JOIN livros_vetores v ON v.livro_id = l.id WHERE v.livro_id IS NULL
    ` as { missing: number }[];
    expect(row!.missing).toBe(0);
  } finally {
    // o banco de testes é compartilhado: devolve a tabela de 1024 dimensões aos outros testes
    await reconcileBookIndex(catalogIntegration, base);
  }
  expect(await columnType()).toBe(`vector(${base.dimensions})`);
  expect((await vectorOf(book.id))?.dims).toBe(base.dimensions);
});

test("UC24 pgvector: o índice é HNSW com distância cosseno", async () => {
  const [index] = await sql`SELECT indexdef FROM pg_indexes WHERE tablename = 'livros_vetores' AND indexdef ILIKE '%hnsw%'` as { indexdef: string }[];
  expect(index?.indexdef).toContain("vector_cosine_ops");
});
