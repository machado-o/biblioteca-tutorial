import { today, addDays } from "../../../../shared/dates";
import { RuleConflict } from "../../../../shared/errors";
import { CirculationUseCase } from "../../domain/CirculationUseCase";
import { reservationStatus } from "../../domain/Reservation";

export class ReserveCopy extends CirculationUseCase {
  async execute(readerId: number, copyId: number) {
    await this.checkLinks(readerId, copyId);
    const date = today(this.clock);
    const readerReservations = await this.repository.reservations({ readerId });
    if (readerReservations.filter(r => reservationStatus(r, date) === "ativa").length >= 2) {
      throw new RuleConflict("O leitor já possui duas reservas ativas.");
    }
    const copyReservations = await this.repository.reservations({ copyId });
    const copyLoans = await this.repository.loans({ copyId });
    if (copyReservations.some(r => reservationStatus(r, date) === "ativa") || copyLoans.some(l => !l.returnedOn)) {
      throw new RuleConflict("Exemplar indisponível para reserva.");
    }
    const reservation = await this.repository.insertReservation({ readerId, copyId, reservedOn: date,
      pickupDeadline: addDays(date, 6), expiresOn: addDays(date, 7), status: "ativa" });
    return this.presentReservation(reservation);
  }

}
