import type { ExperienceData, ExperienceMode, ExperiencePreview } from "./types";

export function findExperience(data: ExperienceData, mode: ExperienceMode, caseId?: string) {
  return data.library.find((entry) => entry.caseId === caseId) ?? data[mode];
}

export function previewEvidence(data: ExperienceData, preview: ExperiencePreview) {
  const entry = findExperience(data, preview.mode, preview.caseId);
  return entry.evidence[
    preview.mode === "function" ? (preview.metric === "esv" ? "es" : "ed") : preview.metric
  ]!;
}
