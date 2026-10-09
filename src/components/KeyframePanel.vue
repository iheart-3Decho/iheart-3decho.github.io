<script setup lang="ts">
import { computed } from "vue";
import FrameThumb from "./FrameThumb.vue";
import type { DemoCase } from "../types";
const props = defineProps<{ item: DemoCase; time: number }>();
const emit = defineEmits<{ phase: [value: "ed" | "es"] }>();
const entries = computed(() =>
  ["ed", "es"].map((value) => {
    const phase = value as "ed" | "es";
    const id =
      props.item.kind === "function"
        ? phase === "ed"
          ? "edv"
          : "esv"
        : phase === "ed"
          ? "lvidd"
          : "lvids";
    return {
      phase,
      metric: props.item.metrics.find((metric) => metric.id === id)!,
      title: phase === "ed" ? "充盈最大時刻" : "收縮最小時刻",
      sub: phase === "ed" ? "心室充滿血液" : "心室完成泵血",
    };
  }),
);
</script>
<template>
  <section
    class="col-span-full grid min-h-0 grid-cols-[145px_minmax(0,1fr)] gap-3 border-t border-[#e2ebee] pt-2 max-[1100px]:grid-cols-[120px_minmax(0,1fr)] max-[650px]:hidden"
    aria-label="關鍵畫面對照"
  >
    <div class="flex items-center">
      <div>
        <span class="text-[9px] tracking-[1px] text-[#718691]"
          >找到時刻，也看見位置</span
        >
        <h2 class="mt-1 text-[17px] leading-tight">充盈與收縮，一眼對照</h2>
      </div>
    </div>
    <div class="grid min-h-0 grid-cols-2 gap-2">
      <button
        v-for="entry in entries"
        :key="entry.phase"
        class="grid min-h-0 min-w-0 grid-cols-[90px_minmax(0,1fr)] grid-rows-[20px_minmax(0,1fr)] gap-1.5 overflow-hidden rounded-lg border border-[#dce7ea] bg-[#f7fafb] p-2 text-left"
        data-keyframe-card
        :class="
          Math.abs(time * item.fps - entry.metric.evidence.frame) <= 1
            ? 'border-[#acd1ca] bg-[#edf7f5]'
            : ''
        "
        :aria-label="entry.title"
        @click="emit('phase', entry.phase)"
      >
        <div
          class="col-span-full flex items-center justify-between text-[9px] text-[#4e7c85]"
        >
          <span class="flex items-center gap-1.5"
            ><i
              class="h-1.5 w-1.5 rounded-full"
              :class="entry.phase === 'ed' ? 'bg-[#419890]' : 'bg-[#6b8fc8]'"
            />{{ entry.title }}</span
          ><b
            >{{ (entry.metric.evidence.frame / item.fps).toFixed(2)
            }}<small>秒</small></b
          >
        </div>
        <FrameThumb
          :item="item"
          :image="item.phaseImages[entry.phase]"
          :geometry="entry.metric.evidence.geometry"
        />
        <div class="flex min-w-0 flex-col justify-center gap-1">
          <span class="text-[9px] text-[#6f8991]"
            >{{ entry.sub
            }}<small class="block text-[8px] text-[#94a5ab]">{{
              item.kind === "function" ? "左心室輪廓" : "心室內徑量測"
            }}</small></span
          ><strong class="text-[21px] font-medium text-[#297f85]"
            >{{ entry.metric.value.toFixed(1)
            }}<small class="ml-1 text-[9px]">{{
              entry.metric.unit
            }}</small></strong
          >
        </div>
      </button>
    </div>
  </section>
</template>
