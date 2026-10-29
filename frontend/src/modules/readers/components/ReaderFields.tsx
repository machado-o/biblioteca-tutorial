import { Field } from "../../../shared/ui/fields.tsx";
import type { Reader } from "../types.ts";

/** Campos usados no cadastro e na atualização do leitor. */
export function ReaderFields({ reader }: { reader: Reader | null }) {
  return <>
    <Field name="nome" label="Nome completo"><input id="nome" name="nome" required autoComplete="name" defaultValue={reader?.nome} /></Field>
    <Field name="cpf" label="CPF" hint="CPF único, com ou sem pontuação."><input id="cpf" name="cpf" required inputMode="numeric" defaultValue={reader?.cpf} aria-describedby="cpf-hint" /></Field>
    <Field name="email" label="E-mail"><input id="email" name="email" type="email" required autoComplete="email" defaultValue={reader?.email} /></Field>
    <Field name="telefone" label="Telefone"><input id="telefone" name="telefone" type="tel" required autoComplete="tel" defaultValue={reader?.telefone} /></Field>
  </>;
}
