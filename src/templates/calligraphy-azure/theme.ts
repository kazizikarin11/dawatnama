import type { TemplateTokens } from "@/templates/tokens";

/**
 * Calligraphy Azure: lapis and gold on paper white. The one template where Arabic
 * calligraphy is the subject rather than a blessing at the top, so the palette is
 * built around ink on a page: a deep lapis that reads as written, not as night.
 */
export const AZURE: TemplateTokens = {
  bg: "#0E1F3C",
  bgAlt: "#16315C",
  surface: "#1D3D6E",
  ink: "#F5F3EC",
  inkSoft: "#D3D6D1",
  inkMuted: "#8E9AA8",
  accent: "#D4B061",
  accentSoft: "#EDD9A4",
  line: "rgba(212, 176, 97, 0.3)",
  overlay: "rgba(14, 31, 60, 0.74)",
};

/** The paper variation: lapis ink written on a warm white page. */
export const AZURE_ALT: TemplateTokens = {
  ...AZURE,
  bg: "#F6F4EC",
  bgAlt: "#E8E6DA",
  surface: "#FCFBF5",
  ink: "#0E1F3C",
  inkSoft: "#2E4165",
  inkMuted: "#6F7C92",
  accent: "#B3913F",
  accentSoft: "#5C6E93",
  line: "rgba(14, 31, 60, 0.2)",
};
