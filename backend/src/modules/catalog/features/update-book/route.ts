import type { Hono } from "hono";
import { catalogIntegration } from "../../../../integration/catalogIntegration";
import { parseId } from "../../../../shared/validation";
import { parseBookInput } from "../../domain/Book";
import { bookJson } from "../../infrastructure/json";
import { updateBook } from "./updateBook";

/** UC03: atualiza os dados bibliográficos de um livro. */
export function registerRoutes(api: Hono): void {
  api.put("/livros/:id", async (c) => {
    const id = parseId(c.req.param("id"));
    const input = parseBookInput(await c.req.json());
    return c.json(bookJson(await updateBook(id, input, catalogIntegration)));
  });
}
