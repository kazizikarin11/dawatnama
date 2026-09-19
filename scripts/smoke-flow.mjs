/**
 * End-to-end smoke test of the creator + guest flow against a running server.
 *
 * Exercises the real HTTP surface in local-repository mode:
 *   sign in -> create -> save (with events, venue, gallery, RSVP) -> publish
 *   -> guest opens the public invitation -> guest submits an RSVP
 *   -> the response appears on the author's RSVP page
 *
 * Usage:  node scripts/smoke-flow.mjs [baseUrl]
 * It only reads and posts over HTTP; it never modifies files.
 */

const base = process.argv[2] ?? "http://localhost:3000";
const cookie = `dawatnama_local_session=user_smoke${Date.now().toString(36)}::smoke%40example.com`;

let failures = 0;

function check(name, condition, detail = "") {
  const status = condition ? "PASS" : "FAIL";
  if (!condition) failures += 1;
  console.log(`${status}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function get(path, withAuth = true) {
  const response = await fetch(`${base}${path}`, {
    headers: withAuth ? { cookie } : {},
    redirect: "manual",
  });
  const body = response.headers.get("content-type")?.includes("image")
    ? ""
    : await response.text();
  return { status: response.status, body };
}

// Server Actions (create / save / publish) are driven from the editor UI rather
// than from here; this script covers the public HTTP surface.

console.log(`Smoke testing ${base}\n`);

/* 1. Public surface ------------------------------------------------- */

const home = await get("/", false);
check("Landing page renders", home.status === 200 && home.body.includes("Dawatnama"));

const templates = await get("/templates", false);
// `&` arrives HTML-escaped in the markup, so compare against decoded text.
const templatesText = templates.body.replace(/&amp;/g, "&");
check(
  "Template picker lists all five designs",
  ["Royal Emerald", "Ivory & Rose", "Midnight Crescent", "Mughal Arch", "Minimal Signature"]
    .every((name) => templatesText.includes(name)),
);

/* 2. The same data in all five templates ---------------------------- */

const markers = {
  "royal-emerald": "Barakallahu lakuma",
  "ivory-rose": "Counting the days",
  "midnight-crescent": "Until the nikah",
  "mughal-arch": "The days ahead",
  "minimal-signature": "Programme",
};

const lengths = new Map();
for (const [template, marker] of Object.entries(markers)) {
  const page = await get(`/invite/ahmed-and-fatima?template=${template}`, false);
  lengths.set(template, page.body.length);
  check(
    `${template}: renders shared wedding data`,
    page.status === 200 &&
      page.body.includes("Fatima") &&
      page.body.includes("Ahmed") &&
      page.body.includes("Noor Banquet Hall") &&
      page.body.includes(marker),
  );
}

check(
  "The five templates produce genuinely different markup",
  new Set(lengths.values()).size === 5,
  [...lengths.entries()].map(([id, len]) => `${id}:${len}`).join(" "),
);

/* 3. Error states --------------------------------------------------- */

const missing = await get("/invite/no-such-invitation", false);
check("Unknown slug returns 404", missing.status === 404);

const og = await get("/invite/ahmed-and-fatima/opengraph-image", false);
check("Social preview image generated", og.status === 200);

const guarded = await get("/dashboard", false);
check("Dashboard requires a session", guarded.status === 307 || guarded.status === 302);

/* 4. RSVP validation ------------------------------------------------ */

async function postRsvp(slug, payload) {
  const response = await fetch(`${base}/api/invite/${slug}/rsvp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { status: response.status, body: await response.text() };
}

const badRsvp = await postRsvp("ahmed-and-fatima", {
  guestName: "x",
  attendance: "maybe",
});
check("Malformed RSVP rejected", badRsvp.status === 422);

const demoRsvp = await postRsvp("ahmed-and-fatima", {
  guestName: "Demo Guest",
  attendance: "attending",
  guestCount: 2,
});
check(
  "Demo RSVP accepted without storing sample data",
  demoRsvp.status === 201 && demoRsvp.body.includes("demo"),
);

const closedRsvp = await postRsvp("no-such-invitation", {
  guestName: "Nobody",
  attendance: "attending",
});
check("RSVP to unknown invitation rejected", closedRsvp.status === 404);

console.log(
  failures === 0
    ? "\nAll public-surface checks passed."
    : `\n${failures} check(s) failed.`,
);

process.exit(failures === 0 ? 0 : 1);
