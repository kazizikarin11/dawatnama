/**
 * Mobile visual QA capture.
 *
 * Opens each template on a 390x844 viewport (the primary target), taps through
 * the opening sequence, then captures the cover plus several scroll positions so
 * the result can be reviewed as a guest would see it.
 *
 * Usage:
 *   $env:PLAYWRIGHT_BROWSERS_PATH="D:\playwright-browsers"
 *   node scripts/capture-screens.mjs [baseUrl] [slug]
 *
 * Writes PNGs into ./screenshots. Only creates files.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, devices } from "playwright";

const base = process.argv[2] ?? "http://localhost:3000";
const slug = process.argv[3] ?? "ahmed-and-fatima";
const outDir = join(process.cwd(), "screenshots");

const TEMPLATES = [
  "royal-emerald",
  "ivory-rose",
  "midnight-crescent",
  "mughal-arch",
  "minimal-signature",
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const problems = [];

for (const template of TEMPLATES) {
  const context = await browser.newContext({
    ...devices["iPhone 13"],
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  // Surface anything the browser complains about; this is real user-visible risk.
  page.on("console", (message) => {
    if (message.type() === "error") {
      problems.push(`[${template}] console: ${message.text().slice(0, 300)}`);
    }
  });
  page.on("pageerror", (error) => {
    problems.push(`[${template}] pageerror: ${String(error).slice(0, 300)}`);
  });

  await page.goto(`${base}/invite/${slug}?template=${template}`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });

  // Let the cover's entrance animation settle before capturing.
  await page.waitForTimeout(4200);
  await page.screenshot({ path: join(outDir, `${template}-01-cover.png`) });

  // Horizontal overflow is a specific thing we care about on phones.
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (overflow.scrollWidth > overflow.clientWidth + 1) {
    problems.push(
      `[${template}] horizontal overflow on cover: ${overflow.scrollWidth} > ${overflow.clientWidth}`,
    );
  }

  const opener = page.locator("[data-cover-action]");
  if ((await opener.count()) === 0) {
    problems.push(`[${template}] no open-invitation control found`);
  } else {
    await opener.first().tap();
  }

  await page.waitForTimeout(1800);

  const total = await page.evaluate(() => document.body.scrollHeight);
  const viewportHeight = 844;
  const steps = 7;

  for (let step = 1; step <= steps; step += 1) {
    const target = Math.round(
      ((total - viewportHeight) / steps) * step,
    );
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), target);
    // Scroll-triggered reveals need a beat to finish.
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: join(outDir, `${template}-${String(step + 1).padStart(2, "0")}-scroll.png`),
    });

    const rowOverflow = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const offenders = [];
      for (const node of document.querySelectorAll("body *")) {
        const rect = node.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        // Ignore deliberately-scrolling rails.
        const style = getComputedStyle(node);
        if (style.overflowX === "auto" || style.overflowX === "scroll") continue;
        if (rect.right > docWidth + 2 || rect.left < -2) {
          const parent = node.parentElement;
          if (parent) {
            const parentStyle = getComputedStyle(parent);
            if (
              parentStyle.overflowX === "auto" ||
              parentStyle.overflowX === "scroll" ||
              parentStyle.overflow === "hidden"
            ) {
              continue;
            }
          }
          offenders.push(
            `${node.tagName.toLowerCase()}.${String(node.className).slice(0, 60)} right=${Math.round(rect.right)}`,
          );
        }
      }
      return offenders.slice(0, 4);
    });

    for (const offender of rowOverflow) {
      problems.push(`[${template}] step ${step} element past viewport: ${offender}`);
    }
  }

  // Tap-target audit: interactive elements must be reachable with a thumb.
  const smallTargets = await page.evaluate(() => {
    const results = [];
    for (const node of document.querySelectorAll(
      "a, button, input, select, textarea, [role='switch']",
    )) {
      const rect = node.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.height < 40 || rect.width < 24) {
        results.push(
          `${node.tagName.toLowerCase()} "${(node.textContent ?? "").trim().slice(0, 28)}" ${Math.round(rect.width)}x${Math.round(rect.height)}`,
        );
      }
    }
    return results.slice(0, 6);
  });

  for (const target of smallTargets) {
    problems.push(`[${template}] small tap target: ${target}`);
  }

  await context.close();
  console.log(`captured ${template}`);
}

await browser.close();

await writeFile(
  join(outDir, "report.txt"),
  problems.length === 0 ? "No automated issues detected.\n" : `${problems.join("\n")}\n`,
  "utf8",
);

console.log(`\n${problems.length} potential issue(s):`);
for (const problem of problems) console.log(`  ${problem}`);
