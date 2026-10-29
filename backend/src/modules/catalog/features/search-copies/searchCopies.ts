import { sql } from "../../../../infrastructure/postgres";
import { InvalidInput } from "../../../../shared/errors";
import { civilDate } from "../../../../shared/dates";
import { parseId } from "../../../../shared/validation";
import type { CatalogIntegration } from "../../domain/CatalogIntegration";
import type { CopyView } from "../../domain/Copy";
import { findCopyView } from "../../infrastructure/copies";

export type CopyFilters = { q?: string; bookId?: string; status?: string };
export async function searchCopies(filters: CopyFilters, integration: CatalogIntegration, now = new Date()): Promise<CopyView[]> {
  const q = filters.q?.trim() ?? "";
  const bookId = filters.bookId ? parseId(filters.bookId) : 0;
  const status = filters.status?.trim() ?? "";
  if (status && !["disponivel", "reservado", "emprestado"].includes(status)) throw new InvalidInput("Situação de exemplar inválida");
  const rows = await sql`
    SELECT e.id FROM exemplares e JOIN livros l ON l.id = e.livro_id
    WHERE (${bookId} = 0 OR e.livro_id = ${bookId}) AND (
      ${q} = '' OR e.numero_registro ILIKE ${'%' + q + '%'} OR l.titulo ILIKE ${'%' + q + '%'}
      OR l.isbn ILIKE ${'%' + q.replace(/[^0-9]/g, '') + '%'} AND ${/\d/.test(q)}
    ) ORDER BY e.numero_registro, e.id
  ` as { id: number }[];
  const copies = await Promise.all(rows.map((row) => findCopyView(sql, row.id, integration, civilDate(now))));
  return status ? copies.filter((copy) => copy.status === status) : copies;
}
