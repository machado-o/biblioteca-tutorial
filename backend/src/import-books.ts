import { prepareDatabase } from "./composition";
import { catalogIntegration } from "./integration/catalogIntegration";
import { parseBookInput } from "./modules/catalog/domain/Book";
import { createBook } from "./modules/catalog/features/create-book/createBook";

await prepareDatabase();

const path = process.argv[2];

if (!path) {
  console.error("uso: bun run import-books <arquivo.csv>");
  process.exit(1);
}

const content = await Bun.file(path).text();
const rows = content.trim().split("\n").slice(1);

let imported = 0;
let rejected = 0;

for (const row of rows) {
  const [isbn, title, authorId] = row.split(",") as [string, string, string];

  try {
    await createBook(parseBookInput({ isbn, titulo: title, autorId: Number(authorId) }), catalogIntegration);
    imported++;
  } catch (error) {
    console.log(`linha rejeitada (${(error as Error).message}): ${row}`);
    rejected++;
  }
}

console.log(`importados: ${imported} | rejeitados: ${rejected}`);
