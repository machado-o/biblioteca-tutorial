import { Loading } from "../../../shared/ui/feedback.tsx";
import { Field } from "../../../shared/ui/fields.tsx";
import { useFetch } from "../../../shared/useFetch.ts";
import type { Book, Copy } from "../types.ts";

/** Campos do exemplar; o livro só é escolhido no cadastro. */
export function CopyFields({ copy }: { copy: Copy | null }) {
  const books = useFetch<Book[]>(copy ? null : "/api/livros");
  return <>
    {!copy && <>
      <Loading loading={books.loading} error={books.error} />
      {books.data && <Field name="livroId" label="Livro"><select id="livroId" name="livroId" required defaultValue=""><option value="">Selecione o livro</option>{books.data.map((book) => <option key={book.id} value={book.id}>{book.titulo} · {book.isbn}</option>)}</select>{!books.data.length && <small>Cadastre um livro antes de cadastrar o exemplar.</small>}</Field>}
    </>}
    {copy && <p className="note"><strong>{copy.numeroRegistro}</strong> · {copy.titulo}</p>}
    <Field name="localizacao" label="Localização" hint="Por exemplo: Estante A, prateleira 2."><input id="localizacao" name="localizacao" required defaultValue={copy?.localizacao} aria-describedby="localizacao-hint" /></Field>
    <Field name="estadoConservacao" label="Estado de conservação"><input id="estadoConservacao" name="estadoConservacao" required placeholder="Bom, novo, desgastado…" defaultValue={copy?.estadoConservacao} /></Field>
  </>;
}
