import type { Hono } from "hono";
import { parseAuthorInput } from "../../domain/Author";
import { authorJson } from "../../infrastructure/json";
import { createAuthor } from "./createAuthor";

/** UC05: cadastra um autor. */
export function registerRoutes(api: Hono): void {
  api.post("/autores", async (c) => c.json(authorJson(await createAuthor(parseAuthorInput(await c.req.json()))), 201));
}
