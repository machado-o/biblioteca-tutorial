import { expect, test } from "bun:test";
import { api, testName } from "#tests/api";

test("UC05: cadastra autor e valida nome e categoria", async () => {
  const name = testName("Autor UC05");
  const response = await api("POST", "/autores", { nome: ` ${name} `, tipo: "didatico" });
  expect(response.status).toBe(201);
  expect(await response.json()).toMatchObject({ nome: name, tipo: "didatico", livrosNoAcervo: 0 });
  expect((await api("POST", "/autores", { nome: " ", tipo: "literatura" })).status).toBe(400);
  expect((await api("POST", "/autores", { nome: name, tipo: "inexistente" })).status).toBe(400);
});
