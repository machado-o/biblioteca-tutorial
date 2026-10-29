import { expect, test } from "bun:test";
import { parseReaderInput } from "../../domain/Reader";
import { UpdateReader } from "./UpdateReader";
import { ana, bruno, InMemoryReaderRepository } from "#tests/reader-doubles";
import { api } from "#tests/api";
import { testReader } from "#tests/reader-fixtures";

test("UC11 permite manter CPF próprio mas recusa CPF de outro leitor sem alterar dados", async () => {
  const repo = new InMemoryReaderRepository();
  await repo.insert(parseReaderInput(ana)); await repo.insert(parseReaderInput(bruno));
  const update = new UpdateReader(repo);
  expect(await update.execute(1, { ...ana, nome: "Ana Atualizada" })).toMatchObject({ id: 1, name: "Ana Atualizada" });
  await expect(update.execute(1, { ...ana, cpf: bruno.cpf })).rejects.toThrow("Já existe");
  expect((await repo.get(1)).cpf).toBe(ana.cpf);
  await expect(update.execute(99, ana)).rejects.toThrow("não encontrado");
});

test("UC11 API: edita mantendo CPF próprio e recusa CPF de outro leitor", async () => {
  const first = await testReader(); const second = await testReader();
  const response = await api("PUT", `/leitores/${first.id}`, { ...first, nome: `${first.nome} atualizado` });
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ id: first.id, cpf: first.cpf, nome: `${first.nome} atualizado` });
  expect((await api("PUT", `/leitores/${first.id}`, { ...first, cpf: second.cpf })).status).toBe(409);
  expect((await api("PUT", `/leitores/${first.id}`, { ...first, email: "inválido" })).status).toBe(400);
  expect((await api("PUT", "/leitores/2147483647", first)).status).toBe(404);
});
