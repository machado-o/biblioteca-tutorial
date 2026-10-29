import { InvalidInput } from "../../../shared/errors";

export type ReaderInput = { name: string; cpf: string; email: string; phone: string };
export type Reader = ReaderInput & { id: number };

/** O CPF identifica o leitor; pontuação não faz parte do valor persistido. */
export function normalizeCpf(value: string): string {
  if (!/^[\d.\-\s]+$/.test(value)) throw new InvalidInput("CPF inválido.");
  const cpf = value.replace(/\D/g, "");
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
    throw new InvalidInput("CPF inválido.");
  }
  for (const size of [9, 10]) {
    const sum = [...cpf.slice(0, size)].reduce(
      (total, digit, index) => total + Number(digit) * (size + 1 - index), 0,
    );
    const rest = (sum * 10) % 11;
    if (Number(cpf[size]) !== (rest === 10 ? 0 : rest)) {
      throw new InvalidInput("CPF inválido.");
    }
  }
  return cpf;
}

export function parseReaderInput(body: unknown): ReaderInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new InvalidInput("Informe os dados do leitor.");
  }
  const data = body as Record<string, unknown>;
  function text(field: string): string {
    const value = data[field];
    if (typeof value !== "string" || !value.trim()) {
      throw new InvalidInput(`O campo ${field} é obrigatório.`);
    }
    return value.trim();
  }
  const name = text("nome");
  const cpf = normalizeCpf(text("cpf"));
  const email = text("email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new InvalidInput("E-mail inválido.");
  const informedPhone = text("telefone");
  if (!/^[\d\s()+.\-]+$/.test(informedPhone)) throw new InvalidInput("Telefone inválido.");
  const phone = informedPhone.replace(/\D/g, "");
  if (phone.length < 10 || phone.length > 15) throw new InvalidInput("Telefone inválido.");
  return { name, cpf, email, phone };
}
