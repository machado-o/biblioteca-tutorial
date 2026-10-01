import type { ConsultaDeLivros } from "../modules/acervo/domain/ConsultaDeLivros";
import type { ConsultaDeAcervo } from "../modules/emprestimo/domain/ConsultaDeAcervo";

export class AcervoComoConsultaDeSolicitacoes implements ConsultaDeAcervo {
  constructor(private readonly livros: ConsultaDeLivros) {}

  existeNumeroRegistro(numeroRegistro: string): boolean {
    return this.livros.existeNumeroRegistro(numeroRegistro);
  }
}