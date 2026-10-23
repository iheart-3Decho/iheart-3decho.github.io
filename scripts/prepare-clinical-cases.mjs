import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
const read = (file) => JSON.parse(readFileSync(file, "utf8"));
const hash = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const template = read("public/demo/cases.json").find((item) => item.id === "function");
const checkpoint = read("public/experience/experience.json").function.checkpointSha256;
const cases = [],
  library = [],
  provenance = [];
for (const patient of ["patient050", "patient043", "patient014"]) {
  const directory = resolve(`private-source/ted-screening/${patient}`);
  const original = read(`${directory}/prediction.json`);
  assert.equal(original.checkpoint_sha256, checkpoint);
  assert.equal(original.source_frame_count, original.video.frameCount);
  const id = `clinical-${patient}`;
  const assets = {};
  function copy(file, area) {
    const relative = `clinical/${id}/${file}`;
    const target = `public/${area}/${relative}`;
    mkdirSync(resolve(target, ".."), { recursive: true });
    copyFileSync(`${directory}/${file}`, target);
    assets[`${area}/${relative}`] = hash(target);
    return relative;
  }
  const phases = Object.fromEntries(
    ["ed", "es"].map((phase) => [
      phase,
      {
        frame: original.phases[phase].frame,
        geometry: { kind: "contour", points: original.phases[phase].contour_display_pixels },
      },
    ]),
  );
  const phaseImages = Object.fromEntries(
    ["ed", "es"].map((phase) => [phase, copy(`function-${phase}.jpg`, "demo")]),
  );
  const values = {
    ef: original.predictions.ef_percent,
    edv: original.predictions.edv_ml,
    esv: original.predictions.esv_ml,
  };
  const item = {
    ...template,
    id,
    caseTitle: `左心室功能 · ${patient}`,
    sourceId: patient,
    video: copy("function.mp4", "demo"),
    ...original.video,
    duration: original.video.frameCount / original.video.fps,
    phaseImages,
    poster: phaseImages.ed,
    phases,
    metrics: template.metrics.map((metric) => ({
      ...metric,
      value: values[metric.id],
      evidence: phases[metric.phase],
    })),
    framePreviews: Array.from({ length: 6 }, (_, i) => ({
      frame: Math.round((i * (original.video.frameCount - 1)) / 5),
      image: copy(`function-frame-${i}.jpg`, "demo"),
    })),
    volumeSeries: original.volume_series,
  };
  // The export's path is relative to its private folder, not the public website.
  delete item.path;
  cases.push(item);
  library.push({
    caseId: id,
    sourceId: patient,
    checkpointSha256: checkpoint,
    video: {
      path: item.video,
      width: item.width,
      height: item.height,
      frameCount: item.frameCount,
      fps: item.fps,
    },
    coordinateTransform: original.coordinate_transform,
    metrics: Object.fromEntries(
      item.metrics.map((m) => [m.id, { label: m.label, value: m.value, unit: m.unit }]),
    ),
    evidence: Object.fromEntries(
      ["ed", "es"].map((phase) => [
        phase,
        {
          frame: phases[phase].frame,
          image: copy(`function-${phase}.png`, "experience"),
          imageSize: [item.width, item.height],
          points: phases[phase].geometry.points,
          geometry: "actual_per_frame_prediction",
        },
      ]),
    ),
  });
  provenance.push({
    caseId: id,
    sourceId: patient,
    dataset: "TED",
    checkpointSha256: checkpoint,
    sourceRawSha256: original.source_raw_sha256,
    sourceFrameCount: original.source_frame_count,
    coordinateTransform: original.coordinate_transform,
    predictions: original.predictions,
    phases: original.phases,
    volumeSeries: original.volume_series,
    assetSha256: assets,
    timeBasis: "cycle",
    acquisitionFps: null,
    modelProtocol: original.model_protocol,
  });
}
writeFileSync(
  "public/experience/clinical-additions.json",
  JSON.stringify({ cases, library, provenance }, null, 2) + "\n",
);
console.log("Prepared three reviewed, complete-cycle TED cases for the clinical workstation only.");
