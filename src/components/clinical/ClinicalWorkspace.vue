<script setup lang="ts">
import { computed } from "vue";
import type { DemoCase } from "../../types";
import type { ExperienceData } from "../../experience/types";
import { useClinicalSession, examNumber, viewCode } from "../../clinical/useClinicalSession";
import { assetUrl } from "../../utils/demo";
import ClinicalPlayer from "./ClinicalPlayer.vue";
import ClinicalEvidence from "./ClinicalEvidence.vue";
import ClinicalMeasurements from "./ClinicalMeasurements.vue";
import ClinicalReport from "./ClinicalReport.vue";
import ImageSources from "../ImageSources.vue";
import Icon from "../Icon.vue";
const props = defineProps<{ cases: DemoCase[]; data: ExperienceData }>();
const {
  automatic,
  caseId,
  metricId,
  overlay,
  reportOpen,
  frame,
  elapsed,
  playlistIndex,
  reviews,
  item,
  metric,
  review,
  experience,
  command,
  issue,
  interact,
  selectCase,
  selectMetric,
  analyse,
  resume,
} = useClinicalSession(props.cases, props.data);
const exam = computed(() =>
  examNumber(props.cases.findIndex((entry) => entry.id === caseId.value)),
);
const reviewed = computed(() => Object.values(reviews).filter((entry) => entry.analysed).length);
function onInteraction(event: Event) {
  if (event.target instanceof Element && event.target.closest("[data-clinical-auto]")) return;
  interact();
}
</script>
<template>
  <main
    class="h-dvh min-w-[1440px] overflow-hidden bg-canvas text-ink print:h-auto print:min-w-0 print:overflow-visible print:bg-white"
    data-clinical
    :data-case="caseId"
    :data-automatic="automatic"
    :data-analysed="review.analysed"
    :data-metric="metricId"
    @pointerdown.capture="onInteraction"
    @keydown.capture="onInteraction"
    @wheel.passive="interact"
  >
    <div class="grid h-full grid-rows-[68px_minmax(0,1fr)_30px] print:hidden" :inert="reportOpen">
      <header class="flex items-center justify-between border-b border-line bg-white px-6">
        <div class="flex items-center gap-3">
          <span class="grid size-9 place-items-center rounded-xl bg-brand text-white"
            ><Icon name="heart" :size="23" /></span
          ><strong class="text-[26px] font-semibold tracking-tight">iHeart</strong>
          <div class="ml-3 border-l border-line pl-5">
            <h1 class="text-[13px] font-semibold">心臟超聲輔助分析</h1>
            <p class="mt-1 text-[9px] tracking-[.13em] text-muted">CARDIAC ANALYSIS WORKSTATION</p>
          </div>
        </div>
        <div class="flex items-center gap-3 text-[12px]">
          <span class="mr-3 rounded-md border border-line bg-canvas px-3 py-2 font-mono text-muted"
            >{{ exam }} <span class="mx-2 text-line">|</span> {{ viewCode(item) }}</span
          ><button
            class="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-[#106a69]"
            data-clinical-analyse
            @click="analyse"
          >
            <Icon name="scan" :size="16" />{{ review.analysed ? "重新分析" : "AI 分析" }}</button
          ><button
            class="flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 disabled:cursor-default"
            :disabled="!review.analysed"
            data-clinical-generate
            @click="reportOpen = true"
          >
            <Icon name="report" :size="16" />生成報告</button
          ><span class="mx-1 h-6 border-l border-line" /><button
            class="flex items-center gap-2 rounded-lg border px-3 py-2.5"
            :class="automatic ? 'border-brand/20 bg-brand/5 text-brand' : 'border-line text-muted'"
            :aria-pressed="automatic"
            data-clinical-auto
            @click="automatic ? interact() : resume()"
          >
            <Icon :name="automatic ? 'pause' : 'play'" :size="14" />{{
              automatic ? "自動演示中" : "恢復自動演示"
            }}</button
          ><a
            href="#/experience"
            class="ml-2 flex items-center gap-1 text-[11px] text-muted hover:text-brand"
            >互動展台<Icon name="arrow" :size="13"
          /></a>
        </div>
      </header>
      <div class="grid min-h-0 grid-cols-[240px_minmax(0,1fr)_400px] gap-4 p-4">
        <aside
          class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-white"
          aria-label="檢查列表"
        >
          <div class="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
            <h2 class="flex items-center gap-2 text-[14px] font-semibold">
              <Icon name="folder" :size="17" />檢查列表
            </h2>
            <span class="rounded bg-canvas px-2 py-1 font-mono text-[10px] text-muted">06</span>
          </div>
          <div
            class="flex h-10 shrink-0 items-center gap-2 border-b border-line px-4 text-[10px] text-muted"
          >
            <span class="size-1.5 rounded-full bg-brand" />示範檢查<span class="ml-auto"
              >A4C / PLAX</span
            >
          </div>
          <div class="flex min-h-0 flex-1 flex-col gap-1 p-2">
            <button
              v-for="(entry, index) in cases"
              :key="entry.id"
              class="flex min-h-0 flex-1 items-center gap-3 rounded-lg border px-2.5 text-left"
              :class="
                entry.id === caseId
                  ? 'border-brand/25 bg-brand/[.065] shadow-[inset_3px_0_0_#147e7d]'
                  : 'border-transparent hover:bg-canvas'
              "
              :data-clinical-case="entry.id"
              :aria-pressed="entry.id === caseId"
              @click="selectCase(entry.id)"
            >
              <div
                class="relative h-[70px] w-[76px] shrink-0 overflow-hidden rounded-md bg-[#0b1119]"
              >
                <img
                  :src="assetUrl(entry.poster)"
                  :alt="`${viewCode(entry)} 病例縮圖`"
                  class="h-full w-full object-contain"
                /><span
                  class="absolute bottom-0 left-0 rounded-tr bg-[#152735d9] px-1.5 py-0.5 font-mono text-[8px] text-white"
                  >{{ viewCode(entry) }}</span
                >
              </div>
              <div class="min-w-0">
                <b
                  class="block font-mono text-[13px]"
                  :class="entry.id === caseId ? 'text-brand' : ''"
                  >{{ examNumber(index) }}</b
                ><span class="mt-1.5 block text-[10px] text-muted">{{
                  entry.kind === "function" ? "左心室功能" : "心臟結構量測"
                }}</span
                ><span
                  class="mt-2 flex items-center gap-1.5 text-[9px]"
                  :class="reviews[entry.id]!.analysed ? 'text-brand' : 'text-muted'"
                  ><span
                    class="size-1 rounded-full"
                    :class="reviews[entry.id]!.analysed ? 'bg-brand' : 'bg-muted/50'"
                  />{{
                    reviews[entry.id]!.confirmed
                      ? "已確認"
                      : reviews[entry.id]!.analysed
                        ? "已分析"
                        : "待分析"
                  }}</span
                >
              </div>
            </button>
          </div>
          <div class="m-3 mt-2 shrink-0 rounded-lg border border-line bg-canvas/60 p-3">
            <p class="text-[10px] font-semibold">統一模型 · 多任務分析</p>
            <div class="mt-3 grid grid-cols-2 gap-y-2 text-[10px] text-muted">
              <span class="flex items-center gap-1.5"><Icon name="clock" :size="12" />時相定位</span
              ><span class="flex items-center gap-1.5"
                ><Icon name="layers" :size="12" />心室分割</span
              ><span class="flex items-center gap-1.5"
                ><Icon name="heart" :size="12" />功能量測</span
              ><span class="flex items-center gap-1.5"
                ><Icon name="ruler" :size="12" />結構量測</span
              >
            </div>
          </div>
        </aside>
        <section class="flex min-h-0 flex-col gap-3" aria-label="影像工作區">
          <div class="flex h-[46px] shrink-0 items-center justify-between px-1">
            <div class="flex items-baseline gap-3">
              <h2 class="text-[18px] font-semibold">
                {{ item.kind === "function" ? "左心室功能分析" : "左心室結構分析" }}
              </h2>
              <span class="text-[11px] text-muted">{{ exam }} · {{ item.view }}</span>
            </div>
            <span
              class="rounded-full border border-line bg-white px-3 py-1.5 text-[10px] text-muted"
              >{{
                automatic ? `自動演示 ${playlistIndex + 1} / ${data.playlist.length}` : "手動閱片"
              }}<span class="ml-2 text-brand">{{
                automatic ? (elapsed < 5 ? "影片回放" : "量測定位") : "可自由核查"
              }}</span></span
            >
          </div>
          <ClinicalPlayer
            :key="item.id"
            :item="item"
            :metric="metric"
            :analysed="review.analysed"
            :overlay="overlay"
            :command="command"
            class="flex-1"
            @frame="frame = $event"
            @overlay="overlay = $event"
            @metric="selectMetric"
            @failed="interact"
          />
          <ClinicalEvidence
            :item="item"
            :experience="experience"
            :analysed="review.analysed"
            :selected="metricId"
            :frame="frame"
            @metric="selectMetric"
            @seek="issue('seek', $event)"
          />
        </section>
        <ClinicalMeasurements
          :item="item"
          :metric="metric"
          :analysed="review.analysed"
          :confirmed="review.confirmed"
          @select="selectMetric"
          @analyse="analyse"
          @confirm="review.confirmed = !review.confirmed"
          @report="reportOpen = true"
        />
      </div>
      <footer
        class="flex items-center justify-between border-t border-line bg-white px-6 text-[10px] text-muted"
      >
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-1.5"
            ><span class="size-1.5 rounded-full bg-brand" />示範病例</span
          ><span>已分析 {{ reviewed }} / {{ cases.length }}</span
          ><span>{{
            review.analysed ? "量測結果可回溯至對應影像" : "選擇檢查並啟動 AI 分析"
          }}</span>
        </div>
        <div class="flex items-center gap-5">
          <ImageSources /><a href="#/showcase" class="hover:text-brand">量測展示 ↗</a
          ><span>iHeart · 3D Analysis &amp; Visualization</span>
        </div>
      </footer>
    </div>
    <ClinicalReport
      v-if="reportOpen"
      :item="item"
      :experience="experience"
      :exam="exam"
      :confirmed="review.confirmed"
      @close="reportOpen = false"
    />
  </main>
</template>
