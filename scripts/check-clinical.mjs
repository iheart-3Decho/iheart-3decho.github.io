import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";
const origin = process.env.DEMO_URL || "http://127.0.0.1:4173/";
const output = resolve("private-source/clinical-validation");
mkdirSync(output, { recursive: true });
const cases = JSON.parse(readFileSync("public/demo/cases.json"));
const data = JSON.parse(readFileSync("public/experience/experience.json"));
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const root = page.locator("[data-clinical]");
async function fit(name) {
  const overflow = await page.evaluate(() => {
    const issues = [];
    if (
      document.documentElement.scrollWidth > innerWidth ||
      document.documentElement.scrollHeight > innerHeight
    )
      issues.push("document");
    for (const el of document.querySelectorAll(
      '[data-clinical-measurements], [data-clinical-report-dialog], [data-clinical-evidence], aside[aria-label="檢查列表"]',
    ))
      if (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2)
        issues.push(el.getAttribute("aria-label") || el.tagName);
    return issues;
  });
  assert.deepEqual(overflow, [], name);
  await page.screenshot({ path: resolve(output, `${name}.png`) });
}
async function loaded() {
  await page.waitForFunction(
    () => document.querySelector("[data-clinical-player] video")?.readyState >= 2,
    null,
    { polling: 100 },
  );
}
async function selected(item, metric) {
  await page.waitForFunction(
    ({ fps, target }) => {
      const v = document.querySelector("[data-clinical-player] video");
      return (
        v?.readyState >= 2 &&
        v.paused &&
        !v.seeking &&
        Math.floor(v.currentTime * fps + 0.001) === target
      );
    },
    { fps: item.fps, target: metric.evidence.frame },
    { polling: 100 },
  );
  await page.locator("[data-clinical-overlay]").waitFor();
  const exported = data.library.find((x) => x.caseId === item.id).evidence[
    item.kind === "function" ? (metric.id === "esv" ? "es" : "ed") : metric.id
  ];
  assert.equal(exported.frame, metric.evidence.frame);
  if (exported.points) assert.deepEqual(exported.points, metric.evidence.geometry.points);
  assert.equal(
    await page
      .locator("[data-clinical-overlay] polygon, [data-clinical-overlay] polyline")
      .getAttribute("points"),
    metric.evidence.geometry.points.map((p) => p.join(",")).join(" "),
  );
}
try {
  const clockStart = new Date();
  await page.clock.install({ time: clockStart });
  await page.clock.pauseAt(clockStart);
  await page.goto(origin);
  await root.waitFor();
  await loaded();
  assert.equal(await root.getAttribute("data-case"), data.function.caseId);
  assert.equal(await root.getAttribute("data-automatic"), "true");
  assert.equal(await root.getAttribute("data-analysed"), "false");
  await fit("01-workstation-original");
  for (const [index, preview] of data.playlist.entries()) {
    const item = cases.find((c) => c.id === preview.caseId);
    assert.equal(await root.getAttribute("data-case"), preview.caseId);
    assert.equal(await root.getAttribute("data-metric"), preview.metric);
    await loaded();
    assert.equal(await page.locator("[data-clinical-overlay]").count(), 0);
    await page.clock.runFor(5000);
    await selected(
      item,
      item.metrics.find((m) => m.id === preview.metric),
    );
    await fit(`02-auto-${index}-${preview.metric}`);
    await page.clock.runFor(7000);
  }
  assert.equal(await root.getAttribute("data-case"), data.playlist[0].caseId);
  // Reset states with resume, then take control before analysing any case.
  await page.locator("[data-clinical-auto]").click();
  assert.equal(await root.getAttribute("data-automatic"), "false");
  await page.locator("[data-clinical-auto]").click();
  await page.locator("[data-clinical-auto]").click();
  const tested = [];
  for (const [index, item] of cases.entries()) {
    await page.locator(`[data-clinical-case="${item.id}"]`).click();
    await loaded();
    assert.equal(await root.getAttribute("data-automatic"), "false");
    assert.equal(await root.getAttribute("data-analysed"), "false");
    assert.ok(
      (await page.locator("[data-clinical-value]").allTextContents()).every((s) => s === "—"),
    );
    await page.locator("[data-clinical-analyse]").click();
    for (const metric of item.metrics) {
      assert.equal(
        await page.locator(`[data-clinical-value="${metric.id}"]`).innerText(),
        metric.value.toFixed(1),
      );
      await page.locator(`[data-clinical-metric="${metric.id}"]`).click();
      await selected(item, metric);
    }
    for (const phase of ["es", "ed"]) {
      await page.getByRole("button", { name: `定位${phase.toUpperCase()}`, exact: true }).click();
      const selectedId = await root.getAttribute("data-metric");
      const phaseMetric = item.metrics.find((m) => m.id === selectedId);
      assert.equal(phaseMetric.phase, phase);
      await selected(item, phaseMetric);
    }
    if (item.kind === "function") {
      const values = item.volumeSeries.map((p) => p.value);
      const minimum = Math.max(0, Math.floor(Math.min(...values) / 20) * 20);
      const maximum = Math.max(Math.ceil(Math.max(...values) / 20) * 20, minimum + 20);
      assert.equal(
        await page.locator("[data-volume-curve] polyline").getAttribute("points"),
        item.volumeSeries
          .map(
            (p) =>
              `${38 + (p.frame / (item.frameCount - 1)) * 430},${102 - ((p.value - minimum) / (maximum - minimum)) * 78}`,
          )
          .join(" "),
      );
      assert.equal(
        await page.locator("[data-volume-curve] circle").count(),
        item.volumeSeries.length,
      );
    }
    const metric = item.metrics[0];
    await page.locator(`[data-clinical-metric="${metric.id}"]`).click();
    await selected(item, metric);
    await fit(`03-analysis-${item.id}`);
    await page.getByRole("button", { name: "原始影像", exact: true }).click();
    assert.equal(await page.locator("[data-clinical-overlay]").count(), 0);
    await page.getByRole("button", { name: "AI 疊加", exact: true }).click();
    await page.locator("[data-clinical-overlay]").waitFor();
    await page.getByRole("slider").fill(String((metric.evidence.frame + 1) % item.frameCount));
    await page.waitForFunction(() => !document.querySelector("video").seeking, null, {
      polling: 100,
    });
    assert.equal(
      await page.locator("[data-clinical-overlay]").count(),
      0,
      "Never attach evidence to another frame",
    );
    await page.getByRole("button", { name: "下一幀", exact: true }).click();
    assert.equal(
      Number(await page.getByRole("slider").inputValue()),
      (metric.evidence.frame + 2) % item.frameCount,
    );
    await page.locator("[data-clinical-generate]").click();
    const report = page.locator("[data-clinical-report-dialog]");
    await report.waitFor();
    // Vue ignores a bubbled event with the same timestamp as a newly attached
    // listener. Advance the paused test clock to model a subsequent keystroke.
    await page.clock.runFor(1);
    assert.ok((await report.innerText()).includes("待核查"));
    await page.keyboard.press("Escape");
    await report.waitFor({ state: "detached" });
    await page.locator("[data-clinical-confirm]").click();
    await page.locator("[data-clinical-report]").click();
    await report.waitFor();
    await page.clock.runFor(1);
    await report
      .locator("img")
      .evaluateAll((images) => Promise.all(images.map((img) => img.decode())));
    const text = await report.innerText();
    assert.ok(text.includes(`IH-${String(index + 1).padStart(3, "0")}`));
    assert.ok(text.includes("已確認量測"));
    for (const m of item.metrics) assert.ok(text.includes(m.value.toFixed(1)));
    assert.equal(await report.locator("tbody tr").count(), item.metrics.length);
    assert.equal(await report.locator("img").count(), item.kind === "function" ? 2 : 4);
    await fit(`04-report-${item.id}`);
    if (item.id === "function-61" || item.id === "dimension-02") {
      await page.pdf({
        path: resolve(output, `report-${item.id}.pdf`),
        format: "A4",
        printBackground: true,
        margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" },
      });
    }
    await page.keyboard.press("Tab");
    assert.equal(await report.evaluate((el) => el.contains(document.activeElement)), true);
    await page.keyboard.press("Escape");
    tested.push(item.id);
  }
  // Idle clears the report and review state, returning to the first carousel item.
  await page.locator("[data-clinical-generate]").click();
  await page.clock.runFor(121000);
  assert.equal(await page.locator("[data-clinical-report-dialog]").count(), 0);
  assert.equal(await root.getAttribute("data-automatic"), "true");
  assert.equal(await page.locator('[data-clinical-confirm][aria-pressed="true"]').count(), 0);
  await page.locator("[data-clinical-analyse]").focus();
  await page.keyboard.press("Enter");
  assert.equal(await root.getAttribute("data-automatic"), "false");
  const fixedCase = await root.getAttribute("data-case");
  await page.clock.runFor(24000);
  assert.equal(await root.getAttribute("data-case"), fixedCase);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(new URL("#/clinical", origin).href);
  await root.waitFor();
  await loaded();
  assert.equal(await root.getAttribute("data-automatic"), "false");
  assert.equal(await page.locator("video").evaluate((v) => v.paused), true);
  await page.clock.runFor(121000);
  assert.equal(await root.getAttribute("data-automatic"), "false");
  // A media failure must be recoverable and must stop automatic switching.
  await page.route("**/demo/library/function-61/video.mp4", (route) => route.abort());
  await page.reload();
  await page.getByRole("alert").waitFor();
  await page.unroute("**/demo/library/function-61/video.mp4");
  await page.getByRole("button", { name: "重新載入影片", exact: true }).click();
  await loaded();
  await page.getByRole("alert").waitFor({ state: "detached" });
  await page.locator("[data-clinical-analyse]").click();
  await fit("05-recovered-clinical");
  // Warm every case, then repeat mounting players and reports. Compare GC'd
  // counters in the same final case so different panel sizes do not bias them.
  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");
  async function resources() {
    await cdp.send("HeapProfiler.collectGarbage");
    const { metrics } = await cdp.send("Performance.getMetrics");
    return Object.fromEntries(
      metrics
        .filter((m) => ["JSHeapUsedSize", "Nodes", "JSEventListeners"].includes(m.name))
        .map((m) => [m.name, m.value]),
    );
  }
  async function repeat(count) {
    for (let i = 0; i < count; i++) {
      const item = cases[i % cases.length];
      await page.locator(`[data-clinical-case="${item.id}"]`).click();
      await loaded();
      await page.locator("[data-clinical-analyse]").click();
      await page.locator("[data-clinical-generate]").click();
      const report = page.locator("[data-clinical-report-dialog]");
      await report.waitFor();
      await page.clock.runFor(1);
      await page.keyboard.press("Escape");
      await report.waitFor({ state: "detached" });
      assert.equal(await page.locator("video").count(), 1);
    }
  }
  await repeat(6);
  const before = await resources();
  await repeat(60);
  // Hash routing must dispose of the workstation session, including its timer.
  for (let i = 0; i < 12; i++) {
    await page.evaluate(() => (location.hash = "#/experience"));
    await page.locator("[data-booth]").waitFor();
    assert.equal(await root.count(), 0);
    await page.evaluate(() => (location.hash = "#/clinical"));
    await root.waitFor();
    await loaded();
    assert.equal(await root.getAttribute("data-analysed"), "false");
  }
  await repeat(6);
  const after = await resources();
  assert.ok(after.JSHeapUsedSize <= before.JSHeapUsedSize + 6 * 1024 * 1024);
  assert.ok(after.Nodes <= before.Nodes + 250);
  assert.ok(after.JSEventListeners <= before.JSEventListeners + 30);
  await cdp.detach();
  assert.deepEqual(errors, []);
  writeFileSync(
    resolve(output, "report.json"),
    JSON.stringify(
      {
        status: "passed",
        at: new Date().toISOString(),
        tested,
        carouselSegments: data.playlist.length,
        carouselWrap: true,
        overlayFrameAndGeometry: true,
        idleReset: true,
        reducedMotion: true,
        mediaRetry: true,
        repeatedAnalysisAndReportCycles: 60,
        repeatedRouteRemounts: 12,
        resources: { before, after },
        errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "PASS: clinical carousel, all six analyses and reports, exact evidence geometry, frame controls, manual takeover, idle reset, reduced motion, media retry and 1920×1080 layout.",
  );
} finally {
  await browser.close();
}
