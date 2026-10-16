<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { DemoCase } from "../../types";
import type { ExperienceData, ExperienceMode } from "../../experience/types";
import { experienceAsset } from "../../experience/types";
import { findExperience, previewEvidence } from "../../experience/catalog";
import { assetUrl, formatMetric, formatPosition, metricMeaning } from "../../utils/demo";
import Icon from "../Icon.vue";
import EvidenceImage from "./EvidenceImage.vue";
const props = defineProps<{ cases: DemoCase[]; data: ExperienceData }>();
const emit = defineEmits<{ start: [mode: ExperienceMode, caseId?: string, metric?: string] }>();
const index = ref(0),
  evidence = ref(false),
  failed = ref(false);
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const automatic = ref(!reduced);
const preview = computed(() => props.data.playlist[index.value]!);
const mode = computed(() => preview.value.mode);
const result = computed(() => findExperience(props.data, mode.value, preview.value.caseId));
const item = computed(() => props.cases.find((c) => c.id === result.value.caseId)!);
const metric = computed(() => item.value.metrics.find((m) => m.id === preview.value.metric)!);
const picture = computed(() => previewEvidence(props.data, preview.value));
const question = computed(
  () =>
    ({
      lvidd: ["你能量出心室", "內部的寬度嗎？"],
      lvids: ["收縮後的心室", "會變得多窄呢？"],
      ivsd: ["兩個心室之間", "心壁有多厚呢？"],
      lvpwd: ["心室後方的心壁", "你能找到它嗎？"],
    })[preview.value.metric] ?? ["你能找到心臟", "裝滿血的那一刻嗎？"],
);
let timer: ReturnType<typeof setInterval>;
let ticks = 0;
function select(next: number) {
  index.value = (next + props.data.playlist.length) % props.data.playlist.length;
  evidence.value = false;
  failed.value = false;
  ticks = 0;
}
onMounted(() => {
  timer = setInterval(() => {
    if (automatic.value) {
      ticks++;
      evidence.value = ticks % 3 === 2;
      if (ticks % 3 === 0) select(index.value + 1);
    }
  }, 4000);
});
onBeforeUnmount(() => clearInterval(timer));
</script>
<template>
  <section class="grid h-full min-h-0 grid-cols-[.8fr_1.3fr] gap-12" data-attract>
    <div class="flex flex-col justify-center pb-8">
      <span class="mb-7 flex items-center gap-3 text-[15px] tracking-[.18em] text-brand"
        ><span class="size-2.5 rounded-full bg-brand motion-safe:animate-pulse" />一段影片 ·
        找到時刻 · 看見量測</span
      >
      <h1 class="text-[65px] font-semibold leading-[1.24] tracking-[-.045em] text-ink">
        {{ question[0] }}<br /><span class="text-brand">{{ question[1] }}</span>
      </h1>
      <p class="mt-7 max-w-[590px] text-[21px] leading-[1.8] text-muted">
        心臟像一個不停運作的幫浦。超聲影片讓我們看見它如何充盈與收縮；找對畫面，才能了解它的功能與尺寸。
      </p>
      <button
        class="mt-9 flex w-fit items-center gap-5 rounded-2xl bg-brand px-10 py-5 text-[23px] font-semibold text-white shadow-lg shadow-brand/15 transition hover:-translate-y-1 hover:bg-[#116b6a]"
        data-start
        @click="emit('start', mode, item.id, preview.metric)"
      >
        開始體驗 <Icon name="arrow" :size="25" />
      </button>
      <button
        class="mt-6 flex w-fit items-center gap-3 text-[17px] text-blue"
        data-other-task
        @click="emit('start', mode === 'function' ? 'dimension' : 'function')"
      >
        <Icon name="ruler" :size="19" />{{
          mode === "function" ? "或試試：量量心臟尺寸" : "或試試：找到充盈與收縮時刻"
        }}
        <span>→</span>
      </button>
      <div class="mt-12 grid grid-cols-3 gap-5 border-t border-line pt-7 text-[15px] text-muted">
        <span><b class="mb-2 block text-[22px] text-ink">01 你來找</b>拖動影片、選擇畫面</span
        ><span><b class="mb-2 block text-[22px] text-ink">02 AI 來量</b>看見輪廓與量測線</span
        ><span><b class="mb-2 block text-[22px] text-ink">03 一起看懂</b>了解每個數字的用途</span>
      </div>
      <div class="mt-8 flex items-center gap-3 text-[13px] text-muted" data-preview-controls>
        <span class="mr-1">多種量測 · {{ index + 1 }} / {{ data.playlist.length }}</span>
        <button
          class="grid size-9 place-items-center rounded-full border border-line bg-white text-brand"
          aria-label="上一段示範"
          @click="select(index - 1)"
        >
          ←
        </button>
        <button
          class="grid size-9 place-items-center rounded-full border border-line bg-white text-brand"
          aria-label="下一段示範"
          @click="select(index + 1)"
        >
          →
        </button>
        <button
          class="rounded-full border border-line bg-white px-4 py-2 text-brand"
          :aria-pressed="automatic"
          @click="automatic = !automatic"
        >
          {{ automatic ? "暫停輪播" : "自動輪播" }}
        </button>
      </div>
    </div>
    <div
      class="flex min-h-0 flex-col overflow-hidden rounded-[32px] bg-[#0c141d] shadow-xl shadow-blue/10"
    >
      <div class="relative min-h-0 flex-1" data-preview-viewport>
        <video
          :key="`${item.id}-${preview.metric}`"
          class="h-full w-full object-contain"
          :src="assetUrl(item.video)"
          :poster="assetUrl(item.poster)"
          :autoplay="!reduced"
          :controls="reduced"
          muted
          loop
          playsinline
          preload="auto"
          aria-label="心臟超聲示範影片"
          :data-preview-case="item.id"
          :data-preview-metric="preview.metric"
          @error="failed = true"
        />
        <div v-if="evidence" class="absolute inset-0" data-attract-evidence>
          <EvidenceImage :src="experienceAsset(picture.image)" alt="AI 找到的量測畫面" />
        </div>
        <div class="absolute left-7 right-7 top-6 flex justify-between text-[14px] text-white">
          <span class="rounded-full bg-[#142d36d9] px-5 py-3"
            >{{ item.view }} · {{ item.caseTitle }}</span
          ><span class="rounded-full bg-[#142d36d9] px-5 py-3">{{
            evidence ? "看見 AI 的量測位置" : "完整心跳，動態播放"
          }}</span>
        </div>
        <div
          v-if="failed"
          role="alert"
          class="absolute inset-0 grid place-content-center gap-5 bg-[#0c141d] text-center text-white"
        >
          <p>影片未能載入</p>
          <button
            class="rounded-xl bg-brand px-6 py-3"
            @click="
              failed = false;
              ($event.currentTarget as HTMLElement)
                .closest('div')
                ?.parentElement?.querySelector('video')
                ?.load();
            "
          >
            重新載入影片
          </button>
        </div>
      </div>
      <div
        class="pointer-events-none mx-7 mb-7 mt-3 shrink-0 rounded-2xl border border-white/15 bg-[#142d36e8] p-6 text-white"
        data-preview-caption
      >
        <p class="mb-2 text-[13px] tracking-widest text-[#8be0d5]">
          {{ evidence ? "WHERE · 在哪裡量" : "WHEN · 在哪一刻量" }}
        </p>
        <div class="flex items-end justify-between gap-5">
          <div>
            <p class="text-[24px] font-medium">
              {{ metric.label }}
              <span class="ml-2 text-[15px] text-[#8be0d5]">{{ metric.code }}</span>
            </p>
            <p class="mt-2 text-[15px] text-white/75">
              {{ evidence ? metricMeaning(metric) : "整段影片中，找到這項量測的關鍵畫面。" }}
            </p>
          </div>
          <strong v-if="evidence" class="shrink-0 text-[35px] font-semibold text-[#8be0d5]">{{
            formatMetric(metric)
          }}</strong>
        </div>
        <div class="relative mt-5 h-1.5 rounded-full bg-white/20" aria-hidden="true">
          <span
            class="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8be0d5] shadow-[0_0_12px_#8be0d5]"
            :style="{ left: `${(picture.frame / Math.max(1, item.frameCount - 1)) * 100}%` }"
          />
        </div>
        <p class="mt-3 text-[13px] text-white/70">
          {{ evidence ? "AI 定位的量測時刻" : "接著看 AI 找到的時刻與位置" }} ·
          {{ formatPosition(item, picture.frame) }}
        </p>
      </div>
    </div>
  </section>
</template>
