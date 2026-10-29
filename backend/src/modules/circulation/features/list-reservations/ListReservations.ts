import { InvalidInput, NotFound } from "../../../../shared/errors";
import type { Filters } from "../../domain/CirculationRepository";
import { CirculationUseCase } from "../../domain/CirculationUseCase";

export class ListReservations extends CirculationUseCase {
  async execute(filters: Filters = {}) {
    if (filters.status && !["ativa", "cancelada", "atendida", "expirada"].includes(filters.status)) {
      throw new InvalidInput("Situação de reserva inválida.");
    }
    const results = await Promise.all((await this.repository.reservations(filters)).map(r => this.presentReservation(r)));
    return results.filter(r => !filters.status || r.status === filters.status);
  }

  async get(id: number) {
    const reservation = (await this.repository.reservations()).find(r => r.id === id);
    if (!reservation) throw new NotFound("Reserva não encontrada.");
    return this.presentReservation(reservation);
  }

}
