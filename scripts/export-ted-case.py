"""Export one unchanged model25 checkpoint on a full-cycle TED cine.

Run from the remote CT-TEE repository using its own Python environment.
The physical pixel aspect is restored before the existing resize/pad operation.
Normalized cycle timestamps match TED's existing full-cine data contract.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path

import cv2
import numpy as np
import torch
from PIL import Image, ImageDraw
from SimpleITK import GetArrayFromImage, ReadImage

from src.s3_echo.components.evidence_quantification.data import (
    TedDataset,
    _resize_images,
)
from src.s3_echo.components.evidence_quantification.sources import discover_ted
from src.s3_echo.model25.train_module import Model25Module


def read_info(path: Path) -> dict[str, str]:
    return dict(
        line.split(": ", 1) for line in path.read_text().splitlines() if ": " in line
    )


def hash_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def largest_contour(mask: np.ndarray) -> list[list[float]]:
    contours, _ = cv2.findContours(
        mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    if not contours:
        raise ValueError("No predicted LV contour")
    points = max(contours, key=cv2.contourArea).reshape(-1, 2).astype(np.float32)
    points[:, 0] /= mask.shape[1] - 1
    points[:, 1] /= mask.shape[0] - 1
    return points.tolist()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--case-id")
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    checkpoint = Path("output/ckpt/s3_echo_model25_periodic_state/selected.ckpt")
    records = discover_ted(Path("datasets/raw_data/ted"))
    manifest = json.loads((checkpoint.parent / "data_manifest.json").read_text())
    test_files = set(manifest["split_ids"]["test"]["ted"])
    if args.case_id is None:
        preview = Image.new("RGB", (4 * 360, 3 * 360), "#101a20")
        draw = ImageDraw.Draw(preview)
        candidates = []
        for record in records:
            if record.image.name not in test_files:
                continue
            info = read_info(
                record.image.with_name(f"{record.patient_id}_4CH_info.cfg")
            )
            if info["ImageQuality"] != "Good":
                continue
            image = ReadImage(str(record.image))
            cine = GetArrayFromImage(image)
            width, height = image.GetSize()[:2]
            spacing = image.GetSpacing()
            display_height = round(height * spacing[1] / spacing[0])
            candidates.append(
                {
                    "id": record.patient_id,
                    "size": [width, height],
                    "frames": len(cine),
                    **info,
                }
            )
            index = len(candidates) - 1
            if index < 12:
                thumbnail = Image.fromarray(cine[0]).resize((width, display_height))
                thumbnail.thumbnail((350, 310))
                x, y = (index % 4) * 360, (index // 4) * 360
                preview.paste(thumbnail, (x + (360 - thumbnail.width) // 2, y + 35))
                draw.text(
                    (x + 12, y + 10),
                    f"{record.patient_id} | {width}x{display_height} | {len(cine)} frames",
                    fill="white",
                )
        preview.save(args.output / "candidates.jpg")
        (args.output / "candidates.json").write_text(
            json.dumps(candidates, indent=2) + "\n"
        )
        print(json.dumps(candidates, indent=2), flush=True)
        return

    record = next(record for record in records if record.patient_id == args.case_id)
    assert record.image.name in test_files, (
        "Use an existing held-out demonstration case"
    )
    image = ReadImage(str(record.image))
    frames = GetArrayFromImage(image)
    masks = GetArrayFromImage(ReadImage(str(record.mask)))
    raw_width, raw_height = image.GetSize()[:2]
    spacing = image.GetSpacing()
    width = raw_width + raw_width % 2
    height = round(raw_height * spacing[1] / spacing[0] / 2) * 2
    # TED has no verified acquisition frame rate. This is explicitly only playback speed.
    playback_fps = 30
    subprocess.run(
        [
            "ffmpeg",
            "-v",
            "error",
            "-y",
            "-f",
            "rawvideo",
            "-pixel_format",
            "gray",
            "-video_size",
            f"{raw_width}x{raw_height}",
            "-framerate",
            str(playback_fps),
            "-i",
            str(record.image.with_suffix(".raw")),
            "-vf",
            f"scale={width}:{height}:flags=lanczos,setsar=1",
            "-an",
            "-c:v",
            "libx264",
            "-crf",
            "18",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            str(args.output / "function.mp4"),
        ],
        check=True,
    )
    sample = TedDataset([record], 384, 512, 32)[0]
    indices = sample["source_indices"].tolist()
    corrected = np.stack(
        [
            cv2.resize(frames[index], (width, height), interpolation=cv2.INTER_LANCZOS4)
            for index in indices
        ]
    )
    sample["images"] = _resize_images(corrected, 384, 512)
    print(
        f"Loading checkpoint for {record.patient_id}, {len(frames)} full-cycle frames",
        flush=True,
    )
    module = (
        Model25Module.load_from_checkpoint(str(checkpoint), map_location="cpu")
        .eval()
        .cuda()
    )
    model = module.model
    inputs = {
        key: sample[key].unsqueeze(0).cuda()
        for key in ("images", "valid", "view_id", "timestamps")
    }
    with torch.inference_mode(), torch.autocast("cuda", dtype=torch.bfloat16):
        *levels, tokens = model.backbone.encode_frames(inputs["images"])
        memory = model.backbone.encode_temporal(
            tokens,
            inputs["timestamps"],
            inputs["valid"],
            model.view_embedding(inputs["view_id"]),
        )
        state, _periodic = model._periodic_state(memory, inputs["valid"])
        # Explicitly request the unchanged function head on A4C; do not relabel source_id.
        outputs = model.metric_heads[1](tuple(levels), state, inputs["valid"])
    arrays = {
        key: outputs[key][0].float().cpu().numpy()
        for key in (
            "lv_mask_probability",
            "selected_masks",
            "ed_weights",
            "es_weights",
            "dynamic_values",
            "frame_volume_ml",
            "volume_scale",
        )
    }
    assert all(np.isfinite(value).all() for value in arrays.values())
    np.savez_compressed(
        args.output / "function_raw_outputs.npz",
        **arrays,
        source_indices=np.asarray(indices),
    )
    scale = min(384 / height, 512 / width)
    resized_width, resized_height = round(width * scale), round(height * scale)
    left, top = (512 - resized_width) // 2, (384 - resized_height) // 2

    def display_points(points: list[list[float]]) -> list[list[float]]:
        return [
            [
                (x * 512 - left) / resized_width * width,
                (y * 384 - top) / resized_height * height,
            ]
            for x, y in points
        ]

    phases = {}
    for name in ("ed", "es"):
        slot = int(arrays[f"{name}_weights"].argmax())
        frame = indices[slot]
        probability = arrays["lv_mask_probability"][slot]
        normalized = largest_contour(probability >= 0.5)
        geometry = display_points(normalized)
        source_frame = cv2.resize(
            frames[frame], (width, height), interpolation=cv2.INTER_LANCZOS4
        )
        rgb = cv2.cvtColor(source_frame, cv2.COLOR_GRAY2RGB)
        polygon = np.rint(geometry).astype(np.int32)
        fill = rgb.copy()
        cv2.fillPoly(fill, [polygon], (45, 210, 180))
        overlay = cv2.addWeighted(rgb, 0.82, fill, 0.18, 0)
        cv2.polylines(overlay, [polygon], True, (92, 235, 207), 2, cv2.LINE_AA)
        Image.fromarray(overlay).save(args.output / f"function-{name}.png")
        Image.fromarray(source_frame).save(
            args.output / f"function-{name}.jpg", quality=95
        )
        prediction_model = cv2.resize(
            probability, (512, 384), interpolation=cv2.INTER_LINEAR
        )
        prediction_raw = (
            cv2.resize(
                prediction_model[
                    top : top + resized_height, left : left + resized_width
                ],
                (raw_width, raw_height),
            )
            >= 0.5
        )
        target = masks[frame] == 1
        dice = float(
            2
            * (prediction_raw & target).sum()
            / max(1, prediction_raw.sum() + target.sum())
        )
        phases[name] = {
            "frame": frame,
            "slot": slot,
            "image": f"function-{name}.png",
            "imageSize": [width, height],
            "geometry": "actual_per_frame_prediction",
            "contour_display_pixels": geometry,
            "contour_model_normalized": normalized,
            "function_head_mask_dice_for_alignment_review": dice,
        }
    for index in range(6):
        frame = round(index * (len(frames) - 1) / 5)
        Image.fromarray(
            cv2.resize(frames[frame], (width, height), interpolation=cv2.INTER_LANCZOS4)
        ).save(args.output / f"function-frame-{index}.jpg", quality=95)
    info = read_info(record.image.with_name(f"{record.patient_id}_4CH_info.cfg"))
    values = arrays["dynamic_values"]
    result = {
        "case_id": record.patient_id,
        "dataset": "TED",
        "view": "A4C",
        "split": "test",
        "checkpoint_sha256": hash_file(checkpoint),
        "checkpoint": str(checkpoint),
        "source_image": str(record.image.resolve()),
        "source_raw_sha256": hash_file(record.image.with_suffix(".raw")),
        "source_frame_count": len(frames),
        "source_info": info,
        "video": {
            "path": "function.mp4",
            "width": width,
            "height": height,
            "fps": playback_fps,
            "frameCount": len(frames),
        },
        "time_basis": "cycle",
        "acquisition_fps": None,
        "timing_note": "All original frames retained in order. 30 fps is presentation playback only, not a claimed acquisition rate. UI shows cycle progress instead of physiological seconds.",
        "model_protocol": "Restore physical pixel aspect using TED spacing, then existing resize/pad and normalized cycle timestamps; unchanged model25 function head on A4C. No fitting, output rescaling or ground-truth substitution. This display-case preprocessing differs from the native anisotropic TED segmentation benchmark.",
        "validation_scope": "Single-case inference on TED; function head was trained for EchoNet-Dynamic. This export is not a dataset-level TED function accuracy evaluation.",
        "coordinate_transform": {
            "raw_size_wh": [raw_width, raw_height],
            "raw_spacing_xy_mm": list(spacing[:2]),
            "model_size_wh": [512, 384],
            "resize_size_wh": [resized_width, resized_height],
            "pad_ltrb": [
                left,
                top,
                512 - resized_width - left,
                384 - resized_height - top,
            ],
            "display_size_wh": [width, height],
            "display_pixel_formula": [
                "x=(normalized_x*512-pad_left)/resize_width*display_width",
                "y=(normalized_y*384-pad_top)/resize_height*display_height",
            ],
        },
        "predictions": {
            "ef_percent": float(values[0]) * 100,
            "edv_ml": float(values[1]) * 300,
            "esv_ml": float(values[2]) * 300,
        },
        "phases": phases,
        "source_indices_zero_based": indices,
        "volume_series": [
            {"frame": frame, "value": float(volume)}
            for frame, volume in zip(indices, arrays["frame_volume_ml"], strict=True)
        ],
    }
    (args.output / "prediction.json").write_text(json.dumps(result, indent=2) + "\n")
    print(
        json.dumps(
            {
                "case": record.patient_id,
                "predictions": result["predictions"],
                "phases": {
                    name: {
                        "frame": entry["frame"],
                        "dice": entry["function_head_mask_dice_for_alignment_review"],
                    }
                    for name, entry in phases.items()
                },
            },
            indent=2,
        ),
        flush=True,
    )


if __name__ == "__main__":
    main()
