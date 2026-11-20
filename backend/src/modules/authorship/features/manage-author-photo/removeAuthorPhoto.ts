import { discardObject, requireStorage, storage } from "../../../../infrastructure/storage";
import { inTransaction } from "../../../../infrastructure/transaction";
import { NotFound } from "../../../../shared/errors";
import { photoKey } from "../../infrastructure/photos";
import { invalidateAuthorSearch } from "../../infrastructure/searchCache";

/** UC26: remove a foto do autor. */
export async function removeAuthorPhoto(id: number, client = storage): Promise<void> {
  requireStorage(client);
  const [row] = await inTransaction((tx) => tx`UPDATE autores SET foto_atualizada_em = NULL WHERE id = ${id} RETURNING id`);
  if (!row) throw new NotFound("Autor não encontrado");
  await invalidateAuthorSearch();
  await discardObject(photoKey(id), client);
}
