<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import HomePage from "./components/HomePage.vue";
import CaseDetail from "./components/CaseDetail.vue";
import BoothPage from "./components/experience/BoothPage.vue";
import type { ExperienceData } from "./experience/types";
import type { DemoCase } from "./types";

const cases = ref<DemoCase[]>([]);
const experience = ref<ExperienceData>();
const experienceFailed = ref(false);
const isBooth = computed(() => route.value === "#/" || route.value === "#/experience");
const failed = ref(false),
  loaded = ref(false);
const route = ref(window.location.hash || "#/");
const caseId = computed(() =>
  route.value.startsWith("#/case/") ? decodeURIComponent(route.value.slice(7).split("?")[0]!) : "",
);
const initialMetric = computed(
  () => new URLSearchParams(route.value.split("?")[1] ?? "").get("metric") ?? "",
);
const activeCase = computed(() => cases.value.find((item) => item.id === caseId.value));
function syncRoute() {
  route.value = window.location.hash || "#/";
}
async function loadExperience() {
  experienceFailed.value = false;
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}experience/experience.json`);
    if (!response.ok) throw new Error("Missing experience");
    const data = await response.json();
    if (!data.function?.evidence?.ed || !data.dimension?.evidence?.lvidd)
      throw new Error("Invalid experience");
    experience.value = data;
  } catch {
    experienceFailed.value = true;
  }
}
async function load() {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}demo/cases.json`);
    if (!response.ok) throw new Error("Missing assets");
    const data = await response.json();
    if (
      !Array.isArray(data) ||
      data.length !== 6 ||
      !data.every(
        (item) =>
          item.caseTitle &&
          item.dataset &&
          item.phaseImages &&
          item.framePreviews?.length &&
          item.metrics?.length,
      )
    )
      throw new Error("Invalid cases");
    cases.value = data;
  } catch {
    failed.value = true;
  } finally {
    loaded.value = true;
  }
}
onMounted(() => {
  window.addEventListener("hashchange", syncRoute);
  void load();
  void loadExperience();
});
onBeforeUnmount(() => window.removeEventListener("hashchange", syncRoute));
</script>

<template>
  <BoothPage v-if="isBooth && experience && cases.length" :cases="cases" :data="experience" />
  <main
    v-else-if="isBooth"
    class="grid h-dvh place-content-center gap-5 bg-canvas text-center text-ink"
    role="status"
  >
    <h1 class="text-[25px]">
      {{ failed || experienceFailed ? "示範素材未能載入" : "正在準備互動體驗…" }}
    </h1>
    <button
      v-if="failed || experienceFailed"
      class="rounded-xl bg-brand px-7 py-3 text-white"
      @click="
        failed = false;
        load();
        loadExperience();
      "
    >
      重新載入</button
    ><a href="#/showcase" class="text-blue">瀏覽完整展示</a>
  </main>
  <HomePage v-else-if="!caseId" :cases="cases" :failed="failed" />
  <CaseDetail
    v-else-if="activeCase"
    :key="route"
    :item="activeCase"
    :initial-metric="initialMetric"
  />
  <main
    v-else
    class="flex h-dvh flex-col items-center justify-center gap-4 text-[#78909d]"
    role="status"
  >
    <h1 class="text-[24px]">
      {{ failed ? "病例素材未能載入" : loaded ? "找不到這個示範病例" : "正在載入示範病例…" }}
    </h1>
    <a
      href="#/showcase"
      class="rounded-lg bg-[#246c79] px-4 py-2 text-[13px] text-white hover:bg-[#318292]"
      >返回病例首頁</a
    >
  </main>
</template>
