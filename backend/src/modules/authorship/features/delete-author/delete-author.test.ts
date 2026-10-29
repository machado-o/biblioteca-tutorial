import { expect, test } from "bun:test";
import { api, testAuthor, testIsbn } from "#tests/api";
import { sql } from "../../../../infrastructure/postgres";
import { prepareAuthorship } from "../..";

test("UC08: exclui autor sem livros, preserva vinculados e não ressuscita a carga inicial", async () => {
  const unlinked = await testAuthor();
  expect((await api("DELETE", `/autores/${unlinked.id}`)).status).toBe(204);
  expect((await api("DELETE", `/autores/${unlinked.id}`)).status).toBe(404);
  await prepareAuthorship();
  const [deleted] = await sql`SELECT id FROM autores WHERE id = ${unlinked.id}`;
  expect(deleted).toBeUndefined();
  const linked = await testAuthor();
  await sql`INSERT INTO livros (isbn, titulo, autor_id, data_catalogacao, numero_registro) VALUES (${testIsbn()}, 'Livro vinculado', ${linked.id}, '2026-10-15', ${`1889-${String(linked.id).padStart(6, '0')}`})`;
  expect((await api("DELETE", `/autores/${linked.id}`)).status).toBe(409);
});

test("UC08: reinicializar não ressuscita autor excluído que pertencia à carga inicial", async () => {
  // Harper Lee é o ID 3 da carga original; o banco de testes não tem obras dessa autora.
  const [original] = await sql`SELECT id, nome, orcid, tipo, livros_no_acervo FROM autores WHERE id = 3`;
  const [link] = await sql`SELECT id FROM livros WHERE autor_id = 3 LIMIT 1`;
  expect(link).toBeUndefined();
  expect(original).toBeDefined();
  try {
    expect((await api("DELETE", "/autores/3")).status).toBe(204);
    await prepareAuthorship();
    const [restored] = await sql`SELECT id FROM autores WHERE id = 3`;
    expect(restored).toBeUndefined();
  } finally {
    // Restaura o fixture original para que os demais testes continuem independentes.
    await sql`INSERT INTO autores (id, nome, orcid, tipo, livros_no_acervo)
      VALUES (3, ${original.nome}, ${original.orcid}, ${original.tipo}, ${original.livros_no_acervo})
      ON CONFLICT (id) DO NOTHING`;
  }
});
