import type { Hono } from "hono";
import { catalogIntegration } from "../../../../integration/catalogIntegration";
import { parseId } from "../../../../shared/validation";
import { copyJson } from "../../infrastructure/json";
import { getCopy } from "./getCopy";
import { searchCopies } from "./searchCopies";

/** UC14: pesquisa exemplares por registro, livro e disponibilidade e consulta um exemplar. */
export function registerRoutes(api: Hono): void {
  api.get("/exemplares", async (c) => {
    const query = c.req.query();
    const copies = await searchCopies({ q: query.q, bookId: query["livroId"], status: query["situacao"] }, catalogIntegration);
    return c.json(copies.map(copyJson));
  });
  api.get("/exemplares/:id", async (c) => c.json(copyJson(await getCopy(parseId(c.req.param("id")), catalogIntegration))));
}
