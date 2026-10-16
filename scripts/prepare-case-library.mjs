import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const source = resolve("private-source/echoxflow-screening");
const demo = resolve("public/demo");
const experience = resolve("public/experience");
const read = (file) => JSON.parse(readFileSync(file, "utf8"));
const write = (file, value) => writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
const hash = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const cases = read(resolve(demo, "cases.json"));
const data = read(resolve(experience, "experience.json"));
const provenance = read(resolve(demo, "provenance.json"));
const checkpoint = data.function.checkpointSha256;
const copies = {};
const exports = [];
const originalFunction =
  data.library?.find((entry) => entry.caseId === "function") ?? data.function;
const library = [originalFunction, data.dimension];

// The manifest names entire, unaltered inference exports reviewed before inclusion.
// Public IDs remain stable so all six existing deep links continue to work.
for (const [id, folder] of [
  ["function-27", "echox-a4c-017"],
  ["function-61", "echox-a4c-006"],
  ["dimension-02", "lvh-02"],
  ["dimension-03", "lvh-03"],
]) {
  const directory = resolve(source, folder);
  const prediction = read(resolve(directory, "prediction.json"));
  assert.equal(prediction.checkpointSha256, checkpoint, "Use the same immutable checkpoint");
  const previous = cases.find((entry) => entry.id === id);
  assert.ok(previous, `Missing stable case ID: ${id}`);
  const prefix = `library/${id}`;
  mkdirSync(resolve(demo, prefix), { recursive: true });
  mkdirSync(resolve(experience, prefix), { recursive: true });
  const copy = (file, target, relative) => {
    copyFileSync(file, resolve(target, relative));
    copies[`${target === demo ? "demo" : "experience"}/${relative}`] = hash(file);
    return relative;
  };
  const isFunction = previous.kind === "function";
  const video = isFunction
    ? copy(resolve(source, prediction.video), demo, `${prefix}/video.mp4`)
    : previous.video;
  const evidence = {};
  for (const [key, value] of Object.entries(prediction.evidence)) {
    evidence[key] = {
      frame: value.frame,
      image: copy(resolve(directory, value.image), experience, `${prefix}/${value.image}`),
      imageSize: value.imageSize,
      points: value.points,
      geometry: value.geometry,
    };
  }
  const metrics = previous.metrics.map((metric) => {
    const key = isFunction ? (metric.id === "esv" ? "es" : "ed") : metric.id;
    const frame = prediction.evidence[key];
    return {
      ...metric,
      ...prediction.values[metric.id],
      evidence: { frame: frame.frame, geometry: { kind: frame.kind, points: frame.points } },
    };
  });
  const phase = (name) => {
    const frame = prediction.evidence[isFunction ? name : name === "ed" ? "lvidd" : "lvids"];
    return { frame: frame.frame, geometry: { kind: frame.kind, points: frame.points } };
  };
  const phaseImage = (name) => {
    const file = isFunction ? name : name === "ed" ? "LVIDd" : "LVIDs";
    return copy(resolve(directory, `${file}.jpg`), demo, `${prefix}/${name}.jpg`);
  };
  const item = {
    ...previous,
    dataset: prediction.dataset,
    sourceId: prediction.sourceId,
    video,
    width: prediction.width,
    height: prediction.height,
    frameCount: prediction.frameCount,
    fps: prediction.fps,
    duration: prediction.frameCount / prediction.fps,
    metrics,
    phases: { ed: phase("ed"), es: phase("es") },
    phaseImages: { ed: phaseImage("ed"), es: phaseImage("es") },
    framePreviews: prediction.framePreviews.map(({ frame, image }) => ({
      frame,
      image: copy(resolve(directory, image), demo, `${prefix}/${image}`),
    })),
  };
  item.poster = item.phaseImages.ed;
  if (isFunction) {
    delete item.timeBasis;
    // Only actual sampled-frame estimates are connected; no invented dense tracking.
    item.volumeSeries = read(resolve(directory, "volume-series.json"));
    assert.ok(item.volumeSeries?.length, "Export actual model volume evidence");
  }
  cases[cases.findIndex((entry) => entry.id === id)] = item;
  library.push({
    caseId: id,
    sourceId: prediction.sourceId,
    checkpointSha256: checkpoint,
    video: {
      path: video,
      width: item.width,
      height: item.height,
      fps: item.fps,
      frameCount: item.frameCount,
    },
    coordinateTransform: prediction.coordinateTransform,
    metrics: Object.fromEntries(
      metrics.map(({ id, label, value, unit }) => [id, { label, value, unit }]),
    ),
    evidence,
  });
  const row = {
    id,
    dataset: prediction.dataset,
    sourceId: prediction.sourceId,
    videoMetadata: item,
    originalUnit: isFunction ? undefined : "cm",
    displayUnit: isFunction ? undefined : "mm",
    conversion: isFunction ? undefined : 10,
    checkpointSha256: checkpoint,
    videoSha256: hash(resolve(demo, video)),
    coordinateTransform: prediction.coordinateTransform,
    geometry:
      "Actual per-frame predictions at each metric's own evidence frame; final scalars remain temporal aggregates.",
    sourceExport: `output/demo_exports/20261015_echoxflow/${folder}/prediction.json`,
  };
  provenance.cases[provenance.cases.findIndex((entry) => entry.id === id)] = row;
  exports.push({
    ...prediction,
    publicId: id,
    scope: `${isFunction ? "Cross-dataset EchoXFlow" : "EchoNet-LVH"} inference; no ground truth substituted, no calibration or checkpoint changes`,
  });
}

// The first PLAX case already has frame-specific exports. Use those in its legacy detail view too.
const dimension = cases.find((item) => item.id === data.dimension.caseId);
for (const metric of dimension.metrics) {
  const frame = data.dimension.evidence[metric.id];
  assert.equal(metric.evidence.frame, frame.frame);
  metric.evidence.geometry = { kind: "line", points: frame.points };
}
const dimensionProvenance = provenance.cases.find((entry) => entry.id === dimension.id);
dimensionProvenance.videoMetadata = dimension;
dimensionProvenance.geometry = "Actual per-frame endpoints from the original PLAX inference export";

data.library = library;
data.function = library.find((entry) => entry.caseId === "function-61");
data.playlist = [
  { caseId: "function-61", mode: "function", metric: "ef" },
  { caseId: "dimension", mode: "dimension", metric: "lvidd" },
  { caseId: "function-27", mode: "function", metric: "edv" },
  { caseId: "dimension-02", mode: "dimension", metric: "ivsd" },
  { caseId: "function-61", mode: "function", metric: "esv" },
  { caseId: "dimension-03", mode: "dimension", metric: "lvids" },
  { caseId: "dimension-02", mode: "dimension", metric: "lvpwd" },
  { caseId: "function", mode: "function", metric: "ef" },
];
write(resolve(demo, "cases.json"), cases);
write(resolve(experience, "experience.json"), data);
provenance.caseLibrary = {
  reviewed: "2026-10-15",
  geometry:
    "Frame-specific predictions only; no ground-truth substitution, enhancement, or checkpoint changes",
  echoxflowProcessing:
    "Official sector_to_cartesian, original grayscale, all frames and source-relative timestamps; even-size black padding only",
  source: "https://huggingface.co/datasets/Ahus-AIM/EchoXFlow",
  conversionCode: "https://github.com/Ahus-AIM/EchoXFlow",
  license: "CC-BY-NC-SA-4.0",
  authorization: "User confirmed public exhibition use of dataset case videos and model results",
};
write(resolve(demo, "provenance.json"), provenance);
const sourceTiming = read(resolve(source, "source-timing.json"));
assert.equal(sourceTiming.status, "passed");
write(resolve(demo, "library-predictions.json"), {
  checkpointSha256: checkpoint,
  exports,
  assetSha256: copies,
  sourceTiming,
});
console.log(
  "Prepared six reviewed cases and eight previews across seven metrics using one checkpoint.",
);
