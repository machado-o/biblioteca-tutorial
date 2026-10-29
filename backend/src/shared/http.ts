import type { Context, Hono } from "hono";
import { InvalidInput } from "./errors";

/** Contrato de cada fatia: o route.ts exporta registerRoutes, descoberto por composition.ts. */
export type RegisterRoutes = (api: Hono) => void;

export function parsePositiveId(value: unknown, label = "Identificador"): number {
  if ((typeof value !== "string" && typeof value !== "number") || !/^\d+$/.test(String(value))) {
    throw new InvalidInput(`${label} inválido.`);
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1 || id > 2_147_483_647) throw new InvalidInput(`${label} inválido.`);
  return id;
}

export async function readJsonBody(c: Context): Promise<Record<string, unknown>> {
  let body: unknown;
  try { body = await c.req.json(); } catch { throw new InvalidInput("Corpo JSON inválido."); }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new InvalidInput("Informe um objeto JSON.");
  }
  return body as Record<string, unknown>;
}

export function parseIdFilter(value: string | undefined): number | undefined {
  return value ? parsePositiveId(value) : undefined;
}
