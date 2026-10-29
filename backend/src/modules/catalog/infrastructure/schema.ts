import { sql } from "../../../infrastructure/postgres";
import { inTransaction } from "../../../infrastructure/transaction";

/**
 * A mesma tabela `livros` do SQLite, na sintaxe do Postgres. `autor_id`
 * continua sendo só um inteiro: nada de chave estrangeira entre módulos.
 */
async function createBooksTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS livros (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      numero_registro TEXT NOT NULL UNIQUE,
      isbn TEXT NOT NULL UNIQUE,
      titulo TEXT NOT NULL,
      autor_id INTEGER NOT NULL,
      data_catalogacao TEXT NOT NULL
    )
  `;
}

/** UC01: o registro bibliográfico deixa de exigir um número de cópia física. */
async function dropBookCopyRequirement(): Promise<void> {
  await inTransaction(async (tx) => {
    await tx`ALTER TABLE livros ALTER COLUMN numero_registro DROP NOT NULL`;
  });
}

/** Migração idempotente: só limpa o campo antigo depois de comprovar a cópia. */
async function prepareCopies(): Promise<void> {
  await inTransaction(async (tx) => {
    await tx`CREATE TABLE IF NOT EXISTS exemplares (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      livro_id INTEGER NOT NULL REFERENCES livros(id),
      numero_registro TEXT NOT NULL UNIQUE,
      localizacao TEXT NOT NULL,
      estado_conservacao TEXT NOT NULL,
      data_catalogacao TEXT NOT NULL
    )`;
    await tx`CREATE INDEX IF NOT EXISTS exemplares_livro_idx ON exemplares(livro_id)`;
    await tx`CREATE TABLE IF NOT EXISTS acervo_sequencias (
      ano TEXT PRIMARY KEY, ultimo INTEGER NOT NULL CHECK (ultimo >= 0)
    )`;
    await tx`
      INSERT INTO exemplares (livro_id, numero_registro, localizacao, estado_conservacao, data_catalogacao)
      SELECT id, numero_registro, 'Acervo', 'bom', data_catalogacao
      FROM livros WHERE numero_registro IS NOT NULL
      ON CONFLICT (numero_registro) DO NOTHING
    `;
    await tx`
      UPDATE livros l SET numero_registro = NULL
      WHERE numero_registro IS NOT NULL AND EXISTS (
        SELECT 1 FROM exemplares e WHERE e.livro_id = l.id AND e.numero_registro = l.numero_registro
      )
    `;
    await tx`
      INSERT INTO acervo_sequencias (ano, ultimo)
      SELECT substring(numero_registro, 1, 4), MAX(substring(numero_registro, 6)::int)
      FROM exemplares GROUP BY substring(numero_registro, 1, 4)
      ON CONFLICT (ano) DO UPDATE SET ultimo = GREATEST(acervo_sequencias.ultimo, EXCLUDED.ultimo)
    `;
  });
}

/** Prepara as tabelas do Acervo: livros, a migração de UC01 e os exemplares de UC13, nesta ordem. */
export async function prepareCatalog(): Promise<void> {
  await createBooksTable();
  await dropBookCopyRequirement();
  await prepareCopies();
}
