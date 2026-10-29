import type { Hono } from "hono";
import { catalogIntegration } from "../../../../integration/catalogIntegration";
import { parseId } from "../../../../shared/validation";
import { deleteBook } from "./deleteBook";

/** UC04: exclui um livro sem exemplares. */
export function registerRoutes(api: Hono): void {
  api.delete("/livros/:id", async (c) => {
    await deleteBook(parseId(c.req.param("id")), catalogIntegration);
    return c.body(null, 204);
  });
}
