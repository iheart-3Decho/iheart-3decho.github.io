import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
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
        "stream=nb_frames,r_frame_rate,width,height",
        "-of",
        "json",
        fileURLToPath(new URL(c.video, root)),
      ],
      { encoding: "utf8" },
    ),
  ).streams[0];
  assert.equal(Number(info.nb_frames), c.frameCount);
  assert.equal(info.width, c.width);
  assert.equal(info.height, c.height);
  const [numerator, denominator] = info.r_frame_rate.split("/").map(Number);
  assert.ok(Math.abs(numerator / denominator - c.fps) < 0.001);
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
assert.equal(ef.value.toFixed(1), "56.4");
assert.equal(f.phases.ed.frame / f.fps, 1.44);
assert.equal(f.phases.es.frame / f.fps, 1.76);
assert.equal(cases.filter((item) => item.kind === "function").length, 3);
assert.equal(cases.filter((item) => item.kind === "dimension").length, 3);
const experienceRoot = new URL("../public/experience/", import.meta.url);
const experience = JSON.parse(readFileSync(new URL("experience.json", experienceRoot)));
assert.equal(experience.function.checkpointSha256, experience.dimension.checkpointSha256);
assert.notEqual(experience.function.sourceId, experience.dimension.sourceId);
for (const kind of ["function", "dimension"]) {
  const entry = experience[kind],
    item = cases.find((c) => c.id === entry.caseId);
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
