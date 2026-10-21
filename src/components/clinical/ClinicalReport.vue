<script setup lang="ts">
import { computed } from "vue";
import type { DemoCase } from "../../types";
import type { ExperienceCase } from "../../experience/types";
import { experienceAsset } from "../../experience/types";
import { formatPosition } from "../../utils/demo";
import { viewCode } from "../../clinical/useClinicalSession";
import EvidenceImage from "../experience/EvidenceImage.vue";
import Icon from "../Icon.vue";
const props = defineProps<{
  item: DemoCase;
  experience: ExperienceCase;
  exam: string;
  confirmed: boolean;
}>();
const emit = defineEmits<{ close: []; metric: [id: string] }>();
const generated = new Date().toLocaleString("zh-HK", { hour12: false });
const images = computed(() =>
  props.item.kind === "function"
    ? [
        { key: "ed", id: "edv", label: "舒張末期 · ED" },
        { key: "es", id: "esv", label: "收縮末期 · ES" },
      ]
    : props.item.metrics.map((m) => ({ key: m.id, id: m.id, label: `${m.label} · ${m.code}` })),
);
function printReport() {
  window.print();
}
</script>
<template>
  <section
    role="region"
    aria-labelledby="clinical-report-title"
    class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-white text-ink print:block print:w-full print:overflow-visible print:rounded-none print:border-0"
    data-clinical-report-panel
  >
    <header
      class="flex h-14 shrink-0 items-center justify-between border-b border-line bg-canvas/60 px-5 print:hidden"
    >
      <span class="flex items-center gap-2 text-[14px] font-semibold"
        ><Icon name="report" :size="18" />量測報告</span
      >
      <div class="flex gap-3">
        <button
          class="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-[12px] font-semibold text-white"
          @click="printReport"
        >
          <Icon name="print" :size="15" />列印報告</button
        ><button
          class="rounded-lg border border-line bg-white px-3 py-2 text-[12px]"
          data-clinical-return-measurements
          @click="emit('close')"
        >
          返回量測
        </button>
      </div>
    </header>
    <article class="min-h-0 px-5 py-4 print:px-0 print:py-0" data-clinical-report-document>
      <div class="flex items-start justify-between border-b-2 border-brand pb-3 print:pb-5">
        <div>
          <div class="hidden items-center gap-2 text-[25px] font-semibold text-brand print:flex">
            <Icon name="heart" :size="25" />iHeart
          </div>
          <h1
            id="clinical-report-title"
            class="text-[18px] font-semibold tracking-wide print:mt-2 print:text-[23px]"
          >
            心臟超聲量測報告
          </h1>
          <p class="mt-1 text-[8px] tracking-[.08em] text-muted print:text-[10px]">
            ECHOCARDIOGRAPHY MEASUREMENT REPORT
          </p>
        </div>
        <div class="text-right text-[9px] leading-5 text-muted print:text-[11px]">
          <b class="block font-mono text-[16px] text-ink">{{ exam }}</b
          ><span class="block">匿名示範病例</span>
        </div>
      </div>
      <div
        class="my-3 grid grid-cols-3 gap-3 rounded-lg bg-canvas px-3 py-2 text-[10px] print:my-5 print:border print:border-line print:py-3 print:text-[11px]"
      >
        <div>
          <span class="block text-[10px] text-muted">檢查切面</span
          ><b class="mt-1 block">{{ viewCode(item) }}</b>
        </div>
        <div>
          <span class="block text-[10px] text-muted">分析項目</span
          ><b class="mt-1 block">{{
            item.kind === "function" ? "左心室分割與功能量測" : "左心室尺寸與壁厚量測"
          }}</b>
        </div>
        <div>
          <span class="block text-[10px] text-muted">本輪量測核查</span
          ><b class="mt-1 block" :class="confirmed ? 'text-brand' : 'text-muted'">{{
            confirmed ? "已確認量測" : "待核查"
          }}</b>
        </div>
      </div>
      <div class="grid grid-cols-1 gap-4 print:grid-cols-[.8fr_1.2fr] print:gap-7">
        <section>
          <h2 class="mb-2 text-[12px] font-semibold print:text-[14px]">量測結果</h2>
          <table class="w-full text-left text-[11px]" aria-label="報告量測結果">
            <thead class="h-7 border-y border-line text-muted print:h-9">
              <tr>
                <th class="font-normal">項目</th>
                <th class="text-right font-normal">數值</th>
                <th class="pl-2 font-normal">單位</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="m in item.metrics"
                :key="m.id"
                class="h-11 border-b border-line print:h-16"
              >
                <td>
                  <b class="inline-block w-[62px] text-[12px] print:block">{{ m.code }}</b
                  ><span class="text-[10px] text-muted print:mt-1 print:block">{{ m.label }}</span>
                </td>
                <td class="text-right font-mono text-[20px] font-semibold">
                  {{ m.value.toFixed(1) }}
                </td>
                <td class="pl-2 text-muted">{{ m.unit }}</td>
              </tr>
            </tbody>
          </table>
          <div
            class="mt-5 hidden rounded-lg border border-line p-3 text-[10px] leading-6 text-muted print:block"
          >
            <b class="block text-ink">影像與量測依據</b>各項結果對應本病例的 AI
            定位畫面，可返回工作站檢視原始影片、輪廓與量測端點。
          </div>
        </section>
        <section>
          <h2 class="mb-2 text-[12px] font-semibold print:text-[14px]">
            {{ item.kind === "function" ? "心動時相與心室輪廓" : "關鍵幀與量測位置" }}
          </h2>
          <div class="grid grid-cols-2 gap-2 print:gap-3">
            <figure
              v-for="picture in images"
              :key="picture.key"
              class="m-0 overflow-hidden rounded-lg border border-line"
            >
              <button
                class="block h-[128px] w-full bg-[#0b1119] print:h-[140px]"
                :aria-label="`回看${picture.label}`"
                @click="emit('metric', picture.id)"
              >
                <EvidenceImage
                  :src="experienceAsset(experience.evidence[picture.key]!.image)"
                  :alt="picture.label"
                />
              </button>
              <figcaption
                class="flex h-9 flex-col justify-center px-2 text-[9px] print:h-11 print:text-[10px]"
              >
                <b>{{ picture.label }}</b
                ><span class="mt-1 font-mono text-muted"
                  >{{ formatPosition(item, experience.evidence[picture.key]!.frame) }} · Frame
                  {{ experience.evidence[picture.key]!.frame + 1 }}</span
                >
              </figcaption>
            </figure>
          </div>
          <p class="mt-2 text-[9px] leading-5 text-muted print:mt-4 print:text-[10px]">
            {{
              item.kind === "function"
                ? "EF：射血分數；EDV：舒張末期容積；ESV：收縮末期容積。"
                : "IVSd：室間隔厚度；LVIDd／LVIDs：舒張／收縮末期左心室內徑；LVPWd：舒張末期左心室後壁厚度。"
            }}
          </p>
        </section>
      </div>
      <footer
        class="mt-3 flex items-center justify-between border-t border-line pt-3 text-[8px] text-muted print:mt-6 print:text-[9px]"
      >
        <span>iHeart · {{ generated }}</span
        ><span>示範病例 · AI 量測與證據</span>
      </footer>
    </article>
  </section>
</template>
