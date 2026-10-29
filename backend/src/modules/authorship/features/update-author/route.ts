import type { Hono } from "hono";
import { authorshipIntegration } from "../../../../integration/authorshipIntegration";
import { parseId } from "../../../../shared/validation";
import { parseAuthorInput } from "../../domain/Author";
import { authorJson } from "../../infrastructure/json";
import { updateAuthor } from "./updateAuthor";

/** UC07: atualiza um autor. */
export function registerRoutes(api: Hono): void {
  api.put("/autores/:id", async (c) => {
    const id = parseId(c.req.param("id"));
    const input = parseAuthorInput(await c.req.json());
    return c.json(authorJson(await updateAuthor(id, input, authorshipIntegration)));
  });
}
