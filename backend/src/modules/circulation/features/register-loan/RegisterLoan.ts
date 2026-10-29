import { today, addDays } from "../../../../shared/dates";
import { RuleConflict } from "../../../../shared/errors";
import { CirculationUseCase } from "../../domain/CirculationUseCase";
import { reservationStatus } from "../../domain/Reservation";

export class RegisterLoan extends CirculationUseCase {
  async execute(readerId: number, copyId: number) {
    await this.checkLinks(readerId, copyId);
    const date = today(this.clock);
    const readerLoans = await this.repository.loans({ readerId });
    if (readerLoans.filter(l => !l.returnedOn).length >= 3) {
      throw new RuleConflict("O leitor já possui três empréstimos em aberto.");
    }
    if ((await this.repository.loans({ copyId })).some(l => !l.returnedOn)) {
      throw new RuleConflict("Exemplar já está emprestado.");
    }
    const reservation = (await this.repository.reservations({ copyId })).find(r => reservationStatus(r, date) === "ativa");
    if (reservation && reservation.readerId !== readerId) throw new RuleConflict("Exemplar reservado para outro leitor.");
    if (reservation) await this.repository.setReservationStatus(reservation.id, "atendida");
    const loan = await this.repository.insertLoan({ readerId, copyId,
      loanedOn: date, dueOn: addDays(date, 14), returnedOn: null });
    return this.presentLoan(loan);
  }

}
