import { expect, test } from "bun:test";
import { api, testBook } from "#tests/api";

test("UC04: exclusão física aceita livro sem exemplares e recusa livro vinculado", async () => {
  const unlinked = await testBook();
  expect((await api("DELETE", `/livros/${unlinked.id}`)).status).toBe(204);
  expect((await api("DELETE", `/livros/${unlinked.id}`)).status).toBe(404);
  const linked = await testBook();
  expect((await api("POST", "/exemplares", { livroId: linked.id, localizacao: "A1", estadoConservacao: "bom" })).status).toBe(201);
  expect((await api("DELETE", `/livros/${linked.id}`)).status).toBe(409);
});
