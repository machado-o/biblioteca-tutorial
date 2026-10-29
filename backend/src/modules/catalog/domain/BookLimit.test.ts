import { expect, test } from "bun:test";
import { BookLimit, BookLimitExceeded } from "./BookLimit";

test("RF05: um autor de literatura vai até 5 livros no acervo", () => {
  expect(BookLimit.limitFor("short")).toBe(5);
  for (let inCatalog = 0; inCatalog < 5; inCatalog++) {
    expect(() => BookLimit.check("short", inCatalog)).not.toThrow();
  }
  expect(() => BookLimit.check("short", 5)).toThrow("O autor já tem 5 livros no acervo");
});

test("RF05′: um autor didático vai até 10 livros no acervo", () => {
  expect(BookLimit.limitFor("large")).toBe(10);
  for (let inCatalog = 0; inCatalog < 10; inCatalog++) {
    expect(() => BookLimit.check("large", inCatalog)).not.toThrow();
  }
  expect(() => BookLimit.check("large", 10)).toThrow("O autor já tem 10 livros no acervo");
});

test("RF05: acima do limite a recusa é uma violação de regra", () => {
  expect(() => BookLimit.check("short", 7)).toThrow(BookLimitExceeded);
});
