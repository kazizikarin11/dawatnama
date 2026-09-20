import type { TemplateTokens } from "@/templates/tokens";

/**
 * Peacock Zari: deep peacock teal with gold zari thread. The teal carries a green
 * cast rather than a blue one, which is what separates it from Midnight Crescent,
 * and the gold is warmer and brassier than Royal Emerald's antique tone.
 */
export const PEACOCK: TemplateTokens = {
  bg: "#08292A",
  bgAlt: "#0C3B3C",
  surface: "#114A4B",
  ink: "#F3EBDA",
  inkSoft: "#D5CBB6",
  inkMuted: "#95A09A",
  accent: "#D9A94C",
  accentSoft: "#F0D9A0",
  line: "rgba(217, 169, 76, 0.28)",
  overlay: "rgba(8, 41, 42, 0.72)",
};

/** A deeper, more saturated variation for evening functions. */
export const PEACOCK_ALT: TemplateTokens = {
  ...PEACOCK,
  bg: "#05201F",
  bgAlt: "#093231",
  accent: "#E0B75E",
  accentSoft: "#F5E3B2",
};
