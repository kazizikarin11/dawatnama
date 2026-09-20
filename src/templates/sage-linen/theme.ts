import type { TemplateTokens } from "@/templates/tokens";

/**
 * Sage Linen: eucalyptus and oat. The lightest, calmest palette in the set, built
 * for a daytime nikah. Where Ivory & Rose is warm and blush, this is cool and
 * green, and the accent is a muted leaf rather than a metallic.
 */
export const SAGE: TemplateTokens = {
  bg: "#F4F1E7",
  bgAlt: "#E7E3D4",
  surface: "#FBF9F3",
  ink: "#2F3A2E",
  inkSoft: "#4F5B4B",
  inkMuted: "#828C7C",
  accent: "#6E7F6A",
  accentSoft: "#B6C2AC",
  line: "rgba(47, 58, 46, 0.18)",
  overlay: "rgba(47, 58, 46, 0.26)",
};

/** A warmer oat-forward variation. */
export const SAGE_ALT: TemplateTokens = {
  ...SAGE,
  bg: "#F1ECDE",
  bgAlt: "#E2DBC6",
  accent: "#7C8A63",
  accentSoft: "#C2CBAE",
};
