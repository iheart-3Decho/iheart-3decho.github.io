import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
const read = (path) => JSON.parse(readFileSync(path, "utf8"));
const extra = read("public/experience/clinical-additions.json");
const base = read("public/demo/cases.json");
const checkpoint = read("public/experience/experience.json").function.checkpointSha256;
assert.equal(
  new Set([...base, ...extra.cases].map((item) => item.id)).size,
  base.length + extra.cases.length,
);
assert.equal(extra.cases.length, 3);
for (const item of extra.cases) {
  const source = extra.provenance.find((row) => row.caseId === item.id);
  const evidence = extra.library.find((row) => row.caseId === item.id);
  assert.equal(source.checkpointSha256, checkpoint);
  assert.equal(evidence.checkpointSha256, checkpoint);
  assert.equal(source.sourceFrameCount, item.frameCount);
  assert.equal(item.timeBasis, "cycle");
  assert.equal(source.acquisitionFps, null);
  assert.deepEqual(item.volumeSeries, source.volumeSeries);
  for (const [asset, digest] of Object.entries(source.assetSha256)) {
    assert.equal(
      createHash("sha256")
        .update(readFileSync(`public/${asset}`))
        .digest("hex"),
      digest,
      asset,
    );
  }
  const video = JSON.parse(
    execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height,nb_frames",
        "-of",
        "json",
        `public/demo/${item.video}`,
      ],
      { encoding: "utf8" },
    ),
  ).streams[0];
  assert.deepEqual(
    [video.width, video.height, Number(video.nb_frames)],
    [item.width, item.height, item.frameCount],
  );
  assert.notEqual(item.phases.ed.frame, item.phases.es.frame);
  for (const metric of item.metrics) {
    const phase = source.phases[metric.phase];
    assert.equal(
      metric.value,
      source.predictions[{ ef: "ef_percent", edv: "edv_ml", esv: "esv_ml" }[metric.id]],
    );
    assert.equal(metric.value, evidence.metrics[metric.id].value);
    assert.equal(metric.evidence.frame, phase.frame);
    assert.deepEqual(metric.evidence.geometry.points, phase.contour_display_pixels);
    assert.deepEqual(evidence.evidence[metric.phase].points, phase.contour_display_pixels);
    for (const [x, y] of metric.evidence.geometry.points)
      assert.ok(x >= 0 && x <= item.width && y >= 0 && y <= item.height);
    assert.ok(phase.frame >= 0 && phase.frame < item.frameCount);
    const png = readFileSync(`public/experience/${evidence.evidence[metric.phase].image}`);
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [item.width, item.height]);
  }
}
console.log(
  "PASS: three added clinical cases, source hashes, unchanged checkpoint/scalars/geometry, complete video frames and cycle time basis.",
);
