/* oxlint-disable react/only-export-components -- Cada page.tsx exporta metadados e componente para o carregamento automático. */
import { RecordForm } from "../../../../shared/ui/RecordForm.tsx";
import { Page } from "../../../../shared/ui/Page.tsx";
import { CopyFields } from "../../components/CopyFields.tsx";
import type { Copy } from "../../types.ts";

function UpdateCopy() {
  return <Page title="Atualizar exemplar" description="Corrija a localização ou o estado de conservação da cópia física.">
    <RecordForm<Copy> endpoint="/api/exemplares" edit itemLabel={(copy) => `${copy.numeroRegistro} · ${copy.titulo}`} fields={(copy) => <CopyFields copy={copy} />} build={(data) => ({ localizacao: String(data.get("localizacao")), estadoConservacao: String(data.get("estadoConservacao")) })} success={(copy) => `Exemplar ${copy.numeroRegistro} atualizado.`} back="/exemplares" submitLabel="Salvar alterações" />
  </Page>;
}

export default { useCase: "UC15", title: "Atualizar exemplar", path: "/exemplares/editar", Component: UpdateCopy };
