/* oxlint-disable react/only-export-components -- Cada page.tsx exporta metadados e componente para o carregamento automático. */
import { RecordForm } from "../../../../shared/ui/RecordForm.tsx";
import { Page } from "../../../../shared/ui/Page.tsx";
import { ReaderFields } from "../../components/ReaderFields.tsx";
import { readReaderForm } from "../../components/readReaderForm.ts";
import type { Reader } from "../../types.ts";

function UpdateReader() {
  return <Page title="Atualizar leitor" description="Escolha o leitor e atualize seus dados cadastrais e de contato.">
    <RecordForm<Reader> endpoint="/api/leitores" edit itemLabel={(reader) => `${reader.nome} · ${reader.cpf}`} fields={(reader) => <ReaderFields reader={reader} />} build={readReaderForm} success={(reader) => `Leitor “${reader.nome}” atualizado.`} back="/leitores" submitLabel="Salvar alterações" />
  </Page>;
}

export default { useCase: "UC11", title: "Atualizar leitor", path: "/leitores/editar", Component: UpdateReader };
