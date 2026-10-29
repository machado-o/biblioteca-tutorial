import { loadSlices, prepareDatabase } from "../src/composition";
import { createApp } from "../src/server";

// Cada suíte usa um banco de TESTES. Os fixtures são próprios: nenhuma tabela é apagada.
await prepareDatabase();
const app = createApp(await loadSlices());

// O contrato JSON é verificado pelos expects de cada atividade.
export interface TestResponse extends Response { json<T = any>(): Promise<T> }
export async function api(method: string, path: string, body?: unknown): Promise<TestResponse> {
  return app.request(`/api${path}`, {
    method,
    ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  }) as Promise<TestResponse>;
}

export function testName(prefix: string): string {
  return `${prefix} ${crypto.randomUUID()}`;
}

export function testIsbn(): string {
  const digits = crypto.getRandomValues(new Uint8Array(9));
  const twelve = "978" + Array.from(digits, (n) => n % 10).join("");
  const sum = [...twelve].reduce((total, n, i) => total + Number(n) * (i % 2 ? 3 : 1), 0);
  return twelve + (10 - sum % 10) % 10;
}

// Os tipos de retorno descrevem o JSON da API, que continua em português.
export async function testAuthor(type = "literatura"): Promise<{ id: number; nome: string }> {
  const response = await api("POST", "/autores", { nome: testName("Autor"), tipo: type });
  if (response.status !== 201) throw new Error(`Fixture autor: ${await response.text()}`);
  return response.json();
}

export async function testBook(): Promise<{ id: number; isbn: string; titulo: string; autorId: number; dataCatalogacao: string }> {
  const author = await testAuthor();
  const response = await api("POST", "/livros", { isbn: testIsbn(), titulo: testName("Livro"), autorId: author.id });
  if (response.status !== 201) throw new Error(`Fixture livro: ${await response.text()}`);
  return response.json();
}

export async function testCopy(): Promise<{ id: number; livroId: number; numeroRegistro: string }> {
  const book = await testBook();
  const response = await api("POST", "/exemplares", { livroId: book.id, localizacao: "Estante T", estadoConservacao: "bom" });
  if (response.status !== 201) throw new Error(`Fixture exemplar: ${await response.text()}`);
  return response.json();
}
