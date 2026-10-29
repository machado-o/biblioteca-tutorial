/* oxlint-disable react/only-export-components -- Cada page.tsx exporta metadados e componente para o carregamento automático. */
import { RecordForm } from "../../../../shared/ui/RecordForm.tsx";
import { Page } from "../../../../shared/ui/Page.tsx";
import { AuthorFields } from "../../components/AuthorFields.tsx";
import { readAuthorForm } from "../../components/readAuthorForm.ts";
import type { Author } from "../../types.ts";

function UpdateAuthor() {
  return <Page title="Atualizar autor" description="Altere o nome ou a categoria de um autor cadastrado.">
    <RecordForm<Author> endpoint="/api/autores" edit itemLabel={(author) => author.nome} fields={(author) => <AuthorFields author={author} />} build={readAuthorForm} success={(author) => `Autor “${author.nome}” atualizado.`} back="/autores" submitLabel="Salvar alterações" notice="A categoria deve comportar os livros já cadastrados: até 5 de literatura ou 10 didáticos." />
  </Page>;
}

export default { useCase: "UC07", title: "Atualizar autor", path: "/autores/editar", Component: UpdateAuthor };
