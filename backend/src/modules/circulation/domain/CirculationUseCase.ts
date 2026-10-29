import type { Clock } from "../../../shared/Clock";
import { today } from "../../../shared/dates";
import { NotFound } from "../../../shared/errors";
import type { CirculationLookup } from "./CirculationLookup";
import type { CirculationRepository } from "./CirculationRepository";
import { daysOverdue, loanStatus, type Loan, type LoanStatus } from "./Loan";
import { reservationStatus, type Reservation, type ReservationStatus } from "./Reservation";

type Details = { readerName: string; readerCpf: string; bookTitle: string; registrationNumber: string };

export type ReservationView = Omit<Reservation, "status"> & { status: ReservationStatus | "expirada" } & Details;
export type LoanView = Loan & { status: LoanStatus; daysOverdue: number } & Details;

/** Cada comando é executado pelo adaptador HTTP dentro da transação compartilhada. */
export class CirculationUseCase {
  constructor(
    protected readonly repository: CirculationRepository,
    protected readonly lookup: CirculationLookup,
    protected readonly clock: Clock = () => new Date(),
  ) {}

  protected async checkLinks(readerId: number, copyId: number): Promise<void> {
    if (!await this.lookup.reader(readerId)) throw new NotFound("Leitor não encontrado.");
    if (!await this.lookup.copy(copyId)) throw new NotFound("Exemplar não encontrado.");
  }

  protected async details(readerId: number, copyId: number): Promise<Details> {
    const [reader, copy] = await Promise.all([this.lookup.reader(readerId), this.lookup.copy(copyId)]);
    return { readerName: reader?.name ?? "", readerCpf: reader?.cpf ?? "",
      bookTitle: copy?.bookTitle ?? "", registrationNumber: copy?.registrationNumber ?? "" };
  }

  protected async presentReservation(reservation: Reservation): Promise<ReservationView> {
    return { ...reservation, status: reservationStatus(reservation, today(this.clock)),
      ...await this.details(reservation.readerId, reservation.copyId) };
  }

  protected async presentLoan(loan: Loan): Promise<LoanView> {
    const date = today(this.clock);
    return { ...loan, status: loanStatus(loan, date),
      daysOverdue: daysOverdue(loan, date),
      ...await this.details(loan.readerId, loan.copyId) };
  }
}
