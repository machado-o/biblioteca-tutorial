import type { Hono } from "hono";
import type { UseCases } from "../../composition";
import { register as registerCadastrarSolicitacao } from "./features/cadastrar-solicitacao/route";

export function registerRoutes(app: Hono, useCases: UseCases): void {
  registerCadastrarSolicitacao(app, useCases);
}
