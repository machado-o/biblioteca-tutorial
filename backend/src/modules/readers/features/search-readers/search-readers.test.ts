import { expect, test } from "bun:test";
import { parseReaderInput } from "../../domain/Reader";
import { SearchReaders } from "./SearchReaders";
import { ana, bruno, InMemoryReaderRepository } from "#tests/reader-doubles";
import { api } from "#tests/api";
import { testReader } from "#tests/reader-fixtures";

type ReaderJson = Awaited<ReturnType<typeof testReader>>;

test("UC10 consulta retorna lista vazia, nome, CPF e identificador", async () => {
  const repo = new InMemoryReaderRepository();
  await repo.insert(parseReaderInput(ana)); await repo.insert(parseReaderInput(bruno));
  const search = new SearchReaders(repo);
  expect(await search.execute("ANA")).toHaveLength(1);
  expect((await search.execute("52998224725"))[0]!.name).toBe("Ana Silva");
  expect(await search.execute("inexistente")).toEqual([]);
  expect(await search.get(2)).toMatchObject(parseReaderInput(bruno));
  await expect(search.get(99)).rejects.toThrow("não encontrado");
});

test("UC10 API: busca por nome, CPF pontuado e consulta individual", async () => {
  const reader = await testReader();
  const list = await api("GET", `/leitores?q=${encodeURIComponent(reader.nome)}`);
  expect(list.status).toBe(200);
  expect(await list.json<ReaderJson[]>()).toContainEqual(reader);
  const cpf = reader.cpf;
  const masked = `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
  expect(await (await api("GET", `/leitores?q=${masked}`)).json<ReaderJson[]>()).toContainEqual(reader);
  expect(await (await api("GET", `/leitores/${reader.id}`)).json<ReaderJson>()).toEqual(reader);
  expect((await api("GET", "/leitores/2147483647")).status).toBe(404);
  expect((await api("GET", "/leitores/invalido")).status).toBe(400);
});
