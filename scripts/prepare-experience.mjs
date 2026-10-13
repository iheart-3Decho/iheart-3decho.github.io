import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const source = resolve("../Demo-Exports/iHeart_演示病例与预测结果_20261013");
const target = resolve("public/experience");
mkdirSync(target, { recursive: true });
const cases = JSON.parse(readFileSync("public/demo/cases.json", "utf8"));
const data = {};
for (const [kind, folder, caseId] of [
  ["function", "01_A4C_泵血功能", "function"],
  ["dimension", "02_PLAX_壁厚与内径", "dimension"],
]) {
  const prediction = JSON.parse(
    readFileSync(resolve(source, folder, "原始输出/预测结果.json"), "utf8"),
  );
  const item = cases.find((entry) => entry.id === caseId);
  assert.equal(prediction.case_id, item.sourceId);
  const images =
    kind === "function"
      ? { ed: "ED_左心室轮廓叠加.png", es: "ES_左心室轮廓叠加.png" }
      : Object.fromEntries(
          ["IVSd", "LVIDd", "LVIDs", "LVPWd"].map((metric) => [
            metric.toLowerCase(),
            `${metric}_关键点与测量线.png`,
          ]),
        );
  const evidence = {};
  const metrics = {};
  for (const metric of item.metrics) {
    const value =
      kind === "function"
        ? prediction.predictions[{ ef: "ef_percent", edv: "edv_ml", esv: "esv_ml" }[metric.id]]
        : prediction.measurements[metric.code].value_mm;
    assert.ok(Math.abs(value - metric.value) < 0.0001, `${metric.id}: source value differs`);
    metrics[metric.id] = { value, unit: metric.unit, label: metric.label };
  }
  for (const [id, file] of Object.entries(images)) {
    const original =
      kind === "function"
        ? prediction.phases[id]
        : prediction.measurements[
            id === "ivsd" ? "IVSd" : id === "lvidd" ? "LVIDd" : id === "lvids" ? "LVIDs" : "LVPWd"
          ];
    const output = `${kind}-${id}.png`;
    copyFileSync(resolve(source, folder, "展示图片", file), resolve(target, output));
    const png = readFileSync(resolve(target, output));
    evidence[id] = {
      frame: original.frame_index_zero_based,
      image: output,
      imageSize: [png.readUInt32BE(16), png.readUInt32BE(20)],
      ...(kind === "dimension"
        ? { points: original.evidence_frame_endpoints_original_pixels }
        : {}),
      geometry: "actual_per_frame_prediction",
    };
    assert.equal(
      original.frame_index_zero_based,
      kind === "function"
        ? item.phases[id].frame
        : item.metrics.find((metric) => metric.id === id).evidence.frame,
    );
  }
  data[kind] = {
    caseId,
    sourceId: prediction.case_id,
    checkpointSha256: prediction.checkpoint_sha256,
    video: {
      path: item.video,
      width: item.width,
      height: item.height,
      fps: item.fps,
      frameCount: item.frameCount,
    },
    coordinateTransform: prediction.coordinate_transform,
    metrics,
    evidence,
  };
}
assert.equal(data.function.checkpointSha256, data.dimension.checkpointSha256);
writeFileSync(resolve(target, "experience.json"), `${JSON.stringify(data, null, 2)}\n`);
console.log(
  "Prepared verified frame-specific images and geometry; videos remain shared with the original demo.",
);
