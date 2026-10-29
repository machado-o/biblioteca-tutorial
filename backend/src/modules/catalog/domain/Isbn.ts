import { InvalidValue } from "../../../shared/domain-errors";

export class Isbn {
  readonly value: string;

  constructor(raw: string) {
    if (!Isbn.isValid(raw)) {
      throw new InvalidValue(`ISBN inválido: ${raw}`);
    }

    this.value = raw.replace(/[^0-9]/g, "");
  }

  /**
   * Perguntar antes de construir. Quem cadastra **exige** um ISBN; quem busca
   * apenas quer saber se o termo digitado é um — "Código Limpo" não é, e nem por
   * isso a busca falhou.
   */
  static isValid(raw: string): boolean {
    const normalized = raw.replace(/[^0-9]/g, "");

    return normalized.length === 13 && Isbn.checkDigitMatches(normalized);
  }

  /**
   * ISBN-13: soma dos 12 primeiros dígitos com pesos 1 e 3 alternados;
   * o 13º dígito é o que completa a soma até o próximo múltiplo de 10.
   */
  private static checkDigitMatches(isbn: string): boolean {
    let sum = 0;

    for (let i = 0; i < 12; i++) {
      sum += Number(isbn[i]!) * (i % 2 === 0 ? 1 : 3);
    }

    return (10 - (sum % 10)) % 10 === Number(isbn[12]!);
  }

  equals(other: Isbn): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
