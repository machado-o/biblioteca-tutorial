import type { Hono } from "hono";
import { catalogIntegration } from "../../../../integration/catalogIntegration";
import { parseId } from "../../../../shared/validation";
import { deleteCopy } from "./deleteCopy";

/** UC16: exclui um exemplar sem histórico de circulação. */
export function registerRoutes(api: Hono): void {
  api.delete("/exemplares/:id", async (c) => {
    await deleteCopy(parseId(c.req.param("id")), catalogIntegration);
    return c.body(null, 204);
  });
}
