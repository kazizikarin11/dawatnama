import type { TemplateTokens } from "@/templates/tokens";

/**
 * Velvet Maroon: wine and antique brass. Heavier and more formal than any of the
 * other dark templates — the ground reads as fabric rather than as night, so the
 * brass sits on it warmly instead of glowing out of it.
 */
export const VELVET: TemplateTokens = {
  bg: "#2E0A14",
  bgAlt: "#4A1020",
  surface: "#5C1729",
  ink: "#F2E6D6",
  inkSoft: "#D9C6B4",
  inkMuted: "#A0888A",
  accent: "#C08A3E",
  accentSoft: "#E3C68F",
  line: "rgba(192, 138, 62, 0.3)",
  overlay: "rgba(46, 10, 20, 0.74)",
};

/** A plum-forward variation, slightly cooler. */
export const VELVET_ALT: TemplateTokens = {
  ...VELVET,
  bg: "#2A0C20",
  bgAlt: "#43142F",
  accent: "#C6934B",
  accentSoft: "#E8D0A0",
};
