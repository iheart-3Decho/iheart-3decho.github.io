import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  existsSync,
} from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { parse } from "csv-parse/sync";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const project = resolve(root, "..");
const destination = resolve(root, "public/demo");
mkdirSync(destination, { recursive: true });
const csvPath = resolve(
  project,
  "CT-Heart/.docs/remote-pull/model25-vis/predictions.csv",
);
const rows = parse(readFileSync(csvPath, "utf8"), {
  columns: true,
  skip_empty_lines: true,
});
const specs = [
  {
    id: "function",
    title: "泵血功能案例 01",
    source: "dynamic",
    sourceId: "0X100CF05D141FF143",
    dataset: "EchoNet-Dynamic",
    view: "心尖四腔心切面",
    file: resolve(
      project,
      "STG/PPTX/2026-10-04/assets/clinical/0X100CF05D141FF143.avi",
    ),
  },
  {
    id: "function-27",
    title: "泵血功能案例 02",
    source: "dynamic",
    sourceId: "0X1012703CDC1436FE",
    dataset: "EchoNet-Dynamic",
    view: "心尖四腔心切面",
    file: resolve(root, "private-source/0X1012703CDC1436FE.avi"),
  },
  {
    id: "function-61",
    title: "泵血功能案例 03",
    source: "dynamic",
    sourceId: "0X105B9EF57DE45DCB",
    dataset: "EchoNet-Dynamic",
    view: "心尖四腔心切面",
    file: resolve(root, "private-source/0X105B9EF57DE45DCB.avi"),
  },
  {
    id: "dimension",
    title: "心臟尺寸案例 01",
    source: "lvh",
    sourceId: "0X100EC1C77A847AA7",
    dataset: "EchoNet-LVH",
    view: "胸骨旁長軸切面",
    file: resolve(root, "private-source/0X100EC1C77A847AA7.avi"),
  },
  {
    id: "dimension-02",
    title: "心臟尺寸案例 02",
    source: "lvh",
    sourceId: "0X1278336999990DD9",
    dataset: "EchoNet-LVH",
    view: "胸骨旁長軸切面",
    file: resolve(root, "private-source/0X1278336999990DD9.avi"),
  },
  {
    id: "dimension-03",
    title: "心臟尺寸案例 03",
    source: "lvh",
    sourceId: "0X174E6302A0DA1AD0",
    dataset: "EchoNet-LVH",
    view: "胸骨旁長軸切面",
    file: resolve(root, "private-source/0X174E6302A0DA1AD0.avi"),
  },
];
const records = specs.map((spec) => {
  const row = rows.find(
    (r) => r.patient_id === spec.sourceId && r.source === spec.source,
  );
  if (!row) throw new Error(`Missing model25 prediction: ${spec.sourceId}`);
  if (!existsSync(spec.file))
    throw new Error(`Missing source video: ${spec.file}`);
  return { ...spec, row, video: `${spec.id}.mp4`, poster: `${spec.id}-ed.jpg` };
});
function probe(file) {
  const info = JSON.parse(
    execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height,r_frame_rate,nb_frames,duration",
        "-of",
        "json",
        file,
      ],
      { encoding: "utf8" },
    ),
  ).streams[0];
  const [a, b] = info.r_frame_rate.split("/").map(Number);
  return {
    width: info.width,
    height: info.height,
    fps: a / b,
    frameCount: Number(info.nb_frames),
    duration: Number(info.duration),
  };
}
// Restore model normalized coordinates through the exact resize-and-pad transform.
function transform(point, width, height) {
  const scale = Math.min(384 / height, 512 / width);
  const w = Math.round(width * scale),
    h = Math.round(height * scale);
  const left = Math.floor((512 - w) / 2),
    top = Math.floor((384 - h) / 2);
  return [
    ((point[0] * 512 - left) / w) * width,
    ((point[1] * 384 - top) / h) * height,
  ];
}
function evidence(row, prefix, metadata, kind) {
  const points =
    kind === "contour"
      ? JSON.parse(row[`${prefix}_contour_normalized`])
      : [
          [Number(row[`${prefix}_p0_x`]), Number(row[`${prefix}_p0_y`])],
          [Number(row[`${prefix}_p1_x`]), Number(row[`${prefix}_p1_y`])],
        ];
  return {
    frame: Number(row[`${prefix}_evidence_source_frame`]),
    geometry: {
      kind,
      points: points.map((p) => transform(p, metadata.width, metadata.height)),
    },
  };
}
const names = [
  ["IVSd", "室間隔厚度", "左右心室之間的心壁，在充盈時有多厚。", "ed"],
  ["LVIDd", "充盈時心室內徑", "心室充滿血液時，腔體內部的寬度。", "ed"],
  ["LVIDs", "收縮時心室內徑", "心室完成收縮時，腔體內部的寬度。", "es"],
  ["LVPWd", "心室後壁厚度", "左心室後方的心壁，在充盈時有多厚。", "ed"],
];
const cases = records.map((record) => {
  const metadata = probe(record.file);
  if (record.source === "lvh" && metadata.width / metadata.height !== 4 / 3)
    throw new Error(`${record.sourceId}: LVH crop needs an explicit transform`);
  const item = {
    id: record.id,
    caseTitle: record.title,
    kind: record.source === "dynamic" ? "function" : "dimension",
    label: record.source === "dynamic" ? "泵血功能" : "心臟尺寸",
    dataset: record.dataset,
    view: record.view,
    video: record.video,
    poster: record.poster,
    sourceId: record.sourceId,
    ...metadata,
  };
  const row = record.row;
  if (record.source === "dynamic") {
    const ed = evidence(row, "A4C_ED", metadata, "contour");
    const es = evidence(row, "A4C_ES", metadata, "contour");
    const volume = JSON.parse(row.A4C_frame_volume_ml);
    Object.assign(item, {
      phases: { ed, es },
      metrics: [
        {
          id: "ef",
          label: "射血分數",
          code: "EF",
          value: Number(row.ef_prediction) * 100,
          unit: "%",
          description: "一次收縮泵出的血量，佔充盈時血量的比例。",
          phase: "ed",
          evidence: ed,
        },
        {
          id: "edv",
          label: "充盈時容積",
          code: "EDV",
          value: Number(row.edv_prediction),
          unit: "mL",
          description: "心室充滿血液、準備收縮時的血量。",
          phase: "ed",
          evidence: ed,
        },
        {
          id: "esv",
          label: "收縮後容積",
          code: "ESV",
          value: Number(row.esv_prediction),
          unit: "mL",
          description: "心室完成收縮後，仍留在心室內的血量。",
          phase: "es",
          evidence: es,
        },
      ],
      volumeSeries: volume.map((value, i) => ({
        frame: Math.round(
          (i * (metadata.frameCount - 1)) / (volume.length - 1),
        ),
        value,
      })),
    });
  } else {
    Object.assign(item, {
      phases: {
        ed: { frame: Number(row.LVIDd_evidence_source_frame) },
        es: { frame: Number(row.LVIDs_evidence_source_frame) },
      },
      metrics: names.map(([code, label, description, phase]) => ({
        id: code.toLowerCase(),
        code,
        label,
        description,
        phase,
        value: Number(row[`${code}_prediction`]) * 10,
        unit: "mm",
        evidence: evidence(row, code, metadata, "line"),
      })),
    });
  }
  return { item, inputVideo: record.file };
});
for (const { item, inputVideo } of cases) {
  execFileSync("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    inputVideo,
    "-map",
    "0:v:0",
    "-an",
    "-c:v",
    "libx264",
    "-crf",
    "18",
    "-preset",
    "medium",
    "-pix_fmt",
    "yuv420p",
    "-fps_mode",
    "passthrough",
    "-movflags",
    "+faststart",
    resolve(destination, item.video),
  ]);
  const posterFrame = item.phases.ed.frame;
  execFileSync("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    inputVideo,
    "-vf",
    `select=eq(n\\,${posterFrame})`,
    "-frames:v",
    "1",
    "-q:v",
    "2",
    resolve(destination, item.poster),
  ]);
  const encoded = probe(resolve(destination, item.video));
  item.phaseImages = { ed: item.poster, es: `${item.id}-es.jpg` };
  item.framePreviews = [];
  const previews = [
    { frame: item.phases.es.frame, image: item.phaseImages.es },
    ...Array.from({ length: 6 }, (_, i) => ({
      frame: Math.round((i * (item.frameCount - 1)) / 5),
      image: `${item.id}-frame-${i}.jpg`,
    })),
  ];
  for (const preview of previews) {
    execFileSync("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      inputVideo,
      "-vf",
      `select=eq(n\\,${preview.frame})`,
      "-frames:v",
      "1",
      "-q:v",
      "2",
      resolve(destination, preview.image),
    ]);
    if (preview.image !== item.phaseImages.es) item.framePreviews.push(preview);
  }
  if (
    encoded.frameCount !== item.frameCount ||
    Math.abs(encoded.fps - item.fps) > 0.001
  )
    throw new Error("Encoded frame sequence changed");
}
writeFileSync(
  resolve(destination, "cases.json"),
  JSON.stringify(
    cases.map(({ item }) => item),
    null,
    2,
  ) + "\n",
);
writeFileSync(
  resolve(destination, "provenance.json"),
  JSON.stringify(
    {
      checkpointFamily: "s3_echo_model25_periodic_state",
      predictionSource:
        "CT-Heart/.docs/remote-pull/model25-vis/predictions.csv",
      cases: records.map((record) => ({
        id: record.id,
        dataset: record.dataset,
        sourceId: record.sourceId,
        videoSource: record.file,
        videoMetadata: cases.find(({ item }) => item.id === record.id).item,
        originalUnit: record.source === "lvh" ? "cm" : undefined,
        displayUnit: record.source === "lvh" ? "mm" : undefined,
        conversion: record.source === "lvh" ? 10 : undefined,
        modelInput: {
          width: 512,
          height: 384,
          ...(record.source === "dynamic"
            ? { leftPadding: 64, topPadding: 0 }
            : { officialCenterCrop: "none for 4:3 source" }),
        },
        geometry:
          record.source === "dynamic"
            ? "metric-family evidence-aggregated model output; not dense framewise segmentation"
            : "metric-family evidence-aggregated model endpoints",
      })),
      timing:
        "Use source container FPS; LVH annotation CSV FPS differs from the AVI. Playback uses the AVI timebase.",
      rights:
        "Public demo distribution authorization confirmed by the user for the selected case videos and model outputs.",
    },
    null,
    2,
  ) + "\n",
);
copyFileSync(resolve(root, "favicon.svg"), resolve(root, "public/favicon.svg"));
console.log(
  `Prepared ${cases.length} model25 cases; source frame count and FPS preserved.`,
);
