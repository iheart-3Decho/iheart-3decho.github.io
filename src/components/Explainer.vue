<script setup lang="ts">
import { computed } from "vue";
import FrameThumb from "./FrameThumb.vue";
import type { DemoCase } from "../types";
const props = defineProps<{ item: DemoCase; time: number }>();
const base = import.meta.env.BASE_URL;
const highlight = computed(
  () =>
    props.item.metrics.find((metric) => metric.id === "ef") ??
    props.item.metrics.find((metric) => metric.id === "lvidd")!,
);
const geometry = computed(
  () =>
    props.item.phases.ed.geometry ??
    props.item.metrics.find((metric) => metric.id === "lvidd")?.evidence.geometry ??
    props.item.metrics[0]?.evidence.geometry,
);
</script>
<template>
  <section
    class="hidden min-h-0 grid-cols-[150px_repeat(4,minmax(0,1fr))] items-center gap-4 rounded-xl border border-[#e0e9ed] bg-[#eaf1f480] px-3 py-2 min-[1101px]:grid"
    aria-label="從影片到量測的可視化流程"
  >
    <div>
      <span class="text-[9px] tracking-[1px] text-[#718691]">一個模型，串起整段流程</span>
      <h2 class="mt-1 text-[19px] leading-tight">從影片到指標</h2>
      <p class="mt-1 text-[9px] text-[#8799a4]">每個數值，都連到影像。</p>
    </div>
    <div
      v-for="(step, index) in [
        { title: '一整段動態影像', sub: '影片理解' },
        { title: '找出關鍵畫面', sub: '時間定位' },
        { title: '圈出心室與量測線', sub: '空間定位' },
        {
          title: item.kind === 'function' ? '功能與容積' : '心室尺寸與厚度',
          sub: '統一量測',
        },
      ]"
      :key="step.sub"
      class="relative flex min-w-0 items-center gap-2"
    >
      <div
        class="h-[58px] w-[78px] flex-none overflow-hidden rounded-lg border border-[#d8e6e8] bg-[#14222c] p-1"
      >
        <template v-if="index === 0"
          ><div class="flex h-full w-max gap-1 animate-film motion-reduce:animate-none">
            <img
              v-for="(frame, i) in [...item.framePreviews, ...item.framePreviews]"
              :key="i"
              class="h-full w-[70px] object-contain"
              :src="`${base}demo/${frame.image}`"
              alt="心超影片影格"
            /></div></template
        ><svg v-else-if="index === 1" class="h-full w-full" viewBox="0 0 100 60">
          <polyline
            v-if="item.volumeSeries"
            :points="
              item.volumeSeries
                .map(
                  (p) => `${(p.frame / (item.frameCount - 1)) * 100},${55 - (p.value / 200) * 40}`,
                )
                .join(' ')
            "
            fill="none"
            stroke="#459faa"
          />
          <path
            :d="`M${(item.phases.ed.frame / (item.frameCount - 1)) * 100} 4v52`"
            stroke="#1c9288"
            stroke-dasharray="2 2"
          />
          <path
            :d="`M${(item.phases.es.frame / (item.frameCount - 1)) * 100} 4v52`"
            stroke="#728fcc"
            stroke-dasharray="2 2"
          />
          <circle
            :cx="Math.min(1, time / item.duration) * 100"
            cy="45"
            r="2.5"
            fill="#1e7885"
          /></svg
        ><FrameThumb
          v-else-if="index === 2"
          :item="item"
          :image="item.phaseImages.ed"
          :geometry="geometry"
        />
        <div v-else class="grid h-full place-items-center rounded bg-[#e7f3f0]">
          <strong class="text-[16px] text-[#278f87]"
            >{{ highlight.value.toFixed(1)
            }}<small class="text-[8px]">{{ item.kind === "function" ? "%" : " mm" }}</small></strong
          >
        </div>
      </div>
      <div class="min-w-0">
        <small class="text-[8px] text-[#7899a0]">0{{ index + 1 }} · {{ step.sub }}</small>
        <h3 class="mt-0.5 truncate text-[11px] font-semibold text-[#315963]">
          {{ step.title }}
        </h3>
      </div>
      <span v-if="index < 3" class="absolute -right-2 text-[18px] text-[#aec6cc]">→</span>
    </div>
  </section>
</template>
