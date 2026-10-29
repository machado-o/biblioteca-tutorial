import type { Clock } from "./Clock";

/** Datas civis da biblioteca: o dia não depende do fuso do servidor nem do navegador. */
export function civilDate(instant: Date): string {
  return instant.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export function today(clock: Clock = () => new Date()): string {
  return civilDate(clock());
}

export function addDays(date: string, days: number): string {
  const day = new Date(`${date}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
}
