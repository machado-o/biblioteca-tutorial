import type { Reader, ReaderInput } from "../src/modules/readers/domain/Reader";
import type { ReaderRepository } from "../src/modules/readers/domain/ReaderRepository";
import { NotFound } from "../src/shared/errors";

export class InMemoryReaderRepository implements ReaderRepository {
  readonly items: Reader[] = [];
  async search(q = "") { return this.items.filter(r => `${r.name} ${r.cpf} ${r.email}`.toLowerCase().includes(q.toLowerCase())); }
  async get(id: number) {
    const reader = this.items.find(r => r.id === id);
    if (!reader) throw new NotFound("Leitor não encontrado.");
    return reader;
  }
  async cpfExists(cpf: string, exceptId: number | null = null) { return this.items.some(r => r.cpf === cpf && r.id !== exceptId); }
  async insert(input: ReaderInput) { const reader = { ...input, id: this.items.length + 1 }; this.items.push(reader); return reader; }
  async update(id: number, input: ReaderInput) { const reader = await this.get(id); Object.assign(reader, input); return reader; }
  async remove(id: number) { this.items.splice(this.items.findIndex(r => r.id === id), 1); }
}

export const ana = { nome: "Ana Silva", cpf: "52998224725", email: "ana@exemplo.com", telefone: "27999991234" };
export const bruno = { nome: "Bruno Souza", cpf: "11144477735", email: "bruno@exemplo.com", telefone: "27999994321" };
