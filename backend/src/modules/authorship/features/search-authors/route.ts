import type { Hono } from "hono";
import { authorshipIntegration } from "../../../../integration/authorshipIntegration";
import { parseId } from "../../../../shared/validation";
import { authorJson } from "../../infrastructure/json";
import { getAuthor } from "./getAuthor";
import { searchAuthors } from "./searchAuthors";

/** UC06: busca autores por nome ou identificador. */
export function registerRoutes(api: Hono): void {
  api.get("/autores", async (c) => c.json((await searchAuthors(c.req.query("q") ?? "", authorshipIntegration)).map(authorJson)));
  api.get("/autores/:id", async (c) => c.json(authorJson(await getAuthor(parseId(c.req.param("id")), authorshipIntegration))));
}
