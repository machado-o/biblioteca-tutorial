import { api, testName } from "./api";

export function testCpf(): string {
  let cpf = Array.from(crypto.getRandomValues(new Uint8Array(9)), n => String(n % 10)).join("");
  if (/^(\d)\1{8}$/.test(cpf)) return testCpf();
  for (const size of [9, 10]) {
    const sum = [...cpf].reduce((total, digit, index) => total + Number(digit) * (size + 1 - index), 0);
    const rest = (sum * 10) % 11;
    cpf += rest === 10 ? "0" : String(rest);
  }
  return cpf;
}

/** Leitor criado pela API; o tipo descreve o JSON da API, em português. */
export async function testReader(): Promise<{ id: number; nome: string; cpf: string; email: string; telefone: string }> {
  const response = await api("POST", "/leitores", {
    nome: testName("Leitor"), cpf: testCpf(),
    email: `${crypto.randomUUID()}@exemplo.com`, telefone: "27999991234",
  });
  if (response.status !== 201) throw new Error(`Fixture leitor: ${await response.text()}`);
  return response.json();
}
