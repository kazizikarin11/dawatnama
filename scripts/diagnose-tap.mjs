/**
 * Diagnoses what actually sits on top of the "open invitation" control.
 *
 * Reports the element the browser would hit at the button's centre, plus the
 * computed pointer-events and paint order of every full-bleed overlay on the
 * cover. Read-only.
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
  const button = document.querySelector("[data-cover-action]");
  if (!button) return { error: "no cover action button" };

  const rect = button.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  const hit = document.elementFromPoint(x, y);
  const stack = document.elementsFromPoint(x, y).map((node) => {
    const style = getComputedStyle(node);
    return {
      tag: node.tagName.toLowerCase(),
      cls: String(node.className ?? "").slice(0, 70),
      pointerEvents: style.pointerEvents,
      position: style.position,
      zIndex: style.zIndex,
    };
  });

  return {
    button: {
      rect: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
      },
      disabled: button.disabled,
    },
    hit: hit
      ? {
          tag: hit.tagName.toLowerCase(),
          cls: String(hit.className ?? "").slice(0, 70),
          isButtonOrChild: button.contains(hit),
        }
      : null,
    stack,
  };
});

console.log(JSON.stringify(report, null, 2));

// Does a plain click actually open it?
const before = await page.locator("[data-cover-action]").count();
await page.locator("[data-cover-action]").first().click({ timeout: 8000, force: true });
await page.waitForTimeout(2000);
const after = await page.locator("[data-cover-action]").count();
console.log(`\ncover action present before=${before} after=${after} (0 after = opened)`);

await browser.close();
