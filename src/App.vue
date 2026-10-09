<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import HomePage from "./components/HomePage.vue";
import CaseDetail from "./components/CaseDetail.vue";
import type { DemoCase } from "./types";

const cases = ref<DemoCase[]>([]);
const failed = ref(false),
  loaded = ref(false);
const route = ref(window.location.hash || "#/");
const caseId = computed(() =>
  route.value.startsWith("#/case/")
    ? decodeURIComponent(route.value.slice(7).split("?")[0]!)
    : "",
);
const initialMetric = computed(
  () =>
    new URLSearchParams(route.value.split("?")[1] ?? "").get("metric") ?? "",
);
const activeCase = computed(() =>
  cases.value.find((item) => item.id === caseId.value),
);
function syncRoute() {
  route.value = window.location.hash || "#/";
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
});
onBeforeUnmount(() => window.removeEventListener("hashchange", syncRoute));
</script>

<template>
  <HomePage v-if="!caseId" :cases="cases" :failed="failed" />
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
      {{
        failed
          ? "病例素材未能載入"
          : loaded
            ? "找不到這個示範病例"
            : "正在載入示範病例…"
      }}
    </h1>
    <a
      href="#/"
      class="rounded-lg bg-[#246c79] px-4 py-2 text-[13px] text-white hover:bg-[#318292]"
      >返回病例首頁</a
    >
  </main>
</template>
