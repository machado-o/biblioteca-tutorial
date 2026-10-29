/* oxlint-disable react/only-export-components -- Cada page.tsx exporta metadados e componente para o carregamento automático. */
import { Link, useSearchParams } from "react-router-dom";
import { queryString } from "../../../../shared/api.ts";
import { formatDate } from "../../../../shared/format.ts";
import { Loading, Status } from "../../../../shared/ui/feedback.tsx";
import { Page } from "../../../../shared/ui/Page.tsx";
import { Table } from "../../../../shared/ui/Table.tsx";
import { useFetch } from "../../../../shared/useFetch.ts";
import { CirculationFilters } from "../../components/CirculationFilters.tsx";
import type { Reservation } from "../../types.ts";

function ListReservations() {
  const [params] = useSearchParams();
  const reservations = useFetch<Reservation[]>(`/api/reservas${queryString({ leitorId: params.get("leitorId") ?? "", exemplarId: params.get("exemplarId") ?? "", situacao: params.get("situacao") ?? "" })}`);
  return <Page title="Consultar reservas" description="Confira as reservas ativas, seus prazos de retirada e o histórico de cancelamentos e atendimentos.">
    <CirculationFilters statuses={[{ value: "ativa", label: "Ativas" }, { value: "cancelada", label: "Canceladas" }, { value: "atendida", label: "Atendidas" }, { value: "expirada", label: "Expiradas" }]} />
    <Loading loading={reservations.loading} error={reservations.error} />
    {reservations.data && (reservations.data.length ? <Table label="Reservas encontradas"><thead><tr><th>Exemplar / Livro</th><th>Leitor</th><th>Reserva</th><th>Retirada até</th><th>Situação</th><th>Ações</th></tr></thead><tbody>
      {reservations.data.map((reservation) => <tr key={reservation.id}><td><strong>{reservation.numeroRegistro}</strong><small className="secondary-line">{reservation.livroTitulo}</small></td><td>{reservation.leitorNome}</td><td>{formatDate(reservation.dataReserva)}</td><td>{formatDate(reservation.dataLimiteRetirada)}</td><td><Status value={reservation.situacao} /></td><td>{reservation.situacao === "ativa" && <span className="actions"><Link to={`/reservas/cancelar?id=${reservation.id}`}>Cancelar</Link><Link to={`/emprestimos/registrar?leitorId=${reservation.leitorId}&exemplarId=${reservation.exemplarId}`}>Emprestar</Link></span>}</td></tr>)}
    </tbody></Table> : <p className="empty">Nenhuma reserva encontrada para esses filtros.</p>)}
  </Page>;
}

export default { useCase: "UC22", title: "Consultar reservas", path: "/reservas", Component: ListReservations };
