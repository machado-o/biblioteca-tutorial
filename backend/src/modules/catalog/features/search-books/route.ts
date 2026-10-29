import type { Hono } from "hono";
import { catalogIntegration } from "../../../../integration/catalogIntegration";
import { parseId } from "../../../../shared/validation";
import { bookJson } from "../../infrastructure/json";
import { getBook } from "./getBook";
import { searchBooks } from "./searchBooks";

/** UC02: pesquisa livros por ISBN, título ou autor e consulta um livro pelo identificador. */
export function registerRoutes(api: Hono): void {
  api.get("/livros", async (c) => c.json((await searchBooks(c.req.query("q") ?? "", catalogIntegration)).map(bookJson)));
  api.get("/livros/id/:id", async (c) => c.json(bookJson(await getBook(parseId(c.req.param("id")), catalogIntegration))));
  // Mantém o endereço da busca original durante a integração gradual dos PRs.
  api.get("/livros/:q", async (c) => c.json((await searchBooks(c.req.param("q"), catalogIntegration)).map(bookJson)));
}
