<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { DemoCase } from "../../types";
import type { ExperienceData, ExperienceMode } from "../../experience/types";
import { experienceAsset } from "../../experience/types";
import { assetUrl } from "../../utils/demo";
import Icon from "../Icon.vue";
import EvidenceImage from "./EvidenceImage.vue";
const props = defineProps<{ cases: DemoCase[]; data: ExperienceData }>();
const emit = defineEmits<{ start: [mode: ExperienceMode] }>();
const mode = ref<ExperienceMode>("function"),
  evidence = ref(false),
  failed = ref(false);
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const item = computed(() => props.cases.find((c) => c.id === props.data[mode.value].caseId)!);
const picture = computed(
  () => props.data[mode.value].evidence[mode.value === "function" ? "ed" : "lvidd"]!,
);
let timer: ReturnType<typeof setInterval>;
let ticks = 0;
onMounted(() => {
  if (!reduced)
    timer = setInterval(() => {
      ticks++;
      evidence.value = ticks % 3 === 2;
      if (ticks % 3 === 0) {
        mode.value = mode.value === "function" ? "dimension" : "function";
        failed.value = false;
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
        {{ mode === "function" ? "你能找到心臟" : "你能量出心室" }}<br /><span class="text-brand">{{
          mode === "function" ? "裝滿血的那一刻嗎？" : "內部的寬度嗎？"
        }}</span>
      </h1>
      <p class="mt-7 max-w-[590px] text-[21px] leading-[1.8] text-muted">
        心臟像一個不停運作的幫浦。超聲影片讓我們看見它如何充盈與收縮；找對畫面，才能了解它的功能與尺寸。
      </p>
      <button
        class="mt-9 flex w-fit items-center gap-5 rounded-2xl bg-brand px-10 py-5 text-[23px] font-semibold text-white shadow-lg shadow-brand/15 transition hover:-translate-y-1 hover:bg-[#116b6a]"
        data-start
        @click="emit('start', mode)"
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
    </div>
    <div
      class="relative min-h-0 overflow-hidden rounded-[32px] bg-[#0c141d] shadow-xl shadow-blue/10"
    >
      <video
        :key="mode"
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
        @error="failed = true"
      />
      <div v-if="evidence" class="absolute inset-0" data-attract-evidence>
        <EvidenceImage :src="experienceAsset(picture.image)" alt="AI 找到的量測畫面" />
      </div>
      <div class="absolute left-7 right-7 top-6 flex justify-between text-[14px] text-white">
        <span class="rounded-full bg-[#142d36d9] px-5 py-3"
          >{{ item.view }} · 示範病例 {{ mode === "function" ? "01" : "02" }}</span
        ><span class="rounded-full bg-[#142d36d9] px-5 py-3">{{
          evidence ? "看見 AI 的量測位置" : "完整心跳，動態播放"
        }}</span>
      </div>
      <div
        class="pointer-events-none absolute bottom-7 left-7 right-7 rounded-2xl border border-white/15 bg-[#142d36e8] p-6 text-white"
      >
        <p class="mb-2 text-[13px] tracking-widest text-[#8be0d5]">
          {{ evidence ? "WHERE · 在哪裡量" : "WHEN · 在哪一刻量" }}
        </p>
        <p class="text-[25px] font-medium">
          {{
            mode === "function"
              ? "先找到充盈與收縮，再看心臟泵出多少血。"
              : "先找到量測畫面，再標出心室的內壁。"
          }}
        </p>
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
  </section>
</template>
