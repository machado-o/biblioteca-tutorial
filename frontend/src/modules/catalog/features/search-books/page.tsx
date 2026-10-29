/* oxlint-disable react/only-export-components -- Cada page.tsx exporta metadados e componente para o carregamento automático. */
import { Link, useSearchParams } from "react-router-dom";
import { formatDate } from "../../../../shared/format.ts";
import { Loading } from "../../../../shared/ui/feedback.tsx";
import { SearchForm } from "../../../../shared/ui/fields.tsx";
import { Page } from "../../../../shared/ui/Page.tsx";
import { RowActions, Table } from "../../../../shared/ui/Table.tsx";
import { useFetch } from "../../../../shared/useFetch.ts";
import type { Book } from "../../types.ts";

function SearchBooks() {
  const [params] = useSearchParams();
  const term = params.get("q") ?? "";
  const books = useFetch<Book[]>(`/api/livros?q=${encodeURIComponent(term)}`);
  return <Page title="Buscar livros" description="Consulte ISBN, título ou autor e veja as cópias disponíveis de cada edição.">
    <SearchForm hint="ISBN, título ou nome do autor" />
    <Loading loading={books.loading} error={books.error} />
    {books.data && (books.data.length ? <>
      <p className="count">{books.data.length} livro(s) encontrado(s)</p>
      <Table label="Livros encontrados"><thead><tr><th>Título / ISBN</th><th>Autor</th><th>Exemplares</th><th>Catalogação</th><th>Ações</th></tr></thead><tbody>
        {books.data.map((book) => <tr key={book.id}>
          <td><strong>{book.titulo}</strong><small className="secondary-line">{book.isbn}</small></td>
          <td>{book.autor}</td>
          <td><Link to={`/exemplares?livroId=${book.id}`}>{book.exemplaresDisponiveis} disponível(is) / {book.totalExemplares} total</Link></td>
          <td>{formatDate(book.dataCatalogacao)}</td>
          <td><RowActions edit={`/livros/editar?id=${book.id}`} remove={`/livros/excluir?id=${book.id}`} /></td>
        </tr>)}
      </tbody></Table>
    </> : <p className="empty">Nenhum livro encontrado. Ajuste a busca ou cadastre um livro.</p>)}
  </Page>;
}

export default { useCase: "UC02", title: "Buscar livros", path: "/livros", Component: SearchBooks };
