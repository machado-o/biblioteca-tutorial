/**
 * API pública do módulo Autoria: a preparação das tabelas e o contrato que a
 * integração implementa para contar os livros de cada autor.
 */
export { prepareAuthorship } from "./infrastructure/schema";
export type { AuthorshipDb, AuthorshipIntegration } from "./domain/AuthorshipIntegration";
