/* oxlint-disable react/only-export-components -- Cada page.tsx exporta metadados e componente para o carregamento automático. */
import { RecordForm } from "../../../../shared/ui/RecordForm.tsx";
import { Page } from "../../../../shared/ui/Page.tsx";
import { CopyFields } from "../../components/CopyFields.tsx";
import type { Copy } from "../../types.ts";

function CreateCopy() {
  return <Page title="Cadastrar exemplar" description="Registre uma cópia física de um livro. O número de registro será gerado automaticamente.">
    <RecordForm<Copy> endpoint="/api/exemplares" itemLabel={(copy) => copy.numeroRegistro} fields={(copy) => <CopyFields copy={copy} />} build={(data) => ({ livroId: Number(data.get("livroId")), localizacao: String(data.get("localizacao")), estadoConservacao: String(data.get("estadoConservacao")) })} success={(copy) => `Exemplar ${copy.numeroRegistro} de “${copy.titulo}” cadastrado.`} back="/exemplares" submitLabel="Cadastrar exemplar" />
  </Page>;
}

export default { useCase: "UC13", title: "Cadastrar exemplar", path: "/exemplares/cadastrar", Component: CreateCopy };
