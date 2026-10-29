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
import type { Loan, Reservation } from "../../types.ts";

function RegisterLoan() {
  const [params] = useSearchParams();
  const [readerId, setReaderId] = useState(params.get("leitorId") ?? "");
  const [copyId, setCopyId] = useState(params.get("exemplarId") ?? "");
  const [revision, setRevision] = useState(0);
  const readers = useFetch<Reader[]>("/api/leitores");
  const copies = useFetch<Copy[]>("/api/exemplares", revision);
  const reservations = useFetch<Reservation[]>(readerId ? `/api/reservas?leitorId=${readerId}&situacao=ativa` : null, revision);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<Loan | null>(null);
  const [sending, setSending] = useState(false);
  const options = copies.data?.filter((copy) => copy.situacao === "disponivel" || (copy.situacao === "reservado" && reservations.data?.some((reservation) => reservation.exemplarId === copy.id))) ?? [];
  async function lend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSending(true); setError(""); setSaved(null);
    try {
      setSaved(await send<Loan>("/api/emprestimos", "POST", { leitorId: Number(readerId), exemplarId: Number(copyId) }));
      setCopyId(""); setRevision((value) => value + 1);
    } catch (e) { setError((e as Error).message); }
    finally { setSending(false); }
  }
  return <Page title="Registrar empréstimo" description="Associe um exemplar ao leitor. A devolução será prevista automaticamente para daqui a 14 dias corridos.">
    <Loading loading={readers.loading || copies.loading || reservations.loading} error={readers.error || copies.error || reservations.error} />
    {readers.data && copies.data && (readers.data.length ? <form className="record-form" onSubmit={lend}>
      <Select name="leitorId" label="Leitor" items={readers.data} itemLabel={(reader) => `${reader.nome} · ${formatCpf(reader.cpf)}`} value={readerId} onChange={(value) => { setReaderId(value); setCopyId(""); setError(""); }} />
      {readerId && !reservations.loading && !reservations.error && <>
        <Select name="exemplarId" label="Exemplar para empréstimo" items={options} itemLabel={(copy) => `${copy.numeroRegistro} · ${copy.titulo}${copy.situacao === "reservado" ? " (reserva deste leitor)" : ""}`} value={copyId} onChange={setCopyId} />
        {!options.length && <p className="hint">Não há exemplares disponíveis ou reservados para este leitor.</p>}
      </>}
      <p className="note">Até três empréstimos em aberto por leitor. Uma reserva deste leitor será atendida automaticamente ao registrar o empréstimo.</p>
      <button type="submit" disabled={sending || !readerId || !copyId || reservations.loading || Boolean(reservations.error)}>{sending ? "Registrando…" : "Registrar empréstimo"}</button>
    </form> : <p className="empty">Cadastre um leitor antes de registrar um empréstimo.</p>)}
    <Notices error={error} />
    {saved && <div className="success" role="status"><p>Empréstimo registrado para <strong>{saved.leitorNome}</strong>: {saved.numeroRegistro} · {saved.livroTitulo}.</p><p>Devolução prevista: <strong>{formatDate(saved.dataPrevistaDevolucao)}</strong>.</p><Link to={`/emprestimos?leitorId=${saved.leitorId}`}>Consultar empréstimos do leitor</Link></div>}
  </Page>;
}

export default { useCase: "UC19", title: "Registrar empréstimo", path: "/emprestimos/registrar", Component: RegisterLoan };
