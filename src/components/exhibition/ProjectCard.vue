<script setup lang="ts">
import { exhibitionAsset, type ExhibitionProject } from "../../exhibition/projects";
import Icon from "../Icon.vue";
defineProps<{ project: ExhibitionProject }>();
defineEmits<{ select: [project: ExhibitionProject] }>();
</script>

<template>
  <button
    :data-project="project.id"
    :aria-label="`探索${project.title}`"
    class="group overflow-hidden rounded-2xl border border-line bg-white text-left shadow-[0_4px_20px_#213c4b05] transition duration-300 hover:-translate-y-1 hover:border-brand/35 hover:shadow-[0_15px_30px_#213c4b10]"
    @click="$emit('select', project)"
  >
    <div
      class="relative h-[194px] overflow-hidden xl:h-[140px]"
      :class="project.id === 'visualization' ? 'bg-[#0b1218]' : 'bg-[#e9eff1]'"
    >
      <img
        :src="exhibitionAsset(project.poster)"
        :alt="project.media[0]!.alt"
        class="h-full w-full object-contain transition-transform duration-700 group-hover:scale-[1.035]"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      <span
        class="absolute top-3 left-3 rounded-lg bg-white/95 px-2.5 py-1.5 text-[12px] font-semibold tracking-wider text-ink"
        >DEMO {{ project.number }}</span
      >
      <span
        class="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-semibold text-brand"
        ><Icon :name="project.id === 'visualization' ? 'play' : 'scan'" :size="14" />{{
          project.id === "visualization" ? "觀看影片" : "查看演示"
        }}</span
      >
    </div>
    <div class="p-5 xl:px-6 xl:py-5">
      <div class="flex items-center justify-between gap-2">
        <h3 class="text-[22px] font-semibold tracking-tight">{{ project.title }}</h3>
        <span
          class="grid size-9 place-items-center rounded-full bg-[#eff7f6] text-brand transition group-hover:bg-brand group-hover:text-white"
          ><Icon name="arrow" :size="18"
        /></span>
      </div>
      <p class="mt-2 text-[14px] leading-relaxed text-muted">{{ project.question }}</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <span
          v-for="tag in project.tags"
          :key="tag"
          class="rounded-md bg-[#f2f6f7] px-2 py-1 text-[11px] text-[#59717c]"
          >{{ tag }}</span
        >
      </div>
    </div>
  </button>
</template>
