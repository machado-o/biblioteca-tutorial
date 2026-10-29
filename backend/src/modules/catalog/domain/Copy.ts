import { getBodyAsObject, getFieldAsPositiveInt, getFieldAsText } from "../../../shared/validation";
import type { CopyAvailability } from "./CatalogIntegration";

export type CopyInput = { location: string; condition: string };
export type NewCopyInput = { bookId: number; location: string; condition: string };

export type CopyView = {
  id: number; bookId: number; registrationNumber: string; location: string;
  condition: string; catalogedOn: string;
  status: CopyAvailability; title: string; isbn: string;
};

export function parseCopyInput(body: unknown): CopyInput {
  const data = getBodyAsObject(body);
  return { location: getFieldAsText(data, "localizacao"), condition: getFieldAsText(data, "estadoConservacao") };
}

/** O livro é validado antes dos dados físicos, na mesma ordem de sempre. */
export function parseNewCopyInput(body: unknown): NewCopyInput {
  const data = getBodyAsObject(body);
  const bookId = getFieldAsPositiveInt(data, "livroId");
  return { bookId, ...parseCopyInput(body) };
}
