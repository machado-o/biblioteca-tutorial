import { expect, test } from "bun:test";
import { InvalidValue } from "../../../shared/domain-errors";
import { RegistrationNumber } from "./RegistrationNumber";

test("RF06: o número de registro tem o formato ano-sequencial com seis dígitos", () => {
  expect(RegistrationNumber.next("2026", 0).value).toBe("2026-000001");
  expect(RegistrationNumber.SEQUENCE_DIGITS).toBe(6);
});

test("RF07: o sequencial segue os já catalogados no ano", () => {
  expect(RegistrationNumber.next("2026", 1).value).toBe("2026-000002");
  expect(RegistrationNumber.next("2026", 41).value).toBe("2026-000042");
});

test("RF07: o sequencial recomeça a cada ano", () => {
  expect(RegistrationNumber.next("2026", 9).value).toBe("2026-000010");
  expect(RegistrationNumber.next("2027", 0).value).toBe("2027-000001");
});

test("RF06: um número de registro fora do formato é recusado", () => {
  for (const raw of ["2026-1", "26-000001", "2026000001", "abcd-000001", ""]) {
    expect(() => new RegistrationNumber(raw)).toThrow(InvalidValue);
  }
  expect(() => new RegistrationNumber("2026-1")).toThrow("número de registro inválido: 2026-1");
  expect(new RegistrationNumber("2026-000123").toString()).toBe("2026-000123");
});
