import { ReserveCopy } from "../reserve-copy/ReserveCopy";
import { RegisterLoan } from "../register-loan/RegisterLoan";
import { RegisterReturn } from "./RegisterReturn";
import { expect, test } from "bun:test";
import { scenario } from "#tests/circulation-doubles";
import { api, testCopy } from "#tests/api";
import { testReader } from "#tests/reader-fixtures";
import { today } from "../../../../shared/dates";

test("UC20 devolução libera exemplar e vaga e só pode ocorrer uma vez", async () => {
  const { create, time } = scenario();
  const reserve = create(ReserveCopy);
  const lend = create(RegisterLoan);
  const giveBack = create(RegisterReturn);
  const first = await lend.execute(1, 1);
  await lend.execute(1, 2); await lend.execute(1, 3);
  time.now = "2026-11-01T12:00:00Z";
  const returned = await giveBack.execute(first.id);
  expect(returned).toMatchObject({ returnedOn: "2026-11-01", status: "devolvido", daysOverdue: 3 });
  await expect(giveBack.execute(first.id)).rejects.toThrow("já foi devolvido");
  await lend.execute(1, 4); await reserve.execute(2, 1);
});

test("UC20 API: devolução única libera a cópia para novo empréstimo", async () => {
  const reader = await testReader(); const copy = await testCopy();
  const loan = await (await api("POST", "/emprestimos", { leitorId: reader.id, exemplarId: copy.id })).json();
  const response = await api("POST", `/emprestimos/${loan.id}/devolucao`);
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ id: loan.id, dataDevolucao: today(), situacao: "devolvido" });
  expect((await api("POST", `/emprestimos/${loan.id}/devolucao`)).status).toBe(409);
  expect((await api("POST", "/emprestimos", { leitorId: reader.id, exemplarId: copy.id })).status).toBe(201);
  expect((await api("POST", "/emprestimos/2147483647/devolucao")).status).toBe(404);
});
