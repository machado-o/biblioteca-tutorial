export type LoanStatus = "em_aberto" | "atrasado" | "devolvido";

export type Loan = {
  id: number; readerId: number; copyId: number; loanedOn: string;
  dueOn: string; returnedOn: string | null;
};

export function loanStatus(loan: Loan, date: string): LoanStatus {
  if (loan.returnedOn) return "devolvido";
  return date > loan.dueOn ? "atrasado" : "em_aberto";
}

export function daysOverdue(loan: Loan, date: string): number {
  const end = loan.returnedOn ?? date;
  return Math.max(0, Math.round((Date.parse(end) - Date.parse(loan.dueOn)) / 86_400_000));
}
