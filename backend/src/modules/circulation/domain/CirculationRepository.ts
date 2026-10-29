import type { Loan } from "./Loan";
import type { Reservation } from "./Reservation";

export type Filters = { readerId?: number; copyId?: number; status?: string };

export interface CirculationRepository {
  reservations(filters?: Filters): Promise<Reservation[]>;
  loans(filters?: Filters): Promise<Loan[]>;
  insertReservation(data: Omit<Reservation, "id">): Promise<Reservation>;
  setReservationStatus(id: number, status: "cancelada" | "atendida"): Promise<void>;
  insertLoan(data: Omit<Loan, "id">): Promise<Loan>;
  returnLoan(id: number, date: string): Promise<void>;
}
