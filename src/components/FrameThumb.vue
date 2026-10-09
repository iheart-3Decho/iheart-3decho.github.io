<script setup lang="ts">
import type { DemoCase, Geometry } from "../types";
const base = import.meta.env.BASE_URL;
defineProps<{ item: DemoCase; image: string; geometry?: Geometry }>();
</script>
<template>
  <div
    class="frame-thumb relative min-w-0 min-h-0 w-full h-full bg-[#0c141d] overflow-hidden rounded-[5px]"
  >
    <img
      class="block h-full w-full object-contain"
      :src="`${base}demo/${image}`"
      alt="心臟超聲關鍵畫面"
    />
    <svg
      v-if="geometry"
      :viewBox="`0 0 ${item.width} ${item.height}`"
      class="pointer-events-none absolute inset-0 h-full w-full"
      aria-label="量測位置"
    >
      <polygon
        v-if="geometry.kind === 'contour'"
        :points="geometry.points.map((p) => p.join(',')).join(' ')"
        fill="#51efcc20"
        stroke="#51efcc"
        stroke-width="1.4"
        vector-effect="non-scaling-stroke"
      />
      <template v-else>
        <polyline
          :points="geometry.points.map((p) => p.join(',')).join(' ')"
          fill="none"
          stroke="#51efcc"
          stroke-width="2.4"
          vector-effect="non-scaling-stroke"
        />
        <circle
          v-for="(p, i) in geometry.points"
          :key="i"
          :cx="p[0]"
          :cy="p[1]"
          :r="item.width * 0.007"
          fill="white"
          stroke="#51efcc"
          stroke-width="1.5"
          vector-effect="non-scaling-stroke"
        />
      </template>
    </svg>
  </div>
</template>
