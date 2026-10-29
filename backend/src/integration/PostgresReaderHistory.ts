import type { SQL } from "bun";
import type { ReaderHistory } from "../modules/readers";

/** Integra os módulos sem fazer leitores conhecer o esquema de circulação. */
export class PostgresReaderHistory implements ReaderHistory {
  constructor(private readonly db: SQL) {}

  async existsFor(readerId: number): Promise<boolean> {
    for (const table of ["reservas", "emprestimos"] as const) {
      const [existing] = await this.db`SELECT to_regclass(${table}) AS found`;
      if (!existing?.found) continue;
      const rows = table === "reservas"
        ? await this.db`SELECT id FROM reservas WHERE leitor_id = ${readerId} LIMIT 1`
        : await this.db`SELECT id FROM emprestimos WHERE leitor_id = ${readerId} LIMIT 1`;
      if (rows.length) return true;
    }
    return false;
  }
}
