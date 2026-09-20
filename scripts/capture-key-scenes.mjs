/**
 * Captures a curated set of scenes per template, for quick visual review.
 *
 * The full deck walk in capture-scenes.mjs is thorough but slow. This picks the
 * scenes that actually reveal design quality — the cover, a reading scene, a
 * portrait, the countdown, one event, the gallery, the RSVP question and the
 * closing — so several templates can be judged in one pass.
 *
 * Usage:
 *   $env:PLAYWRIGHT_BROWSERS_PATH="D:\playwright-browsers"
 *   node scripts/capture-key-scenes.mjs <baseUrl> <template> [...templates]
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, devices } from "playwright";

const base = process.argv[2] ?? "http://localhost:3000";
const templates = process.argv.slice(3);
if (templates.length === 0) {
  console.error("Pass at least one template id.");
  process.exit(1);
}

const slug = "ahmed-and-fatima";
const outDir = join(process.cwd(), "screenshots", "review");
await mkdir(outDir, { recursive: true });

/** Scene ids are prefixed by kind, so a prefix match picks the first of each. */
const WANTED = [
  { key: "cover", match: (id) => id === "cover" },
  { key: "invitation", match: (id) => id === "invitation" },
  { key: "portrait", match: (id) => id.startsWith("party-") || id === "couple" },
  { key: "countdown", match: (id) => id === "countdown" },
  { key: "event", match: (id) => id.startsWith("event-") },
  { key: "venue", match: (id) => id.startsWith("venue-") },
  { key: "story", match: (id) => id.startsWith("story-") },
  { key: "gallery", match: (id) => id === "gallery" },
  { key: "rsvp", match: (id) => id === "rsvp-intro" },
  { key: "closing", match: (id) => id === "closing" },
];

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const notes = [];

for (const template of templates) {
  const context = await browser.newContext({
    ...devices["iPhone 13"],
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  page.on("pageerror", (error) =>
    notes.push(`${template} pageerror: ${String(error).slice(0, 160)}`),
  );
  page.on("console", (message) => {
    if (message.type() === "error") {
      notes.push(`${template} console: ${message.text().slice(0, 160)}`);
    }
  });

  await page.goto(`${base}/invite/${slug}?template=${template}`, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });

  const shot = (name) =>
    page.screenshot({ path: join(outDir, name), timeout: 120_000, animations: "allow" });

  // The opening runs ~5-6s before the call to action settles.
  await page.waitForTimeout(6500);
  await shot(`${template}-00-cover.png`);

  // Open, then let the deck unlock and settle.
  await page.locator("[data-cover-action]").first().tap();
  await page.waitForTimeout(2200);

  const ids = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-scene-id]")).map(
      (node) => node.dataset.sceneId,
    ),
  );

  let index = 1;
  for (const want of WANTED) {
    if (want.key === "cover") continue;
    const id = ids.find((candidate) => want.match(candidate));
    if (!id) {
      notes.push(`${template}: no scene for "${want.key}"`);
      continue;
    }

    await page.evaluate((sceneId) => {
      document.getElementById(sceneId)?.scrollIntoView({ behavior: "instant", block: "start" });
    }, id);

    // Long enough for the scene's timeline to finish under software rendering.
    await page.waitForTimeout(4200);

    await shot(`${template}-${String(index).padStart(2, "0")}-${want.key}.png`);

    const audit = await page.evaluate((sceneId) => {
      const deck = document.querySelector("[data-scene-deck]");
      const scene = document.getElementById(sceneId);
      if (!deck || !scene) return null;
      const deckRect = deck.getBoundingClientRect();

      // Controls that collide with the floating dock are a real usability bug.
      const dock = Array.from(
        document.querySelectorAll(
          "[aria-label='Share this invitation'], [aria-label*='music' i]",
        ),
      )
        .map((node) => node.getBoundingClientRect())
        .filter((rect) => rect.width > 0);

      const clashes = [];
      for (const node of scene.querySelectorAll("a, button")) {
        const rect = node.getBoundingClientRect();
        if (rect.width === 0) continue;
        if (
          dock.some(
            (d) =>
              rect.left < d.right &&
              rect.right > d.left &&
              rect.top < d.bottom &&
              rect.bottom > d.top,
          )
        ) {
          clashes.push((node.textContent ?? "").trim().slice(0, 22));
        }
      }

      return {
        state: scene.dataset.sceneState,
        horizontal: Math.round(deck.scrollWidth - deck.clientWidth),
        offset: Math.round(scene.getBoundingClientRect().top - deckRect.top),
        clashes,
      };
    }, id);

    if (audit) {
      if (audit.state !== "active") notes.push(`${template}/${want.key}: state=${audit.state}`);
      if (Math.abs(audit.offset) > 2) notes.push(`${template}/${want.key}: snap off ${audit.offset}px`);
      if (audit.horizontal > 2) notes.push(`${template}/${want.key}: h-overflow ${audit.horizontal}px`);
      for (const clash of audit.clashes) {
        notes.push(`${template}/${want.key}: DOCK OVERLAP -> "${clash}"`);
      }
    }

    index += 1;
  }

  await context.close();
  console.log(`captured ${template}`);
}

await browser.close();
await writeFile(join(outDir, "report.txt"), `${notes.join("\n")}\n`, "utf8");
console.log(`\n--- audit ---\n${notes.length ? notes.join("\n") : "no issues found"}`);
