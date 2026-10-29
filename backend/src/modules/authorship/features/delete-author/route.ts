import type { Hono } from "hono";
import { authorshipIntegration } from "../../../../integration/authorshipIntegration";
import { parseId } from "../../../../shared/validation";
import { deleteAuthor } from "./deleteAuthor";

/** UC08: exclui um autor sem livros. */
export function registerRoutes(api: Hono): void {
  api.delete("/autores/:id", async (c) => {
    await deleteAuthor(parseId(c.req.param("id")), authorshipIntegration);
    return c.body(null, 204);
  });
}
