import { RuleConflict } from "../../../../shared/errors";
import type { ReaderHistory } from "../../domain/ReaderHistory";
import type { ReaderRepository } from "../../domain/ReaderRepository";

export class DeleteReader {
  constructor(private readonly repository: ReaderRepository, private readonly history: ReaderHistory) {}
  async execute(id: number) {
    await this.repository.get(id);
    if (await this.history.existsFor(id)) throw new RuleConflict("Leitor possui histórico de reservas ou empréstimos e não pode ser excluído.");
    await this.repository.remove(id);
  }
}
