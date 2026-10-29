import { RegisterLoan } from "../register-loan/RegisterLoan";
import { ListLoans } from "./ListLoans";
import { expect, test } from "bun:test";
import { scenario } from "#tests/circulation-doubles";
import { api, testCopy } from "#tests/api";
import { testReader } from "#tests/reader-fixtures";
import { addDays, today } from "../../../../shared/dates";
import { inTransaction } from "../../../../infrastructure/transaction";

test("UC21 consulta filtra leitor, exemplar e situação e calcula atraso", async () => {
  const { create, time, memory } = scenario();
  const lend = create(RegisterLoan);
  const loans = create(ListLoans);
  const first = await lend.execute(1, 1);
  const second = await lend.execute(2, 2);
  time.now = "2026-10-29T12:00:00Z";
  expect((await loans.get(first.id)).status).toBe("em_aberto");
  time.now = "2026-10-30T12:00:00Z";
  expect((await loans.get(first.id)).daysOverdue).toBe(1);
  expect(await loans.execute({ status: "em_aberto" })).toHaveLength(2);
  memory.savedLoans.find(l => l.id === second.id)!.returnedOn = "2026-10-30";
  expect(await loans.execute({ status: "em_aberto" })).toHaveLength(1);
  expect(await loans.execute({ readerId: 1, copyId: 1, status: "atrasado" })).toHaveLength(1);
  expect(await loans.execute({ status: "devolvido" })).toHaveLength(1);
  await expect(loans.execute({ status: "erro" })).rejects.toThrow("inválida");
  await expect(loans.get(99)).rejects.toThrow("não encontrado");
});

test("UC21 API: identifica histórico e calcula atraso com filtros", async () => {
  const reader = await testReader(); const copy = await testCopy();
  const loan = await (await api("POST", "/emprestimos", { leitorId: reader.id, exemplarId: copy.id })).json();
  const lookup = await api("GET", `/emprestimos/${loan.id}`);
  expect(lookup.status).toBe(200);
  expect(await lookup.json()).toMatchObject({ id: loan.id, leitorNome: reader.nome, leitorCpf: reader.cpf, numeroRegistro: copy.numeroRegistro, situacao: "em_aberto", diasDeAtraso: 0 });
  await inTransaction(async tx => { await tx`UPDATE emprestimos SET data_prevista_devolucao = ${addDays(today(), -1)} WHERE id = ${loan.id}`; });
  const overdue = await api("GET", `/emprestimos?leitorId=${reader.id}&exemplarId=${copy.id}&situacao=atrasado`);
  expect(await overdue.json<unknown[]>()).toEqual([expect.objectContaining({ id: loan.id, diasDeAtraso: 1, situacao: "atrasado" })]);
  const open = await api("GET", `/emprestimos?leitorId=${reader.id}&situacao=em_aberto`);
  expect(await open.json<unknown[]>()).toEqual([expect.objectContaining({ id: loan.id, situacao: "atrasado" })]);
  expect((await api("GET", "/emprestimos?situacao=invalida")).status).toBe(400);
  expect((await api("GET", "/emprestimos/2147483647")).status).toBe(404);
});
