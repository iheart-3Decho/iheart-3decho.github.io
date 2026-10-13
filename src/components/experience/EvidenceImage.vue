<script setup lang="ts">
import { ref, watch } from "vue";
const props = defineProps<{ src: string; alt: string }>();
const failed = ref(false),
  version = ref(0);
watch(
  () => props.src,
  () => {
    failed.value = false;
    version.value = 0;
  },
);
</script>
<template>
  <div class="relative h-full w-full">
    <img
      v-if="!failed"
      :src="version ? `${src}?retry=${version}` : src"
      :alt="alt"
      class="h-full w-full object-contain"
      @error="failed = true"
    />
    <div
      v-else
      role="alert"
      class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0c141d] text-white"
    >
      <p>量測畫面未能載入</p>
      <button
        class="rounded-xl bg-brand px-5 py-3 text-[14px]"
        @click="
          version++;
          failed = false;
        "
      >
        重新載入畫面
      </button>
    </div>
  </div>
</template>
