import type { Hono } from "hono";
import { inTransaction } from "../../../../infrastructure/transaction";
import { parsePositiveId } from "../../../../shared/http";
import { circulationDependencies } from "../../infrastructure/dependencies";
import { loanJson } from "../../infrastructure/json";
import { RegisterReturn } from "./RegisterReturn";

/** UC20: registra a devolução de um empréstimo. */
export function registerRoutes(api: Hono): void {
  api.post("/emprestimos/:id/devolucao", async c => {
    const id = parsePositiveId(c.req.param("id"));
    return c.json(loanJson(await inTransaction(tx => new RegisterReturn(...circulationDependencies(tx)).execute(id))));
  });
}
