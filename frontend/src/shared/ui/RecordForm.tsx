import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { send } from "../api.ts";
import { useFetch } from "../useFetch.ts";
import { Loading, Notices } from "./feedback.tsx";
import { RecordPicker } from "./fields.tsx";

/** Cadastro e edição; a edição sempre escolhe um registro existente. */
export function RecordForm<T extends { id: number }>({ endpoint, edit = false, itemLabel, fields, build, success, back, submitLabel, notice }: {
  endpoint: string; edit?: boolean; itemLabel: (item: T) => string; fields: (item: T | null) => ReactNode; build: (data: FormData) => unknown; success: (item: T) => string; back: string; submitLabel: string; notice?: string;
}) {
  const [params, setParams] = useSearchParams();
  const id = params.get("id") ?? "";
  const [revision, setRevision] = useState(0);
  const records = useFetch<T[]>(edit ? endpoint : null, revision);
  const selected = records.data?.find((item) => String(item.id) === id) ?? null;
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSending(true); setError(""); setMessage("");
    try {
      const item = await send<T>(edit ? `${endpoint}/${id}` : endpoint, edit ? "PUT" : "POST", build(data));
      setMessage(success(item));
      if (edit) setRevision((value) => value + 1); else form.reset();
    } catch (e) { setError((e as Error).message); }
    finally { setSending(false); }
  }
  return <>
    {edit && <>
      <Loading loading={records.loading} error={records.error} />
      {records.data && <RecordPicker label="Registro para editar" items={records.data} itemLabel={itemLabel} value={id} onChange={(value) => { setParams(value ? { id: value } : {}); setError(""); setMessage(""); }} />}
    </>}
    {(!edit || selected) && <form key={`${id}-${revision}`} className="record-form" onSubmit={save}>
      {fields(selected)}
      {notice && <p className="note">{notice}</p>}
      <button disabled={sending} type="submit">{sending ? "Salvando…" : submitLabel}</button>
    </form>}
    <Notices error={error} success={message} />
    <p className="form-footer"><Link to={back}>Voltar à consulta</Link></p>
  </>;
}
