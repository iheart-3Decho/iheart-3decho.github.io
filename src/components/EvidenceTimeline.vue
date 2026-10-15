<script setup lang="ts">
import { computed } from "vue";
import Icon from "./Icon.vue";
import type { DemoCase } from "../types";
import { formatPosition } from "../utils/demo";
const props = defineProps<{
  item: DemoCase;
  time: number;
  selected: "ed" | "es";
  playing: boolean;
}>();
const emit = defineEmits<{
  seek: [frame: number];
  phase: [value: "ed" | "es"];
}>();
const lastFrame = computed(() => props.item.frameCount - 1);
const position = computed(() =>
  Math.min(100, ((props.time * props.item.fps) / lastFrame.value) * 100),
);
const curve = computed(() => {
  const series = props.item.volumeSeries;
  if (!series?.length) return "";
  const min = Math.min(...series.map((p) => p.value)),
    max = Math.max(...series.map((p) => p.value));
  return series
    .map(
      (p) =>
        `${(p.frame / lastFrame.value) * 1000},${74 - ((p.value - min) / (max - min || 1)) * 57}`,
    )
    .join(" ");
});
function scrub(event: Event) {
  emit("seek", Number((event.target as HTMLInputElement).value));
}
</script>
<template>
  <section class="flex-none pt-2" aria-label="關鍵時刻定位">
    <div class="flex items-center justify-between text-[10px] text-[#506f7a]">
      <span class="flex items-center gap-1.5 font-medium"
        ><Icon name="clock" :size="14" />關鍵時刻</span
      ><small class="text-[8px] text-[#8b9da7]">{{
        item.volumeSeries ? "左心室容積變化" : "影片時間軸"
      }}</small>
    </div>
    <div
      class="relative mt-1.5 h-[50px] border-b border-[#dfe8ec] bg-[repeating-linear-gradient(to_right,_transparent_0,_transparent_calc(25%_-_1px),_#edf2f5_calc(25%_-_1px),_#edf2f5_25%_)]"
    >
      <svg
        v-if="curve"
        class="block h-full w-full overflow-visible"
        viewBox="0 0 1000 88"
        preserveAspectRatio="none"
      >
        <polyline
          :points="curve"
          fill="none"
          stroke="#459faa"
          stroke-width="2"
          vector-effect="non-scaling-stroke"
        />
      </svg>
      <div
        class="absolute inset-y-1 left-0 border-l border-dashed border-[#48a1a5]"
        :style="{ left: `${(item.phases.ed.frame / lastFrame) * 100}%` }"
      />
      <div
        class="absolute inset-y-1 left-0 border-l border-dashed border-[#6289c6]"
        :style="{ left: `${(item.phases.es.frame / lastFrame) * 100}%` }"
      />
      <div
        class="absolute inset-y-0 left-0 border-l border-[#244f6a]"
        :style="{ left: `${position}%` }"
      >
        <span
          class="block h-2 w-2 -translate-x-1 -translate-y-px rotate-45 rounded-sm bg-[#244f6a]"
        />
      </div>
      <input
        class="absolute inset-0 m-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-track]:h-full [&::-moz-range-track]:bg-transparent [&::-webkit-slider-thumb]:h-[50px] [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-transparent [&::-moz-range-thumb]:h-[50px] [&::-moz-range-thumb]:w-[18px] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-transparent"
        type="range"
        min="0"
        :max="lastFrame"
        step="1"
        :value="Math.round(time * item.fps)"
        aria-label="拖動影片時間軸"
        :aria-valuetext="formatPosition(item, Math.min(lastFrame, Math.round(time * item.fps)))"
        @input="scrub"
      />
    </div>
    <div class="mt-1 flex justify-between text-[8px] tabular-nums text-[#9aacb3]">
      <span>{{ formatPosition(item, 0) }}</span
      ><span>{{ formatPosition(item, lastFrame) }}</span>
    </div>
    <div class="mt-2 grid grid-cols-2 gap-2 max-[650px]:hidden">
      <button
        class="flex items-center gap-1.5 rounded-lg border border-[#e0e9ed] bg-[#f9fbfc] p-2 text-left text-[9px] text-[#657d8a]"
        :class="selected === 'ed' && !playing ? 'border-[#acd1ca] bg-[#edf7f5] text-[#286f72]' : ''"
        @click="emit('phase', 'ed')"
      >
        <i class="h-1.5 w-1.5 rounded-full bg-[#419890]" />充盈最大時刻
        <b class="ml-auto text-[13px]">{{ formatPosition(item, item.phases.ed.frame) }}</b></button
      ><button
        class="flex items-center gap-1.5 rounded-lg border border-[#e0e9ed] bg-[#f9fbfc] p-2 text-left text-[9px] text-[#657d8a]"
        :class="selected === 'es' && !playing ? 'border-[#b9c9e3] bg-[#eef3fb] text-[#4573a8]' : ''"
        @click="emit('phase', 'es')"
      >
        <i class="h-1.5 w-1.5 rounded-full bg-[#6b8fc8]" />收縮最小時刻
        <b class="ml-auto text-[13px]">{{ formatPosition(item, item.phases.es.frame) }}</b>
      </button>
    </div>
  </section>
</template>
