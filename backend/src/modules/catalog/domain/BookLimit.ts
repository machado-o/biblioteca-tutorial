import { RuleViolation } from "../../../shared/domain-errors";

/**
 * O Acervo não fala em "literatura" e "didatico", e sim em que TIRAGEM o
 * autor admite: curta (short) ou ampla (large).
 */
export type PrintRun = "short" | "large";

export class BookLimitExceeded extends RuleViolation {
  constructor(limit: number) {
    super(`O autor já tem ${limit} livros no acervo`);
  }
}

/**
 * Esta regra não cabe em nenhuma instância de Livro: ela fala do CONJUNTO
 * de livros de um autor. Também não cabe em Autor, que não conhece — nem
 * deve conhecer — os livros dele. Por isso vive sozinha.
 */
export class BookLimit {
  private static readonly BY_PRINT_RUN: Record<PrintRun, number> = {
    short: 5,
    large: 10,
  };

  static limitFor(printRun: PrintRun): number {
    return BookLimit.BY_PRINT_RUN[printRun];
  }

  static check(printRun: PrintRun, inCatalog: number): void {
    const limit = BookLimit.limitFor(printRun);

    if (inCatalog >= limit) {
      throw new BookLimitExceeded(limit);
    }
  }
}
