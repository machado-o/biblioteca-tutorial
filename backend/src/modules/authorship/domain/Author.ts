import { InvalidInput } from "../../../shared/errors";
import { getBodyAsObject, getFieldAsText } from "../../../shared/validation";

export type AuthorType = "literatura" | "didatico";

export type AuthorInput = { name: string; type: AuthorType };

export type AuthorView = { id: number; name: string; type: AuthorType; bookCount: number };

export function parseAuthorInput(body: unknown): AuthorInput {
  const data = getBodyAsObject(body);
  const type = getFieldAsText(data, "tipo");
  if (type !== "literatura" && type !== "didatico") throw new InvalidInput("Tipo deve ser literatura ou didatico");
  return { name: getFieldAsText(data, "nome"), type };
}
