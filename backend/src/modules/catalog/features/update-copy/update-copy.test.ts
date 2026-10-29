import { expect, test } from "bun:test";
import { api, testCopy } from "#tests/api";

test("UC15: altera dados físicos preservando livro e número de registro", async () => {
  const copy = await testCopy();
  const input = { localizacao: "Sala 3 / Estante B", estadoConservacao: "desgastado" };
  const response = await api("PUT", `/exemplares/${copy.id}`, { ...input, livroId: 2147483647, numeroRegistro: "1999-000001" });
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ ...input, livroId: copy.livroId, numeroRegistro: copy.numeroRegistro });
  expect((await api("PUT", `/exemplares/${copy.id}`, { ...input, localizacao: " " })).status).toBe(400);
  expect((await api("PUT", "/exemplares/2147483647", input)).status).toBe(404);
});
