import type { AuthorView } from "../domain/Author";

/** JSON da API, em português. */
export function authorJson(author: AuthorView) {
  return { id: author.id, nome: author.name, tipo: author.type, livrosNoAcervo: author.bookCount };
}
