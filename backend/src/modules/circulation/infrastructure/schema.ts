import type { SQL } from "bun";
import { sql } from "../../../infrastructure/postgres";

/** Sem FKs entre módulos: os vínculos são validados pelas portas na mesma transação. */
export async function prepareCirculation(db: SQL = sql): Promise<void> {
  await db`CREATE TABLE IF NOT EXISTS reservas (
    id SERIAL PRIMARY KEY,
    leitor_id INTEGER NOT NULL,
    exemplar_id INTEGER NOT NULL,
    data_reserva TEXT NOT NULL,
    data_limite_retirada TEXT NOT NULL,
    data_expiracao TEXT NOT NULL,
    situacao TEXT NOT NULL CHECK (situacao IN ('ativa', 'cancelada', 'atendida'))
  )`;
  await db`CREATE INDEX IF NOT EXISTS reservas_leitor ON reservas (leitor_id)`;
  await db`CREATE INDEX IF NOT EXISTS reservas_exemplar ON reservas (exemplar_id)`;
  await db`CREATE TABLE IF NOT EXISTS emprestimos (
    id SERIAL PRIMARY KEY,
    leitor_id INTEGER NOT NULL,
    exemplar_id INTEGER NOT NULL,
    data_emprestimo TEXT NOT NULL,
    data_prevista_devolucao TEXT NOT NULL,
    data_devolucao TEXT
  )`;
  await db`CREATE UNIQUE INDEX IF NOT EXISTS emprestimo_aberto_exemplar ON emprestimos (exemplar_id)
    WHERE data_devolucao IS NULL`;
  await db`CREATE INDEX IF NOT EXISTS emprestimos_leitor ON emprestimos (leitor_id)`;
}
