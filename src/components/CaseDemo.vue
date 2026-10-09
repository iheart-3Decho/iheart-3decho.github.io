<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import VideoStage from "./VideoStage.vue";
import EvidenceTimeline from "./EvidenceTimeline.vue";
import KeyframePanel from "./KeyframePanel.vue";
import MetricPanel from "./MetricPanel.vue";
import type { DemoCase, Metric } from "../types";

const props = defineProps<{
  item: DemoCase;
  presentation: boolean;
  cycleStep: number;
  initialMetric?: string;
}>();
const emit = defineEmits<{ manual: []; time: [value: number] }>();
const stage = ref<InstanceType<typeof VideoStage>>();
const initialIndex = Math.max(
  0,
  props.item.metrics.findIndex((metric) => metric.id === props.initialMetric),
);
const selectedId = ref(props.item.metrics[initialIndex]!.id);
const time = ref(0),
  playing = ref(false),
  overlay = ref(true),
  focus = ref("video");
const metric = computed(
  () => props.item.metrics.find((item) => item.id === selectedId.value)!,
);
function select(value: Metric, manual = true) {
  if (manual) emit("manual");
  selectedId.value = value.id;
  overlay.value = true;
  stage.value?.seek(value.evidence.frame);
}
function phase(value: "ed" | "es", manual = true) {
  const id =
    props.item.kind === "function"
      ? value === "ed"
        ? "edv"
        : "esv"
      : value === "ed"
        ? "lvidd"
        : "lvids";
  const found = props.item.metrics.find((item) => item.id === id);
  if (found) select(found, manual);
}
function seek(frame: number) {
  emit("manual");
  stage.value?.seek(frame);
}
function setTime(value: number) {
  time.value = value;
  emit("time", value);
}
function step() {
  if (!props.presentation) return;
  if (props.cycleStep % 6 === 0)
    select(
      props.item.metrics[
        (initialIndex + Math.floor(props.cycleStep / 6)) %
          props.item.metrics.length
      ]!,
      false,
    );
  else if (props.cycleStep % 6 === 4) void stage.value?.play();
}
watch(() => props.cycleStep, step);
watch(
  () => props.presentation,
  async (enabled) => {
    await nextTick();
    if (enabled) step();
  },
);
onMounted(step);
defineExpose({ pause: () => stage.value?.pause() });
</script>

<template>
  <section
    class="flex h-full min-h-0 flex-col overflow-hidden rounded-[16px] border border-[#dce7eb] bg-white/90 shadow-[0_16px_45px_-20px_#315c6e28]"
    :aria-label="
      item.kind === 'function' ? '泵血功能與心室分割示範' : '心臟尺寸與量測示範'
    "
    :data-case="item.id"
  >
    <div
      class="flex min-h-[48px] flex-none items-center justify-between gap-3 border-b border-[#e4ecf0] px-4 py-2.5 max-[650px]:p-2.5"
    >
      <div class="flex min-w-0 items-center gap-2">
        <span class="text-[10px] tabular-nums text-[#6b97a1]">{{
          item.kind === "function" ? "01" : "02"
        }}</span>
        <h2
          class="truncate text-[15px] font-semibold tracking-[.2px] max-[650px]:text-[12px]"
        >
          {{
            item.kind === "function"
              ? "泵血功能 × 心室分割"
              : "心臟尺寸 × 量測定位"
          }}
        </h2>
        <span
          class="hidden whitespace-nowrap rounded border border-[#e0e9ec] bg-[#f1f5f7] px-1.5 py-1 text-[8px] text-[#708792] min-[651px]:inline"
          >{{ item.view }}</span
        >
      </div>
      <div
        class="flex gap-0.5 rounded-lg border border-[#e7edf0] bg-[#f0f4f6] p-0.5"
        role="group"
        aria-label="影像顯示模式"
      >
        <button
          class="rounded-md px-2 py-1.5 text-[10px] text-[#81909b] hover:bg-white"
          :class="!overlay ? 'bg-white text-[#256d75] shadow-sm' : ''"
          :aria-pressed="!overlay"
          @click="overlay = false"
        >
          原始影像</button
        ><button
          class="flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] text-[#81909b] hover:bg-white"
          :class="overlay ? 'bg-white text-[#256d75] shadow-sm' : ''"
          :aria-pressed="overlay"
          @click="overlay = true"
        >
          AI 量測
        </button>
      </div>
    </div>
    <div
      class="flex flex-none gap-1.5 px-3 pt-2 min-[1101px]:hidden"
      role="group"
      aria-label="選擇顯示內容"
    >
      <button
        v-for="tab in [
          ['video', '影片'],
          ['keyframes', '關鍵畫面'],
          ['metrics', '量測結果'],
        ]"
        :key="tab[0]"
        class="flex-1 rounded-md bg-[#f2f6f7] px-2 py-1.5 text-[10px] text-[#809aa3]"
        :class="focus === tab[0] ? 'bg-[#e9f4f1] text-[#267b75]' : ''"
        :aria-pressed="focus === tab[0]"
        @click="focus = tab[0]"
      >
        {{ tab[1] }}
      </button>
    </div>
    <div
      class="grid min-h-0 flex-1 grid-cols-[minmax(0,1.45fr)_minmax(245px,1fr)] grid-rows-[minmax(0,1fr)_105px] gap-3 p-3 max-[1100px]:grid-cols-[minmax(0,1.45fr)_minmax(230px,1fr)] max-[860px]:grid-cols-1 max-[860px]:grid-rows-[minmax(0,1fr)_120px] max-[650px]:flex max-[650px]:flex-1 max-[650px]:flex-col max-[650px]:gap-0 max-[650px]:p-2.5"
    >
      <div
        class="flex min-h-0 min-w-0 flex-col"
        :class="focus !== 'video' ? 'max-[1100px]:hidden' : ''"
      >
        <VideoStage
          ref="stage"
          :item="item"
          :metric="metric"
          :overlay="overlay"
          @time="setTime"
          @playing="playing = $event"
          @manual="emit('manual')"
        /><EvidenceTimeline
          :item="item"
          :time="time"
          :selected="metric.phase"
          :playing="playing"
          @seek="seek"
          @phase="phase"
        />
      </div>
      <MetricPanel
        :item="item"
        :selected="selectedId"
        :class="focus !== 'metrics' ? 'max-[1100px]:hidden' : ''"
        @select="select"
      />
      <KeyframePanel :item="item" :time="time" @phase="phase" />
    </div>
  </section>
</template>
