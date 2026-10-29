import { inTransaction } from "../src/infrastructure/transaction";

/** Só a suíte legada precisa zerar o acervo; jamais permita executar isso no banco da aula. */
export async function cleanTestCatalog(): Promise<void> {
  const url = new URL(process.env.DATABASE_URL ?? "postgres://sem-banco/nao-configurado");
  if (!decodeURIComponent(url.pathname).endsWith("_test")) {
    throw new Error("A limpeza dos testes exige DATABASE_URL apontando para um banco com nome terminado em _test.");
  }
  await inTransaction(async tx => {
    // A aplicação pode estar em uma etapa anterior: as tabelas novas ainda podem não existir.
    for (const table of ["reservas", "emprestimos", "exemplares"] as const) {
      const [row] = await tx`SELECT to_regclass(${table}) AS found`;
      if (row?.found) await tx.unsafe(`DELETE FROM ${table}`);
    }
    await tx`DELETE FROM livros`;
  });
}
