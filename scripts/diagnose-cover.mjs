/**
 * Reports the cover overlay's computed geometry and walks its ancestors looking
 * for the properties that turn `position: fixed` into `absolute` — transform,
 * filter, backdrop-filter, contain, perspective, will-change. Read-only.
 */

import { chromium, devices } from "playwright";

const base = process.argv[2] ?? "http://localhost:3000";
const template = process.argv[3] ?? "royal-emerald";

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

await page.goto(`${base}/invite/ahmed-and-fatima?template=${template}`, {
  waitUntil: "networkidle",
});
await page.waitForTimeout(5000);

const report = await page.evaluate(() => {
  const cover = document.querySelector('[role="dialog"][aria-label="Invitation cover"]');
  if (!cover) return { error: "cover not found" };

  const coverStyle = getComputedStyle(cover);
  const coverRect = cover.getBoundingClientRect();

  const ancestors = [];
  let node = cover.parentElement;
  while (node && node !== document.documentElement) {
    const style = getComputedStyle(node);
    const breaking = [];
    if (style.transform !== "none") breaking.push(`transform:${style.transform.slice(0, 40)}`);
    if (style.filter !== "none") breaking.push(`filter:${style.filter}`);
    if (style.backdropFilter && style.backdropFilter !== "none")
      breaking.push(`backdrop-filter:${style.backdropFilter}`);
    if (style.contain && style.contain !== "none") breaking.push(`contain:${style.contain}`);
    if (style.perspective !== "none") breaking.push(`perspective:${style.perspective}`);
    if (style.willChange !== "auto") breaking.push(`will-change:${style.willChange}`);

    ancestors.push({
      tag: node.tagName.toLowerCase(),
      cls: String(node.className ?? "").slice(0, 80),
      height: Math.round(node.getBoundingClientRect().height),
      breaking,
    });
    node = node.parentElement;
  }

  return {
    cover: {
      position: coverStyle.position,
      top: Math.round(coverRect.top),
      height: Math.round(coverRect.height),
      zIndex: coverStyle.zIndex,
      transform: coverStyle.transform.slice(0, 40),
    },
    viewportHeight: window.innerHeight,
    ancestors,
  };
});

console.log(JSON.stringify(report, null, 2));
await browser.close();
