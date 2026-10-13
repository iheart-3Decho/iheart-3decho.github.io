<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import FeaturedEvidence from "./FeaturedEvidence.vue";
import MetricEvidenceCard from "./MetricEvidenceCard.vue";
import HomePhaseComparison from "./HomePhaseComparison.vue";
import Icon from "./Icon.vue";
import { metricDemos, metricRoute } from "../utils/demo";
import type { DemoCase } from "../types";

const props = defineProps<{ cases: DemoCase[]; failed: boolean }>();
const demos = computed(() => metricDemos(props.cases));
const featuredIndex = ref(0);
const automatic = ref(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
const featured = computed(() => demos.value[featuredIndex.value % Math.max(demos.value.length, 1)]);
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  timer = setInterval(() => {
    if (automatic.value)
      featuredIndex.value = (featuredIndex.value + 1) % Math.max(demos.value.length, 1);
  }, 9000);
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="relative isolate h-dvh w-full overflow-hidden px-6 pt-4 pb-2 text-ink">
    <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <span
        class="absolute -top-[38vw] -right-[20vw] size-[75vw] rounded-full border border-[#278e8514] animate-orbit"
      />
      <span
        class="absolute -top-[26vw] -right-[8vw] size-[52vw] rounded-full border border-[#278e8512] animate-[heart-orbit_31s_linear_infinite_reverse]"
      />
      <span
        class="absolute inset-0 opacity-40 [background-image:linear-gradient(#497f8d0b_1px,_transparent_1px),linear-gradient(90deg,_#497f8d0b_1px,_transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,_black,_transparent_80%)]"
      />
    </div>
    <header
      class="relative z-10 flex h-[62px] w-full items-center justify-between border-b border-line"
    >
      <a href="#/" aria-label="iHeart 首頁" class="flex items-center gap-2.5"
        ><span
          class="grid size-[37px] place-items-center rounded-xl bg-[linear-gradient(145deg,_#278aa4,_#136962)] text-white shadow-sm"
          ><Icon name="heart" :size="21" /></span
        ><strong class="text-[26px] font-semibold tracking-[-1.2px]">iHeart</strong
        ><span class="ml-2 border-l border-[#cddade] pl-4 text-[10px] tracking-wide text-muted"
          >3D Analysis &amp; Visualization</span
        ></a
      >
      <div class="flex items-center gap-8 text-[11px] text-[#557680]">
        <span class="flex items-center gap-2"
          ><i class="size-1.5 rounded-full bg-brand animate-signal" />同一模型 ·
          {{ cases.length }} 個真實影片示範</span
        ><button
          class="flex items-center gap-2 rounded-lg border border-[#c5dfdb] bg-[#eaf4f2] px-4 py-2.5 text-[#226f6f] hover:bg-[#d9ede8]"
          :aria-pressed="automatic"
          :aria-label="automatic ? '停止首頁自動演示' : '開始首頁自動演示'"
          @click="automatic = !automatic"
        >
          <Icon :name="automatic ? 'pause' : 'play'" :size="14" />{{
            automatic ? "自動演示中" : "開始自動演示"
          }}
        </button>
      </div>
    </header>
    <main
      class="grid h-[calc(100dvh-84px)] w-full grid-rows-[minmax(0,1.1fr)_minmax(0,.9fr)_20px] gap-4 pt-3"
      data-home-canvas
    >
      <section
        class="grid min-h-0 grid-cols-[minmax(0,.86fr)_minmax(0,1.14fr)] items-center gap-6"
        aria-label="iHeart 心臟超聲互動示範"
      >
        <div class="flex min-h-0 flex-col justify-center" data-home-intro>
          <p class="mb-3 flex items-center gap-2.5 text-[11px] tracking-widest text-[#527c84]">
            <i
              class="size-2 rounded-full bg-brand animate-signal"
            />不只讀出數字，也找到它來自哪幅畫面
          </p>
          <h1
            class="text-[clamp(56px,3.15vw,84px)] font-medium leading-[1.13] tracking-[-2.5px] text-ink animate-enter"
          >
            從一段超聲影片<br />找到心臟的<span class="text-brand">關鍵時刻</span>
          </h1>
          <p class="mt-3 text-[15px] leading-[1.85] text-[#5a7480]">
            心臟把血液送到全身，超聲讓我們看見它如何跳動。iHeart
            在整段影片中找到充盈與收縮畫面，圈出心室、標出量測線，讓泵血能力與心臟尺寸有影像可回看。
          </p>
          <div class="mt-4 flex items-center gap-3">
            <a
              v-if="featured"
              class="flex items-center gap-3 rounded-[9px] bg-[linear-gradient(110deg,_#217f90,_#197e71)] px-5 py-3.5 text-[13px] font-medium text-white shadow-[0_8px_24px_#1b9f8b20] transition hover:-translate-y-0.5"
              :href="metricRoute(featured.item, featured.metric)"
              >進入互動演示<Icon name="arrow" :size="17" /></a
            ><span class="text-[11px] text-[#627d88]">點選下方任一指標，直接查看對應畫面</span>
          </div>
          <div class="mt-4 grid grid-cols-3 gap-3 border-t border-[#d4e5e7] pt-3">
            <div
              v-for="step in [
                { icon: 'video', title: '一段影片', sub: '保留完整動態過程' },
                { icon: 'clock', title: '何時量測', sub: '找到充盈與收縮時刻' },
                {
                  icon: 'scan',
                  title: '在哪裡量測',
                  sub: '輪廓與端點直接可見',
                },
              ]"
              :key="step.title"
              class="flex items-center gap-2.5"
            >
              <span
                class="grid size-9 place-items-center rounded-lg border border-[#d1e5e1] bg-[#eaf4f1] text-brand"
                ><Icon :name="step.icon" :size="18"
              /></span>
              <div>
                <b class="block text-[12px] font-medium text-[#315963]">{{ step.title }}</b
                ><small class="text-[10px] text-[#627d88]">{{ step.sub }}</small>
              </div>
            </div>
          </div>
          <HomePhaseComparison v-if="featured" :item="featured.item" />
        </div>
        <FeaturedEvidence
          v-if="featured"
          :key="`${featured.item.id}-${featured.metric.id}`"
          :demo="featured"
          :automatic="automatic"
        />
        <div
          v-else
          class="flex h-full items-center justify-center gap-3 rounded-[22px] border border-line bg-white text-muted"
          role="status"
        >
          <Icon name="video" :size="32" />{{
            failed ? "示範影片未能載入，請重新整理。" : "正在準備心臟超聲示範…"
          }}
        </div>
      </section>

      <section
        id="home-metrics"
        class="flex min-h-0 flex-col border-t border-line pt-3"
        aria-label="六項量測與影片關鍵畫面"
      >
        <div class="mb-3 flex flex-none items-end justify-between">
          <div>
            <span class="text-[9px] tracking-[1.8px] text-[#5b7d87]"
              >VIDEO → KEY FRAME → MEASUREMENT</span
            >
            <h2 class="mt-1 text-[23px] font-medium tracking-tight text-ink">
              選一項量測，<span class="text-brand">看它在影片中的時刻與位置</span>
            </h2>
          </div>
          <div class="flex items-center gap-2" aria-label="切換首頁量測演示">
            <button
              v-for="(demo, index) in demos"
              :key="demo.metric.id"
              class="rounded-md border px-2.5 py-1.5 text-[10px] transition hover:bg-[#e3f1ed]"
              :class="
                index === featuredIndex
                  ? 'border-[#a9d1c8] bg-[#e3f1ed] text-[#226f6f]'
                  : 'border-[#d8e5e8] bg-white/80 text-[#627d88]'
              "
              :aria-pressed="index === featuredIndex"
              :aria-label="`展示${demo.metric.code}`"
              @click="featuredIndex = index"
            >
              {{ demo.metric.code }}
            </button>
          </div>
        </div>
        <div v-if="demos.length" class="grid min-h-0 flex-1 grid-cols-6 gap-3">
          <MetricEvidenceCard
            v-for="(demo, index) in demos"
            :key="demo.metric.id"
            :demo="demo"
            :index="index"
            :active="index === featuredIndex"
          />
        </div>
        <div v-else class="flex flex-1 items-center justify-center text-[12px] text-muted">
          {{ failed ? "無法載入量測示範，請重新整理。" : "正在準備量測示範…" }}
        </div>
      </section>
      <footer class="flex items-center justify-between border-t border-line text-[9px] text-muted">
        <span>iHeart · 3D Analysis &amp; Visualization</span
        ><span>同一模型，連起影片、關鍵畫面、心室輪廓與量測結果。</span
        ><span>示範病例 · 七項指標 · 點選卡片查看完整結果</span>
      </footer>
    </main>
  </div>
</template>
