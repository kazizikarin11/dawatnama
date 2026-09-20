/**
 * Inspects one scene's DOM: the scene's reported state, and the computed opacity,
 * transform and box of its top-level content, to find why content is invisible.
 * Read-only.
 */

import { chromium, devices } from "playwright";

const base = process.argv[2] ?? "http://localhost:3200";
const sceneId = process.argv[3] ?? "countdown";
const template = process.argv[4] ?? "royal-emerald";

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const context = await browser.newContext({
  ...devices["iPhone 13"],
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();

page.on("pageerror", (error) => console.log("PAGEERROR:", String(error).slice(0, 300)));
page.on("console", (message) => {
  if (message.type() === "error") console.log("CONSOLE:", message.text().slice(0, 300));
});

await page.goto(`${base}/invite/ahmed-and-fatima?template=${template}`, {
  waitUntil: "networkidle",
});
await page.waitForTimeout(6000);
await page.locator("[data-cover-action]").first().tap();
await page.waitForTimeout(1500);

await page.evaluate((id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "instant", block: "start" });
}, sceneId);
await page.waitForTimeout(3000);

await page.screenshot({ path: `screenshots/diagnose-${sceneId}.png`, timeout: 120_000 });

const report = await page.evaluate((id) => {
  const scene = document.getElementById(id);
  if (!scene) return { error: "scene not found" };

  const walk = (node, depth) => {
    if (depth > 3) return [];
    return Array.from(node.children).flatMap((child) => {
      const style = getComputedStyle(child);
      const rect = child.getBoundingClientRect();
      const entry = {
        depth,
        tag: child.tagName.toLowerCase(),
        cls: String(child.className ?? "").slice(0, 55),
        opacity: style.opacity,
        visibility: style.visibility,
        display: style.display,
        transform: style.transform === "none" ? "none" : style.transform.slice(0, 30),
        clip: style.clipPath === "none" ? "none" : style.clipPath.slice(0, 30),
        box: `${Math.round(rect.width)}x${Math.round(rect.height)}@${Math.round(rect.top)}`,
        text: (child.textContent ?? "").trim().slice(0, 30),
      };
      return [entry, ...walk(child, depth + 1)];
    });
  };

  return {
    state: scene.dataset.sceneState,
    sceneBox: (() => {
      const rect = scene.getBoundingClientRect();
      return `${Math.round(rect.width)}x${Math.round(rect.height)}@${Math.round(rect.top)}`;
    })(),
    tree: walk(scene, 0),
  };
}, sceneId);

console.log(JSON.stringify(report, null, 2).slice(0, 6000));
await browser.close();
