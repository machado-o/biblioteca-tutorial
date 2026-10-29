import type { AuthorshipIntegration } from "../modules/authorship";

export const authorshipIntegration: AuthorshipIntegration = {
  async countBooks(db, authorId) {
    const [row] = await db`SELECT COUNT(*)::int AS total FROM livros WHERE autor_id = ${authorId}` as { total: number }[];
    return row!.total;
  },
};
