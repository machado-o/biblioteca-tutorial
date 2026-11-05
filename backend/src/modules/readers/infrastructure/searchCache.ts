import type { RedisClient } from "bun";
import { ready, redis, redisKey } from "../../../infrastructure/redis";
import type { Reader } from "../domain/Reader";

export type CacheStatus = "HIT" | "MISS" | "BYPASS";

const TTL_SECONDS = 60;

const GENERATION = redisKey("leitores", "buscas", "geracao");

function generationHash(generation: number): string {
  return redisKey("leitores", "buscas", String(generation));
}

function field(term = ""): string {
  return `q:${term.trim().toLocaleLowerCase("pt-BR")}`;
}

export async function readCachedSearch(term: string | undefined, client: RedisClient | null = redis): Promise<{ generation: number; readers: Reader[] | null } | null> {
  if (!client) return null;
  try {
    await ready(client);
    const generation = Number(await client.get(GENERATION) ?? 0);
    const cached = await client.hget(generationHash(generation), field(term));
    return { generation, readers: cached === null ? null : JSON.parse(cached) as Reader[] };
  } catch (error) {
    console.warn("Cache de leitores indisponível:", (error as Error).message);
    return null;
  }
}

export async function writeCachedSearch(term: string | undefined, generation: number, readers: Reader[], client: RedisClient | null = redis): Promise<void> {
  if (!client) return;
  try {
    await ready(client);
    await client.send("HSETEX", [generationHash(generation), "EX", String(TTL_SECONDS), "FIELDS", "1", field(term), JSON.stringify(readers)]);
  } catch (error) {
    console.warn("Cache de leitores indisponível:", (error as Error).message);
  }
}

export async function invalidateReaderSearch(client: RedisClient | null = redis): Promise<void> {
  if (!client) return;
  try {
    await ready(client);
    await client.incr(GENERATION);
  } catch (error) {
    console.warn("Cache de leitores indisponível:", (error as Error).message);
  }
}
