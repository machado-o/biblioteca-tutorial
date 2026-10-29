import type { CatalogAuthor, CatalogDb, CatalogIntegration } from "../modules/catalog";

async function tableExists(db: CatalogDb, name: string): Promise<boolean> {
  const [row] = await db`SELECT to_regclass(${'public.' + name}) IS NOT NULL AS "exists"` as { exists: boolean }[];
  return row!.exists;
}

/** SQL entre módulos fica na integração, e nunca dentro dos módulos de domínio. */
export const catalogIntegration: CatalogIntegration = {
  async author(db, id) {
    const [row] = await db`SELECT id, nome AS name, tipo AS type FROM autores WHERE id = ${id}` as CatalogAuthor[];
    return row ?? null;
  },
  async authorIdsByName(db, term) {
    const rows = await db`SELECT id FROM autores WHERE nome ILIKE ${'%' + term + '%'}` as { id: number }[];
    return rows.map((row) => row.id);
  },
  async syncAuthorBookCounts(db, ids) {
    for (const id of new Set(ids)) {
      await db`UPDATE autores SET livros_no_acervo = (SELECT COUNT(*)::int FROM livros WHERE autor_id = ${id}) WHERE id = ${id}`;
    }
  },
  async copyAvailability(db, copyId, today) {
    if (await tableExists(db, "emprestimos")) {
      const [loan] = await db`SELECT id FROM emprestimos WHERE exemplar_id = ${copyId} AND data_devolucao IS NULL LIMIT 1`;
      if (loan) return "emprestado";
    }
    if (await tableExists(db, "reservas")) {
      const [reservation] = await db`SELECT id FROM reservas WHERE exemplar_id = ${copyId} AND situacao = 'ativa' AND data_expiracao::text > ${today} LIMIT 1`;
      if (reservation) return "reservado";
    }
    return "disponivel";
  },
  async copyHasHistory(db, id) {
    if (await tableExists(db, "emprestimos")) {
      const [row] = await db`SELECT id FROM emprestimos WHERE exemplar_id = ${id} LIMIT 1`;
      if (row) return true;
    }
    if (await tableExists(db, "reservas")) {
      const [row] = await db`SELECT id FROM reservas WHERE exemplar_id = ${id} LIMIT 1`;
      if (row) return true;
    }
    return false;
  },
};
