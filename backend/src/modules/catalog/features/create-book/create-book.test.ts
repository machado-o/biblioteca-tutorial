import { expect, test } from "bun:test";
import { api, testAuthor, testIsbn, testName } from "#tests/api";

test("UC01: cadastro bibliográfico normaliza ISBN e começa sem cópia física", async () => {
  const author = await testAuthor();
  const isbn = testIsbn();
  const input = { isbn: `${isbn.slice(0, 3)}-${isbn.slice(3)}`, titulo: testName("Título"), autorId: author.id };
  const response = await api("POST", "/livros", input);
  expect(response.status).toBe(201);
  const book = await response.json();
  expect(book.isbn).toBe(isbn);
  expect(book.autorId).toBe(author.id);
  expect(book.totalExemplares).toBe(0);
  expect(book.exemplaresDisponiveis).toBe(0);
  expect(book.numeroRegistro).toBeUndefined();
  const location = response.headers.get("Location");
  expect(location).toBe(`/api/livros/${isbn}`);
  const lookup = await api("GET", location!.replace(/^\/api/, ""));
  expect(lookup.status).toBe(200);
  expect((await lookup.json()).map((item: { isbn: string }) => item.isbn)).toContain(isbn);
  expect((await api("POST", "/livros", input)).status).toBe(409);
  expect((await api("POST", "/livros", { ...input, isbn: testIsbn(), titulo: ` ${input.titulo.toUpperCase()} ` })).status).toBe(409);
});

test("UC01: valida entrada e limite de 5 livros bibliográficos do autor literário", async () => {
  const author = await testAuthor();
  const create = (title: string, isbn = testIsbn()) => api("POST", "/livros", { titulo: title, isbn, autorId: author.id });
  expect((await create(" ")).status).toBe(400);
  expect((await create("Inválido", "123")).status).toBe(400);
  expect((await api("POST", "/livros", { titulo: "Sem autor", isbn: testIsbn(), autorId: 2147483647 })).status).toBe(404);
  for (let i = 0; i < 5; i++) expect((await create(`Livro ${i}`)).status).toBe(201);
  expect((await create("Sexto livro")).status).toBe(409);
});

test("UC01: tentativas concorrentes não ultrapassam limite do autor", async () => {
  const author = await testAuthor();
  const responses = await Promise.all(Array.from({ length: 6 }, (_, i) => api("POST", "/livros", { titulo: `Concorrente ${i}`, isbn: testIsbn(), autorId: author.id })));
  expect(responses.filter((r) => r.status === 201)).toHaveLength(5);
  expect(responses.filter((r) => r.status === 409)).toHaveLength(1);
});

test("UC01: identificador do autor rejeita coerções de booleanos, arrays e formatos não inteiros", async () => {
  const author = await testAuthor();
  for (const authorId of [true, [author.id], null, {}, `${author.id}.0`, ` ${author.id}`, "1e0"]) {
    expect((await api("POST", "/livros", { isbn: testIsbn(), titulo: "Entrada inválida", autorId: authorId })).status).toBe(400);
  }
});
