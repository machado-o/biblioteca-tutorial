import { Isbn } from "../../modules/catalog";
import { RuleConflict } from "../../shared/errors";

export type SeedCatalog = { source: string; consultedOn: string; authors: { name: string; source: string; books: { title: string; isbn: string; source: string }[] }[] };

export function validateSeedCatalog(catalog: SeedCatalog): void {
  if (!Array.isArray(catalog.authors) || catalog.authors.length !== 50) throw new RuleConflict("O catálogo do seed deve ter exatamente 50 autores reais.");
  const authors = new Set<string>(); const isbns = new Set<string>();
  for (const author of catalog.authors) {
    const name = author.name.trim().toLowerCase();
    if (!name || !author.source || authors.has(name) || author.books.length < 1 || author.books.length > 5) throw new RuleConflict("Catálogo do seed inválido: autor repetido, sem fonte ou fora do limite de 1 a 5 livros.");
    authors.add(name);
    for (const book of author.books) {
      if (!book.title.trim() || !book.source || !Isbn.isValid(book.isbn) || isbns.has(book.isbn)) throw new RuleConflict(`Catálogo do seed inválido: título, fonte ou ISBN ${book.isbn}.`);
      isbns.add(book.isbn);
    }
  }
}
