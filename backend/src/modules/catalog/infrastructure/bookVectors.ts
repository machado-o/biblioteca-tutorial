import { embedder as defaultEmbedder } from "../../../infrastructure/embedder";
import { sql } from "../../../infrastructure/postgres";
import type { Embedder } from "../../../shared/Embedder";
import type { CatalogIntegration } from "../domain/CatalogIntegration";

/**
 * Vetores dos livros no próprio PostgreSQL, com a extensão pgvector. Uma linha
 * por livro, com o texto indexado e o vetor; o índice HNSW (distância cosseno)
 * acha os vizinhos mais próximos de uma consulta. A chave estrangeira com
 * ON DELETE CASCADE apaga o vetor junto com o livro, na mesma transação.
 */
const TABLE = "livros_vetores";

/** Serializa quem cria ou recria a tabela, para duas chamadas não brigarem. */
const ENSURE_LOCK = 22002;

/** O HNSW do pgvector indexa vetores de até 2000 dimensões. */
const MAX_DIMENSIONS = 2000;

export type IndexResult = { indexed: number; removed: number };
export type KnnHit = { id: number; distance: number };

/** O formato de texto do pgvector: "[0.9,0.1,0]". */
function toPgvector(vector: Float32Array): string {
  return `[${Array.from(vector).join(",")}]`;
}

/** Literal SQL entre aspas simples (só para DDL, que não aceita parâmetros). */
function quoteLiteral(text: string): string {
  return `'${text.replaceAll("'", "''")}'`;
}

/**
 * Garante que a tabela existe para este embedder e diz se precisou criá-la.
 * O id do modelo fica no comentário da tabela: vetores de outro modelo (ou de
 * outra dimensão) não se comparam com os deste, então trocar de modelo apaga a
 * tabela e começa de novo, como o FT.DROPINDEX ... DD fazia no Redis.
 */
export async function ensureBookVectors(embedder: Embedder): Promise<boolean> {
  const model = async (db: typeof sql) => {
    const [row] = await db`SELECT obj_description(to_regclass(${TABLE}), 'pg_class') AS model` as { model: string | null }[];
    return row?.model ?? null;
  };
  if (await model(sql) === embedder.id) return false;

  const n = embedder.dimensions;
  if (!Number.isInteger(n) || n < 1 || n > MAX_DIMENSIONS) throw new Error(`Dimensão inválida: ${n}`);

  return await sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(${ENSURE_LOCK})`;
    // outra chamada pode ter criado a tabela enquanto esta esperava o lock
    if (await model(tx) === embedder.id) return false;
    // DDL não aceita parâmetros ($1): o texto vai cru, por isso n foi validado acima
    await tx.unsafe(`DROP TABLE IF EXISTS ${TABLE}`);
    await tx.unsafe(`
      CREATE TABLE ${TABLE} (
        livro_id INTEGER PRIMARY KEY REFERENCES livros(id) ON DELETE CASCADE,
        texto TEXT NOT NULL,
        embedding vector(${n}) NOT NULL
      )`);
    await tx.unsafe(`CREATE INDEX ${TABLE}_embedding_idx ON ${TABLE} USING hnsw (embedding vector_cosine_ops)`);
    await tx.unsafe(`COMMENT ON TABLE ${TABLE} IS ${quoteLiteral(embedder.id)}`);
    return true;
  }) as boolean;
}

/** O que o modelo lê de cada livro: o título e, para dar contexto, o autor. */
function indexText(title: string, authorName: string | undefined): string {
  return authorName ? `${title} — ${authorName}` : title;
}

async function syncIds(ids: number[], integration: CatalogIntegration, embedder: Embedder | null): Promise<IndexResult & { created: boolean }> {
  const result = { indexed: 0, removed: 0, created: false };
  const unique = [...new Set(ids)];
  // livro excluído não precisa de nada: o ON DELETE CASCADE já levou o vetor junto
  if (unique.length === 0 || !embedder) return result;

  result.created = await ensureBookVectors(embedder);
  const rows = await sql`SELECT id, titulo AS title, autor_id AS "authorId" FROM livros WHERE id IN ${sql(unique)}` as { id: number; title: string; authorId: number }[];
  if (rows.length === 0) return result;

  // os textos guardados de todos os ids numa consulta só
  const stored = await sql`SELECT livro_id AS id, texto AS text FROM livros_vetores WHERE livro_id IN ${sql(rows.map((row) => row.id))}` as { id: number; text: string }[];
  const storedText = new Map(stored.map((row) => [row.id, row.text]));

  const pending: { id: number; text: string }[] = [];
  for (const row of rows) {
    const text = indexText(row.title, (await integration.author(sql, row.authorId))?.name);
    // só paga o embedding quando o texto mudou (ou o livro ainda não tem vetor)
    if (storedText.get(row.id) !== text) pending.push({ id: row.id, text });
  }
  if (pending.length === 0) return result;

  const vectors = await embedder.embed(pending.map((item) => item.text), "document");
  for (const [i, item] of pending.entries()) {
    await sql`
      INSERT INTO livros_vetores (livro_id, texto, embedding)
      VALUES (${item.id}, ${item.text}, ${toPgvector(vectors[i]!)}::vector)
      ON CONFLICT (livro_id) DO UPDATE SET texto = EXCLUDED.texto, embedding = EXCLUDED.embedding
    `;
  }
  result.indexed = pending.length;
  return result;
}

/**
 * Atualiza os vetores destes livros, depois do COMMIT. Nunca lança: sem Gemini
 * o livro fica sem vetor até a próxima reconciliação, e a escrita do livro, que
 * é o que importa, já aconteceu.
 */
export async function syncBookIndex(ids: number[], integration: CatalogIntegration, embedder: Embedder | null = defaultEmbedder): Promise<IndexResult> {
  try {
    const { created, ...result } = await syncIds(ids, integration, embedder);
    // tabela nova (modelo trocado): os outros livros também precisam de vetor
    if (created) void reconcileBookIndex(integration, embedder);
    return result;
  } catch (error) {
    console.warn("Índice semântico indisponível:", (error as Error).message);
    return { indexed: 0, removed: 0 };
  }
}

/**
 * Passa todos os livros pela sincronização: os sem vetor (seed, Gemini fora do
 * ar no cadastro) e os de texto desatualizado ganham vetor novo; os em dia são
 * pulados pela comparação de texto. Órfãos não existem: a chave estrangeira não deixa.
 */
export async function reconcileBookIndex(integration: CatalogIntegration, embedder: Embedder | null = defaultEmbedder): Promise<IndexResult> {
  try {
    const ids = (await sql`SELECT id FROM livros` as { id: number }[]).map((row) => row.id);
    const { created, ...result } = await syncIds(ids, integration, embedder);
    return result;
  } catch (error) {
    console.warn("Índice semântico indisponível:", (error as Error).message);
    return { indexed: 0, removed: 0 };
  }
}

/** O nome do autor faz parte do texto indexado: renomeá-lo reindexa os livros dele. */
export async function syncAuthorBookIndex(authorId: number, integration: CatalogIntegration): Promise<void> {
  try {
    const rows = await sql`SELECT id FROM livros WHERE autor_id = ${authorId}` as { id: number }[];
    await syncBookIndex(rows.map((row) => row.id), integration);
  } catch (error) {
    console.warn("Índice semântico indisponível:", (error as Error).message);
  }
}

/**
 * Os `limit` livros mais próximos do vetor, do mais perto para o mais longe.
 * O par ORDER BY <=> ... LIMIT é o KNN que o índice HNSW sabe acelerar, e o
 * <=> devolve 1 − cos(θ), a mesma distância do Redis: o limiar não muda.
 */
export async function knnSearch(vector: Float32Array, limit: number): Promise<KnnHit[]> {
  const query = toPgvector(vector);
  return await sql`
    SELECT livro_id AS id, embedding <=> ${query}::vector AS distance
    FROM livros_vetores
    ORDER BY embedding <=> ${query}::vector
    LIMIT ${limit}
  ` as KnnHit[];
}
