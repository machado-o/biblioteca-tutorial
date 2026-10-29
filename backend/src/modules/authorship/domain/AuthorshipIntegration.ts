import type { SQL, TransactionSQL } from "bun";

export type AuthorshipDb = SQL | TransactionSQL;

/** Contagem de livros por autor; quem implementa é integration/, dona do SQL entre módulos. */
export type AuthorshipIntegration = { countBooks: (db: AuthorshipDb, authorId: number) => Promise<number> };
