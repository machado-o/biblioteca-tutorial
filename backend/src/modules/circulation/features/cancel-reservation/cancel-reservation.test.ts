import { ReserveCopy } from "../reserve-copy/ReserveCopy";
import { CancelReservation } from "./CancelReservation";
import { expect, test } from "bun:test";
import { scenario } from "#tests/circulation-doubles";
import { api, testCopy } from "#tests/api";
import { testReader } from "#tests/reader-fixtures";

test("UC18 cancelar libera exemplar e vaga; não permite cancelamento repetido", async () => {
  const { create } = scenario();
  const reserve = create(ReserveCopy);
  const cancel = create(CancelReservation);
  const reservation = await reserve.execute(1, 1); await reserve.execute(1, 2);
  expect((await cancel.execute(reservation.id)).status).toBe("cancelada");
  await expect(cancel.execute(reservation.id)).rejects.toThrow("Somente reservas ativas");
  await reserve.execute(1, 3); await reserve.execute(2, 1);
});

test("UC18 API: cancelamento preserva ID e libera a cópia para outro leitor", async () => {
  const reader = await testReader(); const other = await testReader(); const copy = await testCopy();
  const reservation = await (await api("POST", "/reservas", { leitorId: reader.id, exemplarId: copy.id })).json();
  const response = await api("POST", `/reservas/${reservation.id}/cancelamento`);
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ id: reservation.id, situacao: "cancelada" });
  expect((await api("POST", `/reservas/${reservation.id}/cancelamento`)).status).toBe(409);
  expect((await api("POST", "/reservas", { leitorId: other.id, exemplarId: copy.id })).status).toBe(201);
  expect((await api("POST", "/reservas/2147483647/cancelamento")).status).toBe(404);
});

test("UC18 não cancela reserva expirada ou inexistente", async () => {
  const { create, time } = scenario();
  const reserve = create(ReserveCopy);
  const cancel = create(CancelReservation);
  const reservation = await reserve.execute(1, 1);
  time.now = "2026-10-22T12:00:00Z";
  await expect(cancel.execute(reservation.id)).rejects.toThrow("Somente reservas ativas");
  await expect(cancel.execute(99)).rejects.toThrow("não encontrada");
});
