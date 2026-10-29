/* oxlint-disable react/only-export-components -- Cada page.tsx exporta metadados e componente para o carregamento automático. */
import { type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { queryString } from "../../../../shared/api.ts";
import { Loading, Status } from "../../../../shared/ui/feedback.tsx";
import { Field, Select } from "../../../../shared/ui/fields.tsx";
import { Page } from "../../../../shared/ui/Page.tsx";
import { RowActions, Table } from "../../../../shared/ui/Table.tsx";
import { useFetch } from "../../../../shared/useFetch.ts";
import type { Book, Copy } from "../../types.ts";

function SearchCopies() {
  const [params, setParams] = useSearchParams();
  const books = useFetch<Book[]>("/api/livros");
  const filters = { q: params.get("q") ?? "", livroId: params.get("livroId") ?? "", situacao: params.get("situacao") ?? "" };
  const copies = useFetch<Copy[]>(`/api/exemplares${queryString(filters)}`);
  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    for (const key of ["q", "livroId", "situacao"]) { const value = String(data.get(key) ?? "").trim(); if (value) next.set(key, value); }
    setParams(next);
  }
  return <Page title="Buscar exemplares" description="Localize cada cópia física e confira sua disponibilidade para reserva ou empréstimo.">
    <form className="filters" onSubmit={filter} key={params.toString()}>
      <Field name="q" label="Registro, título ou ISBN"><input id="q" name="q" defaultValue={filters.q} /></Field>
      {books.data && <Select name="livroId" label="Livro" items={books.data} itemLabel={(book) => book.titulo} initialValue={filters.livroId} required={false} emptyLabel="Todos os livros" />}
      <Field name="situacao" label="Situação"><select id="situacao" name="situacao" defaultValue={filters.situacao}><option value="">Todas</option><option value="disponivel">Disponível</option><option value="reservado">Reservado</option><option value="emprestado">Emprestado</option></select></Field>
      <button type="submit">Filtrar exemplares</button>
    </form>
    <Loading loading={copies.loading} error={copies.error || books.error} />
    {copies.data && (copies.data.length ? <Table label="Exemplares encontrados"><thead><tr><th>Registro / Livro</th><th>Localização</th><th>Conservação</th><th>Situação</th><th>Ações</th></tr></thead><tbody>
      {copies.data.map((copy) => <tr key={copy.id}><td><strong>{copy.numeroRegistro}</strong><small className="secondary-line">{copy.titulo}</small></td><td>{copy.localizacao}</td><td>{copy.estadoConservacao}</td><td><Status value={copy.situacao} /></td><td><span className="actions"><RowActions edit={`/exemplares/editar?id=${copy.id}`} remove={`/exemplares/excluir?id=${copy.id}`} />{copy.situacao === "disponivel" && <Link to={`/reservas/criar?exemplarId=${copy.id}`}>Reservar</Link>}</span></td></tr>)}
    </tbody></Table> : <p className="empty">Nenhum exemplar encontrado para esses filtros.</p>)}
  </Page>;
}

export default { useCase: "UC14", title: "Buscar exemplares", path: "/exemplares", Component: SearchCopies };
