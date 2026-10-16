<script setup lang="ts">
import { ref } from "vue";
const opened = ref(false);
</script>
<template>
  <button class="text-blue underline decoration-blue/30 underline-offset-4" @click="opened = true">
    影像來源
  </button>
  <div
    v-if="opened"
    class="fixed inset-0 z-50 grid place-items-center bg-ink/35 text-left text-[16px] font-normal leading-relaxed tracking-normal text-ink"
    @click.self="opened = false"
    @keydown.esc="opened = false"
  >
    <section
      class="w-[720px] rounded-3xl bg-white p-10 shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-label="示範影像來源"
    >
      <h2 class="mb-6 text-[26px] font-semibold">示範影像來源</h2>
      <p class="mb-4">
        EchoXFlow · Ahus-AIM / Akershus University Hospital。影像經幾何還原及影片格式轉換；AI
        輪廓與量測標示由 iHeart 模型產生。
      </p>
      <p class="mb-6">
        <a
          href="https://huggingface.co/datasets/Ahus-AIM/EchoXFlow"
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue underline"
          >EchoXFlow 資料集 ↗</a
        >
        ·
        <a
          href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue underline"
          >CC BY-NC-SA 4.0</a
        >
      </p>
      <p class="mb-6">
        其他示範影像：<a
          href="https://www.creatis.insa-lyon.fr/Challenge/ted/"
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue underline"
          >TED</a
        >、<a
          href="https://echonet.github.io/lvh/"
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue underline"
          >EchoNet-LVH</a
        >。各病例來源保留於資料清單。
      </p>
      <button autofocus class="rounded-xl bg-brand px-7 py-3 text-white" @click="opened = false">
        返回展示
      </button>
    </section>
  </div>
</template>
