import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
const root = new URL("../public/demo/", import.meta.url);
const cases = JSON.parse(readFileSync(new URL("cases.json", root)));
assert.equal(cases.length, 6);
for (const c of cases) {
  const info = JSON.parse(
    execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=nb_frames,width,height:frame=best_effort_timestamp_time",
        "-of",
        "json",
        fileURLToPath(new URL(c.video, root)),
      ],
      { encoding: "utf8" },
    ),
  );
  const stream = info.streams[0];
  assert.equal(Number(stream.nb_frames), c.frameCount);
  assert.equal(stream.width, c.width);
  assert.equal(stream.height, c.height);
  assert.equal(info.frames.length, c.frameCount);
  // Nominal r_frame_rate rounds EchoXFlow's acquisition rate to 49/60.
  // Verify every decoded timestamp against the source FPS actually used for seeking.
  const start = Number(info.frames[0].best_effort_timestamp_time);
  for (const [index, frame] of info.frames.entries()) {
    const time = Number(frame.best_effort_timestamp_time) - start;
    assert.ok(Math.abs(time * c.fps - index) < 0.05, `${c.id}: source frame ${index} timing`);
  }
  for (const metric of c.metrics) {
    assert.ok(Number.isFinite(metric.value) && metric.value > 0);
    assert.ok(
      Number.isInteger(metric.evidence.frame) &&
        metric.evidence.frame >= 0 &&
        metric.evidence.frame < c.frameCount,
    );
    for (const [x, y] of metric.evidence.geometry.points)
      assert.ok(
        x >= 0 && x <= c.width && y >= 0 && y <= c.height,
        `${metric.id} coordinates out of image`,
      );
  }
}
assert.equal(new Set(cases.map((item) => item.id)).size, 6);
for (const item of cases.filter((entry) => entry.kind === "function")) {
  const values = Object.fromEntries(item.metrics.map((metric) => [metric.id, metric.value]));
  assert.ok(
    Math.abs(values.ef - (1 - values.esv / values.edv) * 100) < 0.001,
    `${item.id}: EF consistency`,
  );
}
const f = cases.find((item) => item.id === "function") ?? cases[0];
const [ef, edv, esv] = f.metrics;
assert.ok(Math.abs(ef.value - (1 - esv.value / edv.value) * 100) < 0.001);
const ted = JSON.parse(readFileSync(new URL("ted-prediction.json", root)));
for (const [file, expected] of Object.entries(ted.assetSha256)) {
  const directory = file.endsWith(".mp4")
    ? root
    : new URL("../public/experience/", import.meta.url);
  assert.equal(
    createHash("sha256")
      .update(readFileSync(new URL(file, directory)))
      .digest("hex"),
    expected,
    `TED asset differs from original inference export: ${file}`,
  );
}
assert.equal(f.dataset, "TED");
assert.equal(f.sourceId, ted.case_id);
assert.equal(f.timeBasis, "cycle");
assert.equal(f.frameCount, ted.source_frame_count);
assert.equal(f.phases.ed.frame, ted.phases.ed.frame);
assert.equal(f.phases.es.frame, ted.phases.es.frame);
assert.notEqual(f.phases.ed.frame, f.phases.es.frame);
assert.equal(ef.value, ted.predictions.ef_percent);
assert.equal(edv.value, ted.predictions.edv_ml);
assert.equal(esv.value, ted.predictions.esv_ml);
assert.deepEqual([f.width, f.height], ted.coordinate_transform.display_size_wh);
const aspect = ted.coordinate_transform;
const [rawWidth, rawHeight] = aspect.raw_size_wh;
const [spacingX, spacingY] = aspect.raw_spacing_xy_mm;
assert.ok(
  rawWidth > 112 && rawHeight > 112,
  "Use native source resolution above 112px, not an enlarged low-resolution video",
);
// Match the export's physical-pixel restoration, including even H.264 dimensions.
// A fixed minimum display size incorrectly rejects smaller native TED sources.
const halfHeight = (rawHeight * spacingY) / spacingX / 2;
const lowerHalfHeight = Math.floor(halfHeight);
// Python round() in the inference exporter rounds exact ties to the even integer.
const roundedHalfHeight =
  halfHeight - lowerHalfHeight === 0.5
    ? lowerHalfHeight + (lowerHalfHeight % 2)
    : Math.round(halfHeight);
assert.deepEqual(
  [f.width, f.height],
  [rawWidth + (rawWidth % 2), roundedHalfHeight * 2],
  "Display dimensions must come directly from source spacing, without arbitrary enlargement",
);
assert.ok(
  Math.abs(f.width - rawWidth) <= 1 && Math.abs(f.height - (rawHeight * spacingY) / spacingX) <= 1,
  "Restore physical pixel aspect within the one-pixel rounding needed by H.264",
);
assert.equal(cases.filter((item) => item.kind === "function").length, 3);
assert.equal(cases.filter((item) => item.kind === "dimension").length, 3);
const experienceRoot = new URL("../public/experience/", import.meta.url);
const experience = JSON.parse(readFileSync(new URL("experience.json", experienceRoot)));
assert.equal(experience.function.checkpointSha256, experience.dimension.checkpointSha256);
assert.equal(experience.function.checkpointSha256, ted.checkpoint_sha256);
assert.notEqual(experience.function.sourceId, experience.dimension.sourceId);
assert.equal(experience.library.length, 6);
assert.equal(new Set(experience.library.map((entry) => entry.caseId)).size, 6);
for (const entry of experience.library) {
  const item = cases.find((c) => c.id === entry.caseId);
  assert.equal(entry.checkpointSha256, ted.checkpoint_sha256);
  assert.equal(entry.sourceId, item.sourceId);
  for (const [id, metric] of Object.entries(entry.metrics)) {
    const original = item.metrics.find((m) => m.id === id);
    assert.ok(Math.abs(metric.value - original.value) < 0.0001);
    assert.equal(metric.unit, original.unit);
  }
  for (const frame of Object.values(entry.evidence)) {
    assert.ok(Number.isInteger(frame.frame) && frame.frame >= 0 && frame.frame < item.frameCount);
    assert.equal(frame.geometry, "actual_per_frame_prediction");
    assert.ok(existsSync(new URL(frame.image, experienceRoot)));
    const png = readFileSync(new URL(frame.image, experienceRoot));
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], frame.imageSize);
    assert.ok(Math.abs(frame.imageSize[0] / frame.imageSize[1] - item.width / item.height) < 0.001);
    for (const [x, y] of frame.points || [])
      assert.ok(x >= 0 && x <= item.width && y >= 0 && y <= item.height);
  }
}
const reference = JSON.parse(readFileSync(new URL("library-predictions.json", root)));
assert.equal(reference.checkpointSha256, ted.checkpoint_sha256);
assert.equal(reference.sourceTiming.status, "passed");
assert.equal(reference.sourceTiming.recordings.length, 2);
for (const source of reference.sourceTiming.recordings) {
  const item = cases.find((entry) => entry.sourceId === source.sourceId);
  assert.equal(source.decodedFrames, item.frameCount);
  assert.equal(source.sourceFrames, item.frameCount);
  assert.equal(source.frameTimesSeconds.length, item.frameCount);
  assert.deepEqual(source.displaySize, [item.width, item.height]);
  assert.ok(source.maxSourceTimestampErrorSeconds < 0.000003);
  assert.ok(source.completeQrsIntervals >= 1);
  assert.ok(Math.abs(source.fps - item.fps) < 0.000001);
  assert.ok(source.sourceShapeTimeDepthScanlines[1] > 112);
}
for (const [file, expected] of Object.entries(reference.assetSha256)) {
  assert.equal(
    createHash("sha256")
      .update(readFileSync(new URL(`../public/${file}`, import.meta.url)))
      .digest("hex"),
    expected,
    `Library asset differs from inference export: ${file}`,
  );
}
for (const prediction of reference.exports) {
  const item = cases.find((entry) => entry.id === prediction.publicId);
  assert.equal(item.sourceId, prediction.sourceId);
  assert.equal(item.dataset, prediction.dataset);
  assert.equal(prediction.checkpointSha256, ted.checkpoint_sha256);
  assert.equal(item.frameCount, prediction.frameCount);
  assert.deepEqual([item.width, item.height], [prediction.width, prediction.height]);
  for (const metric of item.metrics) {
    assert.equal(metric.value, prediction.values[metric.id].value);
    const key = item.kind === "function" ? (metric.id === "esv" ? "es" : "ed") : metric.id;
    const evidence = prediction.evidence[key];
    assert.equal(metric.evidence.frame, evidence.frame);
    assert.deepEqual(metric.evidence.geometry.points, evidence.points);
  }
  if (item.dataset === "EchoXFlow")
    assert.equal(
      createHash("sha256")
        .update(readFileSync(new URL(item.video, root)))
        .digest("hex"),
      prediction.videoSha256,
    );
}
assert.equal(experience.playlist.length, 8);
assert.equal(experience.playlist[0].caseId, experience.function.caseId);
assert.equal(cases.find((entry) => entry.id === experience.function.caseId).dataset, "EchoXFlow");
assert.equal(new Set(experience.playlist.map((entry) => entry.metric)).size, 7);
assert.equal(new Set(experience.playlist.map((entry) => entry.caseId)).size, 6);
for (const preview of experience.playlist) {
  const item = cases.find((entry) => entry.id === preview.caseId);
  const entry = experience.library.find((entry) => entry.caseId === preview.caseId);
  assert.equal(item.kind, preview.mode);
  assert.ok(entry.metrics[preview.metric]);
  assert.ok(
    entry.evidence[
      preview.mode === "function" ? (preview.metric === "esv" ? "es" : "ed") : preview.metric
    ],
  );
}
console.log(
  "PASS: six-case library, seven metric previews, source frame timestamps, unchanged checkpoint and per-frame export hashes.",
);
console.log(
  "PASS: independent experience values/units, same checkpoint, distinct cases and uncropped frame-specific overlays.",
);
for (const item of cases.filter((entry) => entry.kind === "dimension")) {
  for (const id of ["ivsd", "lvidd", "lvids", "lvpwd"])
    assert.ok(
      item.metrics.some((metric) => metric.id === id),
      `${item.id} missing ${id}`,
    );
}
console.log(
  "PASS: geometry bounds, real frame references, encoded media, EF consistency and cm→mm conversion.",
);
