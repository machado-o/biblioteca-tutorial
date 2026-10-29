import { expect, test } from "bun:test";
import { parseReaderInput } from "../../domain/Reader";
import { DeleteReader } from "./DeleteReader";
import { ana, InMemoryReaderRepository } from "#tests/reader-doubles";
import { api } from "#tests/api";
import { testReader } from "#tests/reader-fixtures";

test("UC12 exclusão física só é permitida sem qualquer histórico", async () => {
  const repo = new InMemoryReaderRepository(); await repo.insert(parseReaderInput(ana));
  const withHistory = new DeleteReader(repo, { existsFor: async () => true });
  await expect(withHistory.execute(1)).rejects.toThrow("histórico");
  expect(await repo.get(1)).toMatchObject(parseReaderInput(ana));
  const withoutHistory = new DeleteReader(repo, { existsFor: async () => false });
  await withoutHistory.execute(1);
  await expect(withoutHistory.execute(1)).rejects.toThrow("não encontrado");
});

test("UC12 API: exclusão sem histórico retorna204 e segunda tentativa404", async () => {
  const reader = await testReader();
  expect((await api("DELETE", `/leitores/${reader.id}`)).status).toBe(204);
  expect((await api("DELETE", `/leitores/${reader.id}`)).status).toBe(404);
});
