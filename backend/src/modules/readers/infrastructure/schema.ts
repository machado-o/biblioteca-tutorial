import type { SQL } from "bun";
import { sql } from "../../../infrastructure/postgres";

export async function prepareReaders(db: SQL = sql): Promise<void> {
  await db`CREATE TABLE IF NOT EXISTS leitores (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    telefone TEXT NOT NULL
  )`;
}
