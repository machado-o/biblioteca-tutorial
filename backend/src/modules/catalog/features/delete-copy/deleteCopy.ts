import { inTransaction } from "../../../../infrastructure/transaction";
import { civilDate } from "../../../../shared/dates";
import { RuleConflict } from "../../../../shared/errors";
import type { CatalogIntegration } from "../../domain/CatalogIntegration";
import { findCopyView } from "../../infrastructure/copies";

export async function deleteCopy(id: number, integration: CatalogIntegration): Promise<void> {
  await inTransaction(async (tx) => {
    await findCopyView(tx, id, integration, civilDate(new Date()));
    if (await integration.copyHasHistory(tx, id)) throw new RuleConflict("Exemplar possui histórico de reservas ou empréstimos e não pode ser excluído");
    await tx`DELETE FROM exemplares WHERE id = ${id}`;
  });
}
