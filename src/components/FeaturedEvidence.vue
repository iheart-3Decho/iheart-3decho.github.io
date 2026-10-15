<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import Icon from "./Icon.vue";
import { assetUrl, formatMetric, formatPosition, metricMeaning, metricRoute } from "../utils/demo";
import type { MetricDemo } from "../utils/demo";

const props = defineProps<{ demo: MetricDemo; automatic: boolean }>();
const video = ref<HTMLVideoElement>();
const located = ref(false),
  currentTime = ref(0),
  failed = ref(false);
const points = computed(() =>
  props.demo.metric.evidence.geometry?.points.map((point) => point.join(",")).join(" "),
);
const progress = computed(() =>
  Math.min(100, (currentTime.value / props.demo.item.duration) * 100),
);
let timer: ReturnType<typeof setTimeout> | undefined;

function locate() {
  if (timer) clearTimeout(timer);
  timer = undefined;
  if (!video.value) return;
  video.value.pause();
  located.value = false;
  video.value.currentTime = props.demo.metric.evidence.frame / props.demo.item.fps;
}
function update() {
  if (!video.value) return;
  currentTime.value = video.value.currentTime;
  located.value =
    video.value.paused &&
    Math.abs(currentTime.value * props.demo.item.fps - props.demo.metric.evidence.frame) <= 1;
}
async function replay() {
  if (!video.value) return;
  if (timer) clearTimeout(timer);
  located.value = false;
  video.value.currentTime = 0;
  try {
    await video.value.play();
  } catch {
    locate();
  }
  if (props.automatic) timer = setTimeout(locate, 3400);
}
function loaded() {
  failed.value = false;
  if (props.automatic) void replay();
  else locate();
}
watch(
  () => props.automatic,
  (enabled) => {
    if (enabled) void replay();
    else locate();
  },
);
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer);
});
</script>

<template>
  <div
    class="relative grid h-full min-h-0 grid-rows-[minmax(0,1fr)_68px] overflow-hidden rounded-[22px] border border-[#dce7eb] bg-white shadow-[0_16px_45px_-20px_#315c6e28]"
    :data-featured-metric="demo.metric.id"
  >
    <div class="relative min-h-0 overflow-hidden bg-[#0c141d]">
      <video
        ref="video"
        class="block h-full w-full object-contain"
        :src="assetUrl(demo.item.video)"
        :poster="assetUrl(demo.item.poster)"
        muted
        playsinline
        preload="auto"
        :aria-label="`${demo.item.caseTitle}影片`"
        @loadedmetadata="loaded"
        @timeupdate="update"
        @seeked="update"
        @pause="update"
        @play="located = false"
        @ended="locate"
        @error="failed = true"
      />
      <svg
        v-if="located && demo.metric.evidence.geometry"
        class="pointer-events-none absolute inset-0 h-full w-full animate-overlay"
        :viewBox="`0 0 ${demo.item.width} ${demo.item.height}`"
        aria-label="關鍵畫面的模型量測位置"
      >
        <polygon
          v-if="demo.metric.evidence.geometry.kind === 'contour'"
          :points="points"
          fill="#51efcc20"
          stroke="#51efcc"
          stroke-width="2"
          vector-effect="non-scaling-stroke"
        />
        <template v-else>
          <polyline
            :points="points"
            fill="none"
            stroke="#51efcc"
            stroke-width="3"
            vector-effect="non-scaling-stroke"
          />
          <circle
            v-for="(point, index) in demo.metric.evidence.geometry.points"
            :key="index"
            :cx="point[0]"
            :cy="point[1]"
            :r="demo.item.width * 0.007"
            fill="white"
            stroke="#51efcc"
            stroke-width="2"
            vector-effect="non-scaling-stroke"
          />
        </template>
      </svg>
      <div
        class="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,_#06151c88,_transparent_32%,_transparent_67%,_#06151caa),linear-gradient(0deg,_#06151cc4,_transparent_25%)]"
      />
      <div
        class="absolute left-5 right-5 top-4 flex items-center justify-between text-[11px] text-[#c5dddf]"
      >
        <span
          class="flex items-center gap-2 rounded-full border border-white/15 bg-[#081a22b3] px-3 py-1.5 backdrop-blur"
          ><i class="size-1.5 rounded-full bg-[#53e1c3] animate-signal" />{{
            located ? "已找到量測畫面" : "從整段影片尋找關鍵時刻"
          }}</span
        ><span class="rounded-full bg-[#081a22b3] px-3 py-1.5">{{ demo.item.view }}</span>
      </div>
      <div
        class="absolute right-5 top-[24%] flex w-[190px] flex-col gap-1.5 rounded-2xl border border-[#dce7eb] bg-white/95 p-4 shadow-[0_12px_30px_#0002] backdrop-blur-xl"
      >
        <small class="text-[10px] tracking-wider text-[#627d88]"
          >{{ demo.metric.code }} · {{ demo.metric.label }}</small
        >
        <strong class="text-[32px] font-medium tracking-tight text-brand">{{
          formatMetric(demo.metric)
        }}</strong>
        <p class="text-[11px] leading-[1.7] text-[#5a7480]">（{{ metricMeaning(demo.metric) }}）</p>
        <a
          class="mt-2 flex items-center gap-1.5 border-t border-line pt-2 text-[10px] text-brand hover:text-[#195b63]"
          :href="metricRoute(demo.item, demo.metric)"
          >探索這項量測<Icon name="arrow" :size="13"
        /></a>
      </div>
      <div
        class="absolute bottom-5 left-5 flex items-center gap-3 rounded-xl border border-[#dce7eb] bg-white/95 px-4 py-3 shadow-sm backdrop-blur"
      >
        <Icon :name="located ? 'scan' : 'video'" :size="25" class="text-brand" />
        <div>
          <span class="block text-[10px] text-[#627d88]">{{
            located ? "WHEN · 量測時刻" : "完整影片 · 自動演示"
          }}</span
          ><strong class="text-[20px] font-medium text-ink tabular-nums"
            >{{
              formatPosition(
                demo.item,
                located
                  ? demo.metric.evidence.frame
                  : Math.min(demo.item.frameCount - 1, Math.floor(currentTime * demo.item.fps)),
              )
            }} </strong
          ><span v-if="located" class="ml-3 text-[11px] text-brand"
            >{{ demo.metric.phase === "ed" ? "心室充盈" : "心室收縮"
            }}{{ demo.metric.id === "ef" ? " · 結合收縮畫面計算泵血比例" : "" }}</span
          >
        </div>
      </div>
      <div
        v-if="failed"
        role="alert"
        class="absolute inset-0 grid place-items-center bg-[#0a1c24e6] text-[#bed9dc]"
      >
        示範影片未能載入，請重新整理。
      </div>
    </div>
    <div class="flex items-center gap-4 border-t border-line bg-[#f7fafb] px-5">
      <button
        class="flex items-center gap-1.5 rounded-lg border border-[#c5dfdb] bg-[#eaf4f2] px-3 py-2 text-[10px] text-[#226f6f] hover:bg-[#d9ede8]"
        @click="located ? replay() : locate()"
      >
        <Icon :name="located ? 'play' : 'scan'" :size="14" />{{
          located ? "重播影片" : "查看關鍵畫面"
        }}
      </button>
      <div class="min-w-0 flex-1">
        <div class="mb-2 flex justify-between text-[9px] text-[#627d88]">
          <span>影片開始</span
          ><span class="text-brand"
            >{{ demo.metric.code }} · 關鍵畫面
            {{ formatPosition(demo.item, demo.metric.evidence.frame) }}</span
          ><span>{{ formatPosition(demo.item, demo.item.frameCount - 1) }}</span>
        </div>
        <div class="relative h-1 rounded-full bg-[#d8e6e8]">
          <span
            class="absolute left-0 top-0 h-1 rounded-full bg-[#49a69a] transition-[width] duration-150"
            :style="{ width: `${progress}%` }"
          /><button
            class="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-sm border border-white bg-brand shadow-[0_0_10px_#147e7d35]"
            :style="{
              left: `${(demo.metric.evidence.frame / (demo.item.frameCount - 1)) * 100}%`,
            }"
            :aria-label="`定位${demo.metric.code}關鍵畫面`"
            @click="locate"
          />
        </div>
      </div>
    </div>
  </div>
</template>
