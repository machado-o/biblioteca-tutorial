import { sql } from "../../../../infrastructure/postgres";
import { civilDate } from "../../../../shared/dates";
import type { BookView } from "../../domain/Book";
import type { CatalogIntegration } from "../../domain/CatalogIntegration";
import { findBook, toBookView } from "../../infrastructure/books";

/** UC02 também oferece a leitura individual por identidade bibliográfica. */
export async function getBook(id: number, integration: CatalogIntegration, now = new Date()): Promise<BookView> {
  return toBookView(sql, await findBook(sql, id), integration, civilDate(now));
}
