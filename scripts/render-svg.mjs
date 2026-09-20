/**
 * Renders SVG files from public/ to PNG so illustration work can be reviewed.
 *
 * Usage:
 *   $env:PLAYWRIGHT_BROWSERS_PATH="D:\playwright-browsers"
 *   node scripts/render-svg.mjs demo/portrait-bride.svg demo/portrait-groom.svg
 */

import { mkdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { chromium } from "playwright";

const inputs = process.argv.slice(2);
if (inputs.length === 0) {
  console.error("Pass one or more paths relative to public/, e.g. demo/x.svg");
  process.exit(1);
}

const outDir = join(process.cwd(), "screenshots", "art");
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 600, height: 800 },
  deviceScaleFactor: 1,
});

for (const relative of inputs) {
  const file = join(process.cwd(), "public", relative);
  const svg = await readFile(file, "utf8");

  // Inline the markup so there is no file:// or server dependency.
  await page.setContent(
    `<!doctype html><html><body style="margin:0;display:grid;place-items:center;
       background:#8a8a8a;height:100vh">
       <div style="width:540px;aspect-ratio:3/4">${svg}</div>
     </body></html>`,
    { waitUntil: "load" },
  );

  // Make the inlined svg fill its box regardless of its own width/height attrs.
  await page.evaluate(() => {
    const node = document.querySelector("svg");
    if (node) {
      node.setAttribute("width", "100%");
      node.setAttribute("height", "100%");
    }
  });

  const name = `${basename(relative, ".svg")}.png`;
  await page.screenshot({ path: join(outDir, name) });
  console.log(`rendered ${relative} -> screenshots/art/${name}`);
}

await browser.close();
