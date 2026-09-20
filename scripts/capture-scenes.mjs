/**
 * Walks the cinematic invitation scene by scene on a 390x844 viewport and
 * captures each screen the way a guest would see it.
 *
 * Also audits the things that would betray the illusion: scenes that are not a
 * single viewport tall, content overflowing its scene, the deck failing to lock
 * before opening, snap settling on a half-scene, and horizontal overflow.
 *
 * Usage:
 *   $env:PLAYWRIGHT_BROWSERS_PATH="D:\playwright-browsers"
 *   node scripts/capture-scenes.mjs [baseUrl] [template]
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, devices } from "playwright";

const base = process.argv[2] ?? "http://localhost:3100";
const template = process.argv[3] ?? "royal-emerald";
const slug = process.argv[4] ?? "ahmed-and-fatima";
const outDir = join(process.cwd(), "screenshots", "scenes");

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const context = await browser.newContext({
  ...devices["iPhone 13"],
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();

const notes = [];
page.on("pageerror", (error) => notes.push(`pageerror: ${String(error).slice(0, 200)}`));
page.on("console", (message) => {
  if (message.type() === "error") notes.push(`console: ${message.text().slice(0, 200)}`);
});

await page.goto(`${base}/invite/${slug}?template=${template}`, {
  waitUntil: "networkidle",
  timeout: 90_000,
});

/**
 * Software GPU rendering plus long ambient animations makes Playwright's default
 * 30s screenshot budget too tight, so shots get a longer timeout.
 */
const shot = (name) =>
  page.screenshot({ path: join(outDir, name), timeout: 120_000, animations: "allow" });

/* The opening sequence runs about six seconds before the CTA settles. */
await page.waitForTimeout(6500);
await shot(`${template}-00-cover.png`);

/* Locked: the guest must not be able to scroll past the cover. */
const beforeOpen = await page.evaluate(() => {
  const deck = document.querySelector("[data-scene-deck]");
  if (!deck) return null;
  deck.scrollTop = 900;
  return { scrollTop: deck.scrollTop, overflowY: getComputedStyle(deck).overflowY };
});
notes.push(`locked before open: ${JSON.stringify(beforeOpen)}`);

/* Scene geometry audit. */
const geometry = await page.evaluate(() => {
  const scenes = Array.from(document.querySelectorAll("[data-scene-id]"));
  const viewport = window.innerHeight;
  return {
    viewport,
    count: scenes.length,
    scenes: scenes.map((scene) => {
      const rect = scene.getBoundingClientRect();
      return {
        id: scene.dataset.sceneId,
        height: Math.round(rect.height),
        offViewport: Math.round(rect.height) > viewport + 2,
      };
    }),
  };
});
notes.push(`viewport=${geometry.viewport} scenes=${geometry.count}`);
for (const scene of geometry.scenes) {
  if (scene.offViewport) {
    notes.push(`taller than viewport: ${scene.id} (${scene.height}px)`);
  }
}

/* Open the invitation. */
await page.locator("[data-cover-action]").first().tap();
await page.waitForTimeout(2200);
await shot(`${template}-01-opened.png`);

const sceneIds = geometry.scenes.map((scene) => scene.id);

for (const [index, id] of sceneIds.entries()) {
  if (index === 0) continue;

  // Move by scrolling the deck, the same way a snap would land.
  await page.evaluate((sceneId) => {
    const target = document.getElementById(sceneId);
    target?.scrollIntoView({ behavior: "instant", block: "start" });
  }, id);

  // Let the scene's timeline play out. Scene reveals run up to ~2s of delay plus
  // their own duration, and software GPU rendering is slow, so this is generous.
  await page.waitForTimeout(4600);

  await shot(`${template}-${String(index + 1).padStart(2, "0")}-${id}.png`);

  const audit = await page.evaluate((sceneId) => {
    const deck = document.querySelector("[data-scene-deck]");
    const scene = document.getElementById(sceneId);
    if (!deck || !scene) return null;

    const deckRect = deck.getBoundingClientRect();
    const sceneRect = scene.getBoundingClientRect();

    // Does anything inside stick out of the scene box, or off the side?
    const overflowing = [];
    for (const node of scene.querySelectorAll("*")) {
      const style = getComputedStyle(node);
      if (style.position === "fixed") continue;
      if (style.overflowX === "auto" || style.overflowX === "scroll") continue;

      const rect = node.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      const clipped = node.closest("[style*='clip-path'], .overflow-hidden");
      if (clipped && clipped !== node) continue;

      if (rect.right > deckRect.right + 2 || rect.left < deckRect.left - 2) {
        overflowing.push(
          `${node.tagName.toLowerCase()}.${String(node.className).slice(0, 40)}`,
        );
      }
    }

    // Does any interactive element collide with the floating dock (music/share)?
    const dockButtons = Array.from(
      document.querySelectorAll("[aria-label='Share this invitation'], [aria-label*='music' i]"),
    );
    const dockRects = dockButtons
      .map((node) => node.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0);
    const dockClashes = [];
    if (dockRects.length) {
      for (const node of scene.querySelectorAll("a, button")) {
        if (node.hasAttribute("data-cover-action")) continue;
        const rect = node.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        for (const dock of dockRects) {
          const overlaps =
            rect.left < dock.right &&
            rect.right > dock.left &&
            rect.top < dock.bottom &&
            rect.bottom > dock.top;
          if (overlaps) {
            dockClashes.push(
              `${node.tagName.toLowerCase()}("${(node.textContent ?? "").trim().slice(0, 24)}")`,
            );
            break;
          }
        }
      }
    }

    return {
      state: scene.dataset.sceneState,
      snapOffset: Math.round(sceneRect.top - deckRect.top),
      horizontal: Math.round(deck.scrollWidth - deck.clientWidth),
      overflowing: overflowing.slice(0, 3),
      dockClashes: dockClashes.slice(0, 3),
    };
  }, id);

  if (audit) {
    if (audit.state !== "active") notes.push(`${id}: state=${audit.state} (expected active)`);
    if (Math.abs(audit.snapOffset) > 2) notes.push(`${id}: snap off by ${audit.snapOffset}px`);
    if (audit.horizontal > 2) notes.push(`${id}: horizontal overflow ${audit.horizontal}px`);
    for (const node of audit.overflowing) notes.push(`${id}: sticks out -> ${node}`);
    for (const node of audit.dockClashes) notes.push(`${id}: DOCK OVERLAP -> ${node}`);
  }

  console.log(`captured ${index + 1}/${sceneIds.length} ${id}`);
}

await browser.close();
await writeFile(join(outDir, "report.txt"), `${notes.join("\n")}\n`, "utf8");
console.log(`\n--- audit ---\n${notes.join("\n")}`);
