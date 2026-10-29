import { expect, test } from "bun:test";
import { normalizeCpf, parseReaderInput } from "../../domain/Reader";
import { CreateReader } from "./CreateReader";
import { InMemoryReaderRepository } from "#tests/reader-doubles";
import { api, testName } from "#tests/api";
import { testCpf } from "#tests/reader-fixtures";

const reader = { nome: " Ana Silva ", cpf: "529.982.247-25", email: " ANA@EXEMPLO.COM ", telefone: "(27) 99999-1234" };

test("UC09 normaliza CPF, e-mail, nome e telefone", () => {
  expect(parseReaderInput(reader)).toEqual({ name: "Ana Silva", cpf: "52998224725", email: "ana@exemplo.com", phone: "27999991234" });
});

test("UC09 rejeita CPF com checksum inválido ou dígitos repetidos", () => {
  for (const cpf of ["52998224726", "11111111111", "00000000000", "abc52998224725", "5299822472"]) {
    expect(() => normalizeCpf(cpf)).toThrow("CPF inválido");
  }
});

test("UC09 exige todos os campos e valida contatos", () => {
  for (const field of ["nome", "cpf", "email", "telefone"]) expect(() => parseReaderInput({ ...reader, [field]: " " })).toThrow("obrigatório");
  expect(() => parseReaderInput({ ...reader, email: "sem-arroba" })).toThrow("E-mail inválido");
  expect(() => parseReaderInput({ ...reader, telefone: "123" })).toThrow("Telefone inválido");
  expect(() => parseReaderInput(null)).toThrow();
});

test("UC09 impede CPF duplicado com ou sem máscara", async () => {
  const repository = new InMemoryReaderRepository();
  const create = new CreateReader(repository);
  await create.execute(reader);
  await expect(create.execute({ ...reader, cpf: "52998224725" })).rejects.toThrow("Já existe");
  expect(repository.items).toHaveLength(1);
});

test("UC09 API: valida campos, normaliza CPF e rejeita duplicidade", async () => {
  const cpf = testCpf();
  const body = { nome: testName("Ana"), cpf: `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`, email: "ANA@EXEMPLO.COM", telefone: "(27)99999-1234" };
  const response = await api("POST", "/leitores", body);
  expect(response.status).toBe(201);
  expect(await response.json()).toMatchObject({ nome: body.nome, cpf, email: "ana@exemplo.com", telefone: "27999991234" });
  expect((await api("POST", "/leitores", { ...body, cpf })).status).toBe(409);
  expect((await api("POST", "/leitores", { ...body, cpf: "11111111111" })).status).toBe(400);
  for (const field of ["nome", "cpf", "email", "telefone"]) expect((await api("POST", "/leitores", { ...body, [field]: "" })).status).toBe(400);
});
