import type { SQL } from "bun";
import { NotFound } from "../../../shared/errors";
import type { ReaderRepository } from "../domain/ReaderRepository";
import type { Reader, ReaderInput } from "../domain/Reader";

/** Apenas persistência: as regras pertencem às classes de cada caso de uso. */
export class PostgresReaderRepository implements ReaderRepository {
  constructor(private readonly db: SQL) {}

  async search(q = ""): Promise<Reader[]> {
    const term = `%${q.trim()}%`;
    const digits = q.replace(/\D/g, "");
    return await this.db<Reader[]>`SELECT id, nome AS name, cpf, email, telefone AS phone FROM leitores
      WHERE nome ILIKE ${term} OR email ILIKE ${term}
         OR cpf ILIKE ${term} OR (${digits !== ""} AND cpf LIKE ${`%${digits}%`})
      ORDER BY nome, id`;
  }

  async get(id: number): Promise<Reader> {
    const [reader] = await this.db<Reader[]>`SELECT id, nome AS name, cpf, email, telefone AS phone FROM leitores WHERE id = ${id}`;
    if (!reader) throw new NotFound("Leitor não encontrado.");
    return reader;
  }

  async cpfExists(cpf: string, exceptId: number | null = null): Promise<boolean> {
    const rows = await this.db`SELECT id FROM leitores WHERE cpf = ${cpf}
      AND (${exceptId}::INTEGER IS NULL OR id <> ${exceptId}) LIMIT 1`;
    return rows.length > 0;
  }

  async insert(input: ReaderInput): Promise<Reader> {
    const [reader] = await this.db<Reader[]>`INSERT INTO leitores (nome, cpf, email, telefone)
      VALUES (${input.name}, ${input.cpf}, ${input.email}, ${input.phone})
      RETURNING id, nome AS name, cpf, email, telefone AS phone`;
    return reader!;
  }

  async update(id: number, input: ReaderInput): Promise<Reader> {
    const [reader] = await this.db<Reader[]>`UPDATE leitores
      SET nome = ${input.name}, cpf = ${input.cpf}, email = ${input.email}, telefone = ${input.phone}
      WHERE id = ${id} RETURNING id, nome AS name, cpf, email, telefone AS phone`;
    return reader!;
  }

  async remove(id: number): Promise<void> { await this.db`DELETE FROM leitores WHERE id = ${id}`; }
}
