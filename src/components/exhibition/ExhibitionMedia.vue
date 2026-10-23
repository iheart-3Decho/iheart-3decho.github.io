<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { exhibitionAsset, type ExhibitionMedia } from "../../exhibition/projects";
import Icon from "../Icon.vue";

const props = defineProps<{ media: ExhibitionMedia }>();
const video = ref<HTMLVideoElement>();
const failed = ref(false);
const retryKey = ref(0);
watch(
  () => props.media.src,
  () => (failed.value = false),
);
onBeforeUnmount(() => video.value?.pause());
</script>

<template>
  <div
    class="relative flex h-full min-h-0 items-center justify-center overflow-hidden rounded-xl bg-[#0b1218]"
  >
    <div
      v-if="failed"
      class="flex flex-col items-center gap-4 p-8 text-center text-white"
      role="alert"
    >
      <Icon name="info" :size="28" />
      <p>這份示範素材暫時未能載入</p>
      <button
        class="rounded-lg bg-white/15 px-5 py-2 hover:bg-white/25"
        @click="
          failed = false;
          retryKey++;
        "
      >
        重新載入
      </button>
    </div>
    <video
      v-else-if="media.type === 'video'"
      :key="`${media.src}-${retryKey}`"
      ref="video"
      :src="exhibitionAsset(media.src)"
      :poster="media.poster ? exhibitionAsset(media.poster) : undefined"
      :aria-label="media.alt"
      controls
      playsinline
      preload="metadata"
      class="h-full max-h-full w-full object-contain"
      @error="failed = true"
    />
    <img
      v-else
      :key="`${media.src}-${retryKey}`"
      :src="exhibitionAsset(media.src)"
      :alt="media.alt"
      class="h-full max-h-full w-full object-contain"
      @error="failed = true"
    />
  </div>
</template>
