import { sql } from "../../../../infrastructure/postgres";
import type { AuthorView } from "../../domain/Author";
import type { AuthorshipIntegration } from "../../domain/AuthorshipIntegration";
import { findAuthor, toAuthorView } from "../../infrastructure/authors";

export async function getAuthor(id: number, integration: AuthorshipIntegration): Promise<AuthorView> {
  return toAuthorView(sql, await findAuthor(sql, id), integration);
}
