import type { TemplateTokens } from "@/templates/tokens";

/**
 * Deco Noir: near-black and brass. Cooler and harder than Velvet Maroon, and far
 * more graphic than Midnight Crescent — the black is neutral rather than navy so
 * the brass geometry reads as metal inlay rather than as light.
 */
export const DECO: TemplateTokens = {
  bg: "#0B0B0C",
  bgAlt: "#141416",
  surface: "#1C1C1F",
  ink: "#F4F0E8",
  inkSoft: "#CFC9BD",
  inkMuted: "#8E8982",
  accent: "#C9A15A",
  accentSoft: "#E6D2A6",
  line: "rgba(201, 161, 90, 0.32)",
  overlay: "rgba(11, 11, 12, 0.76)",
};

/** Inverted: a pearl page with black geometry and brass detail. */
export const DECO_ALT: TemplateTokens = {
  ...DECO,
  bg: "#F4F0E8",
  bgAlt: "#E8E2D6",
  surface: "#FBF8F2",
  ink: "#141416",
  inkSoft: "#3B3B3E",
  inkMuted: "#7B7873",
  accent: "#A8823C",
  accentSoft: "#6B5A33",
  line: "rgba(20, 20, 22, 0.2)",
};
