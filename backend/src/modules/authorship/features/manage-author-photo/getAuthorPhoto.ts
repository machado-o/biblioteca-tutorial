import { sql } from "../../../../infrastructure/postgres";
import { getObject, storage, type StoredObject } from "../../../../infrastructure/storage";
import { NotFound } from "../../../../shared/errors";
import { photoKey } from "../../infrastructure/photos";

/** UC26: o Postgres diz se o autor tem foto; o RustFS guarda os bytes. */
export async function getAuthorPhoto(id: number, client = storage): Promise<StoredObject> {
  const [row] = await sql`SELECT foto_atualizada_em AS "photoUpdatedAt" FROM autores WHERE id = ${id}` as { photoUpdatedAt: Date | null }[];
  if (!row) throw new NotFound("Autor não encontrado");
  if (!row.photoUpdatedAt) throw new NotFound("Autor sem foto");

  const photo = await getObject(photoKey(id), client);
  if (!photo) throw new NotFound("Autor sem foto");
  return photo;
}
