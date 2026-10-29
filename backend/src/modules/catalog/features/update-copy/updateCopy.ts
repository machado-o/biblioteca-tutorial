import { inTransaction } from "../../../../infrastructure/transaction";
import { civilDate } from "../../../../shared/dates";
import type { CatalogIntegration } from "../../domain/CatalogIntegration";
import type { CopyInput, CopyView } from "../../domain/Copy";
import { findCopyView } from "../../infrastructure/copies";

export async function updateCopy(id: number, input: CopyInput, integration: CatalogIntegration, now = new Date()): Promise<CopyView> {
  const today = civilDate(now);
  return inTransaction(async (tx) => {
    await findCopyView(tx, id, integration, today);
    await tx`UPDATE exemplares SET localizacao = ${input.location}, estado_conservacao = ${input.condition} WHERE id = ${id}`;
    return findCopyView(tx, id, integration, today);
  });
}
