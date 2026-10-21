import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const origin = process.env.DEMO_URL || "http://127.0.0.1:4173/";
const output = resolve("private-source/clinical-validation/motion");
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  reducedMotion: "no-preference",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const root = page.locator("[data-clinical]");

async function settled() {
  await page.waitForFunction(
    () =>
      !document
        .getAnimations()
        .some(
          (a) => a.playState === "running" && a.effect?.getComputedTiming().iterations !== Infinity,
        ),
  );
}
async function fit() {
  assert.deepEqual(
    await page.evaluate(() => {
      const issues = [];
      if (
        document.documentElement.scrollHeight > innerHeight ||
        document.documentElement.scrollWidth > innerWidth
      )
        issues.push("document");
      for (const el of document.querySelectorAll(
        "[data-clinical-report-panel], [data-clinical-result-slot], [data-clinical-workflow]",
      ))
        if (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2)
          issues.push(el.tagName);
      return issues;
    }),
    [],
  );
}
async function screenshot(name) {
  await page.screenshot({ path: resolve(output, `${name}.png`), animations: "allow" });
}

try {
  await page.goto(origin);
  await root.waitFor();
  await page.locator("[data-clinical-auto]").click();
  await settled();
  assert.equal(await root.getAttribute("data-automatic"), "false");
  await fit();
  await screenshot("01-original-with-workflow");

  await page.locator("[data-clinical-analyse]").click();
  await page.waitForFunction(() =>
    document.getAnimations().some((a) => a.animationName === "measure-focus"),
  );
  const analysisAnimations = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.animationName)
      .map((a) => a.animationName),
  );
  for (const name of ["measure-focus", "workspace-in", "curve-in"])
    assert.ok(analysisAnimations.includes(name), name);
  await screenshot("02-measurements-entering");
  await settled();
  assert.equal(await page.locator("[data-clinical-workflow]").getAttribute("data-stage"), "1");
  assert.ok(
    (await page.locator("[data-clinical-step-explanation]").innerText()).includes("定位 EF"),
  );
  await fit();
  await screenshot("03-measurements-settled");

  const originalWidth = await page
    .locator("[data-clinical-player]")
    .evaluate((el) => el.getBoundingClientRect().width);
  await page.locator("[data-clinical-generate]").click();
  await page.waitForFunction(() => {
    const report = document.querySelector("[data-clinical-report-panel]");
    return (
      report &&
      document.getAnimations().some((a) => a.transitionProperty === "grid-template-columns")
    );
  });
  await page.waitForTimeout(100);
  const intermediate = await page.evaluate(() => {
    const report = document.querySelector("[data-clinical-report-panel]");
    return {
      opacity: Number(getComputedStyle(report).opacity),
      columns: getComputedStyle(document.querySelector("[data-clinical-layout]"))
        .gridTemplateColumns,
      stage: document.querySelector("[data-clinical-workflow]").getAttribute("data-stage"),
    };
  });
  assert.ok(intermediate.opacity > 0 && intermediate.opacity < 1, JSON.stringify(intermediate));
  assert.equal(intermediate.stage, "2");
  await screenshot("04-report-transition");
  await settled();
  assert.ok(
    (await page.locator("[data-clinical-step-explanation]").innerText()).includes("整理成報告"),
  );
  const reportWidth = await page
    .locator("[data-clinical-player]")
    .evaluate((el) => el.getBoundingClientRect().width);
  assert.ok(Math.abs(originalWidth - reportWidth - 120) < 1);
  assert.equal(await page.getByRole("dialog").count(), 0);
  await fit();
  await screenshot("05-report-alongside-video");

  // Switch cases while the result pane is leaving; the incoming view must use
  // the newly selected exam, without stale report content or an inert player.
  await page.locator("[data-clinical-return-measurements]").click();
  await page.locator('[data-clinical-case="dimension-02"]').click();
  await settled();
  assert.equal(await root.getAttribute("data-case"), "dimension-02");
  assert.equal(await root.getAttribute("data-analysed"), "false");
  assert.equal(await page.locator("[data-clinical-report-panel]").count(), 0);
  await page.locator("[data-clinical-analyse]").click();
  await settled();
  await page.locator("[data-clinical-generate]").click();
  await page.locator("[data-clinical-report-panel]").waitFor();
  await settled();
  await fit();
  await screenshot("06-dimension-report");

  // Reduced motion disables these effects and keeps the interface operable.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await root.waitFor();
  assert.equal(await root.getAttribute("data-automatic"), "false");
  await page.locator("[data-clinical-analyse]").click();
  await page.locator("[data-clinical-generate]").click();
  await page.locator("[data-clinical-report-panel]").waitFor();
  await settled();
  assert.equal(
    await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter((a) => a.playState === "running" && a.effect?.getComputedTiming().duration > 1)
          .length,
    ),
    0,
  );
  await fit();

  // A full native-time segment checks the explanation changes in synchrony
  // with real playback, measurements, report, and the next examination.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload();
  await root.waitFor();
  await page.locator('[data-clinical-workflow][data-stage="1"]').waitFor();
  await page.locator('[data-clinical-workflow][data-stage="2"]').waitFor();
  await page.locator("[data-clinical-report-panel]").waitFor();
  await settled();
  await screenshot("07-automatic-report");
  await page.locator('[data-clinical][data-case="dimension"]').waitFor();
  assert.equal(await page.locator("[data-clinical-workflow]").getAttribute("data-stage"), "0");
  await settled();
  await fit();
  assert.deepEqual(errors, []);
  writeFileSync(
    resolve(output, "report.json"),
    JSON.stringify(
      {
        status: "passed",
        at: new Date().toISOString(),
        analysisAnimations,
        intermediate,
        paneWidthChange: originalWidth - reportWidth,
        interruptedSwitch: true,
        reducedMotion: true,
        nativeTimeSegment: true,
        errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "PASS: native-time staged animations, explanatory workflow, intermediate transition, smooth report layout, interrupted switching, reduced motion, and 1920×1080 fit.",
  );
} finally {
  await browser.close();
}
