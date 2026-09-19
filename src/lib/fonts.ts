import {
  Amiri,
  Cormorant_Garamond,
  Italiana,
  Jost,
  Marcellus,
  Pinyon_Script,
  Playfair_Display,
} from "next/font/google";

/**
 * Seven faces are declared, but each template uses only two or three. A browser
 * downloads a woff2 only when a rendered element actually uses that family, so
 * declaring them here costs CSS bytes, not font bytes. `preload` is off for the
 * template-specific faces so a guest never fetches type for four designs they
 * will not see.
 *
 * next/font requires literal option objects, so the shared settings are repeated
 * rather than spread.
 */

export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
  preload: false,
});

export const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
  preload: false,
});

export const marcellus = Marcellus({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-marcellus",
  display: "swap",
  preload: false,
});

export const italiana = Italiana({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-italiana",
  display: "swap",
  preload: false,
});

export const pinyon = Pinyon_Script({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pinyon",
  display: "swap",
  preload: false,
});

export const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
  preload: false,
});

/** Platform UI face — preloaded, because every page uses it. */
export const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});

export const fontVariables = [
  cormorant.variable,
  playfair.variable,
  marcellus.variable,
  italiana.variable,
  pinyon.variable,
  amiri.variable,
  jost.variable,
].join(" ");
