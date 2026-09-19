/**
 * Captures the WebGL opening on a 390x844 mobile viewport.
 *
 * Grabs three moments per template — the canvas settling in, the field at full
 * strength, and the burst as the invitation opens — plus a check that the canvas
 * actually exists and is drawing.
 *
 * Usage:
 *   $env:PLAYWRIGHT_BROWSERS_PATH="D:\playwright-browsers"
 *   node scripts/capture-webgl.mjs [baseUrl]
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, devices } from "playwright";

const base = process.argv[2] ?? "http://localhost:3000";
const slug = process.argv[3] ?? "ahmed-and-fatima";
const outDir = join(process.cwd(), "screenshots", "webgl");

const TEMPLATES = [
  "royal-emerald",
  "ivory-rose",
  "midnight-crescent",
  "mughal-arch",
  "minimal-signature",
];

await mkdir(outDir, { recursive: true });

// Headless Chromium needs a GPU path for WebGL; these flags provide a software one.
const browser = await chromium.launch({
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
  ],
});

const notes = [];

for (const template of TEMPLATES) {
  const context = await browser.newContext({
    ...devices["iPhone 13"],
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  page.on("pageerror", (error) =>
    notes.push(`[${template}] pageerror: ${String(error).slice(0, 200)}`),
  );
  page.on("console", (message) => {
    if (message.type() === "error") {
      notes.push(`[${template}] console: ${message.text().slice(0, 200)}`);
    }
  });

  await page.goto(`${base}/invite/${slug}?template=${template}`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });

  // Canvas is mounted lazily after a short idle delay.
  let canvasFound = false;
  try {
    await page.waitForSelector("canvas", { timeout: 15_000 });
    canvasFound = true;
  } catch {
    canvasFound = false;
  }

  notes.push(`[${template}] canvas present: ${canvasFound}`);

  if (canvasFound) {
    const info = await page.evaluate(() => {
      const canvas = document.querySelector("canvas");
      if (!canvas) return null;
      const context =
        canvas.getContext("webgl2", { preserveDrawingBuffer: false }) ??
        canvas.getContext("webgl");
      return {
        width: canvas.width,
        height: canvas.height,
        hasContext: Boolean(context),
        opacity: getComputedStyle(canvas.parentElement).opacity,
      };
    });
    notes.push(`[${template}] canvas ${JSON.stringify(info)}`);
  }

  await page.waitForTimeout(3500);
  await page.screenshot({ path: join(outDir, `${template}-1-settled.png`) });

  await page.waitForTimeout(2500);
  await page.screenshot({ path: join(outDir, `${template}-2-field.png`) });

  // Tap open and catch the burst mid-flight.
  const opener = page.locator("[data-cover-action]");
  if ((await opener.count()) > 0) {
    await opener.first().tap();
    await page.waitForTimeout(450);
    await page.screenshot({ path: join(outDir, `${template}-3-burst.png`) });
  }

  await context.close();
  console.log(`captured ${template}`);
}

await browser.close();
await writeFile(join(outDir, "report.txt"), `${notes.join("\n")}\n`, "utf8");

console.log(`\n${notes.join("\n")}`);
