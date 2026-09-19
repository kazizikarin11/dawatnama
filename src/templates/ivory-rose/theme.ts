import type { TemplateTokens } from "@/templates/tokens";

/**
 * Ivory & Rose: warm paper, blush shadow, dusty rose accent. Light scheme, with
 * text kept at a soft near-black so the palette never turns harsh.
 */
export const IVORY_ROSE: TemplateTokens = {
  bg: "#f9f4f0",
  bgAlt: "#f2e6e0",
  surface: "#fffdfb",
  ink: "#3a2e2a",
  inkSoft: "#5b4a44",
  inkMuted: "#8d7a73",
  accent: "#b76e79",
  accentSoft: "#e7cfc8",
  line: "rgba(183, 110, 121, 0.28)",
  overlay: "rgba(58, 46, 42, 0.32)",
};

/** Warmer, sandier variation. */
export const IVORY_ROSE_ALT: TemplateTokens = {
  ...IVORY_ROSE,
  bg: "#f6efe6",
  bgAlt: "#efe2d6",
  accent: "#c08c74",
  accentSoft: "#e8d5c4",
  line: "rgba(192, 140, 116, 0.3)",
};
