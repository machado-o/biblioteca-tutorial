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
  // uma escrita termina entre a leitura no Postgres e a gravação no cache
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

/*
 * Para discutir (passo 06)
 *
 * 1. Valeu a pena? A busca de leitores é uma consulta só, com ILIKE '%termo%'
 *    em nome, e-mail e CPF. Sem índice que sirva a um ILIKE com curinga no
 *    começo, o Postgres varre a tabela inteira; com poucas centenas de leitores
 *    isso leva menos que a ida ao Redis, e o cache quase não economiza. Ele
 *    passa a compensar quando a tabela cresce (dezenas de milhares de leitores)
 *    e os mesmos termos se repetem muito, por exemplo o balcão listando todos
 *    (q vazio) várias vezes por minuto, entre escritas raras.
 *
 * 2. Dados pessoais no Redis. O cache é uma segunda cópia de CPF, e-mail e
 *    telefone. O TTL de 60 s limita quanto tempo um dado excluído sobrevive, e
 *    sem volume o Redis não deixa nada em disco; mas, enquanto vive, o dado
 *    pode ser lido por qualquer um com acesso ao Redis, que aqui não tem senha
 *    nem TLS. Num sistema de verdade eu guardaria só os ids (e buscaria os
 *    dados no Postgres) ou, no mínimo, exigiria ACL, TLS e registraria o Redis
 *    como local de tratamento na documentação da LGPD.
 *
 * 3. Por que geração, e não DEL? Com DEL, uma leitura que começou antes da
 *    escrita pode ler o dado antigo no Postgres, a escrita faz COMMIT e apaga a
 *    chave, e só então a leitura grava o resultado velho, numa chave que agora
 *    ninguém vai apagar: o cache fica errado até o TTL. Com a geração, essa
 *    leitura grava na geração que leu no começo, que a escrita já deixou para
 *    trás; ninguém mais lê ali.
 *
 * 4. Invalidar tudo. Daria para invalidar só os termos afetados, mas seria
 *    preciso saber, para cada leitor alterado, quais termos o encontram (antes
 *    e depois da edição), refazendo a lógica do ILIKE no cache, ou manter um
 *    índice reverso leitor -> termos. É bem mais código e mais chances de errar:
 *    um termo esquecido mostra dados velhos, e a corrida do item 3 volta para
 *    cada termo. Com escritas raras, jogar fora tudo é mais simples e seguro.
 */
