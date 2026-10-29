/* oxlint-disable react/only-export-components -- Cada page.tsx exporta metadados e componente para o carregamento automático. */
import { RecordDeletion } from "../../../../shared/ui/RecordDeletion.tsx";
import { Page } from "../../../../shared/ui/Page.tsx";
import type { Reader } from "../../types.ts";

function DeleteReader() {
  return <Page title="Excluir leitor" description="Remova um leitor que ainda não tenha histórico de circulação.">
    <RecordDeletion<Reader> endpoint="/api/leitores" itemLabel={(reader) => `${reader.nome} · ${reader.cpf}`} back="/leitores" notice="A exclusão é definitiva. Leitores com qualquer empréstimo ou reserva, mesmo encerrados, não podem ser excluídos." />
  </Page>;
}

export default { useCase: "UC12", title: "Excluir leitor", path: "/leitores/excluir", Component: DeleteReader };
