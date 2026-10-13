import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const duration = Number(process.env.SOAK_HOURS || 8) * 3600000;
assert.ok(duration > 0);
const output = resolve("private-source/booth-validation");
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [],
  samples = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
const report = {
  status: "running",
  startedAt: new Date().toISOString(),
  requiredHours: duration / 3600000,
  elapsedHours: 0,
  samples,
  errors,
};
function save() {
  writeFileSync(resolve(output, "soak-report.json"), JSON.stringify(report, null, 2));
}
let started;
try {
  await page.goto(process.env.DEMO_URL || "http://127.0.0.1:4173/");
  await page.locator("[data-attract]").waitFor();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");
  started = performance.now();
  save();
  do {
    assert.deepEqual(errors, []);
    await page.locator("[data-attract]").waitFor();
    const state = await page.locator("video").evaluate((v) => ({
      src: v.currentSrc,
      time: v.currentTime,
      paused: v.paused,
      ready: v.readyState,
    }));
    assert.ok(state.ready >= 2 && !state.paused, "Attract video stopped");
    await page.waitForTimeout(400);
    const next = await page
      .locator("video")
      .evaluate((v) => ({ src: v.currentSrc, time: v.currentTime }));
    if (next.src === state.src)
      assert.ok(Math.abs(next.time - state.time) > 0.05, "Video did not advance");
    assert.deepEqual(
      await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      })),
      { width: 1920, height: 1080 },
    );
    await cdp.send("HeapProfiler.collectGarbage");
    const metrics = (await cdp.send("Performance.getMetrics")).metrics;
    const memory = await cdp.send("Memory.getDOMCounters");
    const heap = metrics.find((m) => m.name === "JSHeapUsedSize").value;
    samples.push({
      at: new Date().toISOString(),
      src: state.src,
      time: state.time,
      heap,
      ...memory,
    });
    if (samples.length > 1)
      assert.ok(
        Date.parse(samples.at(-1).at) - Date.parse(samples.at(-2).at) < 95000,
        "Continuous run interrupted: probe gap exceeds 95 seconds",
      );
    report.elapsedHours = (performance.now() - started) / 3600000;
    save();
    if (report.elapsedHours >= duration / 3600000) break;
    await page.waitForTimeout(Math.min(60000, duration - (performance.now() - started)));
  } while (performance.now() - started < duration);
  const last = samples.at(-1),
    first = samples[0];
  assert.ok(
    Date.now() - Date.parse(last.at) < 65000,
    "Final probe is stale; continuous run was interrupted",
  );
  assert.ok(last.heap < first.heap + 32 * 1024 * 1024, "Sustained heap growth exceeds 32 MiB");
  assert.ok(
    last.nodes < first.nodes + 200 && last.jsEventListeners < first.jsEventListeners + 50,
    "DOM/listener accumulation",
  );
  assert.ok(new Set(samples.map((s) => s.src)).size === 2, "Both videos must cycle");
  report.elapsedHours = (performance.now() - started) / 3600000;
  assert.ok(report.elapsedHours >= duration / 3600000, "Real elapsed duration too short");
  report.status = "passed";
  report.completedAt = new Date().toISOString();
  save();
  await page.screenshot({ path: resolve(output, "13-after-soak.png") });
  console.log(
    `PASS: ${report.elapsedHours.toFixed(3)} real hours, ${samples.length} probes, no browser errors, videos advance, bounded heap/DOM/listeners.`,
  );
} catch (error) {
  report.status = "failed";
  report.failure = String(error);
  save();
  throw error;
} finally {
  await browser.close();
}
