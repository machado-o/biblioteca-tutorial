import { expect, test } from "bun:test";
import { api, testBook, testIsbn } from "#tests/api";

test("UC03: edição preserva identidade e catalogação e rejeita ISBN duplicado", async () => {
  const book = await testBook();
  const other = await testBook();
  const input = { isbn: testIsbn(), titulo: "Título atualizado", autorId: book.autorId };
  const response = await api("PUT", `/livros/${book.id}`, input);
  expect(response.status).toBe(200);
  const updated = await response.json();
  expect(updated.id).toBe(book.id);
  expect(updated.dataCatalogacao).toBe(book.dataCatalogacao);
  expect(updated.titulo).toBe(input.titulo);
  expect((await api("PUT", `/livros/${book.id}`, { ...input, isbn: other.isbn })).status).toBe(409);
  expect((await api("PUT", "/livros/2147483647", input)).status).toBe(404);
});
