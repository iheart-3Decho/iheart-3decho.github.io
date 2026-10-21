<script setup lang="ts">
import type { DemoCase, Metric } from "../../types";
import { formatPosition, metricMeaning } from "../../utils/demo";
import HeartSketch from "../experience/HeartSketch.vue";
import Icon from "../Icon.vue";
defineProps<{ item: DemoCase; metric: Metric; analysed: boolean; confirmed: boolean }>();
defineEmits<{ select: [id: string]; analyse: []; confirm: []; report: [] }>();
</script>
<template>
  <aside
    class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-white"
    data-clinical-measurements
  >
    <header class="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
      <h2 class="flex items-center gap-2 text-[15px] font-semibold">
        <Icon name="ruler" :size="18" />{{
          item.kind === "function" ? "左心室功能量測" : "心臟結構量測"
        }}
      </h2>
      <span
        class="rounded-md px-2 py-1 text-[10px]"
        :class="confirmed ? 'bg-brand/10 text-brand' : 'bg-canvas text-muted'"
        >{{ confirmed ? "已確認" : analysed ? "待核查" : "待分析" }}</span
      >
    </header>
    <div
      class="flex h-12 shrink-0 items-center justify-between border-b border-line bg-canvas/50 px-5 text-[11px]"
    >
      <span class="text-muted">分析範圍</span
      ><b>{{
        item.kind === "function" ? "分割 · 時相 · EF · 容積" : "時相 · 關鍵點 · 壁厚 · 內徑"
      }}</b>
    </div>
    <table class="w-full table-fixed text-left text-[12px]" aria-label="AI 量測結果">
      <thead class="h-10 border-b border-line text-[10px] text-muted">
        <tr>
          <th class="w-[46%] pl-5 font-normal">量測項目</th>
          <th class="w-[29%] text-right font-normal">結果</th>
          <th class="pr-5 text-right font-normal">時相</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in item.metrics"
          :key="row.id"
          class="h-[70px] border-b border-line/80"
          :class="analysed && row.id === metric.id ? 'bg-brand/[.065]' : ''"
        >
          <td class="pl-5">
            <button
              class="w-full py-3 text-left disabled:cursor-default disabled:opacity-100"
              :disabled="!analysed"
              :data-clinical-metric="row.id"
              :aria-pressed="analysed && row.id === metric.id"
              @click="$emit('select', row.id)"
            >
              <b
                class="block text-[13px]"
                :class="analysed && row.id === metric.id ? 'text-brand' : 'text-ink'"
                >{{ row.code
                }}<span v-if="analysed && row.id === metric.id" class="ml-2 text-[10px]">↗</span></b
              ><span class="mt-1 block text-[10px] text-muted">{{ row.label }}</span>
            </button>
          </td>
          <td class="text-right">
            <strong
              class="font-mono text-[22px] font-semibold tracking-tight"
              :class="analysed ? 'text-ink' : 'text-muted/40'"
              :data-clinical-value="row.id"
              >{{ analysed ? row.value.toFixed(1) : "—" }}</strong
            ><span class="ml-1 text-[10px] text-muted">{{ row.unit }}</span>
          </td>
          <td class="pr-5 text-right text-[10px] text-muted">
            {{ analysed ? (row.id === "ef" ? "ED / ES" : row.phase.toUpperCase()) : "—" }}
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="analysed" class="flex min-h-0 flex-1 flex-col px-5 pb-4 pt-5">
      <div class="flex items-end justify-between">
        <div>
          <p class="text-[10px] font-medium uppercase tracking-[.12em] text-brand">
            Selected measurement
          </p>
          <h3 class="mt-2 text-[18px] font-semibold">{{ metric.label }}</h3>
        </div>
        <span class="rounded-md border border-line px-2 py-1 text-[11px] text-muted">{{
          metric.code
        }}</span>
      </div>
      <div class="my-4 flex items-baseline gap-2">
        <strong
          class="font-mono text-[43px] font-semibold leading-none tracking-tight text-brand"
          >{{ metric.value.toFixed(1) }}</strong
        ><span class="text-[17px] text-muted">{{ metric.unit }}</span>
      </div>
      <p class="text-[12px] leading-relaxed text-muted">{{ metricMeaning(metric) }}。</p>
      <div class="my-4 flex min-h-[125px] flex-1 items-center justify-center rounded-xl bg-canvas">
        <HeartSketch
          :kind="item.kind === 'function' ? (metric.id === 'esv' ? 'es' : 'ed') : metric.id"
          compact
        />
      </div>
      <button
        class="flex items-center justify-between rounded-lg border border-line px-3 py-3 text-left text-[11px] hover:border-brand"
        @click="$emit('select', metric.id)"
      >
        <span class="flex items-center gap-2 text-muted"
          ><Icon name="scan" :size="16" />回看量測依據</span
        ><b class="text-brand">{{ formatPosition(item, metric.evidence.frame) }} ↗</b>
      </button>
      <div class="mt-4 grid grid-cols-2 gap-2">
        <button
          class="flex items-center justify-center gap-1.5 rounded-lg border border-line py-3 text-[12px]"
          :class="confirmed ? 'bg-brand/5 text-brand' : 'text-ink hover:bg-canvas'"
          :aria-pressed="confirmed"
          data-clinical-confirm
          @click="$emit('confirm')"
        >
          <Icon name="check" :size="16" />{{ confirmed ? "已確認量測" : "確認量測" }}</button
        ><button
          class="rounded-lg bg-brand py-3 text-[12px] font-semibold text-white hover:bg-[#106a69]"
          data-clinical-report
          @click="$emit('report')"
        >
          生成報告 ↗
        </button>
      </div>
    </div>
    <div v-else class="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
      <div class="grid size-16 place-items-center rounded-2xl bg-brand/5 text-brand">
        <Icon name="scan" :size="30" />
      </div>
      <h3 class="text-[17px] font-semibold">從影片定位量測時刻</h3>
      <p class="text-[12px] leading-7 text-muted">
        自動標示{{
          item.kind === "function"
            ? "左心室輪廓，整理心功能與容積指標"
            : "量測端點，整理心室內徑與壁厚"
        }}。<br />每個數值皆可回看影像依據。
      </p>
      <button
        class="flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-[13px] font-semibold text-white"
        @click="$emit('analyse')"
      >
        <Icon name="scan" :size="16" />AI 分析</button
      ><span class="text-[10px] text-muted">影片 → 關鍵幀 → 量測位置 → 結果</span>
    </div>
  </aside>
</template>
