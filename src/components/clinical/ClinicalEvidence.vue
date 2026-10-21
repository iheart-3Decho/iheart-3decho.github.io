<script setup lang="ts">
import { computed } from "vue";
import type { DemoCase } from "../../types";
import type { ExperienceCase } from "../../experience/types";
import { experienceAsset } from "../../experience/types";
import { assetUrl, formatPosition } from "../../utils/demo";
import EvidenceImage from "../experience/EvidenceImage.vue";
import Icon from "../Icon.vue";
const props = defineProps<{
  item: DemoCase;
  experience: ExperienceCase;
  analysed: boolean;
  selected: string;
  frame: number;
}>();
const emit = defineEmits<{ metric: [id: string]; seek: [frame: number] }>();
const cards = computed(() =>
  props.item.kind === "function"
    ? [
        { id: "edv", key: "ed", label: "舒張末期", code: "ED" },
        { id: "esv", key: "es", label: "收縮末期", code: "ES" },
      ]
    : props.item.metrics.map((m) => ({ id: m.id, key: m.id, label: m.label, code: m.code })),
);
const series = computed(() => props.item.volumeSeries ?? []);
const range = computed(() => {
  const values = series.value.map((p) => p.value);
  const min = Math.max(0, Math.floor(Math.min(...values) / 20) * 20);
  const max = Math.ceil(Math.max(...values) / 20) * 20;
  return { min, max: Math.max(max, min + 20) };
});
const x = (frame: number) => 38 + (frame / (props.item.frameCount - 1)) * 430;
const y = (value: number) =>
  102 - ((value - range.value.min) / (range.value.max - range.value.min)) * 78;
const curve = computed(() => series.value.map((p) => `${x(p.frame)},${y(p.value)}`).join(" "));
</script>
<template>
  <section
    class="flex h-[214px] shrink-0 flex-col overflow-hidden rounded-xl border border-line bg-white"
    data-clinical-evidence
  >
    <header
      class="flex h-10 shrink-0 items-center justify-between border-b border-line px-4 text-[12px]"
    >
      <span class="flex items-center gap-2 font-semibold"
        ><Icon name="layers" :size="16" />{{ analysed ? "關鍵幀與量測依據" : "影片序列" }}</span
      ><span class="text-[11px] text-muted">{{
        analysed ? "點選畫面，回到對應量測時刻" : "AI 分析後顯示關鍵幀與量測位置"
      }}</span>
    </header>
    <div
      v-if="analysed"
      class="grid min-h-0 flex-1 gap-4 p-3 motion-safe:animate-evidence-in"
      :class="item.kind === 'function' ? 'grid-cols-[1fr_1.1fr]' : 'grid-cols-1'"
    >
      <div
        class="grid min-h-0 gap-3"
        :class="item.kind === 'function' ? 'grid-cols-2' : 'grid-cols-4'"
      >
        <button
          v-for="card in cards"
          :key="card.id"
          class="flex min-h-0 flex-col overflow-hidden rounded-lg border text-left"
          :class="
            selected === card.id || (selected === 'ef' && card.id === 'edv')
              ? 'border-brand ring-1 ring-brand/20'
              : 'border-line hover:border-brand/50'
          "
          :data-evidence-key="card.key"
          @click="emit('metric', card.id)"
        >
          <div class="min-h-0 flex-1 bg-[#0b1119]">
            <EvidenceImage
              :src="experienceAsset(experience.evidence[card.key]!.image)"
              :alt="`${card.code} 的 AI 量測畫面`"
            />
          </div>
          <div class="flex h-9 shrink-0 items-center justify-between gap-1 px-2 text-[10px]">
            <span class="truncate"
              ><b>{{ card.code }}</b
              ><span class="ml-1 text-muted">{{
                item.kind === "function" ? card.label : ""
              }}</span></span
            ><span class="shrink-0 font-mono text-brand">{{
              formatPosition(item, experience.evidence[card.key]!.frame)
            }}</span>
          </div>
        </button>
      </div>
      <div
        v-if="item.kind === 'function' && series.length"
        class="flex min-h-0 flex-col rounded-lg bg-canvas px-3 py-2"
        data-volume-curve
      >
        <div class="flex items-center justify-between text-[10px]">
          <b>左心室容積變化</b><span class="text-muted">模型容積估計 · mL</span>
        </div>
        <svg
          viewBox="0 0 500 128"
          class="min-h-0 w-full flex-1"
          role="img"
          aria-label="模型輸出點的左心室容積變化"
        >
          <g v-for="value in [range.min, (range.min + range.max) / 2, range.max]" :key="value">
            <line x1="38" x2="468" :y1="y(value)" :y2="y(value)" stroke="#dce6eb" />
            <text x="30" :y="y(value) + 3" text-anchor="end" fill="#718390" font-size="9">
              {{ value }}
            </text>
          </g>
          <polyline
            :points="curve"
            fill="none"
            stroke="#147e7d"
            stroke-width="2"
            pathLength="1"
            stroke-dasharray="1"
            class="motion-safe:animate-curve-in"
          />
          <g v-for="phase in ['ed', 'es'] as const" :key="phase">
            <line
              :x1="x(item.phases[phase].frame)"
              :x2="x(item.phases[phase].frame)"
              y1="16"
              y2="103"
              stroke="#3272b9"
              stroke-dasharray="3 3"
            />
            <text
              :x="x(item.phases[phase].frame)"
              y="11"
              text-anchor="middle"
              fill="#3272b9"
              font-size="9"
            >
              {{ phase.toUpperCase() }}
            </text>
          </g>
          <line
            :x1="x(frame)"
            :x2="x(frame)"
            y1="20"
            y2="104"
            stroke="#bd924a"
            stroke-width="1.2"
          />
          <circle
            v-for="(point, i) in series"
            :key="i"
            :cx="x(point.frame)"
            :cy="y(point.value)"
            r="3"
            fill="#147e7d"
            tabindex="0"
            role="button"
            :aria-label="`檢視容積估計畫面 ${point.frame + 1}`"
            class="cursor-pointer outline-none focus:stroke-blue focus:stroke-[4]"
            @click="emit('seek', point.frame)"
            @keydown.enter.prevent="emit('seek', point.frame)"
            @keydown.space.prevent="emit('seek', point.frame)"
          />
          <text x="38" y="122" fill="#718390" font-size="9">影片開始</text>
          <text x="468" y="122" text-anchor="end" fill="#718390" font-size="9">
            {{ formatPosition(item, item.frameCount - 1) }}
          </text>
        </svg>
      </div>
    </div>
    <div v-else class="grid min-h-0 flex-1 grid-cols-6 gap-3 p-3">
      <button
        v-for="(preview, i) in item.framePreviews"
        :key="i"
        class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-line text-left hover:border-brand"
        :aria-label="`檢視影片畫面 ${preview.frame + 1}`"
        @click="emit('seek', preview.frame)"
      >
        <img
          :src="assetUrl(preview.image)"
          alt="原始影片縮圖"
          class="min-h-0 w-full flex-1 bg-[#0b1119] object-contain"
        /><span class="py-2 text-center font-mono text-[10px] text-muted">{{
          formatPosition(item, preview.frame)
        }}</span>
      </button>
    </div>
  </section>
</template>
