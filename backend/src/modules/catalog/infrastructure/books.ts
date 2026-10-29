import { NotFound, RuleConflict } from "../../../shared/errors";
import { BookLimit } from "../domain/BookLimit";
import type { BookInput, BookView } from "../domain/Book";
import type { CatalogDb, CatalogIntegration } from "../domain/CatalogIntegration";

export type BookRow = { id: number; isbn: string; title: string; authorId: number; catalogedOn: string };

export async function findBook(db: CatalogDb, id: number): Promise<BookRow> {
  const [row] = await db`
    SELECT id, isbn, titulo AS title, autor_id AS "authorId", data_catalogacao AS "catalogedOn"
    FROM livros WHERE id = ${id}
  ` as BookRow[];
  if (!row) throw new NotFound("Livro não encontrado");
  return row;
}

export async function toBookView(db: CatalogDb, row: BookRow, integration: CatalogIntegration, today: string): Promise<BookView> {
  const author = await integration.author(db, row.authorId);
  const [count] = await db`SELECT COUNT(*)::int AS total FROM livros WHERE autor_id = ${row.authorId}` as { total: number }[];
  const [table] = await db`SELECT to_regclass('public.exemplares') IS NOT NULL AS "exists"` as { exists: boolean }[];
  const copies = table?.exists
    ? await db`SELECT id FROM exemplares WHERE livro_id = ${row.id}` as { id: number }[]
    : [];
  const statuses = await Promise.all(copies.map((copy) => integration.copyAvailability(db, copy.id, today)));
  return {
    id: row.id, isbn: row.isbn, title: row.title, authorId: row.authorId,
    authorName: author?.name ?? "Autor não encontrado", catalogedOn: row.catalogedOn,
    authorBookCount: count?.total ?? 0, totalCopies: copies.length,
    availableCopies: statuses.filter((status) => status === "disponivel").length,
  };
}

/** Verificações e escrita usam a mesma transação e o mesmo lock de toda a biblioteca. */
export async function checkBookRules(db: CatalogDb, input: BookInput, integration: CatalogIntegration, ignoreId = 0): Promise<void> {
  const author = await integration.author(db, input.authorId);
  if (!author) throw new NotFound("Autor não cadastrado");
  const [repeatedIsbn] = await db`SELECT id FROM livros WHERE isbn = ${input.isbn} AND id <> ${ignoreId}`;
  if (repeatedIsbn) throw new RuleConflict("Livro já cadastrado");
  const [repeatedTitle] = await db`
    SELECT id FROM livros WHERE autor_id = ${input.authorId}
      AND lower(btrim(titulo)) = lower(btrim(${input.title})) AND id <> ${ignoreId}
  `;
  if (repeatedTitle) throw new RuleConflict("Este autor já tem um livro com este título");
  const [count] = await db`SELECT COUNT(*)::int AS total FROM livros WHERE autor_id = ${input.authorId} AND id <> ${ignoreId}` as { total: number }[];
  BookLimit.check(author.type === "literatura" ? "short" : "large", count!.total);
}
