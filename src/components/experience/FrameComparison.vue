<script setup lang="ts">
import type { DemoCase, Point } from "../../types";
import type { FrameResult, FrameSelection } from "../../experience/types";
import { experienceAsset } from "../../experience/types";
import EvidenceImage from "./EvidenceImage.vue";
import { formatPosition } from "../../utils/demo";
defineProps<{
  item: DemoCase;
  selected: FrameSelection;
  ai: FrameResult;
  label: string;
  points?: Point[];
}>();
</script>
<template>
  <section
    class="flex min-h-0 flex-col rounded-2xl border border-line bg-white p-4"
    data-comparison
  >
    <div class="mb-3 flex justify-between text-[16px]">
      <b>{{ label }}</b
      ><span class="text-[12px] text-muted">同一段影片 · 不同選擇，各有畫面依據</span>
    </div>
    <div class="grid min-h-0 flex-1 grid-cols-2 gap-4">
      <figure class="flex min-h-0 flex-col">
        <div class="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-[#0c141d]">
          <img :src="selected.image" alt="你選擇的畫面" class="h-full w-full object-contain" /><svg
            v-if="points?.length === 2"
            :viewBox="`0 0 ${item.width} ${item.height}`"
            class="absolute inset-0 h-full w-full"
            aria-label="你的測量線"
          >
            <line
              :x1="points[0]![0]"
              :y1="points[0]![1]"
              :x2="points[1]![0]"
              :y2="points[1]![1]"
              stroke="#ffce83"
              stroke-width="4"
              vector-effect="non-scaling-stroke"
            />
            <circle
              v-for="(p, i) in points"
              :key="i"
              :cx="p[0]"
              :cy="p[1]"
              :r="item.width * 0.009"
              fill="#ffce83"
            />
          </svg>
        </div>
        <figcaption class="flex justify-between pt-2 text-[14px]">
          <span class="text-[#946a25]">你的選擇</span
          ><span class="tabular-nums text-muted">{{ formatPosition(item, selected.frame) }}</span>
        </figcaption>
      </figure>
      <figure class="flex min-h-0 flex-col">
        <div class="min-h-0 flex-1 overflow-hidden rounded-xl bg-[#0c141d]">
          <EvidenceImage
            :src="experienceAsset(ai.image)"
            alt="AI 所選畫面的實際逐幀量測"
            class="h-full w-full object-contain"
          />
        </div>
        <figcaption class="flex justify-between pt-2 text-[14px]">
          <span class="text-brand">AI 選擇 · {{ points ? "端點與量測線" : "心室輪廓" }}</span
          ><span class="tabular-nums text-muted">{{ formatPosition(item, ai.frame) }}</span>
        </figcaption>
      </figure>
    </div>
    <svg
      viewBox="0 0 800 40"
      class="mt-3 h-10 w-full overflow-visible"
      aria-label="你與 AI 在同一影片時間軸上的位置"
    >
      <line x1="12" y1="20" x2="788" y2="20" stroke="#dce8ec" stroke-width="4" />
      <circle
        :cx="12 + (selected.frame / (item.frameCount - 1)) * 776"
        cy="13"
        r="6"
        fill="#c49647"
      />
      <circle :cx="12 + (ai.frame / (item.frameCount - 1)) * 776" cy="27" r="6" fill="#147e7d" />
      <text x="12" y="39" font-size="10" fill="#718390">影片開始</text>
      <text x="788" y="39" text-anchor="end" font-size="10" fill="#718390">
        {{ formatPosition(item, item.frameCount - 1) }}
      </text>
    </svg>
  </section>
</template>
