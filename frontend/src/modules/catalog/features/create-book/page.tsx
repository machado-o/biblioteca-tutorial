/* oxlint-disable react/only-export-components -- Cada page.tsx exporta metadados e componente para o carregamento automático. */
import { RecordForm } from "../../../../shared/ui/RecordForm.tsx";
import { Page } from "../../../../shared/ui/Page.tsx";
import { BookFields } from "../../components/BookFields.tsx";
import { readBookForm } from "../../components/readBookForm.ts";
import type { Book } from "../../types.ts";

function CreateBook() {
  return <Page title="Cadastrar livro" description="Registre a edição no catálogo. As cópias físicas serão cadastradas como exemplares.">
    <RecordForm<Book> endpoint="/api/livros" itemLabel={(book) => book.titulo} fields={(book) => <BookFields book={book} />} build={readBookForm} success={(book) => `Livro “${book.titulo}” cadastrado no catálogo.`} back="/livros" submitLabel="Cadastrar livro" notice="Limite por autor: 5 títulos de literatura ou 10 títulos didáticos. A quantidade de exemplares não altera esse limite." />
  </Page>;
}

export default { useCase: "UC01", title: "Cadastrar livro", path: "/livros/cadastrar", Component: CreateBook };
