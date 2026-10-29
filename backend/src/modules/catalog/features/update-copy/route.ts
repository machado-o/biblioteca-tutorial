import type { Hono } from "hono";
import { catalogIntegration } from "../../../../integration/catalogIntegration";
import { parseId } from "../../../../shared/validation";
import { parseCopyInput } from "../../domain/Copy";
import { copyJson } from "../../infrastructure/json";
import { updateCopy } from "./updateCopy";

/** UC15: atualiza os dados físicos de um exemplar. */
export function registerRoutes(api: Hono): void {
  api.put("/exemplares/:id", async (c) => {
    const id = parseId(c.req.param("id"));
    const input = parseCopyInput(await c.req.json());
    return c.json(copyJson(await updateCopy(id, input, catalogIntegration)));
  });
}
