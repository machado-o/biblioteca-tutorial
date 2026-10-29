import type { TransactionSQL } from "bun";
import { sql } from "./postgres";

/**
 * Serializa as escritas desta versão didática na mesma transação PostgreSQL.
 * A verificação de um limite e sua alteração nunca ficam separadas por COMMIT.
 * O lock é compartilhado entre processos; um mutex JavaScript não bastaria.
 */
export async function inTransaction<T>(
  run: (tx: TransactionSQL) => Promise<T>,
): Promise<T> {
  return await sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(22001)`;
    return await run(tx);
  }) as T;
}
