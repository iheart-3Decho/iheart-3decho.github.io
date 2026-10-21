import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const origin = new URL("#/experience", process.env.DEMO_URL || "http://127.0.0.1:4173/").href;
const output = resolve("private-source/case-library-validation");
mkdirSync(output, { recursive: true });
const data = JSON.parse(readFileSync("public/experience/experience.json"));
const cases = JSON.parse(readFileSync("public/demo/cases.json"));
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
const tested = [];
page.on("pageerror", (error) => errors.push(error.message));
async function phase(name) {
  await page.locator(`[data-booth][data-phase="${name}"]`).waitFor();
}
async function fit(name) {
  assert.equal(
    await page.evaluate(
      () =>
        document.documentElement.scrollHeight > innerHeight ||
        document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  const viewport = page.locator("[data-preview-viewport]");
  if (await viewport.count()) {
    const image = await viewport.boundingBox();
    const caption = await page.locator("[data-preview-caption]").boundingBox();
    assert.ok(
      image.y + image.height <= caption.y,
      "Keep the entire source image above the caption",
    );
  }
  await page.screenshot({ path: resolve(output, `${name}.png`) });
}
async function choose(frame) {
  await page.locator("[data-confirm]:enabled").waitFor();
  await page.getByRole("slider").fill(String(frame));
  await page.waitForFunction(() => {
    const video = document.querySelector("[data-task-player] video");
    return video?.readyState >= 2 && !video.seeking && video.paused;
  });
  await page.locator("[data-confirm]:enabled").click();
}
try {
  // Keep network download time from advancing the controlled carousel clock.
  const clockStart = new Date();
  await page.clock.install({ time: clockStart });
  await page.clock.pauseAt(clockStart);
  await page.goto(origin);
  await phase("attract");
  // Exercise real carousel code, including its complete wrap, with controlled browser time.
  for (const [index, preview] of data.playlist.entries()) {
    const item = cases.find((entry) => entry.id === preview.caseId);
    await page
      .locator(`[data-preview-case="${preview.caseId}"][data-preview-metric="${preview.metric}"]`)
      .waitFor();
    await page.waitForFunction(
      () => document.querySelector("[data-attract] video")?.readyState >= 2,
    );
    assert.ok(
      (await page.locator("[data-attract] video").getAttribute("src")).endsWith(item.video),
    );
    await page.clock.runFor(8000);
    await page.locator("[data-attract-evidence] img").evaluate((img) => img.decode());
    await fit(`preview-${index}-${preview.metric}`);
    await page.clock.runFor(4000);
  }
  await page
    .locator(`[data-preview-case="${data.playlist[0].caseId}"][data-preview-metric="ef"]`)
    .waitFor();
  await page.getByRole("button", { name: "暫停輪播", exact: true }).click();
  for (const [index, preview] of data.playlist.entries()) {
    const entry = data.library.find((item) => item.caseId === preview.caseId);
    await page
      .locator(`[data-preview-case="${preview.caseId}"][data-preview-metric="${preview.metric}"]`)
      .waitFor();
    await page.locator("[data-start]").click();
    await phase(preview.mode === "function" ? "ed" : "frame");
    assert.ok(
      (await page.locator("[data-task-player] video").getAttribute("src")).endsWith(
        entry.video.path,
      ),
    );
    assert.equal(
      await page.locator('img[src*="experience/"], [data-attract-evidence]').count(),
      0,
      "Do not reveal answers during the task",
    );
    // Passing a carousel boundary must not change a visitor's case or task.
    await page.clock.runFor(13000);
    assert.ok(
      (await page.locator("[data-task-player] video").getAttribute("src")).endsWith(
        entry.video.path,
      ),
    );
    if (preview.mode === "function") {
      await choose(entry.evidence.ed.frame);
      await choose(entry.evidence.es.frame);
    } else {
      await choose(entry.evidence[preview.metric].frame);
      await phase("draw");
      const coordinates = await page.locator("[data-draw-surface]").evaluate(
        (svg, points) =>
          points.map(([x, y]) => {
            const point = new DOMPoint(x, y).matrixTransform(svg.getScreenCTM());
            return [point.x, point.y];
          }),
        entry.evidence[preview.metric].points,
      );
      for (const [x, y] of coordinates) await page.mouse.click(x, y);
      await page.locator("[data-confirm]:enabled").click();
    }
    await phase("review");
    await page.locator("[data-reveal]").click();
    await page.clock.runFor(700);
    await phase("results");
    const keys = preview.mode === "function" ? ["ed", "es"] : [preview.metric];
    for (const key of keys) {
      const src = `experience/${entry.evidence[key].image}`;
      const img = page.locator(`[data-comparison] img[src$="${src}"]`);
      await img.evaluate((el) => el.decode());
    }
    assert.ok(
      (await page.locator("[data-results] aside").innerText()).includes(
        entry.metrics[preview.mode === "function" ? "ef" : preview.metric].value.toFixed(1),
      ),
    );
    await fit(`result-${index}-${preview.metric}`);
    tested.push(preview);
    await page.getByRole("button", { name: "返回首頁", exact: true }).click();
    await phase("attract");
    await page.getByRole("button", { name: "暫停輪播", exact: true }).click();
    if (index < data.playlist.length - 1) {
      for (let next = 0; next <= index; next++)
        await page.getByRole("button", { name: "下一段示範", exact: true }).click();
    }
  }
  assert.deepEqual(errors, []);
  writeFileSync(
    resolve(output, "report.json"),
    `${JSON.stringify({ status: "passed", tested, errors, viewport: [1920, 1080], carouselWrap: true, fixedSessionCase: true, controlledClock: true }, null, 2)}\n`,
  );
  console.log(
    "PASS: six cases, all seven metric previews and interactive results, carousel wrap, session isolation and 1920×1080 screenshots.",
  );
} finally {
  await browser.close();
}
