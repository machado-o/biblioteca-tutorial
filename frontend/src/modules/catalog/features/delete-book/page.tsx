/* oxlint-disable react/only-export-components -- Cada page.tsx exporta metadados e componente para o carregamento automático. */
import { RecordDeletion } from "../../../../shared/ui/RecordDeletion.tsx";
import { Page } from "../../../../shared/ui/Page.tsx";
import type { Book } from "../../types.ts";

function DeleteBook() {
  return <Page title="Excluir livro" description="Remova um registro bibliográfico que não tenha exemplares vinculados.">
    <RecordDeletion<Book> endpoint="/api/livros" itemLabel={(book) => `${book.titulo} · ${book.isbn}`} back="/livros" notice="A exclusão é definitiva. Livros com exemplares vinculados não podem ser excluídos." />
  </Page>;
}

export default { useCase: "UC04", title: "Excluir livro", path: "/livros/excluir", Component: DeleteBook };
