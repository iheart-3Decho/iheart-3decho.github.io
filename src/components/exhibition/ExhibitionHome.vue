<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { exhibitionAsset, projects, type ExhibitionProject } from "../../exhibition/projects";
import Icon from "../Icon.vue";
import ProjectCard from "./ProjectCard.vue";
import ExhibitionDialog from "./ExhibitionDialog.vue";

const selected = ref<ExhibitionProject>();
const intro = ref(false);
const hero = ref<HTMLVideoElement>();
const playing = ref(false);
let resumeAfterDialog = false;
const failed = ref(false);
let reduceMotion: MediaQueryList | undefined;
const oldTitle = document.title;
function pause() {
  hero.value?.pause();
}
async function play() {
  try {
    await hero.value?.play();
  } catch {
    playing.value = false;
  }
}
function select(project: ExhibitionProject) {
  resumeAfterDialog = playing.value;
  pause();
  selected.value = project;
}
function showIntro() {
  resumeAfterDialog = playing.value;
  pause();
  intro.value = true;
}
function close() {
  selected.value = undefined;
  intro.value = false;
  if (resumeAfterDialog && !reduceMotion?.matches) void play();
}
function motionChange() {
  if (reduceMotion?.matches) pause();
}
function focusProjects() {
  document.getElementById("exhibition-projects")?.focus();
}
onMounted(() => {
  document.title = "iHeart — 心臟超聲 · 三維視覺化與智能分析";
  reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  reduceMotion.addEventListener("change", motionChange);
});
onBeforeUnmount(() => {
  pause();
  reduceMotion?.removeEventListener("change", motionChange);
  document.title = oldTitle;
});
</script>

<template>
  <div data-exhibition class="min-h-dvh bg-[#f5f8fa] text-ink">
    <a
      href="#exhibition-projects"
      class="fixed top-2 left-4 z-50 -translate-y-24 rounded-lg bg-brand px-4 py-3 text-white focus:translate-y-0"
      @click.prevent="focusProjects"
      >跳至三項演示</a
    >
    <header class="border-b border-line bg-white/85">
      <div
        class="mx-auto flex h-[76px] max-w-[1824px] items-center justify-between gap-5 px-5 lg:px-10"
      >
        <a href="#/" class="flex items-center gap-3" aria-label="iHeart 展示首頁"
          ><span
            class="grid size-10 place-items-center rounded-xl bg-brand text-white shadow-[0_4px_12px_#147e7d20]"
            ><Icon name="heart" :size="23" /></span
          ><span class="text-[28px] font-semibold tracking-[-1px]">iHeart</span
          ><span
            class="ml-3 hidden border-l border-line pl-5 text-[12px] font-medium tracking-wide text-muted sm:block"
            >3D Analysis &amp; Visualization</span
          ></a
        >
        <nav aria-label="主要導覽" class="flex items-center gap-3 md:gap-7">
          <span class="hidden items-center gap-2 text-[12px] text-muted lg:flex"
            ><span class="size-1.5 rounded-full bg-brand" />InnoCarnival 2026</span
          >
          <button
            class="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 text-[12px] font-medium hover:bg-canvas md:px-4"
            @click="showIntro"
          >
            <Icon name="play" :size="14" /><span>觀看介紹影片</span>
          </button>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-[1824px] px-5 pt-7 pb-5 lg:px-10 lg:pt-9">
      <section
        class="grid items-center gap-8 lg:grid-cols-[.85fr_1.15fr] lg:gap-12"
        aria-labelledby="exhibition-title"
      >
        <div class="py-3 lg:py-6">
          <p
            class="mb-5 flex items-center gap-2.5 text-[12px] font-semibold tracking-[.18em] text-brand"
          >
            <span class="h-px w-6 bg-brand" />三分鐘，認識我們的三項研究
          </p>
          <h1
            id="exhibition-title"
            class="text-[38px] leading-[1.25] font-semibold tracking-[-1.5px] md:text-[50px] xl:text-[58px]"
          >
            從心臟影像，<br /><span class="text-brand">看見更多可能。</span>
          </h1>
          <p class="mt-5 max-w-[575px] text-[15px] leading-[1.9] text-[#607682] xl:text-[16px]">
            心臟超聲讓醫生觀察心臟的形態與運動。從三維視覺化、解剖引導分割，到影片中的心臟量測——透過一段介紹影片，認識
            iHeart 的三項研究。
          </p>
          <div class="mt-7 flex flex-wrap items-center gap-3">
            <button
              class="flex items-center gap-3 rounded-xl bg-brand px-5 py-3.5 text-[14px] font-semibold text-white shadow-[0_6px_20px_#147e7d20] hover:bg-[#126d6c]"
              @click="showIntro"
            >
              <Icon name="play" :size="17" />觀看完整介紹
            </button>
            <button
              class="flex items-center gap-2 rounded-xl px-3 py-3 text-[13px] text-[#58717d] hover:bg-white"
              @click="focusProjects"
            >
              探索三項演示<Icon name="arrow" :size="15" />
            </button>
          </div>
          <div
            class="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-5 text-[12px] font-medium text-[#6a818c]"
          >
            <span class="flex items-center gap-2"><Icon name="layers" :size="17" />探索空間</span
            ><span class="flex items-center gap-2"><Icon name="scan" :size="17" />辨識結構</span
            ><span class="flex items-center gap-2"><Icon name="chart" :size="17" />量化功能</span>
          </div>
        </div>
        <div
          class="overflow-hidden rounded-2xl border border-[#dce7eb] bg-[#0a1218] shadow-[0_18px_55px_#19324012]"
        >
          <div
            class="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-3 text-[11px] text-[#aec2cc]"
          >
            <span class="flex items-center gap-2"
              ><span class="size-1.5 rounded-full bg-[#77c5b6]" />iHeart · 三項研究完整介紹</span
            ><span>03:23</span>
          </div>
          <div class="relative aspect-[16/9] lg:aspect-auto lg:h-[335px] xl:h-[410px]">
            <video
              v-show="!failed"
              ref="hero"
              :src="exhibitionAsset('iheart-overview.mp4')"
              :poster="exhibitionAsset('overview-poster.jpg')"
              aria-label="iHeart 三項研究完整介紹影片"
              controls
              loop
              muted
              playsinline
              preload="metadata"
              class="h-full w-full object-contain"
              @play="playing = true"
              @pause="playing = false"
              @error="failed = true"
            />
            <div
              v-if="failed"
              role="alert"
              class="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white"
            >
              <p>影片暫時未能載入</p>
              <button
                class="rounded-lg bg-white/15 px-4 py-2"
                @click="
                  failed = false;
                  hero?.load();
                  play();
                "
              >
                重新載入
              </button>
            </div>
          </div>
          <div class="flex items-center justify-between gap-4 px-5 py-3 text-[12px] text-[#b2c8d1]">
            <span>三維視覺化 · 解剖引導分割 · 心超量測</span
            ><button
              v-if="!failed"
              :aria-label="playing ? '暫停首頁影片' : '播放首頁影片'"
              class="flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-white/10"
              @click="playing ? pause() : play()"
            >
              <Icon :name="playing ? 'pause' : 'play'" :size="14" /><span
                class="hidden sm:inline"
                >{{ playing ? "暫停" : "播放" }}</span
              >
            </button>
          </div>
        </div>
      </section>

      <section
        id="exhibition-projects"
        tabindex="-1"
        aria-labelledby="projects-title"
        class="mt-7 scroll-mt-5 outline-none"
      >
        <div class="mb-5 flex items-end justify-between gap-4">
          <div>
            <p class="mb-2 text-[10px] font-semibold tracking-[.2em] text-brand">
              EXPLORE THE DEMOS
            </p>
            <h2 id="projects-title" class="text-[24px] font-semibold tracking-tight">
              三項技術，看懂心臟影像。
            </h2>
          </div>
          <p class="hidden text-[12px] text-muted sm:block">
            選一項演示，查看實際影像與研究成果<Icon
              name="arrow"
              :size="15"
              class="ml-2 inline-block align-middle"
            />
          </p>
        </div>
        <div class="grid gap-5 md:grid-cols-3">
          <ProjectCard
            v-for="project in projects"
            :key="project.id"
            :project="project"
            @select="select"
          />
        </div>
      </section>
    </main>
    <footer
      class="mx-auto flex max-w-[1824px] flex-wrap items-center justify-between gap-3 px-5 py-3 text-[11px] text-muted lg:px-10"
    >
      <span>iHeart · 3D Analysis &amp; Visualization</span
      ><span>心臟超聲研究演示 · 視覺化、結構辨識與影片量測</span
      ><a href="#/clinical" class="flex items-center gap-1 hover:text-brand"
        >互動工作站<Icon name="arrow" :size="13"
      /></a>
    </footer>
    <ExhibitionDialog v-if="selected || intro" :project="selected" :intro="intro" @close="close" />
  </div>
</template>
