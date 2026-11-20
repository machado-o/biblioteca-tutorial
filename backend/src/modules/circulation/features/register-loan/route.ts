import type { Hono } from "hono";
import { inTransaction } from "../../../../infrastructure/transaction";
import { parsePositiveId, readJsonBody } from "../../../../shared/http";
import { circulationDependencies } from "../../infrastructure/dependencies";
import { loanJson } from "../../infrastructure/json";
import { scheduleLoanReceipt } from "../../infrastructure/loanReceiptJob";
import { RegisterLoan } from "./RegisterLoan";

/**
 * UC19: registra um empréstimo. Quem faz o COMMIT é esta rota, no fim do
 * inTransaction; por isso o comprovante é pedido aqui, depois dele, e não dentro
 * do caso de uso: antes do COMMIT, o worker (ou o envio na hora, por outra
 * conexão) ainda não enxergaria o empréstimo.
 */
export function registerRoutes(api: Hono): void {
  api.post("/emprestimos", async c => {
    const body = await readJsonBody(c);
    const readerId = parsePositiveId(body["leitorId"], "Leitor");
    const copyId = parsePositiveId(body["exemplarId"], "Exemplar");
    const loan = await inTransaction(tx => new RegisterLoan(...circulationDependencies(tx)).execute(readerId, copyId));
    await scheduleLoanReceipt(loan.id);
    return c.json(loanJson(loan), 201);
  });
}
