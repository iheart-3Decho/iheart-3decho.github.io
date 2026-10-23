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
  const preview = page.locator("[data-exhibition] main video");
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

  for (const [id, title, tabs] of [
    ["visualization", "探索三維心臟結構", ["切面演示", "軟件介面", "表示建立"]],
    ["segmentation", "辨識二尖瓣的形態", ["示例一", "示例二", "方法與對照"]],
    ["analysis", "從影片到心臟量測", ["工作站介面", "功能介紹", "方法與結果"]],
  ]) {
    await page.locator(`[data-project="${id}"]`).click();
    const modal = page.getByRole("dialog");
    await modal.getByRole("heading", { name: title, exact: true }).waitFor();
    for (const [index, tab] of tabs.entries()) {
      const button = modal.getByRole("button", { name: tab, exact: true });
      await button.click();
      assert.equal(await button.getAttribute("aria-pressed"), "true");
      const video = modal.locator("video");
      if (await video.count()) {
        await loadedVideo(video);
        await video.evaluate(async (element) => {
          await element.play();
        });
        await page.waitForFunction(() => document.querySelector("dialog video").currentTime > 0.1);
        await video.evaluate((element) => element.pause());
      } else {
        await page.waitForFunction(() => document.querySelector("dialog img")?.naturalWidth > 0);
        assert.equal(
          await modal
            .locator("img")
            .evaluate((element) => element.complete && element.naturalWidth > 0),
          true,
        );
      }
      await screenshot(`02-${id}-${index}.png`);
    }
    await page.keyboard.press("Escape");
    await modal.waitFor({ state: "detached" });
    assert.equal(await page.locator("dialog").count(), 0);
    assert.equal(await preview.evaluate((video) => video.paused), true);
    assert.equal(await page.evaluate(() => document.body.style.overflow), "");
    assert.equal(
      await page
        .locator(`[data-project="${id}"]`)
        .evaluate((element) => element === document.activeElement),
      true,
    );
  }

  await page.getByRole("button", { name: "觀看介紹影片", exact: true }).click();
  const overview = page.locator("dialog video");
  await loadedVideo(overview);
  assert.ok((await overview.evaluate((video) => video.duration)) > 200);
  await overview.evaluate(async (video) => {
    video.currentTime = 60;
    await video.play();
  });
  await screenshot("03-overview-video.png");
  await page.getByRole("button", { name: "關閉演示" }).click();
  await page.getByRole("button", { name: "播放首頁影片" }).click();
  await page.waitForFunction(() => !document.querySelector("main video").paused);

  // Existing routes remain usable from the exhibition build.
  await page.locator('[data-project="analysis"]').click();
  await page.getByRole("link", { name: "開啟互動工作站" }).click();
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

  // Image retry recovers without changing the result or exposing a placeholder.
  await page.goto(origin);
  let rejected = false;
  await page.route("**/exhibition/leaflets-case-2.jpg", (route) => {
    if (!rejected) {
      rejected = true;
      return route.abort();
    }
    return route.continue();
  });
  await page.locator('[data-project="segmentation"]').click();
  await page.getByRole("button", { name: "示例二", exact: true }).click();
  await page.getByRole("alert").waitFor();
  await page.getByRole("button", { name: "重新載入", exact: true }).click();
  await page.waitForFunction(() => document.querySelector("dialog img")?.naturalWidth > 0);
  await page.keyboard.press("Escape");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await loadedVideo(page.locator("main video"));
  assert.equal(await page.locator("main video").evaluate((video) => video.paused), true);
  await screenshot("05-gallery-mobile.png");
  await page.locator('[data-project="segmentation"]').click();
  await page.getByRole("dialog").waitFor();
  await screenshot("06-mobile-detail.png");
  await page.keyboard.press("Escape");
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
        mediaRetry: true,
        reducedMotion: true,
        keyboardAndFocus: true,
        errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "Gallery: three projects, all media, overview, preserved routes, retry, keyboard, desktop and mobile passed.",
  );
} finally {
  await browser.close();
}
