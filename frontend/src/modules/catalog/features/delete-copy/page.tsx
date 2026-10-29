/* oxlint-disable react/only-export-components -- Cada page.tsx exporta metadados e componente para o carregamento automático. */
import { RecordDeletion } from "../../../../shared/ui/RecordDeletion.tsx";
import { Page } from "../../../../shared/ui/Page.tsx";
import type { Copy } from "../../types.ts";

function DeleteCopy() {
  return <Page title="Excluir exemplar" description="Remova uma cópia física que ainda não tenha histórico de circulação.">
    <RecordDeletion<Copy> endpoint="/api/exemplares" itemLabel={(copy) => `${copy.numeroRegistro} · ${copy.titulo}`} back="/exemplares" notice="A exclusão é definitiva. Exemplares com qualquer reserva ou empréstimo, mesmo encerrados, não podem ser excluídos." />
  </Page>;
}

export default { useCase: "UC16", title: "Excluir exemplar", path: "/exemplares/excluir", Component: DeleteCopy };
