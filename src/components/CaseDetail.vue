<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import CaseDemo from "./CaseDemo.vue";
import Explainer from "./Explainer.vue";
import Icon from "./Icon.vue";
import type { DemoCase } from "../types";

const props = defineProps<{ item: DemoCase; initialMetric: string }>();
const demo = ref<InstanceType<typeof CaseDemo>>();
const presentation = ref(false),
  cycleStep = ref(0),
  time = ref(0);
const selectedStart = computed(() =>
  props.item.metrics.some((metric) => metric.id === props.initialMetric)
    ? props.initialMetric
    : props.item.kind === "function"
      ? "ef"
      : "lvidd",
);
const label = computed(() => {
  if (cycleStep.value % 6 >= 4) return "影片播放中";
  const initialIndex = Math.max(
    0,
    props.item.metrics.findIndex((metric) => metric.id === selectedStart.value),
  );
  return props.item.metrics[
    (initialIndex + Math.floor(cycleStep.value / 6)) % props.item.metrics.length
  ]?.code;
});
let timer: ReturnType<typeof setInterval> | undefined;
function stop() {
  presentation.value = false;
  if (timer) clearInterval(timer);
  timer = undefined;
}
function stopDemo() {
  stop();
  demo.value?.pause();
}
function start() {
  stop();
  cycleStep.value = 0;
  presentation.value = true;
  timer = setInterval(() => (cycleStep.value += 1), 1000);
}
onMounted(() => {
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) start();
});
onBeforeUnmount(stop);
</script>

<template>
  <div
    class="mx-auto grid h-dvh w-full grid-rows-[54px_minmax(0,1fr)_24px] overflow-hidden px-7 py-3 text-[#193240]"
  >
    <header class="flex min-h-0 items-center justify-between gap-5 border-b border-[#dfe7ec]">
      <a href="#/" aria-label="返回 iHeart 首頁" class="flex items-center gap-2.5"
        ><span
          class="grid size-[38px] place-items-center rounded-xl bg-[linear-gradient(145deg,_#278aa4,_#136962)] text-white shadow-sm"
          ><Icon name="heart" :size="23" /></span
        ><strong class="text-[26px] font-semibold tracking-tight">iHeart</strong
        ><span class="ml-2 border-l border-[#cddade] pl-4 text-[10px] text-[#6d8490]"
          >3D Analysis &amp; Visualization</span
        ></a
      >
      <div class="flex items-center gap-2 text-[11px] text-[#66858e]">
        <span>病例示範</span><Icon name="chevron" :size="13" /><b class="text-[#294d59]">{{
          item.caseTitle
        }}</b
        ><small class="rounded-full bg-[#edf5f4] px-2.5 py-1 text-[9px] text-[#49827f]">{{
          item.dataset
        }}</small>
      </div>
      <a href="#/" class="flex items-center gap-1.5 text-[12px] text-[#277d7d]"
        ><Icon name="arrow" :size="14" class="rotate-180" />所有病例</a
      >
      <button
        class="flex items-center gap-2 rounded-lg border border-[#c5dfdb] bg-[#eaf4f2] px-3 py-2 text-[12px] text-[#226f6f] hover:bg-[#d9ede8]"
        :aria-label="presentation ? '停止循環演示' : '開始循環演示'"
        @click="presentation ? stopDemo() : start()"
      >
        <Icon :name="presentation ? 'pause' : 'play'" :size="15" />{{
          presentation ? "循環演示中" : "開始循環演示"
        }}<span
          v-if="presentation"
          class="ml-1 border-l border-[#bddbd6] pl-2 text-[10px] text-[#72978f]"
          >{{ label }}</span
        >
      </button>
    </header>
    <main class="grid min-h-0 grid-rows-[90px_minmax(0,1fr)_110px] gap-3 py-2.5">
      <section class="grid min-h-0 grid-cols-[minmax(0,1.1fr)_minmax(0,.95fr)] items-center gap-7">
        <div>
          <h1 class="text-[32px] font-semibold leading-[1.3] tracking-tight">
            {{ item.kind === "function" ? "一段心臟超聲，" : "從一段超聲影片，"
            }}<span class="text-[#197e7d]">{{
              item.kind === "function" ? "看見泵血與心室變化。" : "看見心室尺寸量測。"
            }}</span>
          </h1>
          <p class="mt-2 text-[12px] leading-[1.5] text-[#71818c]">
            {{ item.caseTitle }} · {{ item.view }} · 點選數值，定位影片裡的量測畫面。
          </p>
        </div>
        <aside class="border-l border-[#d4e5e7] pl-6" aria-label="單一模型的分析流程">
          <div class="flex items-center gap-2.5 text-[#83a7a8]">
            <strong class="mr-1 text-[13px] text-[#315963]">同一模型</strong
            ><template
              v-for="(step, index) in [
                { icon: 'clock', title: '找對畫面' },
                { icon: 'layers', title: '畫出輪廓' },
                { icon: 'ruler', title: '量出指標' },
              ]"
              :key="step.title"
              ><Icon v-if="index" name="chevron" :size="12" /><span
                class="inline-flex items-center gap-1.5 rounded-md bg-[#eaf3f1] px-2 py-1.5 text-[12px] text-[#277e7b]"
                ><Icon :name="step.icon" :size="16" />{{ step.title }}</span
              ></template
            >
          </div>
          <p class="mt-2 text-[12px] leading-[1.5] text-[#68858f]">
            從完整影片找到量測時刻，每個結果都有可回看的輪廓或端點。
          </p>
        </aside>
      </section>
      <CaseDemo
        ref="demo"
        :item="item"
        :initial-metric="selectedStart"
        :presentation="presentation"
        :cycle-step="cycleStep"
        @manual="stop"
        @time="time = $event"
      />
      <Explainer :item="item" :time="time" />
    </main>
    <footer
      class="flex items-center justify-between gap-4 border-t border-[#dce6eb] text-[9px] tracking-wide text-[#94a4ae]"
    >
      <span>© {{ new Date().getFullYear() }} iHeart · 心臟超聲智能分析</span
      ><span>同一模型，讓時刻、位置與量測結果連在一起。</span
      ><span>示範病例 · 點選任何指標即可探索</span>
    </footer>
  </div>
</template>
