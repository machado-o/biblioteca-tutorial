/* oxlint-disable react/only-export-components -- Cada page.tsx exporta metadados e componente para o carregamento automático. */
import { RecordForm } from "../../../../shared/ui/RecordForm.tsx";
import { Page } from "../../../../shared/ui/Page.tsx";
import { BookFields } from "../../components/BookFields.tsx";
import { readBookForm } from "../../components/readBookForm.ts";
import type { Book } from "../../types.ts";

function UpdateBook() {
  return <Page title="Atualizar livro" description="Escolha o livro e corrija seus dados bibliográficos.">
    <RecordForm<Book> endpoint="/api/livros" edit itemLabel={(book) => `${book.titulo} · ${book.isbn}`} fields={(book) => <BookFields book={book} />} build={readBookForm} success={(book) => `Livro “${book.titulo}” atualizado.`} back="/livros" submitLabel="Salvar alterações" />
  </Page>;
}

export default { useCase: "UC03", title: "Atualizar livro", path: "/livros/editar", Component: UpdateBook };
