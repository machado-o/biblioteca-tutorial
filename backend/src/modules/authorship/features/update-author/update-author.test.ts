import { expect, test } from "bun:test";
import { api, testAuthor, testIsbn } from "#tests/api";
import { sql } from "../../../../infrastructure/postgres";

test("UC07: atualiza autor e recusa reduzir categoria abaixo da quantidade existente", async () => {
  const author = await testAuthor("didatico");
  for (let i = 0; i < 6; i++) {
    // Fixture de dados bibliográficos: a tabela já existe na aplicação original.
    await sql`INSERT INTO livros (isbn, titulo, autor_id, data_catalogacao, numero_registro) VALUES (${testIsbn()}, ${`Fixture ${i}`}, ${author.id}, '2026-10-15', ${`1888-${String(author.id * 10 + i).padStart(6, '0')}`})`;
  }
  expect((await api("PUT", `/autores/${author.id}`, { nome: "Nome editado", tipo: "literatura" })).status).toBe(409);
  const response = await api("PUT", `/autores/${author.id}`, { nome: "Nome editado", tipo: "didatico" });
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ nome: "Nome editado", livrosNoAcervo: 6 });
  expect((await api("PUT", "/autores/2147483647", { nome: "Ausente", tipo: "didatico" })).status).toBe(404);
});
