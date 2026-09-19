import type { TemplateTokens } from "@/templates/tokens";

/**
 * Minimal Signature: warm white and near-black. The accent is champagne and is
 * used perhaps three times in the whole invitation — restraint is the design.
 */
export const MINIMAL: TemplateTokens = {
  bg: "#f7f5f1",
  bgAlt: "#efece5",
  surface: "#fffefc",
  ink: "#171614",
  inkSoft: "#403d38",
  inkMuted: "#7d776d",
  accent: "#a08b5f",
  accentSoft: "#ded8ce",
  line: "rgba(23, 22, 20, 0.16)",
  overlay: "rgba(23, 22, 20, 0.22)",
};

/** Inverted: black page, warm white type. Same design, different weight. */
export const MINIMAL_ALT: TemplateTokens = {
  bg: "#141311",
  bgAlt: "#1c1a17",
  surface: "#201e1a",
  ink: "#f4f1ec",
  inkSoft: "#cfc9bf",
  inkMuted: "#938d82",
  accent: "#c3a978",
  accentSoft: "#4a463f",
  line: "rgba(244, 241, 236, 0.18)",
  overlay: "rgba(20, 19, 17, 0.4)",
};
