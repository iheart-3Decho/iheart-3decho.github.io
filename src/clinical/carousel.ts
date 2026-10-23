import type { DemoCase } from "../types";
export const CLINICAL_TIMING = { analyse: 8, report: 28, next: 36, metric: 5 } as const;

// Visit every examination once before repeating. Start with the selected
// EchoXFlow case and interleave the available structural examinations.
export function clinicalPlaylist(cases: DemoCase[], first: string) {
  const functions = cases.filter((item) => item.kind === "function");
  const dimensions = cases.filter((item) => item.kind === "dimension");
  const start = functions.findIndex((item) => item.id === first);
  const ordered = [...functions.slice(start), ...functions.slice(0, start)];
  const result: DemoCase[] = [];
  while (ordered.length || dimensions.length) {
    const functional = ordered.shift(),
      structural = dimensions.shift();
    if (functional) result.push(functional);
    if (structural) result.push(structural);
  }
  return result;
}
