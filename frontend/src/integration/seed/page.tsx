/* oxlint-disable react/only-export-components -- Cada page.tsx exporta metadados e componente para o carregamento automático. */
import { useState } from "react";
import { Link } from "react-router-dom";
import { send } from "../../shared/api.ts";
import { formatDate } from "../../shared/format.ts";
import { Loading, Notices } from "../../shared/ui/feedback.tsx";
import { Page } from "../../shared/ui/Page.tsx";
import { Table } from "../../shared/ui/Table.tsx";
import { useFetch } from "../../shared/useFetch.ts";

/** Os campos seguem o JSON da API. */
type SeedSummary = {
  autores: number;
  livros: number;
  exemplares: number;
  leitores: number;
  emprestimosDevolvidos: number;
  emprestimosEmDia: number;
  emprestimosAtrasados: number;
  reservasAtivas: number;
  reservasCanceladas: number;
  reservasExpiradas: number;
};
type SeedState = { executado: false } | { executado: true; resumo: SeedSummary; dataReferencia: string };
type SeedResult = { criado: boolean; resumo: SeedSummary; dataReferencia: string };
const COUNTS: { key: keyof SeedSummary; label: string }[] = [
  { key: "autores", label: "Autores" },
  { key: "livros", label: "Livros" },
  { key: "exemplares", label: "Exemplares" },
  { key: "leitores", label: "Leitores" },
  { key: "emprestimosDevolvidos", label: "Empréstimos devolvidos" },
  { key: "emprestimosEmDia", label: "Empréstimos em dia" },
  { key: "emprestimosAtrasados", label: "Empréstimos atrasados" },
  { key: "reservasAtivas", label: "Reservas ativas" },
  { key: "reservasCanceladas", label: "Reservas canceladas" },
  { key: "reservasExpiradas", label: "Reservas expiradas" },
];

function GenerateSampleData() {
  const current = useFetch<SeedState>("/api/seed");
  const [result, setResult] = useState<SeedResult | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const state: SeedState | null = result ? { executado: true, resumo: result.resumo, dataReferencia: result.dataReferencia } : current.data;
  async function run() {
    setSending(true); setError("");
    try { setResult(await send<SeedResult>("/api/seed", "POST")); }
    catch (e) { setError((e as Error).message); }
    finally { setSending(false); }
  }
  return <Page title="Gerar dados de exemplo" description="Prepare uma biblioteca de demonstração para explorar o catálogo, as reservas e os empréstimos.">
    <p>O conjunto inclui 50 autores reais, até cinco livros reais por autor e de um a dez exemplares por livro. Leitores e seus dados de contato são sintéticos.</p>
    <p>São gerados 120 empréstimos devolvidos, 30 em dia e 30 atrasados, além de 20 reservas ativas, dez canceladas e dez expiradas.</p>
    <p className="note">Os dados existentes são preservados. Executar novamente consulta o mesmo conjunto, sem duplicar registros nem reiniciar a biblioteca. As situações e contagens referem-se à data em que os exemplos foram gerados.</p>
    <Loading loading={current.loading} error={current.error} />
    {state && <>
      <p>{state.executado ? "Os dados de exemplo já foram gerados nesta biblioteca." : "Os dados de exemplo ainda não foram gerados nesta biblioteca."}</p>
      <button type="button" onClick={run} disabled={sending}>{sending ? "Gerando dados de exemplo…" : "Executar seed"}</button>
    </>}
    <Notices error={error} success={!sending && result ? (result.criado ? "Dados de exemplo gerados com sucesso." : "Os dados de exemplo já existem. Nenhum registro foi duplicado.") : ""} />
    {state?.executado && <div style={{ marginTop: "2rem", maxWidth: "640px" }}>
      <h2>Dados gerados</h2>
      <p>Data de referência: <strong>{formatDate(state.dataReferencia)}</strong>.</p>
      <Table label="Resumo dos dados de exemplo"><thead><tr><th>Registros</th><th>Quantidade</th></tr></thead><tbody>
        {COUNTS.map(({ key, label }) => <tr key={key} data-count={key}><td>{label}</td><td>{state.resumo[key]}</td></tr>)}
      </tbody></Table>
      <p className="form-footer actions"><Link to="/livros">Consultar livros</Link><Link to="/leitores">Consultar leitores</Link><Link to="/emprestimos">Consultar empréstimos</Link><Link to="/reservas">Consultar reservas</Link></p>
    </div>}
  </Page>;
}

export default { useCase: "UC23", title: "Gerar dados de exemplo", path: "/livros/seed", Component: GenerateSampleData };
