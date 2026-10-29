/* oxlint-disable react/only-export-components -- Cada page.tsx exporta metadados e componente para o carregamento automático. */
import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { Copy } from "../../../catalog/index.ts";
import type { Reader } from "../../../readers/index.ts";
import { send } from "../../../../shared/api.ts";
import { formatCpf, formatDate } from "../../../../shared/format.ts";
import { Loading, Notices } from "../../../../shared/ui/feedback.tsx";
import { Select } from "../../../../shared/ui/fields.tsx";
import { Page } from "../../../../shared/ui/Page.tsx";
import { useFetch } from "../../../../shared/useFetch.ts";
import type { Reservation } from "../../types.ts";

function ReserveCopy() {
  const [params] = useSearchParams();
  const [revision, setRevision] = useState(0);
  const readers = useFetch<Reader[]>("/api/leitores");
  const copies = useFetch<Copy[]>("/api/exemplares?situacao=disponivel", revision);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<Reservation | null>(null);
  const [sending, setSending] = useState(false);
  async function reserve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSending(true); setError(""); setSaved(null);
    try {
      setSaved(await send<Reservation>("/api/reservas", "POST", { leitorId: Number(data.get("leitorId")), exemplarId: Number(data.get("exemplarId")) }));
      form.reset(); setRevision((value) => value + 1);
    } catch (e) { setError((e as Error).message); }
    finally { setSending(false); }
  }
  return <Page title="Reservar exemplar" description="Separe uma cópia disponível para retirada pelo leitor durante 7 dias corridos, a partir de hoje.">
    <Loading loading={readers.loading || copies.loading} error={readers.error || copies.error} />
    {readers.data && copies.data && (readers.data.length && copies.data.length ? <form className="record-form" onSubmit={reserve} key={revision}>
      <Select name="leitorId" label="Leitor" items={readers.data} itemLabel={(reader) => `${reader.nome} · ${formatCpf(reader.cpf)}`} />
      <Select name="exemplarId" label="Exemplar disponível" items={copies.data} itemLabel={(copy) => `${copy.numeroRegistro} · ${copy.titulo}`} initialValue={revision === 0 ? params.get("exemplarId") ?? "" : ""} />
      <p className="note">Cada leitor pode manter até duas reservas ativas. O exemplar fica bloqueado imediatamente e a reserva expira se não houver retirada no prazo.</p>
      <button type="submit" disabled={sending}>{sending ? "Reservando…" : "Confirmar reserva"}</button>
    </form> : <p className="empty">{!readers.data.length ? "Cadastre um leitor para reservar um exemplar." : "Não há exemplares disponíveis para reserva."}</p>)}
    <Notices error={error} />
    {saved && <div className="success" role="status"><p>Reserva confirmada para <strong>{saved.leitorNome}</strong>: {saved.numeroRegistro} · {saved.livroTitulo}.</p><p>Retirada de {formatDate(saved.dataReserva)} até <strong>{formatDate(saved.dataLimiteRetirada)}</strong>.</p><Link to={`/reservas?leitorId=${saved.leitorId}`}>Consultar reservas do leitor</Link></div>}
  </Page>;
}

export default { useCase: "UC17", title: "Reservar exemplar", path: "/reservas/criar", Component: ReserveCopy };
