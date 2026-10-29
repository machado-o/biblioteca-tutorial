/** Porta: leitores não conhece tabelas internas de circulação. */
export interface ReaderHistory {
  existsFor(readerId: number): Promise<boolean>;
}
