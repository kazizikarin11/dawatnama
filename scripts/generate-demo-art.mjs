/**
 * Generates the demo placeholder artwork in `public/demo`.
 *
 * These stand in for the couple's photographs during development so the
 * templates can be judged on composition and motion without shipping any real
 * person's likeness. Run with:  node scripts/generate-demo-art.mjs
 *
 * The script only ever writes files; it never removes anything.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "public", "demo");

const PALETTES = {
  emerald: { bg: "#08241D", mid: "#0F3D32", light: "#1C5A4A", ink: "#F5EFE3", gold: "#C9A227" },
  rose: { bg: "#F6EBE6", mid: "#E7CFC8", light: "#F9F4F0", ink: "#4A3B37", gold: "#C08C74" },
  midnight: { bg: "#070B17", mid: "#101A32", light: "#1B2847", ink: "#EFE7D6", gold: "#D8B978" },
  sand: { bg: "#EDE4D4", mid: "#DBCBB2", light: "#F7F1E6", ink: "#4B4437", gold: "#B98A5E" },
  sage: { bg: "#DCE1D5", mid: "#B9C3AC", light: "#F2F0E7", ink: "#3C443A", gold: "#A8763E" },
  mono: { bg: "#F4F1EC", mid: "#DED8CE", light: "#FBF9F6", ink: "#171614", gold: "#A08B5F" },
  terracotta: { bg: "#E9D9CB", mid: "#CDA189", light: "#F6EDE4", ink: "#4A342A", gold: "#B3653C" },
  /**
   * Deliberately neutral warm grey, used for the shared cover asset. A hero image
   * has to sit under five different palettes, so it must behave like a muted
   * photograph rather than carry a colour identity of its own.
   */
  photo: { bg: "#4f463b", mid: "#7c6f5d", light: "#d2c4a8", ink: "#f4efe4", gold: "#c9ae7c" },
};

/** Fine film grain + soft vignette so flat art still reads as photographic. */
const defs = (p, id) => `
  <defs>
    <linearGradient id="sky-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${p.bg}"/>
      <stop offset="62%" stop-color="${p.mid}"/>
      <stop offset="100%" stop-color="${p.bg}"/>
    </linearGradient>
    <radialGradient id="glow-${id}" cx="50%" cy="38%" r="62%">
      <stop offset="0%" stop-color="${p.light}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${p.light}" stop-opacity="0"/>
    </radialGradient>
    <filter id="grain-${id}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="${id}"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <radialGradient id="vig-${id}" cx="50%" cy="50%" r="72%">
      <stop offset="60%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.3"/>
    </radialGradient>
  </defs>`;

const wrap = (w, h, p, id, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">
${defs(p, id)}
  <rect width="${w}" height="${h}" fill="url(#sky-${id})"/>
  <rect width="${w}" height="${h}" fill="url(#glow-${id})"/>
${body}
  <rect width="${w}" height="${h}" fill="url(#vig-${id})"/>
  <rect width="${w}" height="${h}" filter="url(#grain-${id})" opacity="0.05"/>
</svg>
`;

/** Eight-point Islamic star, drawn as fine linework. */
function star(cx, cy, r, stroke, width = 1.1, opacity = 0.5) {
  const pts = [];
  for (let i = 0; i < 16; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.52;
    const angle = (Math.PI / 8) * i - Math.PI / 2;
    pts.push(`${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="none" stroke="${stroke}" stroke-width="${width}" opacity="${opacity}"/>`;
}

function lattice(w, h, p, step = 96) {
  let out = "";
  for (let y = step * 0.5; y < h + step; y += step) {
    for (let x = step * 0.5; x < w + step; x += step) {
      out += star(x, y, step * 0.36, p.gold, 0.8, 0.16);
    }
  }
  return `<g>${out}</g>`;
}

/** A pointed Mughal-style arch path. */
function archPath(x, y, w, h) {
  const half = w / 2;
  const shoulder = y + h * 0.42;
  return `M ${x} ${y + h} L ${x} ${shoulder} C ${x} ${y + h * 0.12} ${x + half * 0.55} ${y} ${x + half} ${y} C ${x + w - half * 0.55} ${y} ${x + w} ${y + h * 0.12} ${x + w} ${shoulder} L ${x + w} ${y + h} Z`;
}

/* ---------------------------------------------------------------- */
/* Motifs                                                            */
/* ---------------------------------------------------------------- */

const motifs = {
  arch(w, h, p) {
    const aw = w * 0.62;
    const ah = h * 0.66;
    const x = (w - aw) / 2;
    const y = h * 0.16;
    return `
  ${lattice(w, h, p, Math.round(w / 5))}
  <path d="${archPath(x, y, aw, ah)}" fill="${p.light}" opacity="0.1"/>
  <path d="${archPath(x, y, aw, ah)}" fill="none" stroke="${p.gold}" stroke-width="2" opacity="0.75"/>
  <path d="${archPath(x + aw * 0.06, y + ah * 0.05, aw * 0.88, ah * 0.92)}" fill="none" stroke="${p.gold}" stroke-width="0.9" opacity="0.4"/>
  ${star(w / 2, y + ah * 0.34, aw * 0.16, p.gold, 1.2, 0.55)}
  <line x1="${w * 0.2}" y1="${h * 0.9}" x2="${w * 0.8}" y2="${h * 0.9}" stroke="${p.gold}" stroke-width="1" opacity="0.5"/>`;
  },

  bloom(w, h, p) {
    const cx = w / 2;
    const cy = h * 0.52;
    const petals = Array.from({ length: 9 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 9;
      const rx = w * 0.06;
      const ry = h * 0.2;
      const deg = ((angle * 180) / Math.PI).toFixed(1);
      return `<ellipse cx="${cx}" cy="${cy - ry * 0.75}" rx="${rx}" ry="${ry}" fill="none" stroke="${p.gold}" stroke-width="1" opacity="0.4" transform="rotate(${deg} ${cx} ${cy})"/>`;
    }).join("");
    return `
  <g>${petals}</g>
  <circle cx="${cx}" cy="${cy}" r="${w * 0.045}" fill="${p.gold}" opacity="0.3"/>
  <path d="M ${w * 0.1} ${h * 0.86} C ${w * 0.32} ${h * 0.7} ${w * 0.68} ${h} ${w * 0.9} ${h * 0.82}" fill="none" stroke="${p.gold}" stroke-width="1.2" opacity="0.35"/>
  <path d="M ${w * 0.1} ${h * 0.14} C ${w * 0.34} ${h * 0.28} ${w * 0.66} ${h * 0.02} ${w * 0.9} ${h * 0.18}" fill="none" stroke="${p.gold}" stroke-width="1.2" opacity="0.3"/>`;
  },

  crescent(w, h, p) {
    const cx = w * 0.62;
    const cy = h * 0.3;
    const r = Math.min(w, h) * 0.16;
    const stars = Array.from({ length: 26 }, (_, i) => {
      const x = ((i * 2654435761) % 1000) / 1000;
      const y = ((i * 40503 + 17) % 1000) / 1000;
      const rr = 0.6 + ((i % 3) * 0.5);
      return `<circle cx="${(x * w).toFixed(1)}" cy="${(y * h * 0.75).toFixed(1)}" r="${rr}" fill="${p.ink}" opacity="${0.15 + (i % 4) * 0.12}"/>`;
    }).join("");
    return `
  <g>${stars}</g>
  <g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.ink}" opacity="0.9"/>
    <circle cx="${cx + r * 0.42}" cy="${cy - r * 0.22}" r="${r * 0.92}" fill="${p.bg}"/>
  </g>
  <path d="M 0 ${h * 0.78} C ${w * 0.3} ${h * 0.7} ${w * 0.7} ${h * 0.86} ${w} ${h * 0.76} L ${w} ${h} L 0 ${h} Z" fill="${p.bg}" opacity="0.85"/>
  <line x1="0" y1="${h * 0.78}" x2="${w}" y2="${h * 0.76}" stroke="${p.gold}" stroke-width="1" opacity="0.4"/>`;
  },

  horizon(w, h, p) {
    return `
  <path d="M 0 ${h * 0.62} C ${w * 0.25} ${h * 0.52} ${w * 0.55} ${h * 0.68} ${w} ${h * 0.58} L ${w} ${h} L 0 ${h} Z" fill="${p.mid}" opacity="0.9"/>
  <path d="M 0 ${h * 0.74} C ${w * 0.3} ${h * 0.66} ${w * 0.62} ${h * 0.82} ${w} ${h * 0.72} L ${w} ${h} L 0 ${h} Z" fill="${p.ink}" opacity="0.08"/>
  <circle cx="${w * 0.3}" cy="${h * 0.32}" r="${Math.min(w, h) * 0.12}" fill="${p.gold}" opacity="0.25"/>
  <circle cx="${w * 0.3}" cy="${h * 0.32}" r="${Math.min(w, h) * 0.2}" fill="none" stroke="${p.gold}" stroke-width="0.8" opacity="0.35"/>
  ${star(w * 0.76, h * 0.22, Math.min(w, h) * 0.07, p.gold, 1, 0.4)}`;
  },

  portrait(w, h, p) {
    const aw = w * 0.58;
    const ah = h * 0.7;
    const x = (w - aw) / 2;
    const y = h * 0.14;
    return `
  <path d="${archPath(x, y, aw, ah)}" fill="${p.light}" opacity="0.5"/>
  <path d="${archPath(x, y, aw, ah)}" fill="none" stroke="${p.gold}" stroke-width="1.4" opacity="0.6"/>
  <circle cx="${w / 2}" cy="${y + ah * 0.38}" r="${aw * 0.2}" fill="${p.mid}" opacity="0.85"/>
  <path d="M ${w / 2 - aw * 0.34} ${y + ah} C ${w / 2 - aw * 0.3} ${y + ah * 0.66} ${w / 2 + aw * 0.3} ${y + ah * 0.66} ${w / 2 + aw * 0.34} ${y + ah} Z" fill="${p.mid}" opacity="0.85"/>`;
  },

  stilllife(w, h, p) {
    return `
  ${lattice(w, h, p, Math.round(w / 3.5))}
  <rect x="${w * 0.18}" y="${h * 0.46}" width="${w * 0.64}" height="${h * 0.3}" fill="${p.mid}" opacity="0.55"/>
  <circle cx="${w * 0.36}" cy="${h * 0.44}" r="${w * 0.1}" fill="none" stroke="${p.gold}" stroke-width="1.4" opacity="0.6"/>
  <circle cx="${w * 0.64}" cy="${h * 0.44}" r="${w * 0.1}" fill="none" stroke="${p.gold}" stroke-width="1.4" opacity="0.6"/>
  <line x1="${w * 0.18}" y1="${h * 0.76}" x2="${w * 0.82}" y2="${h * 0.76}" stroke="${p.gold}" stroke-width="1" opacity="0.5"/>`;
  },
};

/* ---------------------------------------------------------------- */
/* Files                                                             */
/* ---------------------------------------------------------------- */

const files = [
  ["hero.svg", 1200, 1600, "emerald", "arch"],
  // The cover asset the demo actually uses: palette-neutral so it works beneath
  // all five templates without clashing with any of them.
  ["hero-cover.svg", 1200, 1600, "photo", "horizon"],
  ["portrait-bride.svg", 900, 1200, "rose", "portrait"],
  ["portrait-groom.svg", 900, 1200, "sage", "portrait"],
  ["gallery-01.svg", 1200, 1500, "sand", "horizon"],
  ["gallery-02.svg", 1200, 900, "terracotta", "bloom"],
  ["gallery-03.svg", 1200, 1500, "emerald", "arch"],
  ["gallery-04.svg", 1200, 900, "midnight", "crescent"],
  ["gallery-05.svg", 1000, 1000, "rose", "bloom"],
  ["gallery-06.svg", 1200, 900, "mono", "stilllife"],
  ["event-dholki.svg", 1200, 800, "terracotta", "bloom"],
  ["event-mehndi.svg", 1200, 800, "sage", "bloom"],
  ["event-nikah.svg", 1200, 800, "emerald", "arch"],
  ["event-walima.svg", 1200, 800, "midnight", "crescent"],
  ["venue-lawn.svg", 1400, 900, "sage", "horizon"],
  ["venue-hall.svg", 1400, 900, "emerald", "arch"],
  ["venue-ballroom.svg", 1400, 900, "midnight", "crescent"],
  ["story-01.svg", 1000, 1200, "mono", "horizon"],
  ["story-02.svg", 1000, 1200, "sand", "stilllife"],
  ["story-03.svg", 1000, 1200, "rose", "stilllife"],
  ["og-default.svg", 1200, 630, "emerald", "arch"],
];

await mkdir(outDir, { recursive: true });

let index = 1;
for (const [name, w, h, paletteName, motif] of files) {
  const palette = PALETTES[paletteName];
  const body = motifs[motif](w, h, palette);
  await writeFile(join(outDir, name), wrap(w, h, palette, index, body), "utf8");
  index += 1;
}

console.log(`Generated ${files.length} demo assets in public/demo`);
