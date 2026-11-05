import type { RedisClient } from "bun";
import { redis } from "../../../../infrastructure/redis";
import type { Reader } from "../../domain/Reader";
import { readCachedSearch, writeCachedSearch, type CacheStatus } from "../../infrastructure/searchCache";
import type { SearchReaders } from "./SearchReaders";

export async function searchReadersCached(term: string | undefined, search: SearchReaders, client: RedisClient | null = redis): Promise<{ readers: Reader[]; cache: CacheStatus }> {
  const cached = await readCachedSearch(term, client);
  if (cached?.readers) return { readers: cached.readers, cache: "HIT" };
  const readers = await search.execute(term);
  if (!cached) return { readers, cache: "BYPASS" };
  await writeCachedSearch(term, cached.generation, readers, client);
  return { readers, cache: "MISS" };
}
