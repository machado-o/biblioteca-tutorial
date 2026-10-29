import { RuleConflict } from "../../../../shared/errors";
import { parseReaderInput } from "../../domain/Reader";
import type { ReaderRepository } from "../../domain/ReaderRepository";

export class UpdateReader {
  constructor(private readonly repository: ReaderRepository) {}
  async execute(id: number, body: unknown) {
    await this.repository.get(id);
    const input = parseReaderInput(body);
    if (await this.repository.cpfExists(input.cpf, id)) throw new RuleConflict("Já existe um leitor com este CPF.");
    return this.repository.update(id, input);
  }
}
