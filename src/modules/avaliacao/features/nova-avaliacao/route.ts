import { getBodyAsObject, getFieldAsPositiveInt, getFieldAsText } from "../../../../shared/validation";

export type NovaAvaliacao = {
  numeroRegistro: string;
  matricula: string;
  nota: number;
  comentario: string | null;
};

export function parseNovaAvaliacao(body: unknown): NovaAvaliacao {
  const data = getBodyAsObject(body);
  return {
    numeroRegistro: getFieldAsText(data, "numeroRegistro"),
    matricula: getFieldAsText(data, "matricula"),
    nota: getFieldAsPositiveInt(data, "nota"),
    comentario: data.comentario == null
      ? null
      : getFieldAsText(data, "comentario"),
  };
}