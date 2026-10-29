import type { ReaderRepository } from "../../domain/ReaderRepository";

export class SearchReaders {
  constructor(private readonly repository: ReaderRepository) {}
  execute(term?: string) { return this.repository.search(term); }
  get(id: number) { return this.repository.get(id); }
}
