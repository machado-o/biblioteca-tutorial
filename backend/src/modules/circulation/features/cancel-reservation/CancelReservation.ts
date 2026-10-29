import { today } from "../../../../shared/dates";
import { NotFound, RuleConflict } from "../../../../shared/errors";
import { CirculationUseCase } from "../../domain/CirculationUseCase";
import { reservationStatus } from "../../domain/Reservation";

export class CancelReservation extends CirculationUseCase {
  async execute(id: number) {
    const reservation = (await this.repository.reservations()).find(r => r.id === id);
    if (!reservation) throw new NotFound("Reserva não encontrada.");
    if (reservationStatus(reservation, today(this.clock)) !== "ativa") throw new RuleConflict("Somente reservas ativas podem ser canceladas.");
    await this.repository.setReservationStatus(id, "cancelada");
    return this.presentReservation({ ...reservation, status: "cancelada" });
  }

}
