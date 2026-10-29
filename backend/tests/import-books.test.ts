import { beforeEach, expect, test } from "bun:test";
import { sql } from "../src/infrastructure/postgres";
import { prepareAuthorship } from "../src/modules/authorship";
import { prepareCatalog } from "../src/modules/catalog";
import { cleanTestCatalog } from "./clean-catalog";

const AUSTEN = 4;
const BOOKS = [
  { isbn: "9780141439518", title: "Orgulho e Preconceito" },
  { isbn: "9780141439662", title: "Razão e Sensibilidade" },
  { isbn: "9780141439587", title: "Emma" },
  { isbn: "9780141439761", title: "Persuasão" },
  { isbn: "9780141439563", title: "A Abadia de Northanger" },
  { isbn: "9780141199689", title: "Lady Susan" },
];

await prepareAuthorship();
await prepareCatalog();

beforeEach(async () => {
  await cleanTestCatalog();
});

async function importBooks(csv: string): Promise<void> {
  await Bun.write("data/importacao-teste.csv", csv);

  const child = Bun.spawn(
    ["bun", "src/import-books.ts", "data/importacao-teste.csv"],
    { stdout: "ignore" },
  );

  await child.exited;
}

async function inCatalog(authorId: number): Promise<number> {
  const [row] = (await sql`
    SELECT COUNT(*)::int AS total FROM livros WHERE autor_id = ${authorId}
  `) as { total: number }[];

  return row!.total;
}

function csvLines(books: typeof BOOKS, authorId: number): string {
  return (
    "isbn,titulo,autorId\n" +
    books.map((b) => `${b.isbn},${b.title},${authorId}`).join("\n") +
    "\n"
  );
}

test("RF05 também vale para a importação em lote", async () => {
  const csv = csvLines(BOOKS, AUSTEN);

  await importBooks(csv);

  expect(await inCatalog(AUSTEN)).toBe(5);
});
