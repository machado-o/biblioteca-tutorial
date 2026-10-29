import { ReserveCopy } from "../reserve-copy/ReserveCopy";
import { RegisterLoan } from "./RegisterLoan";
import { expect, test } from "bun:test";
import { scenario } from "#tests/circulation-doubles";
import { api, testCopy } from "#tests/api";
import { testReader } from "#tests/reader-fixtures";
import { addDays, today } from "../../../../shared/dates";
import { sql } from "../../../../infrastructure/postgres";

test("UC19 empréstimo dura14 dias e reserva própria é atendida", async () => {
  const { create, memory } = scenario();
  const reserve = create(ReserveCopy);
  const lend = create(RegisterLoan);
  const reservation = await reserve.execute(1, 1);
  await expect(lend.execute(2, 1)).rejects.toThrow("outro leitor");
  const loan = await lend.execute(1, 1);
  expect(loan).toMatchObject({ loanedOn: "2026-10-15", dueOn: "2026-10-29", returnedOn: null, status: "em_aberto", daysOverdue: 0 });
  expect(memory.savedReservations.find(r => r.id === reservation.id)!.status).toBe("atendida");
  await expect(lend.execute(1, 1)).rejects.toThrow("já está emprestado");
  await expect(reserve.execute(2, 1)).rejects.toThrow("indisponível");
});

test("UC19 API: empréstimo atende reserva própria, impede reserva alheia e vence em14 dias", async () => {
  const reader = await testReader(); const other = await testReader(); const copy = await testCopy();
  const reservation = await (await api("POST", "/reservas", { leitorId: reader.id, exemplarId: copy.id })).json();
  expect((await api("POST", "/emprestimos", { leitorId: other.id, exemplarId: copy.id })).status).toBe(409);
  const response = await api("POST", "/emprestimos", { leitorId: reader.id, exemplarId: copy.id });
  expect(response.status).toBe(201);
  expect(await response.json()).toMatchObject({ leitorId: reader.id, exemplarId: copy.id, dataEmprestimo: today(), dataPrevistaDevolucao: addDays(today(), 14), dataDevolucao: null, situacao: "em_aberto" });
  const [row] = await sql`SELECT situacao FROM reservas WHERE id = ${reservation.id}`;
  expect(row!.situacao).toBe("atendida");
  expect((await api("POST", "/emprestimos", { leitorId: reader.id, exemplarId: copy.id })).status).toBe(409);
});

test("UC19 API: quatro pedidos simultâneos resultam em três empréstimos", async () => {
  const reader = await testReader();
  const copies = await Promise.all(Array.from({ length: 4 }, () => testCopy()));
  const responses = await Promise.all(copies.map(c => api("POST", "/emprestimos", { leitorId: reader.id, exemplarId: c.id })));
  expect(responses.filter(r => r.status === 201)).toHaveLength(3);
  expect(responses.filter(r => r.status === 409)).toHaveLength(1);
});

test("UC19 recusa quarto empréstimo incluindo os atrasados", async () => {
  const { create, time, memory } = scenario();
  const reserve = create(ReserveCopy);
  const lend = create(RegisterLoan);
  for (const copyId of [1, 2, 3]) await lend.execute(1, copyId);
  time.now = "2026-11-01T12:00:00Z";
  await expect(lend.execute(1, 4)).rejects.toThrow("três empréstimos");
  expect(memory.savedLoans).toHaveLength(3);
});

test("UC19 reserva expirada não impede empréstimo por outro leitor", async () => {
  const { create, time } = scenario();
  const reserve = create(ReserveCopy);
  const lend = create(RegisterLoan);
  await reserve.execute(1, 1); time.now = "2026-10-22T12:00:00Z";
  expect((await lend.execute(2, 1)).readerId).toBe(2);
});
