import type { TemplateTokens } from "@/templates/tokens";

/**
 * Royal Emerald palette: deep emerald grounds, antique gold linework, warm
 * ivory type. The `alt` background is a shade lighter for the bands that sit
 * between the darkest sections.
 */
export const ROYAL_EMERALD: TemplateTokens = {
  bg: "#08241d",
  bgAlt: "#0b2e25",
  surface: "#0f3d32",
  ink: "#f5efe3",
  inkSoft: "#dcd3c2",
  inkMuted: "#a8a08d",
  accent: "#c9a227",
  accentSoft: "#e8d9a8",
  line: "rgba(201, 162, 39, 0.34)",
  overlay: "rgba(8, 36, 29, 0.68)",
};

/** The author's "alt background" switch lifts the whole scheme slightly. */
export const ROYAL_EMERALD_ALT: TemplateTokens = {
  ...ROYAL_EMERALD,
  bg: "#0b2e25",
  bgAlt: "#08241d",
  surface: "#134a3c",
};
