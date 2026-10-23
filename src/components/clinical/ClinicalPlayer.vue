<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import type { DemoCase, Metric } from "../../types";
import type { PlaybackCommand } from "../../clinical/useClinicalSession";
import { assetUrl, formatPosition } from "../../utils/demo";
import Icon from "../Icon.vue";
const props = defineProps<{
  item: DemoCase;
  metric: Metric;
  analysed: boolean;
  overlay: boolean;
  command: PlaybackCommand;
}>();
const emit = defineEmits<{
  frame: [value: number];
  overlay: [value: boolean];
  metric: [id: string];
  failed: [];
}>();
const video = ref<HTMLVideoElement>();
const ready = ref(false),
  failed = ref(false),
  playing = ref(false),
  seeking = ref(false);
const time = ref(0),
  slow = ref(false);
const frame = computed(() =>
  Math.max(0, Math.min(props.item.frameCount - 1, Math.floor(time.value * props.item.fps + 0.001))),
);
const geometry = computed(() => props.metric.evidence.geometry);
const visible = computed(
  () =>
    props.analysed &&
    props.overlay &&
    !playing.value &&
    !seeking.value &&
    frame.value === props.metric.evidence.frame &&
    !!geometry.value,
);
const points = computed(() => geometry.value?.points.map((p) => p.join(",")).join(" "));
let animation = 0;
let pending = props.command;
function update() {
  time.value = video.value?.currentTime ?? 0;
  emit("frame", frame.value);
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
  try {
    await video.value.play();
  } catch (error) {
    // Switching cases or seeking can deliberately interrupt a pending play().
    if (error instanceof DOMException && error.name === "AbortError") return;
    mediaFailed();
  }
}
function locatePhase(phase: "ed" | "es") {
  const id =
    props.metric.phase === phase
      ? props.metric.id
      : props.item.kind === "function"
        ? phase === "ed"
          ? "edv"
          : "esv"
        : phase === "ed"
          ? "lvidd"
          : "lvids";
  emit("metric", id);
}
function mediaFailed() {
  failed.value = true;
  ready.value = false;
  emit("failed");
}
function onPlay() {
  playing.value = true;
  cancelAnimationFrame(animation);
  tick();
}
function onPause() {
  playing.value = false;
  cancelAnimationFrame(animation);
  update();
}
function seek(target: number) {
  pause();
  if (!video.value || !ready.value) return;
  const position =
    (Math.max(0, Math.min(props.item.frameCount - 1, target)) + 0.1) / props.item.fps;
  seeking.value = Math.abs(video.value.currentTime - position) > 0.00001;
  // EF and EDV can share the same evidence frame. Keep the decoded frame
  // rather than asking a looping video to seek again at its final frame.
  if (seeking.value) video.value.currentTime = position;
  update();
}
function apply(command: PlaybackCommand) {
  pending = command;
  if (!ready.value) return;
  if (command.action === "play") void play();
  else if (command.action === "seek") seek(command.frame ?? 0);
  else pause();
}
function loaded() {
  ready.value = true;
  failed.value = false;
  apply(pending);
}
function speed() {
  slow.value = !slow.value;
  if (video.value) video.value.playbackRate = slow.value ? 0.5 : 1;
}
function retry() {
  ready.value = false;
  failed.value = false;
  video.value?.load();
}
watch(() => props.command, apply, { immediate: true });
onBeforeUnmount(() => {
  cancelAnimationFrame(animation);
  video.value?.pause();
});
</script>
<template>
  <section
    class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-white"
    data-clinical-player
  >
    <div
      class="flex h-12 shrink-0 items-center justify-between border-b border-line px-4 text-[12px]"
    >
      <span class="flex items-center gap-2 font-semibold"
        ><Icon name="video" :size="17" />{{ item.view
        }}<span class="ml-2 font-normal text-muted"
          >{{ item.width }} × {{ item.height }}</span
        ></span
      >
      <div class="flex gap-1 rounded-lg bg-canvas p-1">
        <button
          class="rounded-md px-3 py-1"
          :class="!overlay || !analysed ? 'bg-white text-ink shadow-sm' : 'text-muted'"
          :aria-pressed="!overlay || !analysed"
          @click="emit('overlay', false)"
        >
          原始影像
        </button>
        <button
          class="rounded-md px-3 py-1 disabled:cursor-default"
          :class="overlay && analysed ? 'bg-white text-brand shadow-sm' : 'text-muted'"
          :disabled="!analysed"
          :aria-pressed="overlay && analysed"
          @click="emit('overlay', true)"
        >
          AI 疊加
        </button>
      </div>
    </div>
    <div class="relative min-h-0 flex-1 bg-[#0b1119]" data-clinical-viewport>
      <video
        ref="video"
        class="absolute inset-0 h-full w-full object-contain"
        :src="assetUrl(item.video)"
        :poster="assetUrl(item.poster)"
        preload="auto"
        muted
        loop
        playsinline
        aria-label="臨床心超閱片"
        @loadeddata="loaded"
        @timeupdate="update"
        @seeking="seeking = true"
        @seeked="
          seeking = false;
          update();
        "
        @play="onPlay"
        @pause="onPause"
        @error="mediaFailed"
      />
      <svg
        v-if="visible"
        :key="metric.id"
        :viewBox="`0 0 ${item.width} ${item.height}`"
        class="pointer-events-none absolute inset-0 h-full w-full motion-safe:animate-measure-focus"
        aria-label="AI 證據幀量測位置"
        data-clinical-overlay
      >
        <polygon
          v-if="geometry!.kind === 'contour'"
          :points="points"
          fill="#42d8bd26"
          stroke="#69ecd0"
          stroke-width="2"
          vector-effect="non-scaling-stroke"
        />
        <template v-else>
          <polyline
            :points="points"
            fill="none"
            stroke="#69ecd0"
            stroke-width="2.5"
            vector-effect="non-scaling-stroke"
          />
          <circle
            v-for="(point, i) in geometry!.points"
            :key="i"
            :cx="point[0]"
            :cy="point[1]"
            :r="item.width * 0.005"
            fill="#e5fff9"
            stroke="#40c4af"
            stroke-width="1.5"
            vector-effect="non-scaling-stroke"
          />
        </template>
      </svg>
      <div class="pointer-events-none absolute left-4 top-4 flex gap-2 text-[11px] text-white/85">
        <span class="rounded bg-[#152735d9] px-2.5 py-1.5">{{
          item.kind === "function" ? "A4C · 左心室" : "PLAX · 結構量測"
        }}</span
        ><span v-if="visible" class="rounded bg-[#105b54e6] px-2.5 py-1.5"
          >{{ metric.code }} · {{ metric.phase === "ed" ? "舒張末期" : "收縮末期" }}</span
        >
      </div>
      <span
        class="pointer-events-none absolute bottom-3 right-4 rounded bg-[#152735d9] px-2.5 py-1.5 font-mono text-[11px] text-white/80"
        >{{ formatPosition(item, frame) }} · {{ frame + 1 }} / {{ item.frameCount }}</span
      >
      <div
        v-if="failed"
        class="absolute inset-0 grid place-content-center gap-4 bg-[#0b1119] text-center text-white"
        role="alert"
      >
        <p>影片未能載入</p>
        <button class="rounded-lg bg-brand px-5 py-2 text-[14px]" @click="retry">
          重新載入影片
        </button>
      </div>
    </div>
    <div class="shrink-0 px-4 pb-3 pt-4">
      <div class="relative mx-2 mb-3">
        <input
          class="block h-1.5 w-full cursor-pointer accent-brand"
          type="range"
          min="0"
          :max="item.frameCount - 1"
          :value="frame"
          :disabled="!ready"
          aria-label="閱片時間軸"
          @input="seek(Number(($event.target as HTMLInputElement).value))"
        />
        <template v-if="analysed"
          ><button
            v-for="phase in ['ed', 'es'] as const"
            :key="phase"
            class="absolute -top-2 -translate-x-1/2 rounded border border-white bg-brand px-1 py-0.5 text-[9px] font-semibold text-white"
            :style="{ left: `${(item.phases[phase].frame / (item.frameCount - 1)) * 100}%` }"
            :aria-label="`定位${phase.toUpperCase()}`"
            @click="locatePhase(phase)"
          >
            {{ phase.toUpperCase() }}
          </button></template
        >
      </div>
      <div class="flex items-center justify-between text-[12px] text-muted">
        <div class="flex items-center gap-2">
          <button
            class="flex h-8 items-center gap-2 rounded-lg bg-brand px-3 text-white disabled:cursor-default"
            :disabled="!ready"
            :aria-label="playing ? '暫停閱片' : '播放閱片'"
            @click="playing ? pause() : play()"
          >
            <Icon :name="playing ? 'pause' : 'play'" :size="14" />{{
              playing ? "暫停" : "播放"
            }}</button
          ><button
            class="rounded-md border border-line px-2.5 py-1.5"
            :disabled="!ready"
            aria-label="上一幀"
            @click="seek(frame - 1)"
          >
            ‹</button
          ><button
            class="rounded-md border border-line px-2.5 py-1.5"
            :disabled="!ready"
            aria-label="下一幀"
            @click="seek(frame + 1)"
          >
            ›</button
          ><button
            class="rounded-md border border-line px-2.5 py-1.5"
            :disabled="!ready"
            :aria-pressed="slow"
            @click="speed"
          >
            {{ slow ? "0.5× 慢放" : "1× 速度" }}</button
          ><button
            class="flex items-center gap-1 px-2"
            :disabled="!ready"
            @click="
              seek(0);
              play();
            "
          >
            <Icon name="reload" :size="14" />重播
          </button>
        </div>
        <span>{{
          visible ? "顯示此幀的 AI 量測位置" : playing ? "完整影片循環播放" : "拖動時間軸或逐幀檢視"
        }}</span>
      </div>
    </div>
  </section>
</template>
