import { expect, test } from "bun:test";
import { api } from "#tests/api";
import { testReader } from "#tests/reader-fixtures";
import { sql } from "../../../../infrastructure/postgres";
import { createRedis, ready, redis, redisKey } from "../../../../infrastructure/redis";
import { PostgresReaderRepository } from "../../infrastructure/PostgresReaderRepository";
import { invalidateReaderSearch, readCachedSearch, writeCachedSearch } from "../../infrastructure/searchCache";
import { SearchReaders } from "./SearchReaders";
import { searchReadersCached } from "./searchReadersCached";

type ReaderJson = Awaited<ReturnType<typeof testReader>>;

async function search(q?: string) {
  const response = await api("GET", q === undefined ? "/leitores" : `/leitores?q=${encodeURIComponent(q)}`);
  expect(response.status).toBe(200);
  return { cache: response.headers.get("X-Cache"), readers: await response.json<ReaderJson[]>() };
}

test("UC10: a segunda busca vem do cache", async () => {
  const reader = await testReader();
  const first = await search(reader.nome);
  expect(first.cache).toBe("MISS");
  expect(first.readers).toEqual([reader]);
  const second = await search(reader.nome);
  expect(second.cache).toBe("HIT");
  expect(second.readers).toEqual(first.readers);
});

test("UC10: espaços nas pontas e maiúsculas caem no mesmo termo", async () => {
  const reader = await testReader();
  expect((await search(reader.nome)).cache).toBe("MISS");
  const other = await search(`  ${reader.nome.toUpperCase()}  `);
  expect(other.cache).toBe("HIT");
  expect(other.readers).toEqual([reader]);
});

test("UC10: sem q e com q vazio compartilham o resultado", async () => {
  await invalidateReaderSearch();
  const withoutQ = await search();
  expect(withoutQ.cache).toBe("MISS");
  const empty = await search("");
  expect(empty.cache).toBe("HIT");
  expect(empty.readers).toEqual(withoutQ.readers);
});

test("UC09, UC11, UC12: cadastrar, editar e excluir leitor invalidam o cache", async () => {
  await search("");
  expect((await search("")).cache).toBe("HIT");
  const reader = await testReader();
  const afterCreate = await search("");
  expect(afterCreate.cache).toBe("MISS");
  expect(afterCreate.readers).toContainEqual(reader);

  await search(reader.cpf);
  expect((await search(reader.cpf)).cache).toBe("HIT");
  const renamed = { ...reader, nome: `${reader.nome} atualizado` };
  expect((await api("PUT", `/leitores/${reader.id}`, renamed)).status).toBe(200);
  const afterUpdate = await search(reader.cpf);
  expect(afterUpdate.cache).toBe("MISS");
  expect(afterUpdate.readers).toEqual([renamed]);

  expect((await search(reader.cpf)).cache).toBe("HIT");
  expect((await api("DELETE", `/leitores/${reader.id}`)).status).toBe(204);
  const afterDelete = await search(reader.cpf);
  expect(afterDelete.cache).toBe("MISS");
  expect(afterDelete.readers).toEqual([]);
});

test("UC23: depois de um seed a próxima busca é MISS", async () => {
  await search("");
  expect((await search("")).cache).toBe("HIT");
  expect((await api("POST", "/seed")).status).toBe(200);
  expect((await search("")).cache).toBe("MISS");
});

test("UC10: resultado velho gravado numa geração antiga não é lido", async () => {
  const term = crypto.randomUUID();
  const read = await readCachedSearch(term);
  expect(read!.readers).toBeNull();
  await invalidateReaderSearch();
  await writeCachedSearch(term, read!.generation, [{ id: 1, name: "Velho", cpf: "52998224725", email: "velho@exemplo.com", phone: "27999991234" }]);
  expect((await readCachedSearch(term))!.readers).toBeNull();
});

test("UC10: sem Redis a busca responde do Postgres e a invalidação não falha", async () => {
  const reader = await testReader();
  const dead = createRedis("redis://127.0.0.1:1", { autoReconnect: false });
  const result = await searchReadersCached(reader.nome, new SearchReaders(new PostgresReaderRepository(sql)), dead);
  expect(result.cache).toBe("BYPASS");
  expect(result.readers.map(r => r.id)).toEqual([reader.id]);
  await invalidateReaderSearch(dead);
});

test("UC10: cada termo guardado expira sozinho", async () => {
  const reader = await testReader();
  expect((await search(reader.nome)).cache).toBe("MISS");
  const { generation } = (await readCachedSearch(reader.nome))!;
  const client = await ready(redis!);
  const field = `q:${reader.nome.toLocaleLowerCase("pt-BR")}`;
  const [ttl] = await client.send("HTTL", [redisKey("leitores", "buscas", String(generation)), "FIELDS", "1", field]) as number[];
  expect(ttl).toBeGreaterThan(0);
  expect(ttl).toBeLessThanOrEqual(60);
});
