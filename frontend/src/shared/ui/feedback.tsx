export function Notices({ error = "", success = "" }: { error?: string; success?: string }) {
  return <>
    {error && <p className="error" role="alert">{error}</p>}
    {success && <p className="success" role="status">{success}</p>}
  </>;
}

export function Loading({ loading, error }: { loading: boolean; error: string }) {
  return <>{loading && <p className="hint" role="status">Carregando…</p>}<Notices error={error} /></>;
}

const STATUS_LABELS: Record<string, string> = { disponivel: "Disponível", reservado: "Reservado", emprestado: "Emprestado", ativa: "Ativa", cancelada: "Cancelada", atendida: "Atendida", expirada: "Expirada", em_aberto: "Em aberto", atrasado: "Atrasado", devolvido: "Devolvido" };

/** Rótulo da situação que a API devolve (exemplar, reserva ou empréstimo). */
export function Status({ value }: { value: string }) {
  return <span className={`status status-${value}`}>{STATUS_LABELS[value] ?? value}</span>;
}
