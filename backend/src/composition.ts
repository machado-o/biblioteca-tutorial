import { Glob } from "bun";
import { prepareSeed } from "./integration/seed/schema";
import { prepareAuthorship } from "./modules/authorship";
import { prepareCatalog } from "./modules/catalog";
import { prepareCirculation } from "./modules/circulation";
import { prepareReaders } from "./modules/readers";
import type { RegisterRoutes } from "./shared/http";

/**
 * Composition root: o único lugar que conhece todos os módulos. A ordem importa:
 * a carga inicial de autores vem primeiro e os exemplares referenciam livros.
 */
export async function prepareDatabase(): Promise<void> {
  await prepareAuthorship();
  await prepareCatalog();
  await prepareReaders();
  await prepareCirculation();
  await prepareSeed();
}

/** Cada fatia traz o próprio route.ts: adicionar uma fatia não altera nenhum registro central. */
export async function loadSlices(): Promise<RegisterRoutes[]> {
  const files = [
    ...new Glob("modules/*/features/*/route.ts").scanSync({ cwd: import.meta.dir }),
    ...new Glob("integration/*/route.ts").scanSync({ cwd: import.meta.dir }),
  ].map((file) => file.replaceAll("\\", "/")).sort();
  const slices: RegisterRoutes[] = [];
  for (const file of files) {
    const slice = await import(new URL(file, import.meta.url).href);
    if (typeof slice.registerRoutes !== "function") {
      throw new Error(`Fatia sem registerRoutes: ${file}`);
    }
    slices.push(slice.registerRoutes);
  }
  return slices;
}
