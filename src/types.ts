export type Point = [number, number];
export interface Geometry {
  kind: "contour" | "line";
  points: Point[];
}
export interface Evidence {
  frame: number;
  geometry?: Geometry;
}
export interface Metric {
  id: string;
  label: string;
  code: string;
  value: number;
  unit: string;
  description: string;
  phase: "ed" | "es";
  evidence: Evidence;
}
export interface DemoCase {
  id: string;
  caseTitle: string;
  kind: "function" | "dimension";
  label: string;
  dataset: string;
  view: string;
  video: string;
  poster: string;
  phaseImages: { ed: string; es: string };
  framePreviews: { frame: number; image: string }[];
  width: number;
  height: number;
  fps: number;
  frameCount: number;
  duration: number;
  timeBasis?: "cycle";
  phases: { ed: Evidence; es: Evidence };
  metrics: Metric[];
  volumeSeries?: { frame: number; value: number }[];
}
