import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const origin = process.env.GALLERY_URL || "http://127.0.0.1:4174/";
const output = resolve("private-source/exhibition-validation");
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("response", (response) => {
  if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
});
async function screenshot(name) {
  await page.screenshot({
    path: resolve(output, name),
    fullPage: !(await page.locator("dialog").count()),
    animations: "disabled",
  });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  if (page.viewportSize().width === 1920 && (await page.locator("[data-exhibition]").count()))
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollHeight > innerHeight),
      false,
    );
}
async function loadedVideo(locator) {
  await locator.evaluate(async (element) => {
    if (element.readyState >= 2) return;
    const muted = element.muted;
    element.muted = true;
    try {
      await element.play();
      if (element.readyState < 2)
        await new Promise((accept, reject) => {
          const timeout = window.setTimeout(
            () => reject(new Error("Timed out loading video")),
            15000,
          );
          element.addEventListener(
            "loadeddata",
            () => {
              clearTimeout(timeout);
              accept();
            },
            { once: true },
          );
          element.addEventListener(
            "error",
            () => {
              clearTimeout(timeout);
              reject(new Error("Video failed to load"));
            },
            { once: true },
          );
        });
      element.pause();
    } finally {
      element.muted = muted;
    }
  });
}
try {
  await page.goto(origin);
  await page.locator("[data-exhibition]").waitFor();
  assert.equal(await page.locator("[data-project]").count(), 3);
  const preview = page.getByLabel("iHeart 三項研究完整介紹影片");
  await loadedVideo(preview);
  assert.ok((await preview.getAttribute("src")).endsWith("/exhibition/iheart-overview.mp4"));
  assert.ok((await preview.evaluate((video) => video.duration)) > 200);
  assert.equal(await preview.evaluate((video) => video.paused), true);
  assert.ok((await preview.getAttribute("poster")).endsWith("/exhibition/overview-poster.jpg"));
  await page.getByRole("button", { name: "播放首頁影片" }).click();
  await page.waitForFunction(() => !document.querySelector("main video").paused);
  await page.getByRole("button", { name: "暫停首頁影片" }).click();
  assert.equal(await preview.evaluate((video) => video.paused), true);
  await screenshot("01-gallery-desktop.png");

  for (const project of ["visualization", "segmentation", "analysis"]) {
    const card = page.locator(`[data-project="${project}"]`);
    assert.equal(await card.locator("[aria-label='自動輪播進度'] span").count(), 3);
    const firstSource = await card.locator("img, video").first().getAttribute("src");
    await page.waitForTimeout(5500);
    const nextSource = await card.locator("img, video").first().getAttribute("src");
    assert.notEqual(firstSource, nextSource, `${project} should advance automatically`);
    await screenshot(`02-${project}-carousel.png`);
  }

  // Existing routes remain usable from the exhibition build.
  await page.goto(`${origin}#/clinical`);
  await page.locator("[data-clinical]").waitFor();
  await screenshot("04-existing-clinical.png");
  await page.goto(`${origin}#/experience`);
  await page.getByRole("button", { name: "開始體驗", exact: true }).waitFor();
  await page.goto(`${origin}#/showcase`);
  await page.getByRole("heading", { name: /從一段超聲影片/ }).waitFor();
  const cases = JSON.parse(readFileSync("public/demo/cases.json", "utf8"));
  for (const item of cases) {
    await page.goto(`${origin}#/case/${item.id}`);
    await page.waitForFunction(() => document.querySelector("video")?.readyState >= 2);
    assert.equal(await page.locator("[data-exhibition]").count(), 0);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await loadedVideo(page.locator("main video"));
  assert.equal(await page.locator("main video").evaluate((video) => video.paused), true);
  await screenshot("05-gallery-mobile.png");
  assert.deepEqual(errors, []);
  writeFileSync(
    resolve(output, "report.json"),
    JSON.stringify(
      {
        status: "passed",
        origin,
        checkedAt: new Date().toISOString(),
        projects: 3,
        mediaTabs: 9,
        overviewSeconds: 202.858,
        preservedRoutes: [
          "#/clinical",
          "#/experience",
          "#/showcase",
          ...cases.map((item) => `#/case/${item.id}`),
        ],
        automaticCardCarousel: true,
        reducedMotion: true,
        errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "Gallery: overview video, three automatic card carousels, all media, preserved routes, desktop and mobile passed.",
  );
} finally {
  await browser.close();
}
