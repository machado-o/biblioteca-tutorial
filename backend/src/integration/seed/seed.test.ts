import { afterAll, beforeAll, expect, test } from "bun:test";
import { api, testAuthor, testCopy } from "#tests/api";
import { cleanTestCatalog } from "#tests/clean-catalog";
import { testReader } from "#tests/reader-fixtures";
import { inTransaction } from "../../infrastructure/transaction";
import { sql } from "../../infrastructure/postgres";
import { normalizeCpf } from "../../modules/readers";
import type { SeedCatalog } from "./catalog";
import { seedReport } from "./report";
import { fictitiousCpf, runSeed } from "./run";
import { prepareSeed, SEED_VERSION } from "./schema";

if (!new URL(process.env.DATABASE_URL!).pathname.endsWith("_test")) {
  throw new Error("UC23 exige um banco de testes cujo nome termine em _test.");
}

// A suíte legada zera o acervo (inclusive o do seed) e deixa livros de autores do catálogo.
// Recomeçar e desfazer a carga torna o resultado independente da ordem das suítes.
async function resetSeed() {
  await cleanTestCatalog();
  await prepareSeed(sql);
  await inTransaction(async tx => {
    await tx`DELETE FROM leitores WHERE id IN (SELECT registro_id FROM seed_registros WHERE entidade = 'leitores')`;
    await tx`DELETE FROM seed_registros`;
    await tx`DELETE FROM seed_execucoes`;
    await tx`UPDATE autores SET livros_no_acervo = 0`;
  });
}
beforeAll(resetSeed);
afterAll(resetSeed);

test("UC23: conflito tardio de ISBN reverte toda a execução sem apagar dados existentes", async () => {
  if ((await seedReport(sql)).executado) return; // Esta prova exige a primeira execução no banco dedicado.
  const catalog = await Bun.file(new URL("./catalog.json", import.meta.url)).json() as SeedCatalog;
  const target = catalog.authors.at(-1)!.books.at(-1)!;
  const author = await testAuthor();
  const [conflict] = await sql`INSERT INTO livros (isbn, titulo, autor_id, data_catalogacao) VALUES (${target.isbn}, 'Registro incompatível de teste UC23', ${author.id}, '2026-01-01') RETURNING id`;
  const count = async () => (await sql`SELECT (SELECT COUNT(*)::int FROM autores) AS autores, (SELECT COUNT(*)::int FROM livros) AS livros, (SELECT COUNT(*)::int FROM exemplares) AS exemplares, (SELECT COUNT(*)::int FROM leitores) AS leitores, (SELECT COUNT(*)::int FROM emprestimos) AS emprestimos, (SELECT COUNT(*)::int FROM reservas) AS reservas`)[0];
  const before = await count();
  await expect(runSeed()).rejects.toThrow("Seed cancelado");
  expect(await count()).toEqual(before);
  expect(await seedReport(sql)).toEqual({ executado: false });
  await sql`DELETE FROM livros WHERE id = ${conflict!.id}`;
});

// Esta suíte reinicia o acervo e a carga do seed. Rode em biblioteca_test, nunca no banco da aula.
test("UC23: seed atômico, idempotente, completo e coerente com os limites e o histórico", async () => {
  const database = new URL(process.env.DATABASE_URL!).pathname;
  expect(database.endsWith("_test")).toBe(true);
  const sentinel = await testReader(); const existingCopy = await testCopy();
  const existingLoan = await (await api("POST", "/emprestimos", { leitorId: sentinel.id, exemplarId: existingCopy.id })).json();
  await api("POST", `/emprestimos/${existingLoan.id}/devolucao`);
  const [readersBefore] = await sql`SELECT COUNT(*)::int AS total FROM leitores`;
  const response = await api("POST", "/seed");
  expect(response.status, await response.clone().text()).toBe(200);
  const result = await response.json();
  expect(result).toMatchObject({ executado: true, resumo: { autores: 50, leitores: 120, emprestimosDevolvidos: 120, emprestimosEmDia: 30, emprestimosAtrasados: 30, reservasAtivas: 20, reservasCanceladas: 10, reservasExpiradas: 10 } });
  expect(result.resumo.livros).toBeGreaterThanOrEqual(50);
  expect(result.resumo.exemplares).toBeGreaterThanOrEqual(100);
  const summary = result.resumo;
  const [counts] = await sql`SELECT
    (SELECT COUNT(*)::int FROM seed_registros WHERE versao = ${SEED_VERSION} AND entidade = 'autores') AS autores,
    (SELECT COUNT(*)::int FROM seed_registros WHERE versao = ${SEED_VERSION} AND entidade = 'livros') AS livros,
    (SELECT COUNT(*)::int FROM seed_registros WHERE versao = ${SEED_VERSION} AND entidade = 'exemplares') AS exemplares,
    (SELECT COUNT(*)::int FROM seed_registros WHERE versao = ${SEED_VERSION} AND entidade = 'leitores') AS leitores`;
  expect(counts).toEqual({ autores: summary.autores, livros: summary.livros, exemplares: summary.exemplares, leitores: summary.leitores });
  const [invalid] = await sql`SELECT
    EXISTS(SELECT l.autor_id FROM livros l JOIN seed_registros s ON s.entidade = 'autores' AND s.registro_id = l.autor_id AND s.versao = ${SEED_VERSION} GROUP BY l.autor_id HAVING COUNT(*) > 5) AS authors,
    EXISTS(SELECT l.id FROM livros l JOIN seed_registros s ON s.entidade = 'livros' AND s.registro_id = l.id AND s.versao = ${SEED_VERSION} LEFT JOIN exemplares e ON e.livro_id = l.id GROUP BY l.id HAVING COUNT(e.id) < 1 OR COUNT(e.id) > 10) AS copies,
    EXISTS(SELECT leitor_id FROM emprestimos WHERE data_devolucao IS NULL GROUP BY leitor_id HAVING COUNT(*) > 3) AS readers,
    EXISTS(SELECT leitor_id FROM reservas WHERE situacao = 'ativa' AND data_expiracao > ${result.dataReferencia} GROUP BY leitor_id HAVING COUNT(*) > 2) AS reservations`;
  expect(invalid).toEqual({ authors: false, copies: false, readers: false, reservations: false });
  const [loans] = await sql`SELECT
    COUNT(*) FILTER (WHERE e.data_devolucao IS NOT NULL)::int AS returned,
    COUNT(*) FILTER (WHERE e.data_devolucao IS NULL AND e.data_prevista_devolucao >= ${result.dataReferencia})::int AS "onTime",
    COUNT(*) FILTER (WHERE e.data_devolucao IS NULL AND e.data_prevista_devolucao < ${result.dataReferencia})::int AS overdue
    FROM emprestimos e JOIN seed_registros s ON s.entidade = 'emprestimos' AND s.registro_id = e.id AND s.versao = ${SEED_VERSION}`;
  expect(loans).toEqual({ returned: 120, onTime: 30, overdue: 30 });
  const [reservations] = await sql`SELECT
    COUNT(*) FILTER (WHERE r.situacao = 'ativa' AND r.data_expiracao > ${result.dataReferencia})::int AS active,
    COUNT(*) FILTER (WHERE r.situacao = 'cancelada')::int AS cancelled,
    COUNT(*) FILTER (WHERE r.situacao = 'ativa' AND r.data_expiracao <= ${result.dataReferencia})::int AS expired
    FROM reservas r JOIN seed_registros s ON s.entidade = 'reservas' AND s.registro_id = r.id AND s.versao = ${SEED_VERSION}`;
  expect(reservations).toEqual({ active: 20, cancelled: 10, expired: 10 });
  const [dates] = await sql`SELECT
    EXISTS(SELECT 1 FROM emprestimos e JOIN seed_registros s ON s.entidade = 'emprestimos' AND s.registro_id = e.id AND s.versao = ${SEED_VERSION} JOIN exemplares x ON x.id = e.exemplar_id JOIN livros l ON l.id = x.livro_id WHERE e.data_prevista_devolucao::date - e.data_emprestimo::date <> 14 OR e.data_emprestimo < x.data_catalogacao OR x.data_catalogacao < l.data_catalogacao OR e.data_devolucao < e.data_emprestimo) AS loans,
    EXISTS(SELECT 1 FROM reservas r JOIN seed_registros s ON s.entidade = 'reservas' AND s.registro_id = r.id AND s.versao = ${SEED_VERSION} WHERE r.data_expiracao::date - r.data_reserva::date <> 7 OR r.data_limite_retirada::date - r.data_reserva::date <> 6) AS reservations,
    EXISTS(SELECT 1 FROM emprestimos e JOIN reservas r ON r.exemplar_id = e.exemplar_id WHERE e.data_devolucao IS NULL AND r.situacao = 'ativa' AND r.data_expiracao > ${result.dataReferencia}) AS collision`;
  expect(dates).toEqual({ loans: false, reservations: false, collision: false });
  const [overlap] = await sql`SELECT EXISTS(
    SELECT 1 FROM emprestimos a JOIN emprestimos b ON a.exemplar_id = b.exemplar_id AND a.id < b.id
    JOIN seed_registros s ON s.entidade = 'emprestimos' AND s.registro_id = a.id AND s.versao = ${SEED_VERSION}
    WHERE a.data_emprestimo < COALESCE(b.data_devolucao, '9999-12-31')
      AND b.data_emprestimo < COALESCE(a.data_devolucao, '9999-12-31')
  ) AS found`;
  expect(overlap!.found).toBe(false);
  for (let i = 1; i <= 120; i++) expect(normalizeCpf(fictitiousCpf(i))).toBe(fictitiousCpf(i));
  const [total] = await sql`SELECT COUNT(*)::int AS total FROM leitores`;
  if (result.criado) expect(total!.total).toBe(readersBefore!.total + 120);
  expect(await (await api("GET", `/leitores/${sentinel.id}`)).json<Record<string, unknown>>()).toMatchObject(sentinel);
  expect(await (await api("GET", `/emprestimos/${existingLoan.id}`)).json<Record<string, unknown>>()).toMatchObject({ id: existingLoan.id, situacao: "devolvido" });
  const repeats = await Promise.all([runSeed(), runSeed()]);
  expect(repeats.every(r => r.criado === false)).toBe(true);
  const repeated = repeats[0];
  expect(repeated).toEqual({ ...result, criado: false });
  expect(await (await api("GET", "/seed")).json<Record<string, unknown>>()).toEqual({ executado: true, dataReferencia: result.dataReferencia, resumo: summary });
});
