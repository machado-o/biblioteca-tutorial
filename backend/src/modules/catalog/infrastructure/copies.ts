import { NotFound } from "../../../shared/errors";
import type { CatalogDb, CatalogIntegration } from "../domain/CatalogIntegration";
import type { CopyView } from "../domain/Copy";

type CopyRow = Omit<CopyView, "status">;

export async function findCopyView(db: CatalogDb, id: number, integration: CatalogIntegration, today: string): Promise<CopyView> {
  const [row] = await db`
    SELECT e.id, e.livro_id AS "bookId", e.numero_registro AS "registrationNumber",
      e.localizacao AS "location", e.estado_conservacao AS "condition", e.data_catalogacao AS "catalogedOn",
      l.titulo AS title, l.isbn
    FROM exemplares e JOIN livros l ON l.id = e.livro_id WHERE e.id = ${id}
  ` as CopyRow[];
  if (!row) throw new NotFound("Exemplar não encontrado");
  return {
    id: row.id, bookId: row.bookId, registrationNumber: row.registrationNumber,
    location: row.location, condition: row.condition,
    catalogedOn: row.catalogedOn, title: row.title, isbn: row.isbn,
    status: await integration.copyAvailability(db, row.id, today),
  };
}
