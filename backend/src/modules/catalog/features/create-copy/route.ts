import type { Hono } from "hono";
import { catalogIntegration } from "../../../../integration/catalogIntegration";
import { parseNewCopyInput } from "../../domain/Copy";
import { copyJson } from "../../infrastructure/json";
import { createCopy } from "./createCopy";

/** UC13: cadastra um exemplar (cópia física) de um livro. */
export function registerRoutes(api: Hono): void {
  api.post("/exemplares", async (c) => c.json(copyJson(await createCopy(parseNewCopyInput(await c.req.json()), catalogIntegration)), 201));
}
