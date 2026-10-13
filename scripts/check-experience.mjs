import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
const origin = process.env.DEMO_URL || "http://127.0.0.1:4173/";
const output = resolve("private-source/booth-validation");
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await context.newPage(),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const data = JSON.parse(readFileSync("public/experience/experience.json"));
async function phase(name) {
  await page.locator(`[data-booth][data-phase="${name}"]`).waitFor();
}
async function fit(name) {
  if (await page.locator("[data-task-player]").count())
    await page.locator("[data-confirm]:enabled").waitFor();
  const overflows = await page.evaluate(() => {
    const result = [];
    if (
      document.documentElement.scrollHeight > innerHeight ||
      document.documentElement.scrollWidth > innerWidth
    )
      result.push("document");
    for (const el of document.querySelectorAll(
      "[data-booth] aside, [data-comparison], [data-review]",
    )) {
      if (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2)
        result.push(el.tagName);
    }
    return result;
  });
  assert.deepEqual(overflows, [], name);
  await page.screenshot({ path: resolve(output, `${name}.png`) });
}
async function choose(frame) {
  await page.locator("[data-confirm]:enabled").waitFor();
  await page.getByRole("slider").fill(String(frame));
  await page.waitForFunction(() => {
    const v = document.querySelector("[data-task-player] video");
    return v?.readyState >= 2 && !v.seeking && v.paused;
  });
  assert.equal(Number(await page.getByRole("slider").inputValue()), frame);
  await page.locator("[data-confirm]:enabled").click();
}
async function draw() {
  const svg = page.locator("[data-draw-surface]");
  const coordinates = await svg.evaluate((el) => {
    const m = el.getScreenCTM();
    return [
      [439, 497],
      [496, 314],
    ].map(([x, y]) => {
      const p = new DOMPoint(x, y).matrixTransform(m);
      return [p.x, p.y];
    });
  });
  for (const [x, y] of coordinates) await page.mouse.click(x, y);
}
async function decodedMatch(frame) {
  const src = await page.locator("[data-review] img").first().getAttribute("src");
  const pixels = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const rgba = ctx.getImageData(0, 0, img.width, img.height).data;
    return Array.from(rgba).filter((_, i) => i % 4 !== 3);
  }, src);
  const expected = execFileSync("ffmpeg", [
    "-v",
    "error",
    "-i",
    resolve("public/demo", data.function.video.path),
    "-vf",
    `select=eq(n\\,${frame})`,
    "-frames:v",
    "1",
    "-f",
    "rawvideo",
    "-pix_fmt",
    "rgb24",
    "pipe:1",
  ]);
  assert.equal(pixels.length, expected.length);
  const difference =
    pixels.reduce((sum, p, i) => sum + Math.abs(p - expected[i]), 0) / pixels.length;
  assert.ok(difference < 4, `Exact decoded frame ${frame}: pixel MAE ${difference}`);
}
try {
  await page.goto(origin);
  await phase("attract");
  await fit("01-attract");
  await page.waitForFunction(
    () => document.querySelector("[data-attract] video")?.currentTime > 0.1,
  );
  await page.locator("[data-attract-evidence]").waitFor();
  assert.deepEqual(
    await page.locator("[data-attract-evidence]").boundingBox(),
    await page.locator("[data-attract] video").boundingBox(),
  );
  await fit("01b-attract-overlay");
  await page.waitForFunction(() =>
    document.querySelector("[data-attract] video")?.currentSrc.includes("dimension"),
  );
  await fit("01c-attract-dimension");
  await page.goto(origin);
  await page.reload();
  await phase("attract");
  await page.locator("[data-start]").click();
  await phase("ed");
  assert.equal(await page.locator('[data-task-player] img, img[src*="experience/"]').count(), 0);
  await page.locator("[data-confirm]:enabled").waitFor();
  await page.getByRole("button", { name: "1× 正常", exact: true }).click();
  assert.equal(await page.locator("[data-task-player] video").evaluate((v) => v.playbackRate), 0.5);
  await page.getByRole("button", { name: "播放影片", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector("[data-task-player] video")?.currentTime > 0.1,
  );
  await page.getByRole("button", { name: "暫停影片", exact: true }).click();
  await page.getByRole("slider").fill("10");
  await page.locator("[data-confirm]:enabled").waitFor();
  await page.getByRole("button", { name: "下一幀", exact: true }).click();
  await page.locator("[data-confirm]:enabled").waitFor();
  assert.equal(Number(await page.getByRole("slider").inputValue()), 11);
  await page.getByRole("button", { name: "上一幀", exact: true }).click();
  await page.locator("[data-confirm]:enabled").waitFor();
  assert.equal(Number(await page.getByRole("slider").inputValue()), 10);
  await fit("02-select-ed");
  await choose(72);
  await phase("es");
  await fit("03-select-es");
  await choose(72);
  await page.getByRole("alert").waitFor();
  await phase("es");
  await choose(88);
  await phase("review");
  await fit("04-pump-review");
  await decodedMatch(72);
  await page.locator("[data-review]").getByRole("button", { name: "修改" }).first().click();
  await phase("ed");
  await page.waitForFunction(
    () => Number(document.querySelector('input[type="range"]').value) === 72,
  );
  await choose(132);
  await choose(148);
  await decodedMatch(132);
  await page.locator("[data-reveal]").click();
  await phase("results");
  await fit("05-pump-result");
  assert.equal(await page.locator("[data-comparison]").count(), 2);
  await page.getByText("56.4", { exact: false }).first().waitFor();
  assert.ok((await page.locator("[data-results]").innerText()).includes("67.0 mL"));
  assert.ok((await page.locator("[data-results]").innerText()).includes("29.2 mL"));
  await page.getByRole("button", { name: "量測解讀的資料來源" }).click();
  await fit("06-medical-sources");
  await page.getByRole("button", { name: "返回體驗" }).click();
  await page.getByRole("button", { name: "體驗另一項" }).click();
  await phase("frame");
  await fit("07-dimension-frame");
  await choose(108);
  await phase("draw");
  await draw();
  const first = page.getByRole("button", { name: "調整端點 1" });
  const oldX = Number(await first.getAttribute("cx"));
  await first.focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(Number(await first.getAttribute("cx")), oldX + 1);
  const beforeDrag = Number(await first.getAttribute("cx"));
  const box = await first.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 15, box.y + box.height / 2 + 8);
  await page.mouse.up();
  assert.ok(Number(await first.getAttribute("cx")) > beforeDrag);
  await fit("08-draw-line");
  await page.getByRole("button", { name: "清除重畫" }).click();
  assert.equal(await page.getByRole("button", { name: /調整端點/ }).count(), 0);
  assert.equal(await page.locator("[data-confirm]").isEnabled(), false);
  await draw();
  await page.locator("[data-confirm]").click();
  await fit("09-dimension-review");
  await page.locator("[data-reveal]").click();
  await phase("results");
  await fit("10-dimension-result");
  assert.ok((await page.locator("[data-results]").innerText()).includes("51.0"));
  await page.getByRole("button", { name: "修改我的選擇" }).click();
  await phase("draw");
  await page.getByRole("button", { name: "返回修改量測畫面" }).click();
  await phase("frame");
  await page.getByRole("button", { name: "收縮後的心室內徑", exact: false }).click();
  await choose(130);
  await draw();
  await page.locator("[data-confirm]").click();
  await page.locator("[data-reveal]").click();
  await phase("results");
  assert.ok((await page.locator("[data-results]").innerText()).includes("38.6"));
  await fit("11-lvids-result");
  for (const [label, expected] of [
    ["室間隔厚度", "16.0"],
    ["心室後壁厚度", "15.5"],
  ]) {
    await page.getByRole("button", { name: "再試一次" }).click();
    await phase("frame");
    await page.getByRole("button", { name: label, exact: false }).click();
    await choose(108);
    await draw();
    await page.locator("[data-confirm]").click();
    await page.locator("[data-reveal]").click();
    await phase("results");
    assert.ok((await page.locator("[data-results]").innerText()).includes(expected));
  }
  // Idle timeout uses simulated wall time; video and animation never count as input.
  await page.clock.install();
  await page.getByRole("button", { name: "再試一次" }).click();
  await phase("frame");
  await page.clock.runFor(120250);
  await page.locator("[data-idle-warning]").waitFor();
  await fit("12-idle-warning");
  await page.getByRole("button", { name: "繼續體驗" }).click();
  assert.equal(await page.locator("[data-idle-warning]").count(), 0);
  await page.clock.runFor(119000);
  await phase("frame");
  assert.equal(await page.locator("[data-idle-warning]").count(), 0);
  await page.clock.runFor(17000);
  await phase("attract");
  await page.locator("[data-start]").click();
  await phase("ed");
  assert.equal(await page.locator("[data-review]").count(), 0);
  await page.getByRole("button", { name: "結束體驗" }).click();
  await phase("attract");
  await page.clock.resume();
  // Repeated complete interactions exercise mount/unmount, capture cleanup and reset.
  await page.emulateMedia({ reducedMotion: "reduce" });
  const cdp = await context.newCDPSession(page);
  await cdp.send("HeapProfiler.collectGarbage");
  const baseline = await cdp.send("Memory.getDOMCounters");
  const initialHeap = await cdp.send("Runtime.getHeapUsage");
  for (let i = 0; i < 100; i++) {
    await page.locator(i % 2 ? "[data-other-task]" : "[data-start]").click();
    if (i % 2) {
      await choose(108);
      await draw();
      await page.locator("[data-confirm]").click();
    } else {
      await choose(72);
      await choose(88);
    }
    await page.locator("[data-reveal]").click();
    await phase("results");
    await page.getByRole("button", { name: "返回首頁", exact: true }).click();
    await phase("attract");
    assert.equal(
      await page.locator("[data-results], [data-review], [data-draw-surface]").count(),
      0,
    );
    if ((i + 1) % 25 === 0) console.log(`Interaction/reset ${i + 1}/100`);
  }
  await cdp.send("HeapProfiler.collectGarbage");
  const after = await cdp.send("Memory.getDOMCounters");
  const finalHeap = await cdp.send("Runtime.getHeapUsage");
  assert.ok(
    finalHeap.usedSize < initialHeap.usedSize + 16 * 1024 * 1024,
    "Interaction heap accumulation",
  );
  assert.ok(
    after.nodes < baseline.nodes + 200,
    `DOM growth: ${JSON.stringify({ baseline, after })}`,
  );
  assert.ok(
    after.jsEventListeners < baseline.jsEventListeners + 50,
    `Listener growth: ${JSON.stringify({ baseline, after })}`,
  );
  // Offline local static service: forbid every nonlocal request, then reload.
  await context.route("**/*", (route) =>
    new URL(route.request().url()).origin === new URL(origin).origin
      ? route.continue()
      : route.abort(),
  );
  await page.reload();
  await phase("attract");
  await page.locator("[data-start]").click();
  await choose(72);
  await choose(88);
  await page.locator("[data-reveal]").click();
  await phase("results");
  assert.deepEqual(errors, []);
  await page.getByRole("button", { name: "返回首頁", exact: true }).click();
  let failVideo = true;
  await context.route("**/function.mp4", (route) => {
    if (failVideo) {
      failVideo = false;
      return route.abort();
    }
    return route.continue();
  });
  await page.reload();
  await phase("attract");
  await page.getByRole("button", { name: "重新載入影片", exact: true }).click();
  await page.waitForFunction(() => document.querySelector("video")?.readyState >= 2);
  await context.unroute("**/function.mp4");
  await page.locator("[data-start]").click();
  await choose(72);
  await choose(88);
  let failImage = true;
  await context.route("**/function-ed.png", (route) => {
    if (failImage) {
      failImage = false;
      return route.abort();
    }
    return route.continue();
  });
  await page.locator("[data-reveal]").click();
  await phase("results");
  await page.getByRole("button", { name: "重新載入畫面", exact: true }).click();
  await page.waitForFunction(() => {
    const img = document.querySelector('[data-comparison] img[alt="AI 所選畫面的實際逐幀量測"]');
    return img?.complete && img.naturalWidth > 0;
  });
  await page.getByRole("button", { name: "返回首頁", exact: true }).click();
  await page.reload();
  await phase("attract");
  assert.equal(await page.locator("video").evaluate((v) => v.paused && v.controls), true);
  assert.deepEqual(errors, []);
  writeFileSync(
    resolve(output, "functional-report.json"),
    JSON.stringify(
      {
        status: "passed",
        at: new Date().toISOString(),
        interactions: 100,
        framePixels: "MP4 frames 72 and 132 compared against ffmpeg",
        baseline,
        after,
        initialHeap,
        finalHeap,
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: both tasks, four dimensions, decoded frame alignment, edits, redraw, drag/keyboard, idle/cancel/reset, 100 interactions, offline assets, 1920×1080 screenshots.",
  );
} finally {
  await browser.close();
}
