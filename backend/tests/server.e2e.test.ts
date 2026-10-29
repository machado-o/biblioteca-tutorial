import { afterAll, beforeAll, beforeEach, expect, test } from "bun:test";
import { cleanTestCatalog } from "./clean-catalog";

const BASE = "http://localhost:3999";
const AUSTEN = 4;
const BOOKS = [
  { isbn: "9780141439518", titulo: "Orgulho e Preconceito" },
  { isbn: "9780141439662", titulo: "Razão e Sensibilidade" },
  { isbn: "9780141439587", titulo: "Emma" },
  { isbn: "9780141439761", titulo: "Persuasão" },
  { isbn: "9780141439563", titulo: "A Abadia de Northanger" },
  { isbn: "9780141199689", titulo: "Lady Susan" },
];
const EVANS = 1;

/** ISBN-13 sintético com dígito verificador correto — a fase 34 vai conferir. */
function syntheticIsbn(sequence: number): string {
  const twelve = `97800000${String(sequence).padStart(4, "0")}`;
  let sum = 0;

  for (let i = 0; i < 12; i++) sum += Number(twelve[i]!) * (i % 2 === 0 ? 1 : 3);

  return twelve + ((10 - (sum % 10)) % 10);
}

const EVANS_BOOKS = Array.from({ length: 11 }, (_, i) => ({
  isbn: syntheticIsbn(i),
  titulo: `Título didático ${i + 1}`,
}));

let server: ReturnType<typeof Bun.spawn>;

beforeAll(async () => {
  // não há como exercitar a regra sem subir a aplicação inteira
  server = Bun.spawn(["bun", "src/main.ts"], {
    stdout: "ignore",
    // porta própria: a sonda abaixo só passa quando ESTE servidor subir
    env: { ...process.env, PORT: "3999" },
  });

  // ... e sem esperar a porta abrir
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      await fetch(BASE);
      return;
    } catch {
      await Bun.sleep(100);
    }
  }

  throw new Error("o servidor não subiu");
});

afterAll(() => {
  server.kill();
});

beforeEach(async () => {
  // ... e sem limpar o banco de verdade entre um teste e outro
  await cleanTestCatalog();
});

function createBook(n: number, authorId = AUSTEN, books = BOOKS) {
  return fetch(`${BASE}/api/livros`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...books[n], autorId: authorId }),
  });
}

const createEvansBook = (n: number) => createBook(n, EVANS, EVANS_BOOKS);

test("uma rota inexistente da API responde 404 em JSON", async () => {
  const response = await fetch(`${BASE}/api/nada`);

  expect(response.status).toBe(404);
  expect(response.headers.get("Content-Type")).toContain("application/json");
  expect(await response.json()).toEqual({ error: "Recurso não encontrado" });
});

test("uma rota do frontend pode ser aberta diretamente", async () => {
  const response = await fetch(`${BASE}/cadastrar`);

  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type")).toContain("text/html");
  expect(await response.text()).toContain('<div id="root"></div>');
});

test("RF05: um autor de literatura vai até 5 livros no acervo", async () => {
  for (let i = 0; i < 5; i++) {
    const response = await createBook(i);
    expect(response.status).toBe(201);
  }

  const sixth = await createBook(5);

  expect(sixth.status).toBe(409);
});

test("RF05′: um autor didático vai até 10 livros no acervo", async () => {
  for (let i = 0; i < 10; i++) {
    const response = await createEvansBook(i);
    expect(response.status).toBe(201);
  }

  const eleventh = await createEvansBook(10);

  expect(eleventh.status).toBe(409);
});
