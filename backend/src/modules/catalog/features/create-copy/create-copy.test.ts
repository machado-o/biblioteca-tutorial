import { expect, test } from "bun:test";
import { api, testAuthor, testBook, testIsbn } from "#tests/api";
import { sql } from "../../../../infrastructure/postgres";
import { prepareCatalog } from "../../infrastructure/schema";

test("UC13: cria cópias distintas e o número não é reutilizado após exclusão", async () => {
  const book = await testBook();
  const create = () => api("POST", "/exemplares", { livroId: book.id, localizacao: "Estante 2", estadoConservacao: "bom" });
  const responses = await Promise.all([create(), create()]);
  expect(responses.every((r) => r.status === 201)).toBe(true);
  const [first, second] = await Promise.all(responses.map((r) => r.json()));
  expect(first.numeroRegistro).not.toBe(second.numeroRegistro);
  expect(first.numeroRegistro).toMatch(/^\d{4}-\d{6}$/);
  expect(first.situacao).toBe("disponivel");
  // Fixture: elimina só o registro criado por este teste para provar a sequência.
  await sql`DELETE FROM exemplares WHERE id = ${second.id}`;
  const third = await (await create()).json();
  expect(third.numeroRegistro).not.toBe(second.numeroRegistro);
  expect((await api("POST", "/exemplares", { livroId: 2147483647, localizacao: "A", estadoConservacao: "bom" })).status).toBe(404);
  expect((await api("POST", "/exemplares", { livroId: book.id, localizacao: " ", estadoConservacao: "bom" })).status).toBe(400);
});

test("UC13: migração preserva número e data de cada livro antigo, sem duplicar na reexecução", async () => {
  const author = await testAuthor();
  const registrationNumber = `1998-${String(author.id).padStart(6, "0")}`;
  const [legacy] = await sql`
    INSERT INTO livros (isbn, titulo, autor_id, data_catalogacao, numero_registro)
    VALUES (${testIsbn()}, 'Legado UC13', ${author.id}, '1998-07-03', ${registrationNumber}) RETURNING id
  ` as { id: number }[];
  await prepareCatalog();
  await prepareCatalog();
  const copies = await sql`SELECT numero_registro, data_catalogacao FROM exemplares WHERE livro_id = ${legacy!.id}` as { numero_registro: string; data_catalogacao: string }[];
  expect(copies).toHaveLength(1);
  expect(copies[0]).toEqual({ numero_registro: registrationNumber, data_catalogacao: "1998-07-03" });
  const [book] = await sql`SELECT numero_registro FROM livros WHERE id = ${legacy!.id}`;
  expect(book.numero_registro).toBeNull();
});

test("UC13: identificador do livro exige inteiro positivo sem coerções de outros tipos", async () => {
  const book = await testBook();
  for (const bookId of [true, [book.id], null, {}, `${book.id}.0`, "1e0", 0]) {
    expect((await api("POST", "/exemplares", { livroId: bookId, localizacao: "A", estadoConservacao: "bom" })).status).toBe(400);
  }
});
