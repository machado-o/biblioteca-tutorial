import { inTransaction } from "../../../../infrastructure/transaction";
import { civilDate } from "../../../../shared/dates";
import type { BookInput, BookView } from "../../domain/Book";
import type { CatalogIntegration } from "../../domain/CatalogIntegration";
import { checkBookRules, toBookView, type BookRow } from "../../infrastructure/books";

export async function createBook(input: BookInput, integration: CatalogIntegration, now = new Date()): Promise<BookView> {
  const today = civilDate(now);
  return inTransaction(async (tx) => {
    await checkBookRules(tx, input, integration);
    const [row] = await tx`
      INSERT INTO livros (isbn, titulo, autor_id, data_catalogacao)
      VALUES (${input.isbn}, ${input.title}, ${input.authorId}, ${today})
      RETURNING id, isbn, titulo AS title, autor_id AS "authorId", data_catalogacao AS "catalogedOn"
    ` as BookRow[];
    await integration.syncAuthorBookCounts(tx, [input.authorId]);
    return toBookView(tx, row!, integration, today);
  });
}
