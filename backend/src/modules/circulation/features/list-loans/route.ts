import type { Hono } from "hono";
import { sql } from "../../../../infrastructure/postgres";
import { parseIdFilter, parsePositiveId } from "../../../../shared/http";
import { circulationDependencies } from "../../infrastructure/dependencies";
import { loanJson } from "../../infrastructure/json";
import { ListLoans } from "./ListLoans";

/** UC21: consulta empréstimos. */
export function registerRoutes(api: Hono): void {
  api.get("/emprestimos", async c => c.json((await new ListLoans(...circulationDependencies(sql)).execute({
    readerId: parseIdFilter(c.req.query("leitorId")), copyId: parseIdFilter(c.req.query("exemplarId")),
    status: c.req.query("situacao"),
  })).map(loanJson)));
  api.get("/emprestimos/:id", async c => c.json(loanJson(await new ListLoans(...circulationDependencies(sql)).get(parsePositiveId(c.req.param("id"))))));
}
