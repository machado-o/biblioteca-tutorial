import type { Hono } from "hono";
import { inTransaction } from "../../../../infrastructure/transaction";
import { today } from "../../../../shared/dates";
import { InvalidInput } from "../../../../shared/errors";
import { parsePositiveId, readJsonBody } from "../../../../shared/http";
import { circulationDependencies } from "../../infrastructure/dependencies";
import { reservationJson } from "../../infrastructure/json";
import { ReserveCopy } from "./ReserveCopy";

/** UC17: reserva um exemplar. */
export function registerRoutes(api: Hono): void {
  api.post("/reservas", async c => {
    const body = await readJsonBody(c);
    if (body["dataReserva"] !== undefined && body["dataReserva"] !== today()) {
      throw new InvalidInput("A reserva só pode ser feita para o dia corrente.");
    }
    const readerId = parsePositiveId(body["leitorId"], "Leitor");
    const copyId = parsePositiveId(body["exemplarId"], "Exemplar");
    const reservation = await inTransaction(tx => new ReserveCopy(...circulationDependencies(tx)).execute(readerId, copyId));
    return c.json(reservationJson(reservation), 201);
  });
}
