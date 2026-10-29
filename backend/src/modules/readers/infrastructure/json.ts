import type { Reader } from "../domain/Reader";

/** JSON da API: as chaves continuam em português. */
export function readerJson(reader: Reader) {
  return { id: reader.id, nome: reader.name, cpf: reader.cpf, email: reader.email, telefone: reader.phone };
}
