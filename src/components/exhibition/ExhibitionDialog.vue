<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { ExhibitionMedia as Media, ExhibitionProject } from "../../exhibition/projects";
import ExhibitionMedia from "./ExhibitionMedia.vue";
import Icon from "../Icon.vue";

const props = defineProps<{ project?: ExhibitionProject; intro?: boolean }>();
const emit = defineEmits<{ close: [] }>();
const dialog = ref<HTMLDialogElement>();
const active = ref(0);
const overview: Media = {
  label: "完整介紹",
  src: "iheart-overview.mp4",
  type: "video",
  poster: "overview-poster.jpg",
  alt: "iHeart 三項研究演示的完整介紹影片",
  caption: "約三分鐘，依次介紹三維視覺化、解剖引導分割與心超影片量測。可開啟聲音觀看。",
};
const media = computed(() => (props.intro ? overview : props.project!.media[active.value]!));
function close() {
  dialog.value?.close();
}
function backdrop(event: MouseEvent) {
  if (event.target === dialog.value) close();
}
watch(
  () => props.project?.id,
  () => (active.value = 0),
);
onMounted(() => {
  document.body.style.overflow = "hidden";
  dialog.value?.showModal();
});
onBeforeUnmount(() => {
  document.body.style.overflow = "";
});
</script>

<template>
  <dialog
    ref="dialog"
    aria-labelledby="exhibition-dialog-title"
    class="fixed inset-0 m-auto flex h-[min(900px,92dvh)] max-h-none w-[min(1460px,94vw)] max-w-none flex-col gap-5 overflow-y-auto rounded-2xl border-0 bg-canvas p-5 text-ink shadow-2xl backdrop:bg-[#142934]/70 backdrop:backdrop-blur-sm md:p-7"
    @close="emit('close')"
    @click="backdrop"
  >
    <header class="flex items-center justify-between gap-4">
      <div>
        <p class="mb-1 text-[11px] font-semibold tracking-[.18em] text-brand">
          {{
            intro
              ? "IHEART · RESEARCH DEMONSTRATION"
              : `DEMO ${project!.number} · ${project!.english}`
          }}
        </p>
        <h2 id="exhibition-dialog-title" class="text-[23px] font-semibold md:text-[28px]">
          {{ intro ? "看見心臟的三種方式" : project!.title }}
        </h2>
      </div>
      <button
        autofocus
        aria-label="關閉演示"
        class="grid size-10 place-items-center rounded-full bg-white text-xl text-muted hover:bg-line"
        @click="close"
      >
        ✕
      </button>
    </header>
    <div class="flex shrink-0 flex-col gap-5 lg:min-h-0 lg:flex-1 lg:flex-row">
      <div class="flex flex-col gap-3 lg:min-h-0 lg:flex-1">
        <div v-if="!intro" class="flex flex-wrap gap-2" aria-label="示範素材">
          <button
            v-for="(item, index) in project!.media"
            :key="item.src"
            :aria-pressed="active === index"
            :class="active === index ? 'bg-brand text-white' : 'bg-white text-muted hover:bg-line'"
            class="rounded-lg px-4 py-2 text-[13px]"
            @click="active = index"
          >
            {{ item.label }}
          </button>
        </div>
        <div class="h-[300px] lg:h-auto lg:min-h-0 lg:flex-1">
          <ExhibitionMedia :key="media.src" :media="media" />
        </div>
        <p class="text-[12px] leading-relaxed text-muted">{{ media.caption }}</p>
      </div>
      <aside
        v-if="project"
        class="flex shrink-0 flex-col rounded-xl border border-line bg-white p-5 lg:w-[280px] lg:p-6"
      >
        <span class="mb-5 grid size-12 place-items-center rounded-xl bg-[#eaf5f3] text-brand"
          ><Icon :name="project.icon" :size="25"
        /></span>
        <h3 class="text-[21px] leading-snug">{{ project.question }}</h3>
        <p class="mt-4 text-[14px] leading-[1.9] text-muted">{{ project.description }}</p>
        <ol class="my-6 flex flex-col gap-4 p-0">
          <li
            v-for="(step, index) in project.steps"
            :key="step"
            class="flex list-none items-center gap-3 text-[13px]"
          >
            <span
              class="grid size-7 shrink-0 place-items-center rounded-full border border-brand/20 font-medium text-brand"
              >{{ index + 1 }}</span
            >{{ step }}
          </li>
        </ol>
        <a
          v-if="project.link"
          :href="project.link.href"
          class="mt-auto flex items-center justify-between gap-3 rounded-lg bg-brand px-4 py-3 text-[13px] font-semibold text-white hover:bg-[#126d6c]"
          @click="close"
          >{{ project.link.label }}<Icon name="arrow" :size="16"
        /></a>
        <p class="mt-5 border-t border-line pt-4 text-[11px] leading-relaxed text-muted">
          {{
            project.id === "analysis"
              ? "互動工作站使用預置模型結果，可回看量測依據。"
              : "圖片及影片為實際研究演示，保留原始結構與結果。"
          }}
        </p>
      </aside>
    </div>
  </dialog>
</template>
