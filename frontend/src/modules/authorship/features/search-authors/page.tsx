/* oxlint-disable react/only-export-components -- Cada page.tsx exporta metadados e componente para o carregamento automático. */
import { useSearchParams } from "react-router-dom";
import { Loading } from "../../../../shared/ui/feedback.tsx";
import { SearchForm } from "../../../../shared/ui/fields.tsx";
import { Page } from "../../../../shared/ui/Page.tsx";
import { RowActions, Table } from "../../../../shared/ui/Table.tsx";
import { useFetch } from "../../../../shared/useFetch.ts";
import type { Author } from "../../types.ts";

function SearchAuthors() {
  const [params] = useSearchParams();
  const authors = useFetch<Author[]>(`/api/autores?q=${encodeURIComponent(params.get("q") ?? "")}`);
  return <Page title="Buscar autores" description="Encontre um autor pelo nome ou identificador e consulte sua quantidade de livros no acervo.">
    <SearchForm hint="Nome ou identificador do autor" />
    <Loading loading={authors.loading} error={authors.error} />
    {authors.data && (authors.data.length ? <Table label="Autores encontrados"><thead><tr><th>Nome</th><th>Categoria</th><th>Livros no acervo</th><th>Ações</th></tr></thead><tbody>
      {authors.data.map((author) => <tr key={author.id}><td><strong>{author.nome}</strong></td><td>{author.tipo === "literatura" ? "Literatura" : "Didático"}</td><td>{author.livrosNoAcervo}</td><td><RowActions edit={`/autores/editar?id=${author.id}`} remove={`/autores/excluir?id=${author.id}`} /></td></tr>)}
    </tbody></Table> : <p className="empty">Nenhum autor encontrado. Ajuste a busca ou cadastre um autor.</p>)}
  </Page>;
}

export default { useCase: "UC06", title: "Buscar autores", path: "/autores", Component: SearchAuthors };
