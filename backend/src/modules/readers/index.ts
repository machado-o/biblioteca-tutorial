/**
 * API pública do módulo Leitores. A invalidação do cache de buscas está aqui
 * porque quem escreve direto na tabela leitores (o seed) mora fora do módulo.
 */
export { prepareReaders } from "./infrastructure/schema";
export type { ReaderHistory } from "./domain/ReaderHistory";
export { normalizeCpf, parseReaderInput, type Reader, type ReaderInput } from "./domain/Reader";
export { invalidateReaderSearch } from "./infrastructure/searchCache";
