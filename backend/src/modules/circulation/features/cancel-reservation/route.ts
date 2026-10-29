import type { Hono } from "hono";
import { inTransaction } from "../../../../infrastructure/transaction";
import { parsePositiveId } from "../../../../shared/http";
import { circulationDependencies } from "../../infrastructure/dependencies";
import { reservationJson } from "../../infrastructure/json";
import { CancelReservation } from "./CancelReservation";

/** UC18: cancela uma reserva ativa. */
export function registerRoutes(api: Hono): void {
  api.post("/reservas/:id/cancelamento", async c => {
    const id = parsePositiveId(c.req.param("id"));
    return c.json(reservationJson(await inTransaction(tx => new CancelReservation(...circulationDependencies(tx)).execute(id))));
  });
}
