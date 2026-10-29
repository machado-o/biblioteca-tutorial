import { InvalidInput, NotFound } from "../../../../shared/errors";
import type { Filters } from "../../domain/CirculationRepository";
import { CirculationUseCase } from "../../domain/CirculationUseCase";

export class ListLoans extends CirculationUseCase {
  async execute(filters: Filters = {}) {
    if (filters.status && !["em_aberto", "atrasado", "devolvido"].includes(filters.status)) {
      throw new InvalidInput("Situação de empréstimo inválida.");
    }
    const results = await Promise.all((await this.repository.loans(filters)).map(l => this.presentLoan(l)));
    return results.filter(l => {
      if (!filters.status) return true;
      // "Em aberto" é o conjunto de empréstimos ainda não devolvidos, inclusive vencidos.
      if (filters.status === "em_aberto") return l.returnedOn === null;
      return l.status === filters.status;
    });
  }

  async get(id: number) {
    const loan = (await this.repository.loans()).find(l => l.id === id);
    if (!loan) throw new NotFound("Empréstimo não encontrado.");
    return this.presentLoan(loan);
  }
}
