import { sql } from "../../../../infrastructure/postgres";
import { civilDate } from "../../../../shared/dates";
import type { CatalogIntegration } from "../../domain/CatalogIntegration";
import type { CopyView } from "../../domain/Copy";
import { findCopyView } from "../../infrastructure/copies";

export async function getCopy(id: number, integration: CatalogIntegration, now = new Date()): Promise<CopyView> {
  return findCopyView(sql, id, integration, civilDate(now));
}
