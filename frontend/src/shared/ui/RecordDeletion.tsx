import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api.ts";
import { useFetch } from "../useFetch.ts";
import { Loading, Notices } from "./feedback.tsx";
import { RecordPicker } from "./fields.tsx";

export function RecordDeletion<T extends { id: number }>({ endpoint, itemLabel, back, notice }: { endpoint: string; itemLabel: (item: T) => string; back: string; notice: string }) {
  const [params, setParams] = useSearchParams();
  const id = params.get("id") ?? "";
  const [revision, setRevision] = useState(0);
  const records = useFetch<T[]>(endpoint, revision);
  const selected = records.data?.find((item) => String(item.id) === id);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  async function remove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true); setError(""); setMessage("");
    try {
      await api<void>(`${endpoint}/${id}`, { method: "DELETE" });
      setMessage("Registro excluído com sucesso."); setParams({}); setRevision((value) => value + 1);
    } catch (e) { setError((e as Error).message); }
    finally { setSending(false); }
  }
  return <>
    <Loading loading={records.loading} error={records.error} />
    {records.data && <RecordPicker label="Registro para excluir" items={records.data} itemLabel={itemLabel} value={id} onChange={(value) => { setParams(value ? { id: value } : {}); setError(""); setMessage(""); }} />}
    {selected && <form key={id} className="record-form" onSubmit={remove}>
      <p className="note">{notice}</p>
      <label className="confirmation"><input type="checkbox" name="confirmation" required /> Confirmo a exclusão de {itemLabel(selected)}.</label>
      <button className="danger" type="submit" disabled={sending}>{sending ? "Excluindo…" : "Excluir definitivamente"}</button>
    </form>}
    <Notices error={error} success={message} />
    <p className="form-footer"><Link to={back}>Voltar à consulta</Link></p>
  </>;
}
