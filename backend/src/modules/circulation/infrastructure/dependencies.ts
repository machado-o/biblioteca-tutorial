import type { SQL } from "bun";
import { PostgresCirculationLookup } from "../../../integration/PostgresCirculationLookup";
import type { CirculationLookup } from "../domain/CirculationLookup";
import type { CirculationRepository } from "../domain/CirculationRepository";
import { PostgresCirculationRepository } from "./PostgresCirculationRepository";

export function circulationDependencies(db: SQL): [CirculationRepository, CirculationLookup] {
  return [new PostgresCirculationRepository(db), new PostgresCirculationLookup(db)];
}
