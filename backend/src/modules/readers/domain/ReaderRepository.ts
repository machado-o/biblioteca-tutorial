import type { Reader, ReaderInput } from "./Reader";

export interface ReaderRepository {
  search(q?: string): Promise<Reader[]>;
  get(id: number): Promise<Reader>;
  cpfExists(cpf: string, exceptId?: number | null): Promise<boolean>;
  insert(input: ReaderInput): Promise<Reader>;
  update(id: number, input: ReaderInput): Promise<Reader>;
  remove(id: number): Promise<void>;
}
