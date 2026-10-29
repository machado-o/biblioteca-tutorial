import { Field } from "../../../shared/ui/fields.tsx";
import type { Author } from "../types.ts";

/** Campos usados no cadastro e na atualização do autor. */
export function AuthorFields({ author }: { author: Author | null }) {
  return <>
    <Field name="nome" label="Nome"><input id="nome" name="nome" required defaultValue={author?.nome} /></Field>
    <Field name="tipo" label="Categoria"><select id="tipo" name="tipo" required defaultValue={author?.tipo ?? "literatura"}><option value="literatura">Literatura</option><option value="didatico">Didático</option></select></Field>
  </>;
}
