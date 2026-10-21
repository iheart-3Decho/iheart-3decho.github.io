<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
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
const emit = defineEmits<{ close: [] }>();
const panel = ref<HTMLElement>();
const generated = new Date().toLocaleString("zh-HK", { hour12: false });
const previousFocus = document.activeElement as HTMLElement | null;
const images = computed(() =>
  props.item.kind === "function"
    ? [
        { key: "ed", label: "舒張末期 · ED" },
        { key: "es", label: "收縮末期 · ES" },
      ]
    : props.item.metrics.map((m) => ({ key: m.id, label: `${m.label} · ${m.code}` })),
);
function printReport() {
  window.print();
}
function keyboard(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    emit("close");
  }
  if (event.key !== "Tab") return;
  const buttons = [
    ...panel.value!.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]'),
  ];
  const first = buttons[0],
    last = buttons.at(-1);
  if (
    event.shiftKey &&
    (document.activeElement === first || document.activeElement === panel.value)
  ) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}
onMounted(() => panel.value?.focus());
onBeforeUnmount(() => previousFocus?.focus({ preventScroll: true }));
</script>
<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-[#152c3b]/35 p-8 backdrop-blur-sm print:static print:block print:bg-white print:p-0 print:backdrop-blur-none"
    @click.self="emit('close')"
  >
    <section
      ref="panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clinical-report-title"
      tabindex="-1"
      class="flex max-h-[940px] w-[1080px] flex-col overflow-hidden rounded-2xl bg-white text-ink shadow-2xl outline-none print:max-h-none print:w-full print:overflow-visible print:rounded-none print:shadow-none"
      data-clinical-report-dialog
      @keydown="keyboard"
    >
      <header
        class="flex h-16 shrink-0 items-center justify-between border-b border-line bg-canvas/60 px-7 print:hidden"
      >
        <span class="flex items-center gap-2 text-[14px] font-semibold"
          ><Icon name="report" :size="18" />報告預覽</span
        >
        <div class="flex gap-3">
          <button
            class="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-[12px] font-semibold text-white"
            @click="printReport"
          >
            <Icon name="print" :size="15" />列印報告</button
          ><button
            class="rounded-lg border border-line bg-white px-4 py-2 text-[12px]"
            aria-label="關閉報告"
            @click="emit('close')"
          >
            關閉 ×
          </button>
        </div>
      </header>
      <article class="px-10 py-7 print:px-0 print:py-0" data-clinical-report-document>
        <div class="flex items-start justify-between border-b-2 border-brand pb-5">
          <div>
            <div class="flex items-center gap-2 text-[25px] font-semibold text-brand">
              <Icon name="heart" :size="25" />iHeart
            </div>
            <h1 id="clinical-report-title" class="mt-2 text-[23px] font-semibold tracking-wide">
              心臟超聲量測報告
            </h1>
            <p class="mt-1 text-[10px] tracking-[.12em] text-muted">
              ECHOCARDIOGRAPHY MEASUREMENT REPORT
            </p>
          </div>
          <div class="text-right text-[11px] leading-6 text-muted">
            <b class="block font-mono text-[16px] text-ink">{{ exam }}</b
            ><span class="block">匿名示範病例</span
            ><span class="block">報告生成：{{ generated }}</span>
          </div>
        </div>
        <div
          class="my-5 grid grid-cols-3 gap-4 rounded-lg bg-canvas px-4 py-3 text-[11px] print:border print:border-line"
        >
          <div>
            <span class="block text-[10px] text-muted">檢查切面</span
            ><b class="mt-1 block">{{ viewCode(item) }} · {{ item.view }}</b>
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
        <div class="grid grid-cols-[.8fr_1.2fr] gap-7">
          <section>
            <h2 class="mb-3 text-[14px] font-semibold">量測結果</h2>
            <table class="w-full text-left text-[11px]" aria-label="報告量測結果">
              <thead class="h-9 border-y border-line text-muted">
                <tr>
                  <th class="font-normal">項目</th>
                  <th class="text-right font-normal">數值</th>
                  <th class="pl-2 font-normal">單位</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in item.metrics" :key="m.id" class="h-16 border-b border-line">
                  <td>
                    <b class="block text-[12px]">{{ m.code }}</b
                    ><span class="mt-1 block text-[10px] text-muted">{{ m.label }}</span>
                  </td>
                  <td class="text-right font-mono text-[20px] font-semibold">
                    {{ m.value.toFixed(1) }}
                  </td>
                  <td class="pl-2 text-muted">{{ m.unit }}</td>
                </tr>
              </tbody>
            </table>
            <div class="mt-5 rounded-lg border border-line p-3 text-[10px] leading-6 text-muted">
              <b class="block text-ink">影像與量測依據</b>各項結果對應本病例的 AI
              定位畫面，可返回工作站檢視原始影片、輪廓與量測端點。
            </div>
          </section>
          <section>
            <h2 class="mb-3 text-[14px] font-semibold">
              {{ item.kind === "function" ? "心動時相與心室輪廓" : "關鍵幀與量測位置" }}
            </h2>
            <div class="grid grid-cols-2 gap-3">
              <figure
                v-for="picture in images"
                :key="picture.key"
                class="m-0 overflow-hidden rounded-lg border border-line"
              >
                <div class="h-[176px] bg-[#0b1119] print:h-[140px]">
                  <EvidenceImage
                    :src="experienceAsset(experience.evidence[picture.key]!.image)"
                    :alt="picture.label"
                  />
                </div>
                <figcaption class="flex h-11 flex-col justify-center px-2.5 text-[10px]">
                  <b>{{ picture.label }}</b
                  ><span class="mt-1 font-mono text-muted"
                    >{{ formatPosition(item, experience.evidence[picture.key]!.frame) }} · Frame
                    {{ experience.evidence[picture.key]!.frame + 1 }}</span
                  >
                </figcaption>
              </figure>
            </div>
            <p class="mt-4 text-[10px] leading-6 text-muted">
              {{
                item.kind === "function"
                  ? "EF：射血分數；EDV：舒張末期容積；ESV：收縮末期容積。"
                  : "IVSd：室間隔厚度；LVIDd／LVIDs：舒張／收縮末期左心室內徑；LVPWd：舒張末期左心室後壁厚度。"
              }}
            </p>
          </section>
        </div>
        <footer
          class="mt-6 flex items-center justify-between border-t border-line pt-3 text-[9px] text-muted"
        >
          <span>iHeart · 心臟超聲輔助分析</span><span>示範病例 · AI 量測結果與對應影像</span>
        </footer>
      </article>
    </section>
  </div>
</template>
