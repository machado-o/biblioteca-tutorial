import type { SQL, TransactionSQL } from "bun";

export type CatalogDb = SQL | TransactionSQL;
export type CatalogAuthor = { id: number; name: string; type: "literatura" | "didatico" };
export type CopyAvailability = "disponivel" | "reservado" | "emprestado";

/** Porta do Acervo: o que ele precisa saber de autoria e circulação, sem conhecer suas tabelas. */
export type CatalogIntegration = {
  author: (db: CatalogDb, id: number) => Promise<CatalogAuthor | null>;
  authorIdsByName: (db: CatalogDb, term: string) => Promise<number[]>;
  syncAuthorBookCounts: (db: CatalogDb, ids: number[]) => Promise<void>;
  copyAvailability: (db: CatalogDb, copyId: number, today: string) => Promise<CopyAvailability>;
  copyHasHistory: (db: CatalogDb, id: number) => Promise<boolean>;
};
