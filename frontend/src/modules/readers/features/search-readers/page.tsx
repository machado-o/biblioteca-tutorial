/* oxlint-disable react/only-export-components -- Cada page.tsx exporta metadados e componente para o carregamento automático. */
import { useSearchParams } from "react-router-dom";
import { formatCpf } from "../../../../shared/format.ts";
import { Loading } from "../../../../shared/ui/feedback.tsx";
import { SearchForm } from "../../../../shared/ui/fields.tsx";
import { Page } from "../../../../shared/ui/Page.tsx";
import { RowActions, Table } from "../../../../shared/ui/Table.tsx";
import { useFetch } from "../../../../shared/useFetch.ts";
import type { Reader } from "../../types.ts";

function SearchReaders() {
  const [params] = useSearchParams();
  const readers = useFetch<Reader[]>(`/api/leitores?q=${encodeURIComponent(params.get("q") ?? "")}`);
  return <Page title="Buscar leitores" description="Encontre leitores e acesse seus dados de contato.">
    <SearchForm hint="Nome, CPF ou e-mail" />
    <Loading loading={readers.loading} error={readers.error} />
    {readers.data && (readers.data.length ? <Table label="Leitores encontrados"><thead><tr><th>Nome / CPF</th><th>E-mail</th><th>Telefone</th><th>Ações</th></tr></thead><tbody>
      {readers.data.map((reader) => <tr key={reader.id}><td><strong>{reader.nome}</strong><small className="secondary-line">{formatCpf(reader.cpf)}</small></td><td>{reader.email}</td><td>{reader.telefone}</td><td><RowActions edit={`/leitores/editar?id=${reader.id}`} remove={`/leitores/excluir?id=${reader.id}`} /></td></tr>)}
    </tbody></Table> : <p className="empty">Nenhum leitor encontrado. Ajuste a busca ou cadastre um leitor.</p>)}
  </Page>;
}

export default { useCase: "UC10", title: "Buscar leitores", path: "/leitores", Component: SearchReaders };
