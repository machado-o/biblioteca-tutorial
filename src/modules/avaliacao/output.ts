export type AvaliacaoJson = {
  id: number;
  numeroRegistro: string;
  matricula: string;
  nota: number;
  comentario: string | null;
};

export function avaliacaoToJson(avaliacao: Avaliacao): AvaliacaoJson {
  return {
    id: avaliacao.id!.value,
    numeroRegistro: avaliacao.numeroRegistro,
    matricula: avaliacao.matricula,
    nota: avaliacao.nota,
    comentario: avaliacao.comentario,
  };
}