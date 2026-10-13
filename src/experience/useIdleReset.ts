import { onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue";

export function useIdleReset(active: Ref<boolean>, reset: () => void) {
  const countdown = ref(0);
  let lastInput = Date.now();
  let timer: ReturnType<typeof setInterval> | undefined;
  function continueSession() {
    lastInput = Date.now();
    countdown.value = 0;
  }
  function activity() {
    if (active.value && !countdown.value) lastInput = Date.now();
  }
  function tick() {
    if (!active.value) return;
    const idle = Date.now() - lastInput;
    if (idle >= 135_000) {
      continueSession();
      reset();
    } else countdown.value = idle >= 120_000 ? Math.ceil((135_000 - idle) / 1000) : 0;
  }
  watch(active, continueSession);
  onMounted(() => {
    window.addEventListener("pointerdown", activity);
    window.addEventListener("keydown", activity);
    window.addEventListener("input", activity);
    timer = setInterval(tick, 250);
  });
  onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
    window.removeEventListener("pointerdown", activity);
    window.removeEventListener("keydown", activity);
    window.removeEventListener("input", activity);
  });
  return { countdown, continueSession };
}
