<script setup lang="ts">
import FrameThumb from "./FrameThumb.vue";
import Icon from "./Icon.vue";
import {
  assetUrl,
  formatMetric,
  metricMeaning,
  metricRoute,
} from "../utils/demo";
import type { MetricDemo } from "../utils/demo";
defineProps<{ demo: MetricDemo; index: number; active: boolean }>();
</script>

<template>
  <a
    :href="metricRoute(demo.item, demo.metric)"
    :data-home-case="demo.item.id"
    :data-home-metric="demo.metric.id"
    :aria-label="`${demo.metric.code}：${demo.question}，查看影片中的量測畫面`"
    class="group flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-white/95 shadow-[0_8px_25px_-14px_#315c6e25] transition duration-300 hover:-translate-y-1 hover:border-[#92c6bd] hover:bg-[#f2faf7] focus-visible:outline-offset-[-4px]"
    :class="
      active ? 'border-[#68afa3] ring-1 ring-[#68afa330]' : 'border-[#dce7ea]'
    "
  >
    <div class="relative min-h-0 flex-1 overflow-hidden bg-[#061017]">
      <FrameThumb
        :item="demo.item"
        :image="demo.item.phaseImages[demo.metric.phase]"
        :geometry="demo.metric.evidence.geometry"
        class="transition-transform duration-500 group-hover:scale-[1.04]"
      />
      <div
        class="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,_#071820e6,_transparent_46%)]"
      />
      <div
        class="absolute left-3 right-3 top-2.5 flex items-center justify-between"
      >
        <span
          class="rounded-md border border-white/15 bg-[#071820b3] px-2 py-1 text-[12px] font-semibold tracking-wider text-[#97ead9] backdrop-blur"
          >{{ demo.metric.code }}</span
        >
        <span
          class="grid size-6 place-items-center rounded-full border border-white/20 bg-[#071820a6] text-[#b7d7d7] transition group-hover:translate-x-0.5 group-hover:bg-[#208982]"
          ><Icon name="arrow" :size="14"
        /></span>
      </div>
      <div
        class="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[10px] text-[#cfefeb]"
      >
        <span class="flex items-center gap-1.5"
          ><Icon name="scan" :size="13" />已定位量測畫面</span
        >
        <b class="font-medium tabular-nums"
          >{{ (demo.metric.evidence.frame / demo.item.fps).toFixed(2) }} 秒</b
        >
      </div>
    </div>

    <div class="flex flex-none flex-col gap-2 px-3 py-2.5">
      <h3 class="text-[12px] font-medium text-ink">
        {{ demo.question }}
      </h3>
      <div class="flex items-baseline justify-between gap-1">
        <strong
          class="text-[23px] font-medium tracking-tight text-brand tabular-nums"
          >{{ formatMetric(demo.metric) }}</strong
        >
        <small class="text-[8px] text-[#627d88]"
          >示範病例 {{ String(index + 1).padStart(2, "0") }}</small
        >
      </div>
      <p class="min-h-[28px] text-[10px] leading-[1.45] text-[#5a7480]">
        （{{ metricMeaning(demo.metric) }}）
      </p>

      <div
        class="relative h-[28px] overflow-hidden rounded-md border border-[#d4e5e7] bg-[#0c141d]"
        aria-hidden="true"
      >
        <div
          class="flex h-full w-max gap-0.5 animate-film motion-reduce:animate-none"
        >
          <img
            v-for="(frame, i) in [
              ...demo.item.framePreviews,
              ...demo.item.framePreviews,
            ]"
            :key="i"
            class="h-full w-[36px] object-cover opacity-75"
            :src="assetUrl(frame.image)"
            alt=""
            loading="lazy"
          />
        </div>
      </div>
      <div class="relative h-0.5 rounded bg-[#d8e6e8]" aria-hidden="true">
        <span
          class="absolute -top-0.5 size-1.5 rotate-45 rounded-sm bg-brand shadow-[0_0_8px_#147e7d35]"
          :style="{
            left: `${(demo.metric.evidence.frame / (demo.item.frameCount - 1)) * 97}%`,
          }"
        />
      </div>
      <div class="flex items-center justify-between text-[9px] text-[#627d88]">
        <span>整段影片 → 關鍵畫面</span
        ><span class="flex items-center gap-1 text-brand"
          >查看時刻與位置<Icon name="chevron" :size="11"
        /></span>
      </div>
    </div>
  </a>
</template>
