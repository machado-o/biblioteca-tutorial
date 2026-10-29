import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import type { Copy } from "../../catalog/index.ts";
import type { Reader } from "../../readers/index.ts";
import { formatCpf } from "../../../shared/format.ts";
import { Notices } from "../../../shared/ui/feedback.tsx";
import { Field, Select } from "../../../shared/ui/fields.tsx";
import { useFetch } from "../../../shared/useFetch.ts";

export function CirculationFilters({ statuses }: { statuses: { value: string; label: string }[] }) {
  const [params, setParams] = useSearchParams();
  const readers = useFetch<Reader[]>("/api/leitores");
  const copies = useFetch<Copy[]>("/api/exemplares");
  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    for (const key of ["leitorId", "exemplarId", "situacao"]) { const value = String(data.get(key) ?? ""); if (value) next.set(key, value); }
    setParams(next);
  }
  return <>
    <form className="filters" onSubmit={filter} key={params.toString()}>
      {readers.data && <Select name="leitorId" label="Leitor" items={readers.data} itemLabel={(reader) => `${reader.nome} · ${formatCpf(reader.cpf)}`} initialValue={params.get("leitorId") ?? ""} required={false} emptyLabel="Todos os leitores" />}
      {copies.data && <Select name="exemplarId" label="Exemplar" items={copies.data} itemLabel={(copy) => `${copy.numeroRegistro} · ${copy.titulo}`} initialValue={params.get("exemplarId") ?? ""} required={false} emptyLabel="Todos os exemplares" />}
      <Field name="situacao" label="Situação"><select id="situacao" name="situacao" defaultValue={params.get("situacao") ?? ""}><option value="">Todas</option>{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></Field>
      <button type="submit">Filtrar</button>
    </form>
    <Notices error={readers.error || copies.error} />
  </>;
}
