import { expect, test } from "bun:test";
import { api, testCopy } from "#tests/api";

test("UC14: consulta exemplar e combina filtros de registro, livro e disponibilidade", async () => {
  const copy = await testCopy();
  const response = await api("GET", `/exemplares?q=${encodeURIComponent(copy.numeroRegistro)}&livroId=${copy.livroId}&situacao=disponivel`);
  expect(response.status).toBe(200);
  expect((await response.json()).map((e: { id: number }) => e.id)).toContain(copy.id);
  const detail = await api("GET", `/exemplares/${copy.id}`);
  expect(detail.status).toBe(200);
  expect(await detail.json()).toMatchObject({ id: copy.id, livroId: copy.livroId, situacao: "disponivel" });
  expect((await api("GET", "/exemplares/2147483647")).status).toBe(404);
  expect((await api("GET", "/exemplares?situacao=desconhecida")).status).toBe(400);
});
