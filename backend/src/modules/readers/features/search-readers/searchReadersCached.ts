import type { RedisClient } from "bun";
import { redis } from "../../../../infrastructure/redis";
import type { Reader } from "../../domain/Reader";
import { readCachedSearch, writeCachedSearch, type CacheStatus } from "../../infrastructure/searchCache";
import type { SearchReaders } from "./SearchReaders";

/**
 * Cache-aside: procura no Redis; se não estiver lá, roda o caso de uso (que vai
 * ao Postgres) e guarda. O SearchReaders continua igual; o cache o envolve aqui,
 * na fatia, e não num repositório, para o status chegar à rota e o get(id)
 * seguir sem cache.
 */
export async function searchReadersCached(term: string | undefined, search: SearchReaders, client: RedisClient | null = redis): Promise<{ readers: Reader[]; cache: CacheStatus }> {
  const cached = await readCachedSearch(term, client);
  if (cached?.readers) return { readers: cached.readers, cache: "HIT" };
  const readers = await search.execute(term);
  if (!cached) return { readers, cache: "BYPASS" };
  await writeCachedSearch(term, cached.generation, readers, client);
  return { readers, cache: "MISS" };
}
