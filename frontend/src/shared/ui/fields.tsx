import type { FormEvent, ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

export function Field({ name, label, children, hint }: { name: string; label: string; children: ReactNode; hint?: string }) {
  return <div className="field"><label htmlFor={name}>{label}</label>{children}{hint && <small id={`${name}-hint`}>{hint}</small>}</div>;
}

export function Select<T extends { id: number }>({ name, label, items, itemLabel, value, initialValue = "", onChange, required = true, emptyLabel = "Selecione uma opção" }: {
  name: string; label: string; items: T[]; itemLabel: (item: T) => string; value?: string; initialValue?: string; onChange?: (value: string) => void; required?: boolean; emptyLabel?: string;
}) {
  return <Field name={name} label={label}>
    <select id={name} name={name} required={required} value={value} onChange={onChange ? (e) => onChange(e.target.value) : undefined} defaultValue={value === undefined ? initialValue : undefined}>
      <option value="">{emptyLabel}</option>
      {items.map((item) => <option key={item.id} value={item.id}>{itemLabel(item)}</option>)}
    </select>
  </Field>;
}

/** Escolha de um registro existente; nenhum ID precisa ser digitado. */
export function RecordPicker<T extends { id: number }>({ label, items, itemLabel, value, onChange }: {
  label: string; items: T[]; itemLabel: (item: T) => string; value: string; onChange: (value: string) => void;
}) {
  return <div className="record-picker">
    <Select name="selectedRecord" label={label} items={items} itemLabel={itemLabel} value={value} onChange={onChange} />
    {!items.length && <p className="hint">Nenhum registro cadastrado.</p>}
  </div>;
}

/** O termo fica na URL: recarregar ou voltar preserva a consulta. */
export function SearchForm({ hint, label = "Termo de busca" }: { hint: string; label?: string }) {
  const [params, setParams] = useSearchParams();
  const term = params.get("q") ?? "";
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    setParams(q ? { q } : {});
  }
  return <form className="search" onSubmit={search}>
    <Field name="q" label={label}><input key={term} id="q" name="q" defaultValue={term} placeholder={hint} /></Field>
    <button type="submit">Buscar</button>
  </form>;
}
