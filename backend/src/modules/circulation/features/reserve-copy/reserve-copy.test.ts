import { ReserveCopy } from "./ReserveCopy";
import { expect, test } from "bun:test";
import { scenario } from "#tests/circulation-doubles";
import { addDays, today } from "../../../../shared/dates";
import { api, testCopy } from "#tests/api";
import { testReader } from "#tests/reader-fixtures";

test("UC17 reserva imediatamente com sete dias corridos de exclusividade", async () => {
  const { create } = scenario();
  const reserve = create(ReserveCopy);
  const reservation = await reserve.execute(1, 1);
  expect(reservation).toMatchObject({ reservedOn: "2026-10-15", pickupDeadline: "2026-10-21", expiresOn: "2026-10-22", status: "ativa", readerName: "Leitor 1" });
  await expect(reserve.execute(2, 1)).rejects.toThrow("indisponível");
});

test("UC17 API: reserva tem janela inclusiva7 dias e recusa terceiro pedido", async () => {
  const reader = await testReader();
  const copies = await Promise.all([testCopy(), testCopy(), testCopy()]);
  const reserve = (copyId: number, extra = {}) => api("POST", "/reservas", { leitorId: reader.id, exemplarId: copyId, ...extra });
  const first = await reserve(copies[0]!.id);
  expect(first.status).toBe(201);
  expect(await first.json()).toMatchObject({ leitorId: reader.id, exemplarId: copies[0]!.id, dataReserva: today(), dataLimiteRetirada: addDays(today(), 6), dataExpiracao: addDays(today(), 7), situacao: "ativa" });
  expect((await reserve(copies[1]!.id)).status).toBe(201);
  expect((await reserve(copies[2]!.id)).status).toBe(409);
  expect((await reserve(copies[2]!.id, { dataReserva: addDays(today(), 1) })).status).toBe(400);
  expect((await api("POST", "/reservas", { leitorId: 2147483647, exemplarId: copies[2]!.id })).status).toBe(404);
});

test("UC17 API: concorrência não ultrapassa duas reservas nem duplica reserva da cópia", async () => {
  const reader = await testReader();
  const copies = await Promise.all([testCopy(), testCopy(), testCopy()]);
  const results = await Promise.all(copies.map(c => api("POST", "/reservas", { leitorId: reader.id, exemplarId: c.id })));
  expect(results.filter(r => r.status === 201)).toHaveLength(2);
  expect(results.filter(r => r.status === 409)).toHaveLength(1);
  const free = await testCopy(); const a = await testReader(); const b = await testReader();
  const contest = await Promise.all([a, b].map(r => api("POST", "/reservas", { leitorId: r.id, exemplarId: free.id })));
  expect(contest.filter(r => r.status === 201)).toHaveLength(1);
  expect(contest.filter(r => r.status === 409)).toHaveLength(1);
});

test("UC17 recusa a terceira reserva do leitor sem alterar o exemplar", async () => {
  const { create, memory } = scenario();
  const reserve = create(ReserveCopy);
  await reserve.execute(1, 1); await reserve.execute(1, 2);
  await expect(reserve.execute(1, 3)).rejects.toThrow("duas reservas");
  expect(memory.savedReservations).toHaveLength(2);
  expect((await reserve.execute(2, 3)).status).toBe("ativa");
});

test("UC17 reserva expira no início do oitavo dia e libera o limite e a cópia", async () => {
  const { create, time } = scenario();
  const reserve = create(ReserveCopy);
  await reserve.execute(1, 1); await reserve.execute(1, 2);
  time.now = "2026-10-21T23:59:59-03:00";
  await expect(reserve.execute(2, 1)).rejects.toThrow("indisponível");
  time.now = "2026-10-22T00:00:00-03:00";
  expect((await reserve.execute(2, 1)).status).toBe("ativa");
  expect((await reserve.execute(1, 3)).status).toBe("ativa");
});

test("UC17 exige vínculos existentes e usa data civil brasileira", async () => {
  const { create } = scenario();
  const reserve = create(ReserveCopy);
  await expect(reserve.execute(99, 1)).rejects.toThrow("Leitor não encontrado");
  await expect(reserve.execute(1, 99)).rejects.toThrow("Exemplar não encontrado");
  expect(today(() => new Date("2026-10-16T01:00:00Z"))).toBe("2026-10-15");
});

test("UC17 API: IDs não aceitam booleanos, arrays, nulos ou notação exponencial", async () => {
  const reader = await testReader(); const copy = await testCopy();
  for (const invalid of [true, [reader.id], null, {}, "1e0", 0]) {
    expect((await api("POST", "/reservas", { leitorId: invalid, exemplarId: copy.id })).status).toBe(400);
    expect((await api("POST", "/reservas", { leitorId: reader.id, exemplarId: invalid })).status).toBe(400);
  }
});
