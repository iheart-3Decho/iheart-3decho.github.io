<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import Icon from "./Icon.vue";
import type { DemoCase, Metric } from "../types";
const props = defineProps<{
  item: DemoCase;
  metric: Metric;
  overlay: boolean;
}>();
const emit = defineEmits<{
  time: [value: number];
  playing: [value: boolean];
  manual: [];
}>();
const video = ref<HTMLVideoElement>();
const currentTime = ref(0),
  playing = ref(false),
  slow = ref(false),
  error = ref(false),
  ready = ref(false);
let animation = 0,
  pendingFrame = props.metric.evidence.frame,
  pendingPlay = false;
const asset = (file: string) => `${import.meta.env.BASE_URL}demo/${file}`;
const frame = computed(() =>
  Math.min(
    props.item.frameCount - 1,
    Math.round(currentTime.value * props.item.fps),
  ),
);
const geometry = computed(() => props.metric.evidence.geometry);
const showGeometry = computed(
  () =>
    props.overlay &&
    !playing.value &&
    Math.abs(frame.value - props.metric.evidence.frame) <= 1 &&
    !!geometry.value,
);
const points = computed(() =>
  geometry.value?.points.map((point) => `${point[0]},${point[1]}`).join(" "),
);
const timeLabel = computed(
  () =>
    `${currentTime.value.toFixed(2)} / ${props.item.duration.toFixed(2)} 秒`,
);
function update() {
  if (video.value) {
    currentTime.value = video.value.currentTime;
    emit("time", currentTime.value);
  }
}
function tick() {
  update();
  if (playing.value) animation = requestAnimationFrame(tick);
}
function stopTick() {
  cancelAnimationFrame(animation);
  animation = 0;
}
function pause() {
  pendingPlay = false;
  video.value?.pause();
  playing.value = false;
  emit("playing", false);
  stopTick();
}
function seek(frameIndex: number) {
  pendingFrame = frameIndex;
  pause();
  if (ready.value && video.value)
    video.value.currentTime = Math.min(
      frameIndex / props.item.fps,
      props.item.duration - 1 / props.item.fps,
    );
}
async function toggle() {
  emit("manual");
  if (!video.value || !ready.value) return;
  if (playing.value) pause();
  else {
    try {
      await video.value.play();
    } catch {
      error.value = true;
    }
  }
}
async function play() {
  pendingPlay = true;
  if (ready.value && video.value) {
    try {
      await video.value.play();
    } catch {
      pendingPlay = false;
    }
  }
}
function onPlay() {
  playing.value = true;
  emit("playing", true);
  stopTick();
  tick();
}
function onPause() {
  playing.value = false;
  emit("playing", false);
  stopTick();
  update();
}
function loaded() {
  const resume = pendingPlay;
  ready.value = true;
  error.value = false;
  if (video.value) {
    video.value.playbackRate = slow.value ? 0.5 : 1;
    seek(pendingFrame);
    if (resume) void play();
  }
}
function setSpeed() {
  emit("manual");
  slow.value = !slow.value;
  if (video.value) video.value.playbackRate = slow.value ? 0.5 : 1;
}
function retry() {
  error.value = false;
  ready.value = false;
  video.value?.load();
}
watch(
  () => props.item.id,
  () => {
    pause();
    ready.value = false;
    error.value = false;
    currentTime.value = 0;
    pendingFrame = props.metric.evidence.frame;
    emit("time", 0);
  },
);
watch(
  () => props.metric,
  (metric) => seek(metric.evidence.frame),
);
onBeforeUnmount(stopTick);
defineExpose({ seek, play, pause });
</script>
<template>
  <div
    class="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[10px] border border-[#162a36] bg-[#0c141d] shadow-[inset_0_0_70px_#0c192733]"
  >
    <div
      class="pointer-events-none absolute left-3 right-3 top-3 z-[2] flex items-center justify-between text-[9px] tracking-[.5px] text-[#c6d4da]"
    >
      <span class="flex items-center gap-1.5"
        ><i class="h-1.5 w-1.5 rounded-full bg-[#53e1c3] animate-signal" />{{
          item.view
        }}</span
      ><span
        class="rounded border border-[#3e555e] bg-[#10232d90] px-1.5 py-1 text-[8px] text-[#a0c8c6]"
        >{{ overlay ? "AI 量測視圖" : "原始影像" }}</span
      >
    </div>
    <div
      class="relative h-[calc(100%_-_62px)] w-[calc(100%_-_24px)] overflow-hidden rounded-sm"
      :style="{ aspectRatio: `${item.width} / ${item.height}` }"
    >
      <video
        ref="video"
        class="block h-full w-full object-contain"
        :key="item.id"
        :src="asset(item.video)"
        :poster="asset(item.poster)"
        preload="auto"
        playsinline
        muted
        loop
        aria-label="心臟超聲示範影片"
        @loadedmetadata="loaded"
        @timeupdate="update"
        @seeked="update"
        @play="onPlay"
        @pause="onPause"
        @error="error = true"
      /><svg
        v-if="showGeometry && geometry"
        class="pointer-events-none absolute inset-0 h-full w-full animate-overlay drop-shadow-[0_0_3px_#50efcc44]"
        :viewBox="`0 0 ${item.width} ${item.height}`"
        aria-label="模型預測量測位置"
      >
        <polygon
          v-if="geometry.kind === 'contour'"
          :points="points"
          fill="rgba(54,222,192,.13)"
          stroke="#51efcc"
          stroke-width="1.6"
          vector-effect="non-scaling-stroke"
        />
        <polyline
          v-else
          :points="points"
          fill="none"
          stroke="#51efcc"
          stroke-width="2.4"
          vector-effect="non-scaling-stroke"
        />
        <circle
          v-for="(point, index) in geometry.kind === 'line'
            ? geometry.points
            : []"
          :key="index"
          :cx="point[0]"
          :cy="point[1]"
          :r="item.width * 0.007"
          fill="#fff"
          stroke="#51efcc"
          stroke-width="2"
          vector-effect="non-scaling-stroke"
        />
      </svg>
    </div>
    <div
      v-if="error"
      class="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-2 bg-[#10212ef5] text-[#d6e2e8]"
      role="alert"
    >
      <Icon name="video" :size="30" /><strong>影片暫時無法載入</strong>
      <p class="text-[10px]">請確認示範素材已準備完成，再重試。</p>
      <button
        class="flex items-center gap-1.5 rounded bg-[#eaf5f4] px-3 py-2 text-[10px] text-[#356b72]"
        @click="retry"
      >
        <Icon name="reload" />重新載入
      </button>
    </div>
    <div
      class="pointer-events-none absolute bottom-2.5 left-3 right-3 z-[2] flex items-center justify-between text-[9px] text-[#c9d7dd]"
    >
      <span class="flex items-center gap-1.5"
        ><i class="h-1.5 w-1.5 rounded-full bg-[#53e1c3] animate-signal" />{{
          showGeometry
            ? metric.phase === "ed"
              ? "充盈最大時刻"
              : "收縮最小時刻"
            : playing
              ? "觀看心臟的動態變化"
              : "點選右側指標，查看量測畫面"
        }}</span
      ><span class="tabular-nums text-[#90a6b1]">{{ timeLabel }}</span>
    </div>
  </div>
  <div class="flex flex-none items-center gap-2 border-b border-[#e4ecf0] py-2">
    <button
      class="flex items-center gap-1.5 rounded bg-[#246c79] px-2.5 py-1.5 text-[10px] text-white"
      :aria-label="playing ? '暫停影片' : '播放影片'"
      :disabled="!ready || error"
      @click="toggle"
    >
      <Icon :name="playing ? 'pause' : 'play'" :size="14" />{{
        playing ? "暫停" : "播放影片"
      }}</button
    ><button
      class="rounded bg-[#f1f5f7] px-2 py-1.5 text-[10px] text-[#657c87]"
      :aria-pressed="slow"
      @click="setSpeed"
    >
      {{ slow ? "0.5× 慢速" : "1× 正常" }}</button
    ><span
      class="ml-auto hidden items-center gap-1 text-[9px] text-[#8a9ca5] min-[1101px]:flex"
      ><Icon name="scan" :size="13" />點選時刻，立即定位</span
    >
  </div>
</template>
