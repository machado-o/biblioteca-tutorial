import { ReserveCopy } from "../reserve-copy/ReserveCopy";
import { ListReservations } from "./ListReservations";
import { expect, test } from "bun:test";
import { scenario } from "#tests/circulation-doubles";
import { api, testCopy } from "#tests/api";
import { testReader } from "#tests/reader-fixtures";
import { today } from "../../../../shared/dates";
import { inTransaction } from "../../../../infrastructure/transaction";

test("UC22 filtra reservas por leitor, exemplar e situação derivada sem apagar histórico", async () => {
  const { create, time, memory } = scenario();
  const reserve = create(ReserveCopy);
  const reservations = create(ListReservations);
  const first = await reserve.execute(1, 1);
  const second = await reserve.execute(2, 2);
  memory.savedReservations.find(r => r.id === second.id)!.status = "cancelada";
  time.now = "2026-10-22T12:00:00Z";
  expect((await reservations.get(first.id)).status).toBe("expirada");
  expect(await reservations.execute({ readerId: 1, copyId: 1, status: "expirada" })).toHaveLength(1);
  expect(await reservations.execute({ status: "cancelada" })).toHaveLength(1);
  expect(await reservations.execute()).toHaveLength(2);
  await expect(reservations.execute({ status: "erro" })).rejects.toThrow("inválida");
});

test("UC22 API: lista com nomes e filtros e deriva expiração na data corrente", async () => {
  const reader = await testReader(); const copy = await testCopy();
  const reservation = await (await api("POST", "/reservas", { leitorId: reader.id, exemplarId: copy.id })).json();
  const single = await api("GET", `/reservas/${reservation.id}`);
  expect(single.status).toBe(200);
  expect(await single.json()).toMatchObject({ id: reservation.id, leitorNome: reader.nome, leitorCpf: reader.cpf, numeroRegistro: copy.numeroRegistro, situacao: "ativa" });
  const list = await api("GET", `/reservas?leitorId=${reader.id}&exemplarId=${copy.id}&situacao=ativa`);
  expect(await list.json<unknown[]>()).toEqual([expect.objectContaining({ id: reservation.id })]);
  await inTransaction(async tx => { await tx`UPDATE reservas SET data_expiracao = ${today()} WHERE id = ${reservation.id}`; });
  expect(await (await api("GET", `/reservas?leitorId=${reader.id}&situacao=expirada`)).json<unknown[]>()).toEqual([expect.objectContaining({ id: reservation.id, situacao: "expirada" })]);
  expect((await api("GET", "/reservas?situacao=invalida")).status).toBe(400);
  expect((await api("GET", "/reservas/2147483647")).status).toBe(404);
});
