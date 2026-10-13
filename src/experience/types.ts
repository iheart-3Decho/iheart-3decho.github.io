import type { Point } from "../types";

export type ExperienceMode = "function" | "dimension";
export type ExperiencePhase =
  | "attract"
  | "ed"
  | "es"
  | "frame"
  | "draw"
  | "review"
  | "revealing"
  | "results";
export type DimensionMetric = "lvidd" | "lvids" | "ivsd" | "lvpwd";
export interface FrameSelection {
  frame: number;
  image: string;
}
export interface FrameResult {
  frame: number;
  image: string;
  imageSize: [number, number];
  points?: Point[];
  geometry: "actual_per_frame_prediction";
}
export interface ExperienceCase {
  caseId: string;
  sourceId: string;
  checkpointSha256: string;
  video: { path: string; width: number; height: number; fps: number; frameCount: number };
  coordinateTransform: Record<string, unknown>;
  metrics: Record<string, { value: number; unit: string; label: string }>;
  evidence: Record<string, FrameResult>;
}
export type ExperienceData = Record<ExperienceMode, ExperienceCase>;
export const experienceAsset = (file: string) => `${import.meta.env.BASE_URL}experience/${file}`;
