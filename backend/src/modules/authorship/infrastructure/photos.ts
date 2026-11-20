import { objectKey } from "../../../infrastructure/storage";

/** UC26: a chave da foto no bucket. Fixa por autor: uma foto nova substitui a anterior. */
export function photoKey(authorId: number): string {
  return objectKey("autoria", "autores", authorId, "foto");
}
