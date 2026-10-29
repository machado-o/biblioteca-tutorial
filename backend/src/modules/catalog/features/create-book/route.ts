import type { Hono } from "hono";
import { catalogIntegration } from "../../../../integration/catalogIntegration";
import { parseBookInput } from "../../domain/Book";
import { bookJson } from "../../infrastructure/json";
import { createBook } from "./createBook";

/** UC01: cataloga um livro (registro bibliográfico). */
export function registerRoutes(api: Hono): void {
  api.post("/livros", async (c) => {
    const book = await createBook(parseBookInput(await c.req.json()), catalogIntegration);
    c.header("Location", `/api/livros/${book.isbn}`);
    return c.json(bookJson(book), 201);
  });
}
