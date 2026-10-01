import type { Hono } from "hono";
import type { UseCases } from "../../composition";
import { register as registerBuscarLivro } from "./features/buscar-livro/route";
import { register as registerCadastrarLivro } from "./features/cadastrar-livro/route";
import { register as registerCorrigirIsbn } from "./features/corrigir-isbn/route";

export function registerRoutes(app: Hono, useCases: UseCases): void {
  registerCadastrarLivro(app, useCases);
  registerBuscarLivro(app, useCases);
  registerCorrigirIsbn(app, useCases);

}
