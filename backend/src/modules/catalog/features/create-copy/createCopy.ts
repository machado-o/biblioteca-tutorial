import { inTransaction } from "../../../../infrastructure/transaction";
import { civilDate } from "../../../../shared/dates";
import type { CatalogIntegration } from "../../domain/CatalogIntegration";
import type { CopyView, NewCopyInput } from "../../domain/Copy";
import { RegistrationNumber } from "../../domain/RegistrationNumber";
import { findBook } from "../../infrastructure/books";
import { findCopyView } from "../../infrastructure/copies";

export async function createCopy(input: NewCopyInput, integration: CatalogIntegration, now = new Date()): Promise<CopyView> {
  const today = civilDate(now);
  const year = today.slice(0, 4);
  return inTransaction(async (tx) => {
    await findBook(tx, input.bookId);
    const [counter] = await tx`
      INSERT INTO acervo_sequencias (ano, ultimo) VALUES (${year}, 1)
      ON CONFLICT (ano) DO UPDATE SET ultimo = acervo_sequencias.ultimo + 1 RETURNING ultimo AS last
    ` as { last: number }[];
    const registrationNumber = RegistrationNumber.next(year, counter!.last - 1).value;
    const [row] = await tx`
      INSERT INTO exemplares (livro_id, numero_registro, localizacao, estado_conservacao, data_catalogacao)
      VALUES (${input.bookId}, ${registrationNumber}, ${input.location}, ${input.condition}, ${today}) RETURNING id
    ` as { id: number }[];
    return findCopyView(tx, row!.id, integration, today);
  });
}
