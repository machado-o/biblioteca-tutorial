import { getBodyAsObject, getFieldAsPositiveInt, getFieldAsText } from "../../../shared/validation";
import { Isbn } from "./Isbn";

export type BookInput = { isbn: string; title: string; authorId: number };

export type BookView = {
  id: number; isbn: string; title: string; authorId: number; authorName: string;
  catalogedOn: string; authorBookCount: number; totalCopies: number; availableCopies: number;
};

export function parseBookInput(body: unknown): BookInput {
  const data = getBodyAsObject(body);
  return {
    isbn: new Isbn(getFieldAsText(data, "isbn")).value,
    title: getFieldAsText(data, "titulo"),
    authorId: getFieldAsPositiveInt(data, "autorId"),
  };
}
