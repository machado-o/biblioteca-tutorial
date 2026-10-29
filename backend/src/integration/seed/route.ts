import type { Hono } from "hono";
import { sql } from "../../infrastructure/postgres";
import { seedReport } from "./report";
import { runSeed } from "./run";

/** UC23: consulta e executa a carga de demonstração (seed). */
export function registerRoutes(api: Hono): void {
  api.get("/seed", async c => c.json(await seedReport(sql)));
  api.post("/seed", async c => c.json(await runSeed(), 200));
}
