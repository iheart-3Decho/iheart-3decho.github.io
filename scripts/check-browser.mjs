import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const origin = process.env.DEMO_URL || "http://127.0.0.1:4173/";
const output = resolve("private-source/previews");
mkdirSync(output, { recursive: true });
const cases = JSON.parse(readFileSync("public/demo/cases.json", "utf8"));
const choices = [
  ["function", "ef"],
  ["function-27", "edv"],
  ["function-61", "esv"],
  ["dimension", "ivsd"],
  ["dimension-02", "lvidd"],
  ["dimension-03", "lvids"],
];
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

async function fit() {
  const problem = await page.evaluate(() => {
    if (
      document.documentElement.scrollWidth > innerWidth ||
      document.documentElement.scrollHeight > innerHeight
    )
      return "page overflow";
    for (const card of document.querySelectorAll("[data-home-metric], [data-keyframe-card]")) {
      if (card.scrollHeight > card.clientHeight + 1) return "card overflow";
    }
    const canvas = document.querySelector("[data-home-canvas]");
    if (canvas) {
      const bounds = canvas.getBoundingClientRect();
      if (bounds.left > 25 || innerWidth - bounds.right > 25) return "excessive home side margins";
      const intro = document.querySelector("[data-home-intro]");
      if (
        intro &&
        intro.getBoundingClientRect().bottom >
          intro.parentElement.getBoundingClientRect().bottom + 1
      )
        return "intro overlaps metric section";
    }
    return null;
  });
  assert.equal(problem, null);
}
async function waitFrame(caseId, metricId) {
  const item = cases.find((entry) => entry.id === caseId);
  const metric = item.metrics.find((entry) => entry.id === metricId);
  await page.waitForFunction(
    ({ caseId, fps, frame }) => {
      const video = document.querySelector(`[data-case="${caseId}"] video`);
      return (
        video?.readyState >= 2 &&
        video.paused &&
        !video.seeking &&
        Math.abs(video.currentTime * fps - frame) <= 1
      );
    },
    { caseId, fps: item.fps, frame: metric.evidence.frame },
  );
  await page.locator('svg[aria-label="模型預測量測位置"]').waitFor({ state: "visible" });
  await page.locator('svg[aria-label="模型預測量測位置"]').evaluate(async (svg) => {
    await Promise.all(svg.getAnimations().map((animation) => animation.finished));
  });
  const selected = await page
    .locator(`[data-case="${caseId}"] button[aria-pressed="true"]`)
    .allTextContents();
  assert.ok(
    selected.some((text) => text.includes(metric.code)),
    `${metric.code} should be selected`,
  );
}
try {
  await page.goto(`${origin}#/showcase`);
  await page.locator("[data-home-metric]").first().waitFor();
  assert.deepEqual(
    await page
      .locator("[data-home-metric]")
      .evaluateAll((cards) => cards.map((card) => card.dataset.homeMetric)),
    choices.map((entry) => entry[1]),
  );
  await fit();
  await page.locator('svg[aria-label="關鍵畫面的模型量測位置"]').waitFor();
  await page.screenshot({ path: resolve(output, "home-metrics-1920.png") });
  // Automatic transition must move to a different case/metric and locate it.
  await page.locator('[data-featured-metric="edv"]').waitFor();
  await page.locator('svg[aria-label="關鍵畫面的模型量測位置"]').waitFor();
  assert.ok(
    Math.abs(
      (await page.locator("video").evaluate((video) => video.currentTime)) -
        cases
          .find((item) => item.id === "function-27")
          .metrics.find((metric) => metric.id === "edv").evidence.frame /
          cases.find((item) => item.id === "function-27").fps,
    ) < 0.02,
  );
  await page.getByRole("button", { name: "停止首頁自動演示" }).click();
  await page.getByRole("button", { name: "展示LVIDs", exact: true }).click();
  await page.locator('svg[aria-label="關鍵畫面的模型量測位置"]').waitFor();
  assert.ok(
    Math.abs(
      (await page.locator("video").evaluate((video) => video.currentTime)) -
        cases
          .find((item) => item.id === "dimension-03")
          .metrics.find((metric) => metric.id === "lvids").evidence.frame /
          cases.find((item) => item.id === "dimension-03").fps,
    ) < 0.02,
  );
  await page.screenshot({ path: resolve(output, "home-lvids-1920.png") });
  for (const [caseId, metricId] of choices) {
    await page.locator(`[data-home-metric="${metricId}"]`).click();
    await page.locator(`[data-case="${caseId}"]`).waitFor();
    await waitFrame(caseId, metricId);
    await fit();
    if (metricId === "esv" || metricId === "ivsd")
      await page.screenshot({
        path: resolve(output, `detail-${metricId}-1920.png`),
      });
    await page.getByRole("link", { name: "所有病例", exact: true }).click();
    await page.locator("[data-home-metric]").first().waitFor();
  }
  await page.locator('[data-home-metric="lvidd"]').focus();
  await page.keyboard.press("Enter");
  await waitFrame("dimension-02", "lvidd");
  await page.getByRole("button", { name: "原始影像", exact: true }).click();
  await page.locator('svg[aria-label="模型預測量測位置"]').waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "AI 量測", exact: true }).click();
  await waitFrame("dimension-02", "lvidd");
  await page.getByRole("button", { name: "播放影片", exact: true }).click();
  await page.getByRole("button", { name: "暫停影片", exact: true }).click();
  await page.getByRole("slider").focus();
  const before = Number(await page.getByRole("slider").inputValue());
  await page.keyboard.press("ArrowRight");
  assert.equal(Number(await page.getByRole("slider").inputValue()), before + 1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${origin}#/showcase`);
  await page.reload();
  await page.getByRole("button", { name: "開始首頁自動演示" }).waitFor();
  await page.locator('svg[aria-label="關鍵畫面的模型量測位置"]').waitFor();
  assert.equal(await page.locator("video").evaluate((video) => video.paused), true);
  await page.setViewportSize({ width: 2560, height: 1187 });
  await fit();
  await page.screenshot({ path: resolve(output, "home-wide-2560.png") });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: six metric entrances from six verified cases, automatic video-to-frame evidence cycle, direct metric deep links, contour/endpoint overlays, 1920×1080 fit, keyboard and reduced motion.",
  );
} finally {
  await browser.close();
}
