<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import Icon from "../Icon.vue";
import type { DemoCase, Point } from "../../types";
import type { FrameSelection } from "../../experience/types";
import { assetUrl, formatPosition } from "../../utils/demo";

const props = defineProps<{
  item: DemoCase;
  initialFrame?: number;
  drawing?: boolean;
  selection?: FrameSelection | null;
  points: Point[];
}>();
const emit = defineEmits<{ points: [points: Point[]]; ready: [value: boolean] }>();
const video = ref<HTMLVideoElement>();
const drawingSvg = ref<SVGSVGElement>();
const ready = ref(false),
  seeking = ref(false),
  playing = ref(false),
  failed = ref(false),
  slow = ref(false),
  time = ref(0);
const frame = computed(() =>
  Math.max(0, Math.min(props.item.frameCount - 1, Math.floor(time.value * props.item.fps + 0.001))),
);
const canCapture = computed(() => ready.value && !seeking.value && !failed.value);
let animation = 0,
  dragging: number | null = null;
let abortCapture: (() => void) | undefined;
function update() {
  if (video.value) time.value = video.value.currentTime;
}
function tick() {
  update();
  if (playing.value) animation = requestAnimationFrame(tick);
}
function pause() {
  video.value?.pause();
  playing.value = false;
  cancelAnimationFrame(animation);
  update();
}
async function play() {
  if (!ready.value || !video.value) return;
  if (video.value.ended) seek(0);
  try {
    await video.value.play();
  } catch {
    failed.value = true;
    emit("ready", false);
  }
}
function onPlay() {
  playing.value = true;
  cancelAnimationFrame(animation);
  tick();
}
function seek(value: number) {
  pause();
  if (video.value && ready.value) {
    const clamped = Math.max(0, Math.min(props.item.frameCount - 1, value));
    const target = (clamped + 0.1) / props.item.fps;
    if (Math.abs(video.value.currentTime - target) > 0.00001) {
      seekStart();
      video.value.currentTime = target;
    }
    time.value = target;
  }
}
function loaded() {
  ready.value = true;
  failed.value = false;
  emit("ready", true);
  update();
  if (props.initialFrame !== undefined) seek(props.initialFrame);
}
function seekStart() {
  seeking.value = true;
  emit("ready", false);
}
function seekEnd() {
  seeking.value = false;
  update();
  emit("ready", ready.value && !failed.value);
}
function speed() {
  slow.value = !slow.value;
  if (video.value) video.value.playbackRate = slow.value ? 0.5 : 1;
}
function retry() {
  ready.value = false;
  failed.value = false;
  emit("ready", false);
  video.value?.load();
}
async function capture(): Promise<FrameSelection> {
  pause();
  if (!video.value || !canCapture.value || video.value.seeking || video.value.readyState < 2)
    throw new Error("影片畫面尚未準備完成");
  // Freeze and decode the selected integer frame before reading its pixels.
  const selected = frame.value;
  const target = (selected + 0.1) / props.item.fps;
  if (Math.abs(video.value.currentTime - target) > 0.0001) {
    await new Promise<void>((resolve, reject) => {
      const element = video.value!;
      const complete = () => {
        cleanup();
        resolve();
      };
      const abort = () => {
        cleanup();
        reject(new Error("影片載入失敗，請重試"));
      };
      const timeout = setTimeout(abort, 4000);
      abortCapture = abort;
      function cleanup() {
        abortCapture = undefined;
        clearTimeout(timeout);
        element.removeEventListener("seeked", complete);
        element.removeEventListener("error", abort);
      }
      element.addEventListener("seeked", complete, { once: true });
      element.addEventListener("error", abort, { once: true });
      element.currentTime = target;
    });
  }
  const canvas = document.createElement("canvas");
  canvas.width = props.item.width;
  canvas.height = props.item.height;
  const context = canvas.getContext("2d")!;
  context.drawImage(video.value, 0, 0, canvas.width, canvas.height);
  return { frame: selected, image: canvas.toDataURL("image/jpeg", 0.95) };
}
function mapPointer(event: PointerEvent): Point | null {
  const svg = drawingSvg.value,
    matrix = svg?.getScreenCTM();
  if (!svg || !matrix) return null;
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  if (point.x < 0 || point.x > props.item.width || point.y < 0 || point.y > props.item.height)
    return null;
  return [point.x, point.y];
}
function place(event: PointerEvent) {
  const point = mapPointer(event);
  if (point && props.points.length < 2) emit("points", [...props.points, point]);
}
function drag(event: PointerEvent, index: number) {
  dragging = index;
  drawingSvg.value?.setPointerCapture(event.pointerId);
}
function move(event: PointerEvent) {
  if (dragging === null) return;
  const point = mapPointer(event);
  if (point)
    emit(
      "points",
      props.points.map((existing, i) => (i === dragging ? point : existing)),
    );
}
function endDrag() {
  dragging = null;
}
function adjust(event: KeyboardEvent, index: number) {
  const deltas: Record<string, Point> = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  };
  const delta = deltas[event.key];
  if (!delta) return;
  event.preventDefault();
  emit(
    "points",
    props.points.map((point, i) =>
      i === index
        ? ([
            Math.max(0, Math.min(props.item.width, point[0] + delta[0])),
            Math.max(0, Math.min(props.item.height, point[1] + delta[1])),
          ] as Point)
        : point,
    ),
  );
}
onBeforeUnmount(() => {
  abortCapture?.();
  cancelAnimationFrame(animation);
  video.value?.pause();
});
defineExpose({ capture, seek, pause });
</script>
<template>
  <div
    class="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_120px] overflow-hidden rounded-[28px] border border-line bg-white shadow-sm"
    data-task-player
  >
    <div class="relative min-h-0 bg-[#0c141d]">
      <video
        ref="video"
        class="h-full w-full object-contain"
        :class="drawing ? 'invisible' : ''"
        :src="assetUrl(item.video)"
        muted
        playsinline
        preload="auto"
        aria-label="選擇關鍵畫面的心超影片"
        @loadeddata="loaded"
        @timeupdate="update"
        @seeking="seekStart"
        @seeked="seekEnd"
        @play="onPlay"
        @pause="pause"
        @ended="pause"
        @error="
          failed = true;
          emit('ready', false);
        "
      />
      <template v-if="drawing && selection">
        <img
          :src="selection.image"
          alt="你選擇的量測畫面"
          class="absolute inset-0 h-full w-full object-contain"
        />
        <svg
          ref="drawingSvg"
          :viewBox="`0 0 ${item.width} ${item.height}`"
          class="absolute inset-0 h-full w-full touch-none cursor-crosshair"
          aria-label="點兩個端點畫測量線"
          data-draw-surface
          @pointerdown="place"
          @pointermove="move"
          @pointerup="endDrag"
          @pointercancel="endDrag"
          @lostpointercapture="endDrag"
        >
          <line
            v-if="points.length === 2"
            :x1="points[0]![0]"
            :y1="points[0]![1]"
            :x2="points[1]![0]"
            :y2="points[1]![1]"
            stroke="#ffce83"
            stroke-width="4"
            vector-effect="non-scaling-stroke"
          />
          <g v-for="(point, index) in points" :key="index">
            <circle
              :cx="point[0]"
              :cy="point[1]"
              :r="item.width * 0.025"
              fill="transparent"
              class="cursor-grab"
              @pointerdown.stop="drag($event, index)"
            />
            <circle
              :cx="point[0]"
              :cy="point[1]"
              :r="item.width * 0.009"
              fill="#ffce83"
              stroke="white"
              stroke-width="2"
              vector-effect="non-scaling-stroke"
              tabindex="0"
              role="button"
              :aria-label="`調整端點 ${index + 1}`"
              @pointerdown.stop="drag($event, index)"
              @keydown="adjust($event, index)"
            />
          </g>
        </svg>
      </template>
      <div
        class="pointer-events-none absolute left-6 right-6 top-5 flex items-center justify-between text-[12px] text-white/80"
      >
        <span class="rounded-full bg-[#142d36cc] px-4 py-2"
          >{{ item.view }} · 示範病例 {{ item.kind === "function" ? "01" : "02" }}</span
        ><span class="rounded-full bg-[#142d36cc] px-4 py-2">{{
          drawing ? "你的量測線" : "原始影像"
        }}</span>
      </div>
      <div
        v-if="failed"
        role="alert"
        class="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#0c141de8] text-white"
      >
        <p>影片暫時未能載入</p>
        <button class="rounded-xl bg-brand px-7 py-3" @click="retry">重新載入影片</button>
      </div>
      <div
        v-else-if="!ready"
        class="absolute inset-0 grid place-items-center bg-[#0c141d80] text-white/80"
        role="status"
      >
        正在準備影片…
      </div>
    </div>
    <div class="flex flex-col justify-center gap-4 px-6" :class="drawing ? 'bg-[#fff9ef]' : ''">
      <template v-if="!drawing">
        <div class="flex items-center gap-3">
          <button
            class="flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-[14px] text-white disabled:opacity-40"
            :disabled="!ready || failed"
            @click="playing ? pause() : play()"
          >
            <Icon :name="playing ? 'pause' : 'play'" :size="17" />{{
              playing ? "暫停影片" : "播放影片"
            }}
          </button>
          <button
            class="rounded-lg border border-line px-4 py-2.5 text-[13px] text-muted"
            @click="speed"
          >
            {{ slow ? "0.5× 慢放" : "1× 正常" }}
          </button>
          <button
            class="rounded-lg border border-line px-4 py-2.5 text-[13px] text-muted"
            :disabled="!ready"
            @click="seek(frame - 1)"
          >
            上一幀
          </button>
          <button
            class="rounded-lg border border-line px-4 py-2.5 text-[13px] text-muted"
            :disabled="!ready"
            @click="seek(frame + 1)"
          >
            下一幀
          </button>
          <button
            class="ml-1 flex items-center gap-2 text-[13px] text-muted"
            :disabled="!ready"
            @click="
              seek(0);
              play();
            "
          >
            <Icon name="reload" :size="16" />重播
          </button>
          <span class="ml-auto text-[14px] text-muted tabular-nums"
            >{{ formatPosition(item, frame) }} · 第 {{ frame + 1 }} / {{ item.frameCount }} 幀</span
          >
        </div>
        <input
          class="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#d5e8e7] accent-brand [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand"
          type="range"
          min="0"
          :max="item.frameCount - 1"
          step="1"
          :value="frame"
          :disabled="!ready || failed"
          aria-label="拖動影片選擇時刻"
          @input="seek(Number(($event.target as HTMLInputElement).value))"
        />
      </template>
      <div v-else class="flex items-center justify-between">
        <span class="flex items-center gap-3 text-[16px] text-[#846635]"
          ><Icon name="ruler" :size="22" />點選兩端，連起你想量測的位置
          <span class="text-[13px] text-muted">{{ points.length }} / 2 個端點</span></span
        ><button
          class="rounded-xl border border-[#e5cfaa] bg-white px-5 py-3 text-[14px] text-[#846635]"
          @click="emit('points', [])"
        >
          清除重畫
        </button>
      </div>
    </div>
  </div>
</template>
