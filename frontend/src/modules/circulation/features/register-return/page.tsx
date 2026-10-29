/* oxlint-disable react/only-export-components -- Cada page.tsx exporta metadados e componente para o carregamento automático. */
import { formatDate } from "../../../../shared/format.ts";
import { Page } from "../../../../shared/ui/Page.tsx";
import { CirculationAction } from "../../components/CirculationAction.tsx";
import type { Loan } from "../../types.ts";

function RegisterReturn() {
  return <Page title="Registrar devolução" description="Encerre um empréstimo em aberto e torne o exemplar disponível novamente.">
    <CirculationAction<Loan> endpoint="/api/emprestimos" operation="devolucao" itemLabel={(loan) => `${loan.numeroRegistro} · ${loan.livroTitulo} · ${loan.leitorNome}`} details={(loan) => <><p><strong>{loan.livroTitulo}</strong> · {loan.numeroRegistro}</p><p>Leitor: {loan.leitorNome}</p><p>Devolução prevista: {formatDate(loan.dataPrevistaDevolucao)}</p>{loan.diasDeAtraso > 0 && <p className="error">{loan.diasDeAtraso} dia(s) de atraso.</p>}</>} submitLabel="Confirmar devolução" success={(loan) => `Devolução do exemplar ${loan.numeroRegistro} registrada em ${formatDate(loan.dataDevolucao)}.`} back="/emprestimos" emptyMessage="Não há empréstimos em aberto para devolver." />
  </Page>;
}

export default { useCase: "UC20", title: "Registrar devolução", path: "/emprestimos/devolver", Component: RegisterReturn };
