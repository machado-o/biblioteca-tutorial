import { inTransaction } from "../../../../infrastructure/transaction";
import { civilDate } from "../../../../shared/dates";
import type { BookInput, BookView } from "../../domain/Book";
import type { CatalogIntegration } from "../../domain/CatalogIntegration";
import { checkBookRules, findBook, toBookView, type BookRow } from "../../infrastructure/books";

export async function updateBook(id: number, input: BookInput, integration: CatalogIntegration, now = new Date()): Promise<BookView> {
  return inTransaction(async (tx) => {
    const previous = await findBook(tx, id);
    await checkBookRules(tx, input, integration, id);
    const [row] = await tx`UPDATE livros SET isbn = ${input.isbn}, titulo = ${input.title}, autor_id = ${input.authorId} WHERE id = ${id} RETURNING id, isbn, titulo AS title, autor_id AS "authorId", data_catalogacao AS "catalogedOn"` as BookRow[];
    await integration.syncAuthorBookCounts(tx, [previous.authorId, input.authorId]);
    return toBookView(tx, row!, integration, civilDate(now));
  });
}
