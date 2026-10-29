/* oxlint-disable react/only-export-components -- Cada page.tsx exporta metadados e componente para o carregamento automático. */
import { formatDate } from "../../../../shared/format.ts";
import { Page } from "../../../../shared/ui/Page.tsx";
import { CirculationAction } from "../../components/CirculationAction.tsx";
import type { Reservation } from "../../types.ts";

function CancelReservation() {
  return <Page title="Cancelar reserva" description="Cancele uma reserva ativa para liberar o exemplar e uma das vagas do leitor.">
    <CirculationAction<Reservation> endpoint="/api/reservas" operation="cancelamento" itemLabel={(reservation) => `${reservation.numeroRegistro} · ${reservation.livroTitulo} · ${reservation.leitorNome}`} details={(reservation) => <><p><strong>{reservation.livroTitulo}</strong> · {reservation.numeroRegistro}</p><p>Leitor: {reservation.leitorNome}</p><p>Retirada até {formatDate(reservation.dataLimiteRetirada)}</p></>} submitLabel="Cancelar reserva" success={(reservation) => `Reserva de ${reservation.leitorNome} cancelada. O exemplar ${reservation.numeroRegistro} foi liberado.`} back="/reservas" emptyMessage="Não há reservas ativas para cancelar." />
  </Page>;
}

export default { useCase: "UC18", title: "Cancelar reserva", path: "/reservas/cancelar", Component: CancelReservation };
