import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { DomainError, InvalidValue } from "./shared/domain-errors";
import { InvalidInput, NotFound, RuleConflict } from "./shared/errors";
import type { RegisterRoutes } from "./shared/http";

/** O build do React (`bun run build` em frontend/), relativo à pasta backend/. */
const FRONTEND = "../frontend/dist";

function errorResponse(error: unknown): Response {
  if (error instanceof InvalidInput || error instanceof InvalidValue || error instanceof SyntaxError) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof NotFound) {
    return Response.json({ error: error.message }, { status: 404 });
  }

  if (error instanceof RuleConflict || error instanceof DomainError) {
    return Response.json({ error: error.message }, { status: 409 });
  }

  console.error(error);

  return Response.json({ error: "Erro interno" }, { status: 500 });
}

export function createApp(slices: RegisterRoutes[] = []) {
  const api = new Hono();

  api.get("/", (context) => context.json({ message: "API da Biblioteca" }));

  for (const registerRoutes of slices) registerRoutes(api);

  const app = new Hono();

  // toda a API mora sob /api: o resto dos endereços fica livre para o frontend
  app.route("/api", api);
  app.all("/api/*", (context) => context.notFound());

  // arquivos do build: index.html, JS, CSS, ícone
  app.use("*", serveStatic({ root: FRONTEND }));

  // qualquer outro endereço (/cadastrar, por exemplo) é rota do React Router:
  // devolve o index.html e o roteador do navegador decide o que mostrar
  app.get("*", serveStatic({ path: `${FRONTEND}/index.html` }));

  app.notFound((context) =>
    context.json({ error: "Recurso não encontrado" }, 404),
  );

  app.onError((error) => errorResponse(error));

  return app;
}

export function createServer(
  slices: RegisterRoutes[],
  port = Number(process.env.PORT ?? 3000),
) {
  return Bun.serve({ port, fetch: createApp(slices).fetch });
}
