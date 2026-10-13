<script setup lang="ts">
import { computed } from "vue";
import Icon from "./Icon.vue";
import type { DemoCase, Metric } from "../types";
import { metricMeaning } from "../utils/demo";
const props = defineProps<{ item: DemoCase; selected: string }>();
const values = computed(() =>
  Object.fromEntries(props.item.metrics.map((metric) => [metric.id, metric.value])),
);
defineEmits<{ select: [metric: Metric] }>();
const format = (metric: Metric) => metric.value.toFixed(1);
</script>
<template>
  <aside
    class="flex min-h-0 flex-col border-l border-[#e4ecf0] pl-4 max-[860px]:border-l-0 max-[860px]:border-t max-[860px]:pt-4 max-[650px]:flex-1"
    aria-label="心臟量測結果"
  >
    <div class="flex flex-none items-center justify-between">
      <div>
        <span class="text-[9px] tracking-[1px] text-[#718691]">讓影片成為清晰的答案</span>
        <h2 class="mt-1.5 text-[20px] font-semibold max-[650px]:text-[18px]">
          {{ item.kind === "function" ? "心臟的泵血能力" : "心臟的尺寸與厚度" }}
        </h2>
      </div>
      <span class="grid h-9 w-9 place-items-center rounded-[10px] bg-[#f0f7f5] text-[#408b88]"
        ><Icon :name="item.kind === 'function' ? 'heart' : 'ruler'" :size="22"
      /></span>
    </div>
    <p class="my-2 text-[10px] text-[#8b9aa5]">
      {{ item.kind === "function" ? "一次心跳，泵出多少血液？" : "心室有多寬？心壁有多厚？" }}
    </p>
    <div class="grid min-h-0 flex-1 grid-cols-2 grid-rows-[1.2fr_1fr] gap-2">
      <button
        v-for="metric in item.metrics"
        :key="metric.id"
        class="relative flex min-h-0 w-full flex-col justify-between rounded-[10px] border border-[#e5ecef] bg-[#fafcfd] p-3 text-left text-[#748992] transition hover:-translate-y-0.5 hover:border-[#bed5d5]"
        :class="[
          metric.id === selected
            ? 'border-[#a9d1c8] bg-[linear-gradient(120deg,_#edf8f5,_#f5faf9)] shadow-[0_3px_10px_#3b8e8110]'
            : '',
          metric.id === 'ef' ? 'col-span-full' : '',
        ]"
        :aria-pressed="metric.id === selected"
        @click="$emit('select', metric)"
      >
        <span class="flex items-start justify-between gap-1 text-[11px] font-medium"
          ><span
            >{{ metric.label
            }}<small class="mt-0.5 block text-[8px] tracking-[.6px] text-[#92a6ad]">{{
              metric.code
            }}</small></span
          ><Icon :name="metric.id === selected ? 'scan' : 'chevron'" :size="15"
        /></span>
        <span
          class="my-2 text-[32px] font-medium leading-none tracking-[-1.3px] text-[#2d6071] tabular-nums max-[650px]:text-[29px]"
          :class="metric.id === 'ef' ? 'text-[52px] text-[#187e77]' : ''"
          >{{ format(metric)
          }}<small class="ml-1 text-[11px] font-normal tracking-normal text-[#79949e]">{{
            metric.unit
          }}</small></span
        >
        <span class="text-[10px] leading-[1.5] text-[#758c95]"
          >（{{ metricMeaning(metric) }}）</span
        >
        <span v-if="metric.id === 'ef'" class="mt-2 block h-1 overflow-hidden rounded bg-[#dceee8]"
          ><i
            class="block h-full rounded bg-[linear-gradient(to_right,_#328595,_#3ea995)]"
            :style="{ width: `${Math.min(100, Math.max(0, metric.value))}%` }"
        /></span>
      </button>
    </div>
    <div
      v-if="item.kind === 'function'"
      class="mt-2 rounded-lg border border-[#deeaed] bg-[#f4f8f9] p-2.5"
    >
      <div class="flex items-center justify-between text-[9px] text-[#557b85]">
        <span>這次收縮，泵出多少血液？</span
        ><strong class="text-[20px] text-[#297f85]"
          >{{ (values.edv - values.esv).toFixed(1) }} <small>mL</small></strong
        >
      </div>
      <div class="mt-1.5 flex h-4 overflow-hidden rounded bg-[#deeaeb] text-[7px] text-[#6d8c95]">
        <span
          class="flex items-center justify-center bg-[#49a69a] text-white"
          :style="{ width: `${values.ef}%` }"
          >泵出的血量</span
        ><span class="flex flex-1 items-center justify-center">留在心室的血量</span>
      </div>
    </div>
    <div v-else class="mt-2 rounded-lg border border-[#deeaed] bg-[#f4f8f9] p-2.5">
      <div class="flex items-center justify-between text-[9px] text-[#557b85]">
        <span>心室內徑，隨收縮變化</span><Icon name="ruler" :size="15" />
      </div>
      <div
        v-for="row in [
          { label: '充盈', value: values.lvidd, tone: 'bg-[#49a69a]' },
          { label: '收縮', value: values.lvids, tone: 'bg-[#718fc9]' },
        ]"
        :key="row.label"
        class="flex items-center gap-1.5 text-[8px] text-[#7e939c]"
      >
        <span class="w-7">{{ row.label }}</span
        ><i
          class="h-1.5 rounded"
          :class="row.tone"
          :style="{
            width: `${(row.value / values.lvidd) * 70}%`,
          }"
        ></i
        ><b>{{ row.value.toFixed(1) }} mm</b>
      </div>
    </div>
  </aside>
</template>
