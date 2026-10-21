<script setup lang="ts">
import { computed } from "vue";
import Icon from "../Icon.vue";
const props = defineProps<{ stage: number; metric: string; kind: "function" | "dimension" }>();
const steps = [
  { label: "檢視影片", icon: "video" },
  { label: "定位與量測", icon: "scan" },
  { label: "整理報告", icon: "report" },
];
const explanation = computed(
  () =>
    [
      "先看完整影片，了解心臟在跳動過程中的變化。",
      `定位 ${props.metric} 的量測畫面，對照${props.kind === "function" ? "心室輪廓" : "量測端點"}與右側數值。`,
      "將量測及證據圖整理成報告，影像仍可在旁邊回看。",
    ][props.stage],
);
</script>
<template>
  <section
    class="shrink-0 rounded-xl border border-line bg-white px-4 py-2"
    aria-label="分析流程"
    data-clinical-workflow
    :data-stage="stage"
  >
    <ol class="m-0 flex list-none items-center gap-3 p-0" aria-label="閱片、量測與報告">
      <template v-for="(step, index) in steps" :key="step.label">
        <li
          class="flex shrink-0 items-center gap-2 rounded-md px-2 py-1 text-[11px] motion-safe:transition-[background-color,color] motion-safe:duration-500"
          :class="stage >= index ? 'bg-brand/5 text-brand' : 'text-muted'"
          :aria-current="stage === index ? 'step' : undefined"
        >
          <span
            class="grid size-5 place-items-center rounded-full text-[9px] motion-safe:transition-[background-color,color] motion-safe:duration-500"
            :class="stage >= index ? 'bg-brand text-white' : 'bg-canvas text-muted'"
            ><Icon v-if="stage > index" name="check" :size="12" /><span v-else>{{
              index + 1
            }}</span></span
          >
          <Icon :name="step.icon" :size="14" />{{ step.label }}
        </li>
        <li
          v-if="index < steps.length - 1"
          class="relative h-px min-w-4 flex-1 bg-line"
          aria-hidden="true"
        >
          <span
            class="absolute inset-y-0 left-0 bg-brand/65 motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out"
            :style="{ width: stage > index ? '100%' : '0%' }"
          />
        </li>
      </template>
    </ol>
    <div
      class="mt-1 flex h-5 items-center gap-2 border-t border-line/70 pt-1 text-[10px] text-muted"
      aria-live="polite"
      aria-atomic="true"
    >
      <Icon name="arrow" :size="12" class="text-brand" />
      <Transition
        mode="out-in"
        enter-active-class="motion-safe:transition-[opacity,translate] motion-safe:duration-300 motion-safe:ease-out"
        enter-from-class="motion-safe:translate-y-1 motion-safe:opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="motion-safe:transition-opacity motion-safe:duration-100"
        leave-to-class="motion-safe:opacity-0"
        ><span :key="explanation" data-clinical-step-explanation>{{
          explanation
        }}</span></Transition
      >
    </div>
  </section>
</template>
