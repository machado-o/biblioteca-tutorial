/* oxlint-disable react/only-export-components -- Cada page.tsx exporta metadados e componente para o carregamento automático. */
import { Link, useSearchParams } from "react-router-dom";
import { queryString } from "../../../../shared/api.ts";
import { formatDate } from "../../../../shared/format.ts";
import { Loading, Status } from "../../../../shared/ui/feedback.tsx";
import { Page } from "../../../../shared/ui/Page.tsx";
import { Table } from "../../../../shared/ui/Table.tsx";
import { useFetch } from "../../../../shared/useFetch.ts";
import { CirculationFilters } from "../../components/CirculationFilters.tsx";
import type { Loan } from "../../types.ts";

function ListLoans() {
  const [params] = useSearchParams();
  const loans = useFetch<Loan[]>(`/api/emprestimos${queryString({ leitorId: params.get("leitorId") ?? "", exemplarId: params.get("exemplarId") ?? "", situacao: params.get("situacao") ?? "" })}`);
  return <Page title="Consultar empréstimos" description="Acompanhe retiradas, devoluções e atrasos, mantendo o histórico de circulação.">
    <CirculationFilters statuses={[{ value: "em_aberto", label: "Em aberto (inclui atrasados)" }, { value: "atrasado", label: "Atrasados" }, { value: "devolvido", label: "Devolvidos" }]} />
    <Loading loading={loans.loading} error={loans.error} />
    {loans.data && (loans.data.length ? <Table label="Empréstimos encontrados"><thead><tr><th>Exemplar / Livro</th><th>Leitor</th><th>Retirada</th><th>Prazo</th><th>Devolução</th><th>Situação</th><th>Ações</th></tr></thead><tbody>
      {loans.data.map((loan) => <tr key={loan.id}><td><strong>{loan.numeroRegistro}</strong><small className="secondary-line">{loan.livroTitulo}</small></td><td>{loan.leitorNome}</td><td>{formatDate(loan.dataEmprestimo)}</td><td>{formatDate(loan.dataPrevistaDevolucao)}</td><td>{formatDate(loan.dataDevolucao)}</td><td><Status value={loan.situacao} />{loan.diasDeAtraso > 0 && <small className="secondary-line">{loan.diasDeAtraso} dia(s) de atraso</small>}</td><td>{!loan.dataDevolucao && <Link to={`/emprestimos/devolver?id=${loan.id}`}>Devolver</Link>}</td></tr>)}
    </tbody></Table> : <p className="empty">Nenhum empréstimo encontrado para esses filtros.</p>)}
  </Page>;
}

export default { useCase: "UC21", title: "Consultar empréstimos", path: "/emprestimos", Component: ListLoans };
