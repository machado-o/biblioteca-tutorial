/* oxlint-disable react/only-export-components -- Cada page.tsx exporta metadados e componente para o carregamento automático. */
import { RecordForm } from "../../../../shared/ui/RecordForm.tsx";
import { Page } from "../../../../shared/ui/Page.tsx";
import { ReaderFields } from "../../components/ReaderFields.tsx";
import { readReaderForm } from "../../components/readReaderForm.ts";
import type { Reader } from "../../types.ts";

function CreateReader() {
  return <Page title="Cadastrar leitor" description="Informe os dados obrigatórios para identificar o leitor nas reservas e nos empréstimos.">
    <RecordForm<Reader> endpoint="/api/leitores" itemLabel={(reader) => reader.nome} fields={(reader) => <ReaderFields reader={reader} />} build={readReaderForm} success={(reader) => `Leitor “${reader.nome}” cadastrado.`} back="/leitores" submitLabel="Cadastrar leitor" />
  </Page>;
}

export default { useCase: "UC09", title: "Cadastrar leitor", path: "/leitores/cadastrar", Component: CreateReader };
