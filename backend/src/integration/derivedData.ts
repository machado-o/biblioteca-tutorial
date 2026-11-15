import type { RedisClient } from "bun";
import { redis } from "../infrastructure/redis";
import { invalidateAuthorSearch } from "../modules/authorship";
import { reconcileBookIndex } from "../modules/catalog";
import { catalogIntegration } from "./catalogIntegration";

/**
 * Os dados derivados podem ter ficado para trás: o servidor esteve parado
 * enquanto o banco mudou, ou o seed escreveu direto nas tabelas. Recalcula tudo
 * a partir das tabelas de origem: o cache de autores (Redis) e os vetores dos
 * livros (pgvector, no próprio Postgres).
 */
export async function refreshDerivedData(): Promise<void> {
  await invalidateAuthorSearch();
  const { indexed } = await reconcileBookIndex(catalogIntegration);
  console.log(`Índice semântico: ${indexed} livro(s) indexado(s)`);
}

/**
 * Enquanto o Redis esteve fora, as escritas no Postgres continuaram, mas não
 * conseguiram invalidar o cache de autores. Por isso cada conexão (a primeira e
 * cada reconexão automática) invalida o cache. Os vetores dos livros não moram
 * mais no Redis: reconectar não exige reindexar nada.
 */
export function refreshDerivedDataOnConnect(client: RedisClient | null = redis, refresh: () => Promise<void> = invalidateAuthorSearch): void {
  if (!client) return;
  client.onconnect = () => { void refresh(); };
}
