import { today } from "../../../../shared/dates";
import { NotFound, RuleConflict } from "../../../../shared/errors";
import { CirculationUseCase } from "../../domain/CirculationUseCase";

export class RegisterReturn extends CirculationUseCase {
  async execute(id: number) {
    const loan = (await this.repository.loans()).find(l => l.id === id);
    if (!loan) throw new NotFound("Empréstimo não encontrado.");
    if (loan.returnedOn) throw new RuleConflict("Este empréstimo já foi devolvido.");
    const returnedOn = today(this.clock);
    await this.repository.returnLoan(id, returnedOn);
    return this.presentLoan({ ...loan, returnedOn });
  }

}
