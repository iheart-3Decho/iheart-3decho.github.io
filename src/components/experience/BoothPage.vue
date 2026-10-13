<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import type { DemoCase, Point } from "../../types";
import type {
  DimensionMetric,
  ExperienceData,
  ExperienceMode,
  ExperiencePhase,
  FrameSelection,
} from "../../experience/types";
import { dimensionGuides } from "../../experience/education";
import { useIdleReset } from "../../experience/useIdleReset";
import BoothWelcome from "./BoothWelcome.vue";
import BoothResults from "./BoothResults.vue";
import TaskPlayer from "./TaskPlayer.vue";
import HeartSketch from "./HeartSketch.vue";
import Icon from "../Icon.vue";
const props = defineProps<{ cases: DemoCase[]; data: ExperienceData }>();
const phase = ref<ExperiencePhase>("attract"),
  mode = ref<ExperienceMode>("function"),
  metric = ref<DimensionMetric>("lvidd");
const ed = ref<FrameSelection | null>(null),
  es = ref<FrameSelection | null>(null),
  selected = ref<FrameSelection | null>(null),
  points = ref<Point[]>([]);
const player = ref<InstanceType<typeof TaskPlayer>>(),
  ready = ref(false),
  busy = ref(false),
  error = ref("");
let revealTimer: ReturnType<typeof setTimeout> | undefined;
let session = 0;
const item = computed(() => props.cases.find((c) => c.id === props.data[mode.value].caseId)!);
const guide = computed(() => dimensionGuides[metric.value]);
const active = computed(() => phase.value !== "attract");
const idle = useIdleReset(active, reset);
const step = computed(() =>
  ["ed", "frame"].includes(phase.value) ? 1 : ["es", "draw"].includes(phase.value) ? 2 : 3,
);
const title = computed(() =>
  phase.value === "ed"
    ? "找心臟裝滿血的那一刻"
    : phase.value === "es"
      ? "再找收縮後，心室最小的那一刻"
      : phase.value === "frame"
        ? guide.value.question
        : phase.value === "draw"
          ? "點選兩端，畫出你的量測線"
          : "準備好看看 AI 的選擇嗎？",
);
function reset() {
  session++;
  clearTimeout(revealTimer);
  busy.value = false;
  error.value = "";
  ed.value = null;
  es.value = null;
  selected.value = null;
  points.value = [];
  ready.value = false;
  metric.value = "lvidd";
  phase.value = "attract";
}
function start(next: ExperienceMode) {
  reset();
  mode.value = next;
  phase.value = next === "function" ? "ed" : "frame";
}
async function edit(target: ExperiencePhase) {
  phase.value = target;
  error.value = "";
  await nextTick();
  const selection = target === "ed" ? ed.value : target === "es" ? es.value : selected.value;
  if (selection) player.value?.seek(selection.frame);
}
function changeMetric(next: DimensionMetric) {
  metric.value = next;
  selected.value = null;
  points.value = [];
  error.value = "";
  phase.value = "frame";
}
async function confirm() {
  if (busy.value) return;
  error.value = "";
  busy.value = true;
  const currentSession = session;
  try {
    if (phase.value === "draw") {
      if (points.value.length !== 2) return;
      phase.value = "review";
    } else {
      const snapshot = await player.value!.capture();
      if (currentSession !== session) return;
      if (phase.value === "ed") {
        ed.value = snapshot;
        phase.value = "es";
      } else if (phase.value === "es") {
        if (snapshot.frame === ed.value?.frame) {
          error.value = "請選另一個畫面，兩個時刻不能完全相同。";
          return;
        }
        es.value = snapshot;
        phase.value = "review";
      } else {
        selected.value = snapshot;
        points.value = [];
        phase.value = "draw";
      }
    }
  } catch {
    if (currentSession === session) error.value = "影片畫面尚未準備完成，請稍候或重新載入。";
  } finally {
    if (currentSession === session) busy.value = false;
  }
}
function reveal() {
  phase.value = "revealing";
  revealTimer = setTimeout(
    () => {
      phase.value = "results";
    },
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650,
  );
}
onBeforeUnmount(() => clearTimeout(revealTimer));
</script>
<template>
  <main
    class="flex h-dvh min-h-0 flex-col overflow-hidden bg-canvas px-[48px] py-[26px] text-ink"
    data-booth
    :data-phase="phase"
    :data-mode="mode"
  >
    <header
      class="mb-6 flex h-[56px] shrink-0 items-center justify-between border-b border-line pb-5"
    >
      <a
        href="#/"
        class="flex items-center gap-3 text-[30px] font-semibold tracking-tight"
        @click.prevent="reset"
        ><span class="grid size-10 place-items-center rounded-xl bg-brand text-white"
          ><Icon name="heart" :size="25" /></span
        >iHeart<span
          class="ml-4 border-l border-line pl-5 text-[12px] font-normal tracking-wide text-muted"
          >3D Analysis &amp; Visualization</span
        ></a
      >
      <div v-if="active" class="flex gap-8 text-[15px]">
        <span
          v-for="(label, i) in mode === 'function'
            ? ['找到充盈', '找到收縮', '查看 AI 量測']
            : ['選擇畫面', '畫出位置', '查看 AI 量測']"
          :key="label"
          :class="step === i + 1 ? 'font-semibold text-brand' : 'text-muted'"
          ><b
            class="mr-2 inline-grid size-7 place-items-center rounded-full"
            :class="step === i + 1 ? 'bg-brand text-white' : 'bg-white'"
            >{{ i + 1 }}</b
          >{{ label }}</span
        >
      </div>
      <div class="flex items-center gap-5 text-[13px] text-muted">
        <span>約 1–2 分鐘 · 自己試試看</span
        ><button
          v-if="active"
          class="rounded-lg border border-line bg-white px-4 py-2"
          @click="reset"
        >
          結束體驗</button
        ><a v-else class="rounded-lg border border-line bg-white px-4 py-2" href="#/showcase"
          >瀏覽完整展示 ↗</a
        >
      </div>
    </header>
    <div class="min-h-0 flex-1">
      <BoothWelcome v-if="phase === 'attract'" :cases="cases" :data="data" @start="start" />
      <BoothResults
        v-else-if="phase === 'results'"
        :item="item"
        :mode="mode"
        :data="data[mode]"
        :ed="ed"
        :es="es"
        :selected="selected"
        :points="points"
        :metric="metric"
        @edit="edit(mode === 'function' ? 'es' : 'draw')"
        @restart="start(mode)"
        @other="start(mode === 'function' ? 'dimension' : 'function')"
        @home="reset"
      />
      <div v-else class="grid h-full min-h-0 grid-cols-[1.65fr_1fr] gap-7">
        <div
          v-if="phase === 'review' || phase === 'revealing'"
          class="flex min-h-0 flex-col rounded-[28px] border border-line bg-white p-7"
          data-review
        >
          <h2 class="mb-5 text-[23px] font-semibold">
            這是你選擇的{{ mode === "function" ? "兩個時刻" : "量測位置" }}
          </h2>
          <div
            class="grid min-h-0 flex-1 gap-6"
            :class="mode === 'function' ? 'grid-cols-2' : 'grid-cols-1'"
          >
            <figure
              v-for="(snapshot, i) in mode === 'function' ? [ed, es] : [selected]"
              :key="i"
              class="flex min-h-0 flex-col"
            >
              <div class="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-[#0c141d]">
                <img
                  :src="snapshot!.image"
                  alt="你選擇的畫面"
                  class="h-full w-full object-contain"
                /><svg
                  v-if="mode === 'dimension' && points.length === 2"
                  :viewBox="`0 0 ${item.width} ${item.height}`"
                  class="absolute inset-0 h-full w-full"
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
                </svg>
              </div>
              <figcaption class="flex items-center justify-between pt-4 text-[17px]">
                <span
                  >{{ mode === "function" ? (i === 0 ? "充盈最大" : "收縮最小") : guide.label }} ·
                  {{ (snapshot!.frame / item.fps).toFixed(2) }} 秒</span
                ><button
                  class="text-blue underline underline-offset-4"
                  :disabled="phase === 'revealing'"
                  @click="edit(mode === 'function' ? (i === 0 ? 'ed' : 'es') : 'draw')"
                >
                  修改
                </button>
              </figcaption>
            </figure>
          </div>
          <p class="pt-5 text-[14px] text-muted">
            這些是你在影片中選出的畫面。下一步，看看 AI 找到的時刻與量測依據。
          </p>
        </div>
        <TaskPlayer
          v-else
          ref="player"
          :key="mode"
          :item="item"
          :initial-frame="phase === 'ed' ? ed?.frame : phase === 'es' ? es?.frame : selected?.frame"
          :drawing="phase === 'draw'"
          :selection="selected"
          :points="points"
          @points="points = $event"
          @ready="ready = $event"
        />
        <aside class="flex min-h-0 flex-col rounded-[28px] border border-line bg-white p-8">
          <div class="mb-5 flex justify-between text-[13px] text-brand">
            <span
              >{{ mode === "function" ? "泵血功能" : "心臟尺寸" }} · 示範病例
              {{ mode === "function" ? "01" : "02" }}</span
            ><span>步驟 {{ step }} / 3</span>
          </div>
          <h1 class="text-[35px] font-semibold leading-[1.35] tracking-tight">{{ title }}</h1>
          <div v-if="mode === 'dimension' && phase === 'frame'" class="mt-5 grid grid-cols-2 gap-2">
            <button
              v-for="(option, id) in dimensionGuides"
              :key="id"
              class="rounded-xl border px-3 py-3 text-left text-[13px]"
              :class="
                metric === id ? 'border-brand bg-brand/5 text-brand' : 'border-line text-muted'
              "
              @click="changeMetric(id)"
            >
              {{ option.label }}<span class="ml-2 text-[11px]">{{ option.code }}</span>
            </button>
          </div>
          <HeartSketch
            class="my-5 min-h-0 max-h-[260px] flex-1"
            :kind="mode === 'dimension' ? metric : phase === 'ed' ? 'ed' : 'es'"
          />
          <p class="text-[19px] leading-[1.7] text-muted">
            {{
              phase === "review" || phase === "revealing"
                ? "點一下，揭示這段影片已有的 AI 分析結果，並比較畫面與量測位置。"
                : mode === "function"
                  ? phase === "ed"
                    ? "想像心室是一個幫浦。先找它腔室最大、準備泵血的畫面。拖動時間軸，或慢放仔細看。"
                    : "心臟收縮，把血液泵出。找腔室最小的畫面；它不必出現在你剛才選的時刻之後。"
                  : phase === "draw"
                    ? "依照示意圖，在影像上點兩個端點。端點可以拖動調整，也可以清除重畫。"
                    : guide.instruction
            }}
          </p>
          <div class="mt-auto pt-6">
            <p
              v-if="error"
              role="alert"
              class="mb-4 rounded-xl bg-[#fff2df] p-3 text-[15px] text-[#946a25]"
            >
              {{ error }}
            </p>
            <button
              v-if="phase === 'review' || phase === 'revealing'"
              class="flex w-full items-center justify-center gap-3 rounded-2xl bg-brand py-5 text-[22px] font-semibold text-white disabled:opacity-70"
              :disabled="phase === 'revealing'"
              data-reveal
              @click="reveal"
            >
              <Icon name="scan" :size="24" />{{
                phase === "revealing" ? "打開量測結果…" : "開始 AI 分析"
              }}</button
            ><button
              v-else
              class="w-full rounded-2xl bg-brand py-5 text-[21px] font-semibold text-white disabled:opacity-40"
              :disabled="busy || (phase === 'draw' ? points.length !== 2 : !ready)"
              data-confirm
              @click="confirm"
            >
              {{ phase === "draw" ? "確認我的量測線" : "就是這個畫面" }} →</button
            ><button
              v-if="phase === 'es' || phase === 'draw'"
              class="mt-4 w-full text-[14px] text-blue"
              @click="edit(phase === 'es' ? 'ed' : 'frame')"
            >
              ← 返回修改{{ phase === "es" ? "充盈畫面" : "量測畫面" }}
            </button>
            <p class="mt-5 text-center text-[12px] text-muted">
              不用醫學知識，也能從畫面開始認識心臟。
            </p>
          </div>
        </aside>
      </div>
    </div>
    <div
      v-if="idle.countdown.value > 0"
      class="fixed inset-0 z-50 grid place-items-center bg-ink/40"
      data-idle-warning
    >
      <section
        class="w-[580px] rounded-[28px] bg-white p-10 text-center shadow-xl"
        role="alertdialog"
        aria-modal="true"
        aria-label="閒置復位提醒"
      >
        <Icon name="clock" :size="40" class="mx-auto mb-5 text-brand" />
        <h2 class="text-[28px] font-semibold">還要繼續體驗嗎？</h2>
        <p class="my-5 text-[19px] text-muted">
          {{ idle.countdown.value }} 秒後將清空選擇，回到首頁。
        </p>
        <button
          autofocus
          class="rounded-xl bg-brand px-9 py-4 text-[19px] text-white"
          @click="idle.continueSession"
        >
          繼續體驗</button
        ><button class="mt-5 block w-full text-muted" @click="reset">返回首頁</button>
      </section>
    </div>
  </main>
</template>
