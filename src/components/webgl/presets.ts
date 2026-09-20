import type { TemplateId } from "@/lib/wedding/types";

/**
 * Per-template WebGL presets.
 *
 * The scene code is shared; only these numbers and colours differ, which keeps
 * each template's opening unmistakably its own without five separate renderers.
 * Minimal Signature is intentionally the quietest — its identity is restraint, so
 * it gets a barely-there haze rather than a particle show.
 */

export interface CoverPreset {
  /** Particle count at the high tier; the low tier uses roughly half. */
  count: number;
  colorA: string;
  colorB: string;
  /** Base point size in world units. */
  size: number;
  /** 1 rises, -1 falls. */
  direction: 1 | -1;
  /** Vertical travel range in world units. */
  spread: number;
  /** Lateral sway amplitude. */
  sway: number;
  speed: number;
  /** Additive bloom behind the type. 0 disables it. */
  glow: { color: string; intensity: number; scale: number };
  /** Soft moving light bands. 0 disables. */
  aurora: { color: string; intensity: number };
  /** Pointer/tilt parallax strength. */
  parallax: number;
  /** Extra layer of large, very soft bokeh discs. */
  bokeh: number;
}

export const COVER_PRESETS: Record<TemplateId, CoverPreset> = {
  // Gold dust lifting through a dark emerald hall.
  "royal-emerald": {
    count: 520,
    colorA: "#c9a227",
    colorB: "#f0e3b8",
    size: 26,
    direction: 1,
    spread: 7,
    sway: 0.45,
    speed: 0.55,
    glow: { color: "#c9a227", intensity: 0.16, scale: 5 },
    aurora: { color: "#1c5a4a", intensity: 0.1 },
    parallax: 0.5,
    bokeh: 14,
  },

  // Blush petals drifting down across warm paper.
  "ivory-rose": {
    count: 300,
    colorA: "#b76e79",
    colorB: "#e7cfc8",
    size: 44,
    direction: -1,
    spread: 7.5,
    sway: 0.85,
    speed: 0.42,
    glow: { color: "#f3ddd6", intensity: 0.12, scale: 5.5 },
    aurora: { color: "#e7cfc8", intensity: 0.07 },
    parallax: 0.35,
    bokeh: 12,
  },

  // The full night: deep starfield, gold motes, moonlight bloom.
  "midnight-crescent": {
    count: 900,
    colorA: "#d8b978",
    colorB: "#eef3ff",
    size: 22,
    direction: 1,
    spread: 9,
    sway: 0.3,
    speed: 0.32,
    // A tight, cool moonlight halo. Gold at any strength across the whole frame
    // turns this template sepia, which is the one thing it must never be.
    glow: { color: "#9fb4d8", intensity: 0.14, scale: 5 },
    aurora: { color: "#24406e", intensity: 0.16 },
    parallax: 0.85,
    bokeh: 22,
  },

  // Fine warm sand caught in low sun.
  "mughal-arch": {
    count: 340,
    colorA: "#b3653c",
    colorB: "#d9b899",
    size: 24,
    direction: 1,
    spread: 7,
    sway: 0.4,
    speed: 0.38,
    glow: { color: "#d9b899", intensity: 0.09, scale: 5 },
    aurora: { color: "#b9c3ac", intensity: 0.06 },
    parallax: 0.3,
    bokeh: 8,
  },

  // Almost nothing: a slow haze and the faintest grain.
  "minimal-signature": {
    count: 160,
    colorA: "#a08b5f",
    colorB: "#ded8ce",
    size: 18,
    direction: 1,
    spread: 6,
    sway: 0.22,
    speed: 0.26,
    glow: { color: "#ded8ce", intensity: 0.06, scale: 4.5 },
    aurora: { color: "#ded8ce", intensity: 0.03 },
    parallax: 0.2,
    bokeh: 0,
  },

  // Gold thread catching light over teal, with a green-cast aurora so the
  // template never drifts toward Midnight Crescent's blue.
  "peacock-zari": {
    count: 480,
    colorA: "#d9a94c",
    colorB: "#4fd1c5",
    size: 24,
    direction: 1,
    spread: 7,
    sway: 0.5,
    speed: 0.5,
    glow: { color: "#d9a94c", intensity: 0.15, scale: 5 },
    aurora: { color: "#0f6b62", intensity: 0.14 },
    parallax: 0.55,
    bokeh: 16,
  },

  // Heavy warm dust settling through a curtained room. Slow and low.
  "velvet-maroon": {
    count: 360,
    colorA: "#c08a3e",
    colorB: "#e3c68f",
    size: 28,
    direction: -1,
    spread: 6.5,
    sway: 0.3,
    speed: 0.3,
    glow: { color: "#c08a3e", intensity: 0.17, scale: 5.5 },
    aurora: { color: "#5c1729", intensity: 0.18 },
    parallax: 0.34,
    bokeh: 18,
  },

  // Daylight and pollen. The quietest of the light templates.
  "sage-linen": {
    count: 220,
    colorA: "#6e7f6a",
    colorB: "#e7e3d4",
    size: 30,
    direction: -1,
    spread: 7,
    sway: 0.7,
    speed: 0.3,
    glow: { color: "#ffffff", intensity: 0.12, scale: 6 },
    aurora: { color: "#b6c2ac", intensity: 0.06 },
    parallax: 0.26,
    bokeh: 10,
  },

  // Brass flecks against black. Tight, bright, and no atmosphere at all —
  // this template's drama is geometric, not weather.
  "deco-noir": {
    count: 300,
    colorA: "#c9a15a",
    colorB: "#f4f0e8",
    size: 16,
    direction: 1,
    spread: 6,
    sway: 0.14,
    speed: 0.6,
    glow: { color: "#c9a15a", intensity: 0.12, scale: 4 },
    aurora: { color: "#c9a15a", intensity: 0.04 },
    parallax: 0.42,
    bokeh: 4,
  },

  // Gold leaf lifting off a lapis page.
  "calligraphy-azure": {
    count: 400,
    colorA: "#d4b061",
    colorB: "#f5f3ec",
    size: 20,
    direction: 1,
    spread: 8,
    sway: 0.36,
    speed: 0.36,
    glow: { color: "#d4b061", intensity: 0.13, scale: 5 },
    aurora: { color: "#16315c", intensity: 0.2 },
    parallax: 0.6,
    bokeh: 12,
  },
};
