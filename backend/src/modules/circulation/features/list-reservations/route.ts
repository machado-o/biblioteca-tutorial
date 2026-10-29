import type { Hono } from "hono";
import { sql } from "../../../../infrastructure/postgres";
import { parseIdFilter, parsePositiveId } from "../../../../shared/http";
import { circulationDependencies } from "../../infrastructure/dependencies";
import { reservationJson } from "../../infrastructure/json";
import { ListReservations } from "./ListReservations";

/** UC22: consulta reservas. */
export function registerRoutes(api: Hono): void {
  api.get("/reservas", async c => c.json((await new ListReservations(...circulationDependencies(sql)).execute({
    readerId: parseIdFilter(c.req.query("leitorId")), copyId: parseIdFilter(c.req.query("exemplarId")),
    status: c.req.query("situacao"),
  })).map(reservationJson)));
  api.get("/reservas/:id", async c => c.json(reservationJson(await new ListReservations(...circulationDependencies(sql)).get(parsePositiveId(c.req.param("id"))))));
}
