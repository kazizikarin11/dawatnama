import type { TemplateTokens } from "@/templates/tokens";

/**
 * Mughal Arch: sandstone and ivory with muted sage, terracotta used only as a
 * punctuation accent. Light, dry, architectural.
 */
export const MUGHAL: TemplateTokens = {
  bg: "#f4efe3",
  bgAlt: "#e6ddc9",
  surface: "#fbf8f1",
  ink: "#3b3529",
  inkSoft: "#5a5343",
  inkMuted: "#8a8271",
  accent: "#b3653c",
  accentSoft: "#d9b899",
  line: "rgba(59, 53, 41, 0.2)",
  overlay: "rgba(59, 53, 41, 0.28)",
};

/** Sage-forward variation for a cooler, garden-courtyard feel. */
export const MUGHAL_ALT: TemplateTokens = {
  ...MUGHAL,
  bg: "#edf0e8",
  bgAlt: "#dbe1d3",
  accent: "#6f7b5c",
  accentSoft: "#b9c3ac",
  line: "rgba(60, 68, 58, 0.22)",
};
