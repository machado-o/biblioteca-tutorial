import { inTransaction } from "../../../../infrastructure/transaction";
import type { AuthorInput, AuthorType, AuthorView } from "../../domain/Author";

export async function createAuthor(input: AuthorInput): Promise<AuthorView> {
  return inTransaction(async (tx) => {
    const [row] = await tx`INSERT INTO autores (nome, tipo) VALUES (${input.name}, ${input.type}) RETURNING id, nome AS name, tipo AS type` as { id: number; name: string; type: AuthorType }[];
    return { ...row!, bookCount: 0 };
  });
}
