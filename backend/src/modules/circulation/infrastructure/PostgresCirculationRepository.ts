import type { SQL } from "bun";
import type { CirculationRepository, Filters } from "../domain/CirculationRepository";
import type { Loan } from "../domain/Loan";
import type { Reservation } from "../domain/Reservation";

export class PostgresCirculationRepository implements CirculationRepository {
  constructor(private readonly db: SQL) {}

  async reservations(filters: Filters = {}): Promise<Reservation[]> {
    return await this.db<Reservation[]>`SELECT id, leitor_id AS "readerId", exemplar_id AS "copyId",
      data_reserva AS "reservedOn", data_limite_retirada AS "pickupDeadline",
      data_expiracao AS "expiresOn", situacao AS status FROM reservas
      WHERE (${filters.readerId ?? null}::INTEGER IS NULL OR leitor_id = ${filters.readerId ?? null})
        AND (${filters.copyId ?? null}::INTEGER IS NULL OR exemplar_id = ${filters.copyId ?? null})
      ORDER BY id DESC`;
  }

  async loans(filters: Filters = {}): Promise<Loan[]> {
    return await this.db<Loan[]>`SELECT id, leitor_id AS "readerId", exemplar_id AS "copyId",
      data_emprestimo AS "loanedOn", data_prevista_devolucao AS "dueOn",
      data_devolucao AS "returnedOn" FROM emprestimos
      WHERE (${filters.readerId ?? null}::INTEGER IS NULL OR leitor_id = ${filters.readerId ?? null})
        AND (${filters.copyId ?? null}::INTEGER IS NULL OR exemplar_id = ${filters.copyId ?? null})
      ORDER BY id DESC`;
  }

  async insertReservation(data: Omit<Reservation, "id">): Promise<Reservation> {
    const [row] = await this.db`INSERT INTO reservas
      (leitor_id, exemplar_id, data_reserva, data_limite_retirada, data_expiracao, situacao)
      VALUES (${data.readerId}, ${data.copyId}, ${data.reservedOn}, ${data.pickupDeadline}, ${data.expiresOn}, ${data.status})
      RETURNING id`;
    return { ...data, id: Number(row!.id) };
  }

  async setReservationStatus(id: number, status: "cancelada" | "atendida"): Promise<void> {
    await this.db`UPDATE reservas SET situacao = ${status} WHERE id = ${id}`;
  }

  async insertLoan(data: Omit<Loan, "id">): Promise<Loan> {
    const [row] = await this.db`INSERT INTO emprestimos
      (leitor_id, exemplar_id, data_emprestimo, data_prevista_devolucao, data_devolucao)
      VALUES (${data.readerId}, ${data.copyId}, ${data.loanedOn}, ${data.dueOn}, ${data.returnedOn})
      RETURNING id`;
    return { ...data, id: Number(row!.id) };
  }

  async returnLoan(id: number, date: string): Promise<void> {
    await this.db`UPDATE emprestimos SET data_devolucao = ${date} WHERE id = ${id}`;
  }
}
