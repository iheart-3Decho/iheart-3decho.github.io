<script setup lang="ts">
import { computed, ref } from "vue";
import type { DemoCase, Point } from "../../types";
import type {
  DimensionMetric,
  ExperienceCase,
  ExperienceMode,
  FrameSelection,
} from "../../experience/types";
import { dimensionGuides, medicalSources } from "../../experience/education";
import FrameComparison from "./FrameComparison.vue";
import HeartSketch from "./HeartSketch.vue";
const props = defineProps<{
  item: DemoCase;
  mode: ExperienceMode;
  data: ExperienceCase;
  ed: FrameSelection | null;
  es: FrameSelection | null;
  selected: FrameSelection | null;
  points: Point[];
  metric: DimensionMetric;
}>();
defineEmits<{ edit: []; restart: []; other: []; home: [] }>();
const sources = ref(false);
const guide = computed(() => dimensionGuides[props.metric]);
const value = (id: string) => props.data.metrics[id]!;
</script>
<template>
  <div class="flex h-full min-h-0 flex-col gap-5" data-results>
    <div class="flex items-center justify-between">
      <div>
        <p class="mb-1 text-[13px] tracking-widest text-brand">AI 找到時刻，也標出位置</p>
        <h1 class="text-[32px] font-semibold">
          從動態影像，看懂心臟{{ mode === "function" ? "如何泵血" : "的尺寸" }}。
        </h1>
      </div>
      <div class="flex gap-3 text-[14px]">
        <button class="rounded-xl border border-line bg-white px-5 py-3" @click="$emit('edit')">
          修改我的選擇</button
        ><button class="rounded-xl border border-line bg-white px-5 py-3" @click="$emit('restart')">
          再試一次</button
        ><button class="rounded-xl bg-brand px-5 py-3 text-white" @click="$emit('other')">
          體驗另一項 →</button
        ><button class="rounded-xl border border-line bg-white px-5 py-3" @click="$emit('home')">
          返回首頁
        </button>
      </div>
    </div>
    <div class="grid min-h-0 flex-1 grid-cols-[1.35fr_1fr] gap-6">
      <div v-if="mode === 'function'" class="grid min-h-0 grid-rows-2 gap-4">
        <FrameComparison
          v-if="ed"
          :item="item"
          :selected="ed"
          :ai="data.evidence.ed!"
          label="充盈最大 · 心室裝滿血"
        /><FrameComparison
          v-if="es"
          :item="item"
          :selected="es"
          :ai="data.evidence.es!"
          label="收縮最小 · 心室泵血後"
        />
      </div>
      <FrameComparison
        v-else-if="selected"
        :item="item"
        :selected="selected"
        :ai="data.evidence[metric]!"
        :points="points"
        :label="guide.label"
      />
      <aside
        class="flex min-h-0 flex-col justify-between rounded-[24px] border border-line bg-white p-7"
      >
        <template v-if="mode === 'function'">
          <div>
            <span class="text-[14px] text-brand">射血分數 · EF</span>
            <div class="my-2 flex items-end gap-4">
              <strong class="text-[74px] font-semibold leading-none text-brand"
                >{{ value("ef").value.toFixed(1) }}<span class="text-[36px]">%</span></strong
              >
              <p class="mb-1 text-[18px] leading-relaxed text-muted">
                每 100 份血液<br />約泵出 {{ Math.round(value("ef").value) }} 份
              </p>
            </div>
            <p class="mt-4 text-[17px] leading-relaxed text-ink">
              量的是「一次收縮泵出的比例」。醫生用它觀察心室收縮功能，並結合症狀與其他檢查判斷。
            </p>
          </div>
          <div class="rounded-2xl bg-canvas p-5">
            <svg
              viewBox="0 0 600 165"
              class="h-[150px] w-full"
              aria-label="充盈容積與收縮後容積示意"
            >
              <path
                d="M85 18 C0 40 33 150 100 155 C168 150 201 40 116 18Z"
                fill="#d5e9e6"
                stroke="#147e7d"
                stroke-width="3"
              />
              <path
                d="M383 57 C330 70 345 145 392 151 C439 145 457 70 404 57Z"
                fill="#d5e9e6"
                stroke="#147e7d"
                stroke-width="3"
              />
              <path
                d="M210 85 H298 m-16 -13 16 13 -16 13"
                fill="none"
                stroke="#147e7d"
                stroke-width="3"
              />
              <text x="252" y="50" text-anchor="middle" font-size="17" fill="#147e7d">
                泵出血液
              </text>
              <text x="100" y="85" text-anchor="middle" font-size="27" fill="#193240">
                {{ value("edv").value.toFixed(1) }}
              </text>
              <text x="392" y="110" text-anchor="middle" font-size="23" fill="#193240">
                {{ value("esv").value.toFixed(1) }}
              </text>
              <text x="500" y="95" font-size="18" fill="#718390">mL</text>
            </svg>
            <div class="grid grid-cols-2 gap-5 text-[16px]">
              <p>
                <b>充盈時 · EDV</b
                ><span class="mt-1 block text-muted"
                  >{{ value("edv").value.toFixed(1) }} mL（裝了多少血）</span
                >
              </p>
              <p>
                <b>收縮後 · ESV</b
                ><span class="mt-1 block text-muted"
                  >{{ value("esv").value.toFixed(1) }} mL（還剩多少血）</span
                >
              </p>
            </div>
          </div>
          <div class="text-[15px] leading-relaxed text-muted">
            <p>容積幫助醫生觀察心室大小，並比較治療或隨訪前後的變化。</p>
            <p class="mt-3">
              AHA 一般 EF 參考區間為
              55–70%；單一數字不能判斷是否健康。容積的判讀也需考慮體型等個人資訊。
            </p>
          </div>
        </template>
        <template v-else
          ><div>
            <p class="text-[16px] text-brand">{{ guide.label }} · {{ guide.code }}</p>
            <p class="my-4 text-[72px] font-semibold leading-none text-brand">
              {{ value(metric).value.toFixed(1) }} <span class="text-[30px]">mm</span>
            </p>
            <p class="text-[20px] text-muted">
              （{{ guide.anatomy }}{{ metric === "lvidd" || metric === "lvids" ? "寬約" : "厚約" }}
              {{ (value(metric).value / 10).toFixed(1) }} 公分）
            </p>
          </div>
          <HeartSketch :kind="metric" />
          <div class="space-y-4 text-[18px] leading-relaxed">
            <p><b>量了什麼？</b><br />{{ guide.meaning }}</p>
            <p><b>為什麼醫生關注？</b><br />{{ guide.purpose }}</p>
            <p class="text-[14px] text-muted">
              尺寸需結合體型、性別和其他檢查判讀。你的畫線只呈現位置，不換算毫米；AI
              數值取自模型的最終輸出。
            </p>
          </div></template
        >
        <button
          class="mt-3 w-fit text-[13px] text-blue underline underline-offset-4"
          @click="sources = true"
        >
          量測解讀的資料來源 ↗
        </button>
      </aside>
    </div>
    <p class="text-center text-[13px] text-muted">
      影片可包含多次心跳，因此不同時刻也可能呈現相近狀態。這是選擇與量測的對照，並非正確／錯誤評分。示範結果不代替醫生診斷。
    </p>
    <div
      v-if="sources"
      class="fixed inset-0 z-40 grid place-items-center bg-ink/30"
      @click.self="sources = false"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="資料來源"
        class="w-[700px] rounded-3xl bg-white p-9 shadow-xl"
      >
        <h2 class="mb-6 text-[26px]">量測解讀的資料來源</h2>
        <p class="mb-6 text-muted">
          AHA：EF 的泵血比例與一般參考區間。ASE / EACVI：心腔容積、尺寸與結構量測。
        </p>
        <a
          v-for="source in medicalSources"
          :key="source.url"
          :href="source.url"
          target="_blank"
          rel="noopener noreferrer"
          class="mb-5 block text-blue underline"
          >{{ source.title }} ↗</a
        ><button
          autofocus
          class="mt-4 rounded-xl bg-brand px-7 py-3 text-white"
          @click="sources = false"
        >
          返回體驗
        </button>
      </section>
    </div>
  </div>
</template>
