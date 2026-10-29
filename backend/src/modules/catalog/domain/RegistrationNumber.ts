import { InvalidValue } from "../../../shared/domain-errors";

export class RegistrationNumber {
  /** O formato do número de registro é decisão do negócio, não do banco. */
  static readonly SEQUENCE_DIGITS = 6;

  readonly value: string;

  constructor(raw: string) {
    if (!/^\d{4}-\d{6}$/.test(raw)) {
      throw new InvalidValue(`número de registro inválido: ${raw}`);
    }

    this.value = raw;
  }

  /** O número de registro nasce por aqui: ano da catalogação + sequencial daquele ano. */
  static next(year: string, catalogedInYear: number): RegistrationNumber {
    const sequence = String(catalogedInYear + 1).padStart(
      RegistrationNumber.SEQUENCE_DIGITS,
      "0",
    );

    return new RegistrationNumber(`${year}-${sequence}`);
  }

  toString(): string {
    return this.value;
  }
}
