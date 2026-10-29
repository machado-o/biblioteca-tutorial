import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { send } from "../../../shared/api.ts";
import { Loading, Notices } from "../../../shared/ui/feedback.tsx";
import { Select } from "../../../shared/ui/fields.tsx";
import { useFetch } from "../../../shared/useFetch.ts";

/** Cancelamento e devolução trabalham com operações existentes, nunca com IDs digitados. */
export function CirculationAction<T extends { id: number }>({ endpoint, operation, itemLabel, details, submitLabel, success, back, emptyMessage }: {
  endpoint: string; operation: "cancelamento" | "devolucao"; itemLabel: (item: T) => string; details: (item: T) => ReactNode; submitLabel: string; success: (item: T) => string; back: string; emptyMessage: string;
}) {
  const [params, setParams] = useSearchParams();
  const id = params.get("id") ?? "";
  const [revision, setRevision] = useState(0);
  const records = useFetch<T[]>(operation === "cancelamento" ? `${endpoint}?situacao=ativa` : endpoint, revision);
  // Um empréstimo atrasado continua aberto e também precisa permitir devolução.
  const items = records.data?.filter((item) => operation === "cancelamento" || ("dataDevolucao" in item && item.dataDevolucao === null));
  const selected = items?.find((item) => String(item.id) === id);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  async function run(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSending(true); setError(""); setMessage("");
    try {
      const item = await send<T>(`${endpoint}/${id}/${operation}`, "POST");
      setMessage(success(item)); setParams({}); setRevision((value) => value + 1);
    } catch (e) { setError((e as Error).message); }
    finally { setSending(false); }
  }
  return <>
    <Loading loading={records.loading} error={records.error} />
    {items && (items.length ? <div className="record-picker"><Select name="selectedOperation" label={operation === "cancelamento" ? "Reserva ativa" : "Empréstimo em aberto"} items={items} itemLabel={itemLabel} value={id} onChange={(value) => { setParams(value ? { id: value } : {}); setError(""); setMessage(""); }} /></div> : <p className="empty">{emptyMessage}</p>)}
    {selected && <form className="record-form" onSubmit={run} key={id}>
      <div className="operation-summary">{details(selected)}</div>
      <label className="confirmation"><input type="checkbox" name="confirmation" required /> Confirmo os dados desta operação.</label>
      <button type="submit" disabled={sending}>{sending ? "Registrando…" : submitLabel}</button>
    </form>}
    <Notices error={error} success={message} />
    <p className="form-footer"><Link to={back}>Voltar à consulta</Link></p>
  </>;
}
