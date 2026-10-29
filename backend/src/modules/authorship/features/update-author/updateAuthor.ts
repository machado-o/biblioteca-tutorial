import { inTransaction } from "../../../../infrastructure/transaction";
import { RuleConflict } from "../../../../shared/errors";
import type { AuthorInput, AuthorView } from "../../domain/Author";
import type { AuthorshipIntegration } from "../../domain/AuthorshipIntegration";
import { findAuthor, toAuthorView, type AuthorRow } from "../../infrastructure/authors";

export async function updateAuthor(id: number, input: AuthorInput, integration: AuthorshipIntegration): Promise<AuthorView> {
  return inTransaction(async (tx) => {
    await findAuthor(tx, id);
    const count = await integration.countBooks(tx, id);
    const limit = input.type === "literatura" ? 5 : 10;
    if (count > limit) throw new RuleConflict(`O autor possui ${count} livros; o tipo escolhido permite ${limit}`);
    const [row] = await tx`UPDATE autores SET nome = ${input.name}, tipo = ${input.type}, livros_no_acervo = ${count} WHERE id = ${id} RETURNING id, nome AS name, tipo AS type, livros_no_acervo AS "bookCount"` as AuthorRow[];
    return toAuthorView(tx, row!, integration);
  });
}
