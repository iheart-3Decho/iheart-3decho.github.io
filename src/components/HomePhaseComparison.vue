<script setup lang="ts">
import { computed } from "vue";
import FrameThumb from "./FrameThumb.vue";
import Icon from "./Icon.vue";
import { formatMetric, formatPosition, metricRoute } from "../utils/demo";
import type { DemoCase } from "../types";

const props = defineProps<{ item: DemoCase }>();
const phases = computed(() =>
  (["ed", "es"] as const).map((phase) => ({
    phase,
    title: phase === "ed" ? "充盈最大時刻" : "收縮最小時刻",
    metric: props.item.metrics.find(
      (metric) =>
        metric.id ===
        (props.item.kind === "function"
          ? phase === "ed"
            ? "edv"
            : "esv"
          : phase === "ed"
            ? "lvidd"
            : "lvids"),
    )!,
  })),
);
</script>

<template>
  <div class="mt-4" aria-label="同一影片的充盈與收縮量測畫面">
    <div class="mb-2 flex items-center justify-between text-[10px] text-[#627d88]">
      <span class="flex items-center gap-1.5"
        ><Icon name="clock" :size="13" />從同一段影片，找到兩個關鍵時刻</span
      >
      <span>點選畫面查看量測</span>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <a
        v-for="entry in phases"
        :key="entry.phase"
        :href="metricRoute(item, entry.metric)"
        class="grid min-w-0 grid-cols-[82px_minmax(0,1fr)_20px] items-center gap-3 rounded-xl border border-[#dce7ea] bg-white/90 p-2 shadow-sm transition hover:border-[#acd1ca] hover:bg-[#edf7f5]"
      >
        <FrameThumb
          :item="item"
          :image="item.phaseImages[entry.phase]"
          :geometry="entry.metric.evidence.geometry"
          class="h-[66px]"
        />
        <div class="min-w-0">
          <div class="flex items-center gap-2 text-[11px] text-[#315963]">
            <i
              class="size-1.5 rounded-full"
              :class="entry.phase === 'ed' ? 'bg-brand' : 'bg-blue'"
            />{{ entry.title }}
          </div>
          <div class="mt-1 text-[17px] font-medium text-brand">
            {{ formatPosition(item, entry.metric.evidence.frame) }}
          </div>
          <div class="mt-1 text-[10px] text-[#627d88]">
            {{ entry.metric.label }} · {{ formatMetric(entry.metric) }}
          </div>
        </div>
        <Icon name="arrow" :size="17" class="text-brand" />
      </a>
    </div>
  </div>
</template>
