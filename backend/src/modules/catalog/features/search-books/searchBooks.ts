import { sql } from "../../../../infrastructure/postgres";
import { civilDate } from "../../../../shared/dates";
import type { BookView } from "../../domain/Book";
import type { CatalogIntegration } from "../../domain/CatalogIntegration";
import { Isbn } from "../../domain/Isbn";
import { toBookView, type BookRow } from "../../infrastructure/books";

/** Mantém a prioridade existente: ISBN exato, depois título, depois autor. */
export async function searchBooks(term: string, integration: CatalogIntegration, now = new Date()): Promise<BookView[]> {
  const q = term.trim();
  let rows: BookRow[] = [];
  if (q === "") rows = await sql`SELECT id, isbn, titulo AS title, autor_id AS "authorId", data_catalogacao AS "catalogedOn" FROM livros ORDER BY titulo, id` as BookRow[];
  else {
    if (Isbn.isValid(q)) rows = await sql`SELECT id, isbn, titulo AS title, autor_id AS "authorId", data_catalogacao AS "catalogedOn" FROM livros WHERE isbn = ${new Isbn(q).value}` as BookRow[];
    if (rows.length === 0) rows = await sql`SELECT id, isbn, titulo AS title, autor_id AS "authorId", data_catalogacao AS "catalogedOn" FROM livros WHERE titulo ILIKE ${'%' + q + '%'} ORDER BY titulo, id` as BookRow[];
    if (rows.length === 0) {
      const ids = await integration.authorIdsByName(sql, q);
      if (ids.length > 0) rows = await sql`SELECT id, isbn, titulo AS title, autor_id AS "authorId", data_catalogacao AS "catalogedOn" FROM livros WHERE autor_id IN ${sql(ids)} ORDER BY titulo, id` as BookRow[];
    }
  }
  return Promise.all(rows.map((row) => toBookView(sql, row, integration, civilDate(now))));
}
