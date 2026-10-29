import type { Author } from "../../authorship/index.ts";
import { Loading } from "../../../shared/ui/feedback.tsx";
import { Field } from "../../../shared/ui/fields.tsx";
import { useFetch } from "../../../shared/useFetch.ts";
import type { Book } from "../types.ts";

/** Campos usados no cadastro e na atualização do livro. */
export function BookFields({ book }: { book: Book | null }) {
  const authors = useFetch<Author[]>("/api/autores");
  return <>
    <Field name="isbn" label="ISBN-13" hint="Informe os 13 dígitos, com ou sem hífens."><input id="isbn" name="isbn" required defaultValue={book?.isbn} aria-describedby="isbn-hint" /></Field>
    <Field name="titulo" label="Título"><input id="titulo" name="titulo" required defaultValue={book?.titulo} /></Field>
    <Loading loading={authors.loading} error={authors.error} />
    {authors.data && <Field name="autorId" label="Autor"><select id="autorId" name="autorId" required defaultValue={book?.autorId ?? ""}>
      <option value="">Selecione o autor</option>
      {authors.data.map((author) => <option key={author.id} value={author.id}>{author.nome} · {author.tipo === "literatura" ? "Literatura" : "Didático"}</option>)}
    </select>{!authors.data.length && <small>Cadastre um autor antes de cadastrar o livro.</small>}</Field>}
  </>;
}
