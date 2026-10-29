import { sql } from "../../../../infrastructure/postgres";
import type { AuthorView } from "../../domain/Author";
import type { AuthorshipIntegration } from "../../domain/AuthorshipIntegration";
import { toAuthorView, type AuthorRow } from "../../infrastructure/authors";

export async function searchAuthors(term: string, integration: AuthorshipIntegration): Promise<AuthorView[]> {
  const q = term.trim();
  const id = /^\d+$/.test(q) ? Number(q) : 0;
  const rows = await sql`SELECT id, nome AS name, tipo AS type, livros_no_acervo AS "bookCount" FROM autores WHERE ${q} = '' OR id = ${id} OR nome ILIKE ${'%' + q + '%'} ORDER BY nome, id` as AuthorRow[];
  return Promise.all(rows.map((row) => toAuthorView(sql, row, integration)));
}
