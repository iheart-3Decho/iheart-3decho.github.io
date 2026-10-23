<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import {
  exhibitionAsset,
  type ExhibitionMedia,
  type ExhibitionProject,
} from "../../exhibition/projects";
import Icon from "../Icon.vue";

const props = defineProps<{ project: ExhibitionProject }>();
const active = ref(0);
const failed = ref(false);
let timer: number | undefined;
const current = () => props.project.media[active.value]!;

function advance() {
  active.value = (active.value + 1) % props.project.media.length;
  failed.value = false;
}
function mediaStyle(_media: ExhibitionMedia) {
  return "object-contain";
}
onMounted(() => {
  timer = window.setInterval(advance, 5200);
});
onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
});
</script>

<template>
  <article
    :data-project="project.id"
    class="overflow-hidden rounded-2xl border border-line bg-white text-left shadow-[0_4px_20px_#213c4b05]"
  >
    <div
      class="relative h-[185px] overflow-hidden xl:h-[185px]"
      :class="project.id === 'visualization' ? 'bg-[#0b1218]' : 'bg-[#e9eff1]'"
      aria-live="polite"
    >
      <div :key="`${current().src}-${active}`" class="h-full w-full animate-enter">
        <video
          v-if="current().type === 'video'"
          :src="exhibitionAsset(current().src)"
          :poster="current().poster ? exhibitionAsset(current().poster!) : undefined"
          :aria-label="current().alt"
          autoplay
          muted
          loop
          playsinline
          preload="metadata"
          :class="mediaStyle(current())"
          class="h-full w-full"
          @error="failed = true"
        />
        <img
          v-else
          :src="exhibitionAsset(current().src)"
          :alt="current().alt"
          :class="mediaStyle(current())"
          class="h-full w-full"
          @error="failed = true"
        />
      </div>
      <div
        v-if="failed"
        class="absolute inset-0 grid place-items-center bg-[#0b1218] text-[12px] text-white"
      >
        <button
          class="rounded-lg bg-white/15 px-4 py-2 hover:bg-white/25"
          @click="
            failed = false;
            advance();
          "
        >
          重新載入素材
        </button>
      </div>
      <div
        class="absolute top-3 left-3 rounded-lg bg-white/95 px-2.5 py-1.5 text-[12px] font-semibold tracking-wider text-ink"
      >
        DEMO {{ project.number }}
      </div>
      <div
        class="absolute right-3 bottom-3 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-[11px] text-white backdrop-blur-sm"
      >
        {{ current().label }}
        <span class="text-white/60">{{ active + 1 }}/{{ project.media.length }}</span>
      </div>
      <div class="absolute bottom-3 left-3 flex gap-1.5" aria-label="自動輪播進度">
        <span
          v-for="(_, index) in project.media"
          :key="index"
          :class="index === active ? 'w-5 bg-white' : 'w-1.5 bg-white/50'"
          class="h-1.5 rounded-full transition-all duration-300"
        />
      </div>
    </div>
    <div class="p-3 xl:px-4 xl:py-3">
      <div class="flex items-center justify-between gap-2">
        <h3 class="text-[20px] font-semibold tracking-tight">{{ project.title }}</h3>
        <span class="grid size-8 place-items-center rounded-full bg-[#eff7f6] text-brand"
          ><Icon :name="project.icon" :size="18"
        /></span>
      </div>
      <p class="mt-1 text-[12px] leading-relaxed text-muted">{{ project.question }}</p>
      <div class="mt-2 flex flex-wrap gap-1.5">
        <span
          v-for="tag in project.tags"
          :key="tag"
          class="rounded-md bg-[#f2f6f7] px-2 py-0.5 text-[10px] text-[#59717c]"
          >{{ tag }}</span
        >
      </div>
    </div>
  </article>
</template>
