import type { LoanView, ReservationView } from "../domain/CirculationUseCase";

/** Chaves do JSON da API, em português, para cada propriedade interna. */
const RESERVATION_KEYS: Record<keyof ReservationView, string> = {
  id: "id", readerId: "leitorId", copyId: "exemplarId", reservedOn: "dataReserva",
  pickupDeadline: "dataLimiteRetirada", expiresOn: "dataExpiracao", status: "situacao",
  readerName: "leitorNome", readerCpf: "leitorCpf", bookTitle: "livroTitulo", registrationNumber: "numeroRegistro",
};

const LOAN_KEYS: Record<keyof LoanView, string> = {
  id: "id", readerId: "leitorId", copyId: "exemplarId", loanedOn: "dataEmprestimo",
  dueOn: "dataPrevistaDevolucao", returnedOn: "dataDevolucao", status: "situacao", daysOverdue: "diasDeAtraso",
  readerName: "leitorNome", readerCpf: "leitorCpf", bookTitle: "livroTitulo", registrationNumber: "numeroRegistro",
};

/** Traduz as chaves preservando a ordem em que o caso de uso montou o objeto. */
function translate<T extends object>(view: T, keys: Record<keyof T, string>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(view).map(([key, value]) => [keys[key as keyof T], value]));
}

export function reservationJson(reservation: ReservationView): Record<string, unknown> {
  return translate(reservation, RESERVATION_KEYS);
}

export function loanJson(loan: LoanView): Record<string, unknown> {
  return translate(loan, LOAN_KEYS);
}
