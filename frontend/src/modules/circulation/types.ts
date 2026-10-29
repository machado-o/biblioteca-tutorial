/** Os campos seguem o JSON da API. */
export type Reservation = {
  id: number;
  leitorId: number;
  exemplarId: number;
  dataReserva: string;
  dataLimiteRetirada: string;
  dataExpiracao: string;
  situacao: "ativa" | "cancelada" | "atendida" | "expirada";
  leitorNome: string;
  leitorCpf: string;
  livroTitulo: string;
  numeroRegistro: string;
};

export type Loan = {
  id: number;
  leitorId: number;
  exemplarId: number;
  dataEmprestimo: string;
  dataPrevistaDevolucao: string;
  dataDevolucao: string | null;
  situacao: "em_aberto" | "atrasado" | "devolvido";
  diasDeAtraso: number;
  leitorNome: string;
  leitorCpf: string;
  livroTitulo: string;
  numeroRegistro: string;
};
