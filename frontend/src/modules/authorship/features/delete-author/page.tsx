/* oxlint-disable react/only-export-components -- Cada page.tsx exporta metadados e componente para o carregamento automático. */
import { RecordDeletion } from "../../../../shared/ui/RecordDeletion.tsx";
import { Page } from "../../../../shared/ui/Page.tsx";
import type { Author } from "../../types.ts";

function DeleteAuthor() {
  return <Page title="Excluir autor" description="Remova um autor que não tenha livros vinculados.">
    <RecordDeletion<Author> endpoint="/api/autores" itemLabel={(author) => author.nome} back="/autores" notice="A exclusão é definitiva. Autores com livros no acervo não podem ser excluídos." />
  </Page>;
}

export default { useCase: "UC08", title: "Excluir autor", path: "/autores/excluir", Component: DeleteAuthor };
