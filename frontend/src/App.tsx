import { Link, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { FeaturePage } from "./shared/featurePage.ts";

// Cada fatia acrescenta seu page.tsx; não há menu ou roteador para disputar.
const loaded = import.meta.glob<{ default: FeaturePage }>(["./modules/*/features/*/page.tsx", "./integration/*/page.tsx"], { eager: true });
const pages = Object.values(loaded).map((module) => module.default).sort((a, b) => a.useCase.localeCompare(b.useCase));
const areas = [
  { path: "/livros", title: "Livros" },
  { path: "/autores", title: "Autores" },
  { path: "/leitores", title: "Leitores" },
  { path: "/exemplares", title: "Exemplares" },
  { path: "/reservas", title: "Reservas" },
  { path: "/emprestimos", title: "Empréstimos" },
];

export default function App() {
  const location = useLocation();
  const currentArea = areas.find((area) => location.pathname.startsWith(area.path)) ?? areas[0]!;
  const activities = pages.filter((page) => page.path.startsWith(currentArea.path));
  return (
    <>
      <a className="skip-link" href="#content">Ir para o conteúdo</a>
      <header className="top-bar">
        <div className="identity"><Link className="brand" to="/">Biblioteca</Link><span>Acervo e circulação</span></div>
        <nav aria-label="Áreas da biblioteca">
          {areas.filter((area) => pages.some((page) => page.path.startsWith(area.path))).map((area) => {
            const start = pages.find((page) => page.path === area.path)?.path ?? pages.find((page) => page.path.startsWith(area.path))!.path;
            return <Link key={area.path} to={start} className={currentArea.path === area.path ? "active" : ""} aria-current={currentArea.path === area.path ? "true" : undefined}>{area.title}</Link>;
          })}
        </nav>
      </header>
      <div className="activities-bar">
        <nav className="activities" aria-label={`Atividades de ${currentArea.title}`}>
          {activities.map((page) => <NavLink key={page.path} to={page.path} end>{page.title}</NavLink>)}
        </nav>
      </div>
      <main className="content" id="content">
        <Routes>
          {pages.map(({ path, Component }) => <Route key={path} path={path} element={<Component />} />)}
          <Route path="/" element={<Navigate to={`/livros${location.search}`} replace />} />
          <Route path="/cadastrar" element={<Navigate to={`/livros/cadastrar${location.search}`} replace />} />
          <Route path="*" element={<><h1>Página não encontrada</h1><p>Use o menu para escolher uma atividade disponível.</p><Link to="/">Voltar ao acervo</Link></>} />
        </Routes>
      </main>
      <footer className="footer">Biblioteca · Gestão do acervo e atendimento ao leitor</footer>
    </>
  );
}
