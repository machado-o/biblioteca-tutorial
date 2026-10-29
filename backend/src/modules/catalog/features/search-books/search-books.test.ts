import { expect, test } from "bun:test";
import { api, testAuthor, testIsbn, testName } from "#tests/api";

test("UC02: pesquisa por ISBN, título e autor e mantém endereço legado", async () => {
  const author = await testAuthor();
  const input = { isbn: testIsbn(), titulo: testName("Pesquisa"), autorId: author.id };
  const book = await (await api("POST", "/livros", input)).json();
  for (const term of [input.isbn, input.titulo, author.nome]) {
    const response = await api("GET", `/livros?q=${encodeURIComponent(term)}`);
    expect(response.status).toBe(200);
    expect((await response.json()).some((l: { id: number }) => l.id === book.id)).toBe(true);
  }
  expect((await (await api("GET", `/livros/${input.isbn}`)).json())[0].id).toBe(book.id);
  expect((await (await api("GET", `/livros/id/${book.id}`)).json()).id).toBe(book.id);
  expect((await api("GET", "/livros/id/2147483647")).status).toBe(404);
});
