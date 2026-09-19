/**
 * Smoke test of the authenticated creator path in local-repository mode.
 *
 * Seeds one invitation into the local JSON store for a known owner, then checks
 * over HTTP that the dashboard, editor and RSVP pages read it back, that a guest
 * can submit a real RSVP, and that the response reaches the author's RSVP page.
 *
 * Usage:  node scripts/smoke-authenticated.mjs [baseUrl]
 * Only ever creates or appends; nothing is removed.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const base = process.argv[2] ?? "http://localhost:3000";
const storePath = join(process.cwd(), ".data", "dawatnama.json");

const ownerId = "user_smokeowner";
const cookie = `dawatnama_local_session=${ownerId}::smoke%40example.com`;
const invitationId = "inv_smoketest";
const slug = "smoke-test-wedding";

let failures = 0;
function check(name, condition, detail = "") {
  if (!condition) failures += 1;
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

/* Seed ------------------------------------------------------------- */

const seeded = {
  ownerId,
  archivedAt: null,
  data: {
    id: invitationId,
    slug,
    status: "published",
    couple: {
      order: "bride-first",
      bride: { name: "Ayesha Siddiqui", shortName: "Ayesha" },
      groom: { name: "Bilal Raza", shortName: "Bilal" },
      shortDescription: "A smoke test couple.",
    },
    weddingDate: "2027-03-14",
    weddingTime: "17:00",
    invitationMessage: "Please join us.",
    events: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Nikah",
        date: "2027-03-14",
        startTime: "17:00",
        enabled: true,
        rsvpRequired: true,
        venue: { name: "Test Hall", address: "1 Test Road" },
      },
    ],
    gallery: [{ url: "/demo/gallery-01.svg", alt: "Test photograph" }],
    rsvp: { enabled: true, askPhone: true, askGuestCount: true, maxGuests: 4 },
    sections: { rsvp: true, events: true, venue: true, gallery: true },
    appearance: { templateId: "mughal-arch" },
  },
};

let store = { version: 1, invitations: [], responses: [] };
try {
  store = JSON.parse(await readFile(storePath, "utf8"));
  store.invitations ??= [];
  store.responses ??= [];
} catch {
  // First run: the store does not exist yet.
}

store.invitations = [
  ...store.invitations.filter((entry) => entry.data?.id !== invitationId),
  seeded,
];

await mkdir(join(process.cwd(), ".data"), { recursive: true });
await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
console.log(`Seeded invitation ${invitationId} for ${ownerId}\n`);

/* Checks ----------------------------------------------------------- */

async function get(path, withAuth = true) {
  const response = await fetch(`${base}${path}`, {
    headers: withAuth ? { cookie } : {},
    redirect: "manual",
  });
  return { status: response.status, body: await response.text() };
}

const dashboard = await get("/dashboard");
check(
  "Dashboard lists the invitation",
  dashboard.status === 200 &&
    dashboard.body.includes("Ayesha") &&
    dashboard.body.includes(slug),
);

const editor = await get(`/dashboard/invitations/${invitationId}`);
check(
  "Editor loads the saved invitation",
  editor.status === 200 &&
    editor.body.includes("Ayesha") &&
    editor.body.includes("Nikah"),
);

const publicPage = await get(`/invite/${slug}`, false);
check(
  "Published invitation is publicly readable",
  publicPage.status === 200 &&
    publicPage.body.includes("Ayesha") &&
    publicPage.body.includes("Test Hall"),
);

const guestRsvp = await fetch(`${base}/api/invite/${slug}/rsvp`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    guestName: "Smoke Guest",
    phone: "+92 300 0000001",
    attendance: "attending",
    guestCount: 9, // above maxGuests: must be clamped to 4
    eventIds: ["11111111-1111-4111-8111-111111111111", "not-a-real-event"],
    message: "Congratulations!",
  }),
});
check("Guest RSVP accepted", guestRsvp.status === 201);

const afterStore = JSON.parse(await readFile(storePath, "utf8"));
const saved = afterStore.responses.filter((entry) => entry.invitationId === invitationId);
const latest = saved.at(-1);

check("RSVP persisted", saved.length > 0);
check(
  "Guest count clamped to the author's maximum",
  latest?.guestCount === 4,
  `stored ${latest?.guestCount}`,
);
check(
  "Unknown event ids discarded",
  latest?.eventIds.length === 1,
  `stored ${JSON.stringify(latest?.eventIds)}`,
);

const rsvpPage = await get(`/dashboard/invitations/${invitationId}/rsvp`);
check(
  "RSVP dashboard shows the response",
  rsvpPage.status === 200 &&
    rsvpPage.body.includes("Smoke Guest") &&
    rsvpPage.body.includes("Congratulations!"),
);

const otherOwner = await fetch(`${base}/dashboard/invitations/${invitationId}`, {
  headers: { cookie: "dawatnama_local_session=user_someoneelse::other%40example.com" },
  redirect: "manual",
});
check(
  "Another account cannot open the invitation",
  otherOwner.status === 404,
  `status ${otherOwner.status}`,
);

/* Section visibility ------------------------------------------------ */

const minimalId = "inv_smoketest_minimal";
const minimalSlug = "smoke-test-minimal";

const minimal = {
  ownerId,
  archivedAt: null,
  data: {
    id: minimalId,
    slug: minimalSlug,
    status: "published",
    couple: {
      bride: { name: "Hafsa Noor", shortName: "Hafsa" },
      groom: { name: "Usman Tariq", shortName: "Usman" },
    },
    weddingDate: "2027-05-02",
    events: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        name: "Nikah",
        date: "2027-05-02",
        enabled: true,
        venue: { name: "Quiet Hall", address: "2 Quiet Street" },
      },
    ],
    // Everything optional is switched off, and there is no gallery content.
    gallery: [],
    story: [],
    rsvp: { enabled: false },
    sections: {
      gallery: false,
      rsvp: false,
      story: false,
      dressCode: false,
      countdown: false,
      couple: false,
      verse: false,
      family: false,
    },
    appearance: { templateId: "royal-emerald" },
  },
};

const current = JSON.parse(await readFile(storePath, "utf8"));
current.invitations = [
  ...current.invitations.filter((entry) => entry.data?.id !== minimalId),
  minimal,
];
await writeFile(storePath, JSON.stringify(current, null, 2), "utf8");

const trimmed = await get(`/invite/${minimalSlug}`, false);
const trimmedBody = trimmed.body;

// Assert against rendered markup rather than text that also appears in the RSC
// payload: default RSVP wording is present in the data even when unused.
check(
  "Disabled sections leave no heading behind",
  trimmed.status === 200 &&
    !trimmedBody.includes('id="rsvp"') &&
    !trimmedBody.includes("Send response") &&
    !trimmedBody.includes(">Gallery<") &&
    !trimmedBody.includes("Our Story") &&
    !trimmedBody.includes("Counting down"),
);

check(
  "Enabled sections still render",
  trimmedBody.includes("Hafsa") &&
    trimmedBody.includes("Quiet Hall") &&
    trimmedBody.includes("The Events"),
);

console.log(
  failures === 0 ? "\nAll authenticated checks passed." : `\n${failures} check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
