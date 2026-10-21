import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import type { DemoCase } from "../types";
import type { ExperienceData } from "../experience/types";

export interface PlaybackCommand {
  sequence: number;
  action: "play" | "pause" | "seek";
  frame?: number;
}
export interface ReviewState {
  analysed: boolean;
  confirmed: boolean;
}
export const examNumber = (index: number) => `IH-${String(index + 1).padStart(3, "0")}`;
export const viewCode = (item: DemoCase) => (item.kind === "function" ? "A4C" : "PLAX");
export const evidenceKey = (item: DemoCase, metricId: string) =>
  item.kind === "function" ? (metricId === "esv" ? "es" : "ed") : metricId;

export function useClinicalSession(cases: DemoCase[], data: ExperienceData) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const automatic = ref(!reduced.matches);
  const caseId = ref(data.function.caseId);
  const metricId = ref("ef");
  const overlay = ref(true);
  const reportOpen = ref(false);
  const frame = ref(0);
  const elapsed = ref(0);
  const playlistIndex = ref(0);
  const reviews = reactive<Record<string, ReviewState>>(
    Object.fromEntries(cases.map((item) => [item.id, { analysed: false, confirmed: false }])),
  );
  const item = computed(() => cases.find((entry) => entry.id === caseId.value)!);
  const metric = computed(() => item.value.metrics.find((entry) => entry.id === metricId.value)!);
  const review = computed(() => reviews[caseId.value]!);
  const experience = computed(() => data.library.find((entry) => entry.caseId === caseId.value)!);
  const command = ref<PlaybackCommand>({
    sequence: 0,
    action: automatic.value ? "play" : "pause",
  });
  let lastActivity = Date.now();
  let timer: ReturnType<typeof setInterval>;
  function issue(action: PlaybackCommand["action"], target?: number) {
    command.value = { sequence: command.value.sequence + 1, action, frame: target };
  }
  function interact() {
    automatic.value = false;
    lastActivity = Date.now();
  }
  function selectMetric(id: string) {
    metricId.value = id;
    overlay.value = true;
    issue("seek", metric.value.evidence.frame);
  }
  function selectCase(id: string) {
    reportOpen.value = false;
    caseId.value = id;
    metricId.value = item.value.kind === "function" ? "ef" : "lvidd";
    overlay.value = true;
    frame.value = 0;
    if (review.value.analysed) selectMetric(metricId.value);
    else issue("play");
  }
  function analyse() {
    review.value.analysed = true;
    review.value.confirmed = false;
    selectMetric(metricId.value);
  }
  function showPreview(index: number) {
    const preview = data.playlist[index]!;
    playlistIndex.value = index;
    reportOpen.value = false;
    reviews[preview.caseId] = { analysed: false, confirmed: false };
    caseId.value = preview.caseId;
    metricId.value = preview.metric;
    overlay.value = true;
    elapsed.value = 0;
    frame.value = 0;
    issue("play");
  }
  function resume() {
    for (const entry of Object.values(reviews)) {
      entry.analysed = false;
      entry.confirmed = false;
    }
    automatic.value = true;
    showPreview(0);
  }
  function motionChanged(event: MediaQueryListEvent) {
    if (event.matches) {
      interact();
      issue("pause");
    }
  }
  onMounted(() => {
    if (automatic.value) showPreview(0);
    reduced.addEventListener("change", motionChanged);
    timer = setInterval(() => {
      if (automatic.value) {
        elapsed.value++;
        if (elapsed.value === 5) analyse();
        if (elapsed.value === 8) reportOpen.value = true;
        if (elapsed.value >= 12) showPreview((playlistIndex.value + 1) % data.playlist.length);
      } else if (!reduced.matches && Date.now() - lastActivity >= 120000) resume();
    }, 1000);
  });
  onBeforeUnmount(() => {
    clearInterval(timer);
    reduced.removeEventListener("change", motionChanged);
  });
  return {
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
  };
}
