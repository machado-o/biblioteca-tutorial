/* oxlint-disable react/only-export-components -- Cada page.tsx exporta metadados e componente para o carregamento automático. */
import { RecordForm } from "../../../../shared/ui/RecordForm.tsx";
import { Page } from "../../../../shared/ui/Page.tsx";
import { AuthorFields } from "../../components/AuthorFields.tsx";
import { readAuthorForm } from "../../components/readAuthorForm.ts";
import type { Author } from "../../types.ts";

function CreateAuthor() {
  return <Page title="Cadastrar autor" description="Registre os autores que poderão ser associados aos livros do acervo.">
    <RecordForm<Author> endpoint="/api/autores" itemLabel={(author) => author.nome} fields={(author) => <AuthorFields author={author} />} build={readAuthorForm} success={(author) => `Autor “${author.nome}” cadastrado.`} back="/autores" submitLabel="Cadastrar autor" />
  </Page>;
}

export default { useCase: "UC05", title: "Cadastrar autor", path: "/autores/cadastrar", Component: CreateAuthor };
