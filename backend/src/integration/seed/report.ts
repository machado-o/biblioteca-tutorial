import type { SQL } from "bun";
import { SEED_VERSION } from "./schema";

// Chaves em português: espelham o JSON persistido em seed_execucoes.resumo e o payload da API.
export type SeedSummary = { autores: number; livros: number; exemplares: number; leitores: number; emprestimosDevolvidos: number; emprestimosEmDia: number; emprestimosAtrasados: number; reservasAtivas: number; reservasCanceladas: number; reservasExpiradas: number };
export type SeedReport = { executado: boolean; resumo?: SeedSummary; dataReferencia?: string };

/** Fotografia da execução: consultar ou repetir não restaura dados que o professor alterou. */
export async function seedReport(db: SQL): Promise<SeedReport> {
  const [row] = await db`SELECT data_referencia, resumo FROM seed_execucoes WHERE versao = ${SEED_VERSION}`;
  return row ? { executado: true, dataReferencia: row.data_referencia, resumo: (typeof row.resumo === "string" ? JSON.parse(row.resumo) : row.resumo) as SeedSummary } : { executado: false };
}
