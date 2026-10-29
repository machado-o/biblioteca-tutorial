import type { SQL, TransactionSQL } from "bun";
import { sql } from "../../infrastructure/postgres";
import { parseReaderInput } from "../../modules/readers";
import { addDays, today } from "../../shared/dates";
import { RuleConflict } from "../../shared/errors";
import { validateSeedCatalog, type SeedCatalog } from "./catalog";
import { seedReport, type SeedSummary } from "./report";
import { prepareSeed, SEED_VERSION } from "./schema";

type SeedCopy = { id: number; catalogedOn: string };
async function mark(tx: TransactionSQL, entity: string, id: number) {
  await tx`INSERT INTO seed_registros (versao, entidade, registro_id) VALUES (${SEED_VERSION}, ${entity}, ${id}) ON CONFLICT DO NOTHING`;
}

export function fictitiousCpf(index: number): string {
  let cpf = `900${String(index).padStart(6, "0")}`;
  for (const size of [9, 10]) {
    const sum = [...cpf].reduce((total, n, i) => total + Number(n) * (size + 1 - i), 0);
    const rest = sum * 10 % 11; cpf += String(rest === 10 ? 0 : rest);
  }
  return cpf;
}

/** Orquestração de integração fora de modules: todas as escritas são uma transação única. */
export async function runSeed(db: SQL = sql, now = new Date(), provided?: SeedCatalog) {
  const catalog = provided ?? await Bun.file(new URL("./catalog.json", import.meta.url)).json() as SeedCatalog;
  validateSeedCatalog(catalog);
  await prepareSeed(db);
  return await db.begin(async tx => {
    await tx`SELECT pg_advisory_xact_lock(22001)`;
    const previous = await seedReport(tx);
    if (previous.executado) return { ...previous, criado: false };
    const date = today(() => now); const old = addDays(date, -180);
    const all: SeedCopy[] = []; let bookCount = 0;
    for (const author of catalog.authors) {
      const existing = await tx`SELECT id FROM autores WHERE lower(btrim(nome)) = lower(btrim(${author.name}))`;
      if (existing.length > 1) throw new RuleConflict(`Seed cancelado: há mais de um autor chamado ${author.name}.`);
      const [created] = existing.length ? existing : await tx`INSERT INTO autores (nome, tipo) VALUES (${author.name}, 'literatura') RETURNING id`;
      const authorId = Number(created!.id); await mark(tx, "autores", authorId);
      const current = await tx<{ id: number; isbn: string }[]>`SELECT id, isbn FROM livros WHERE autor_id = ${authorId}`;
      const additional = author.books.filter(b => !current.some(r => r.isbn === b.isbn)).length;
      if (current.length + additional > 5) throw new RuleConflict(`Seed cancelado: ${author.name} ultrapassaria 5 livros. Nenhum dado foi alterado.`);
      for (const book of author.books) {
        const [stored] = await tx`SELECT id, titulo AS title, autor_id AS "authorId", data_catalogacao AS "catalogedOn" FROM livros WHERE isbn = ${book.isbn}`;
        if (stored && (stored.authorId !== authorId || stored.title.trim().toLowerCase() !== book.title.trim().toLowerCase())) throw new RuleConflict(`Seed cancelado: ISBN ${book.isbn} já pertence a outro registro bibliográfico.`);
        if (!stored) {
          const [sameTitle] = await tx`SELECT id FROM livros WHERE autor_id = ${authorId} AND lower(btrim(titulo)) = lower(btrim(${book.title}))`;
          if (sameTitle) throw new RuleConflict(`Seed cancelado: título ${book.title} já existe com outro ISBN.`);
        }
        const [inserted] = stored ? [stored] : await tx`INSERT INTO livros (isbn, titulo, autor_id, data_catalogacao) VALUES (${book.isbn}, ${book.title}, ${authorId}, ${old}) RETURNING id, data_catalogacao AS "catalogedOn"`;
        const bookId = Number(inserted!.id); await mark(tx, "livros", bookId);
        const copies = await tx<SeedCopy[]>`SELECT id, data_catalogacao AS "catalogedOn" FROM exemplares WHERE livro_id = ${bookId} ORDER BY id`;
        if (copies.length > 10) throw new RuleConflict(`Seed cancelado: o livro ${book.title} já possui mais de 10 exemplares.`);
        const wanted = 1 + bookCount++ % 10;
        const copyDate = String(inserted!.catalogedOn) > old ? String(inserted!.catalogedOn) : old;
        for (let i = copies.length; i < wanted; i++) {
          const year = copyDate.slice(0, 4);
          const [counter] = await tx`INSERT INTO acervo_sequencias (ano, ultimo) VALUES (${year}, 1) ON CONFLICT (ano) DO UPDATE SET ultimo = acervo_sequencias.ultimo + 1 RETURNING ultimo AS last`;
          const registrationNumber = `${year}-${String(counter!.last).padStart(6, "0")}`;
          const [copy] = await tx<SeedCopy[]>`INSERT INTO exemplares (livro_id, numero_registro, localizacao, estado_conservacao, data_catalogacao) VALUES (${bookId}, ${registrationNumber}, 'Acervo demonstrativo UC23', 'bom', ${copyDate}) RETURNING id, data_catalogacao AS "catalogedOn"`;
          copies.push(copy!);
        }
        for (const copy of copies) {
          if (copy.catalogedOn > date || copy.catalogedOn < String(inserted!.catalogedOn)) throw new RuleConflict("Seed cancelado: há datas de catalogação incompatíveis na base existente.");
          await mark(tx, "exemplares", copy.id); all.push(copy);
        }
      }
      await tx`UPDATE autores SET livros_no_acervo = (SELECT COUNT(*) FROM livros WHERE autor_id = ${authorId}) WHERE id = ${authorId}`;
    }
    const free: SeedCopy[] = [];
    for (const copy of all) {
      // Movimentações de demonstração só usam cópias antigas e sem histórico anterior.
      // Assim não alteramos nem sobrepomos a circulação dos dados preexistentes.
      if (copy.catalogedOn > old) continue;
      const [history] = await tx`SELECT EXISTS(SELECT 1 FROM emprestimos WHERE exemplar_id = ${copy.id}) OR EXISTS(SELECT 1 FROM reservas WHERE exemplar_id = ${copy.id}) AS found`;
      if (!history!.found) free.push(copy);
    }
    const historical = free;
    if (all.length < 100 || free.length < 100) throw new RuleConflict("Seed cancelado: são necessários 100 exemplares catalogados há pelo menos 180 dias e sem histórico anterior. Nenhum dado foi alterado.");
    const readers: number[] = [];
    for (let i = 1; i <= 120; i++) {
      const input = parseReaderInput({ nome: `Leitor Fictício ${String(i).padStart(3, "0")}`, cpf: fictitiousCpf(i), email: `leitor.seed${String(i).padStart(3, "0")}@example.com`, telefone: `2799${String(i).padStart(7, "0")}` });
      const [existing] = await tx`SELECT id, nome AS name, email, telefone AS phone FROM leitores WHERE cpf = ${input.cpf}`;
      if (existing && (existing.name !== input.name || existing.email !== input.email || existing.phone !== input.phone)) throw new RuleConflict(`Seed cancelado: CPF fictício ${input.cpf} já pertence a outro leitor.`);
      if (existing) {
        const [linked] = await tx`SELECT EXISTS(SELECT 1 FROM reservas WHERE leitor_id = ${existing.id}) OR EXISTS(SELECT 1 FROM emprestimos WHERE leitor_id = ${existing.id}) AS found`;
        if (linked!.found) throw new RuleConflict("Seed cancelado: um leitor fictício já possui histórico incompatível.");
      }
      const [saved] = existing ? [existing] : await tx`INSERT INTO leitores (nome, cpf, email, telefone) VALUES (${input.name}, ${input.cpf}, ${input.email}, ${input.phone}) RETURNING id`;
      readers.push(Number(saved!.id)); await mark(tx, "leitores", Number(saved!.id));
    }
    for (let i = 0; i < 120; i++) {
      const copy = historical[i % historical.length]!;
      // Cada volta usa uma quinzena anterior, sem sobrepor os empréstimos da mesma cópia.
      const start = addDays(date, -60 - Math.floor(i / historical.length) * 15);
      const [r] = await tx`INSERT INTO emprestimos (leitor_id, exemplar_id, data_emprestimo, data_prevista_devolucao, data_devolucao) VALUES (${readers[i]!}, ${copy.id}, ${start}, ${addDays(start, 14)}, ${addDays(start, 7)}) RETURNING id`;
      await mark(tx, "emprestimos", Number(r!.id));
    }
    for (let i = 0; i < 60; i++) {
      const start = addDays(date, i < 30 ? -3 : -21);
      const [r] = await tx`INSERT INTO emprestimos (leitor_id, exemplar_id, data_emprestimo, data_prevista_devolucao) VALUES (${readers[i]!}, ${free[i]!.id}, ${start}, ${addDays(start, 14)}) RETURNING id`;
      await mark(tx, "emprestimos", Number(r!.id));
    }
    for (let i = 0; i < 40; i++) {
      const start = addDays(date, i < 20 ? 0 : i < 30 ? -10 : -8);
      const status = i >= 20 && i < 30 ? "cancelada" : "ativa";
      const [r] = await tx`INSERT INTO reservas (leitor_id, exemplar_id, data_reserva, data_limite_retirada, data_expiracao, situacao) VALUES (${readers[i + 60]!}, ${free[i + 60]!.id}, ${start}, ${addDays(start, 6)}, ${addDays(start, 7)}, ${status}) RETURNING id`;
      await mark(tx, "reservas", Number(r!.id));
    }
    const summary: SeedSummary = { autores: 50, livros: bookCount, exemplares: all.length, leitores: 120, emprestimosDevolvidos: 120, emprestimosEmDia: 30, emprestimosAtrasados: 30, reservasAtivas: 20, reservasCanceladas: 10, reservasExpiradas: 10 };
    await tx`INSERT INTO seed_execucoes (versao, data_referencia, resumo) VALUES (${SEED_VERSION}, ${date}, ${JSON.stringify(summary)}::text::jsonb)`;
    return { executado: true, criado: true, dataReferencia: date, resumo: summary };
  });
}
