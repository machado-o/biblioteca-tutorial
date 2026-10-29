import { expect, test } from "bun:test";
import { api, testAuthor } from "#tests/api";

test("UC06: busca por nome, por identificador e informa ausência", async () => {
  const author = await testAuthor();
  for (const q of [author.nome, String(author.id)]) {
    const response = await api("GET", `/autores?q=${encodeURIComponent(q)}`);
    expect(response.status).toBe(200);
    expect((await response.json()).some((a: { id: number }) => a.id === author.id)).toBe(true);
  }
  expect((await (await api("GET", `/autores/${author.id}`)).json()).nome).toBe(author.nome);
  expect((await api("GET", "/autores/2147483647")).status).toBe(404);
});
