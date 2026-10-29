import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function Table({ label, children }: { label: string; children: ReactNode }) {
  return <div className="results" role="region" aria-label={label} tabIndex={0}><table>{children}</table></div>;
}

export function RowActions({ edit, remove }: { edit?: string; remove?: string }) {
  return <span className="actions">{edit && <Link to={edit}>Editar</Link>}{remove && <Link to={remove}>Excluir</Link>}</span>;
}
