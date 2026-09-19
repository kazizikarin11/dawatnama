import { TEMPLATE_IDS, type TemplateId } from "@/lib/wedding/types";
import type { TemplateMeta } from "./contract";

/**
 * Pure metadata — no React, no component imports. Server pages, the picker and
 * SEO can read this without pulling five templates into the bundle.
 */
export const TEMPLATE_META: Record<TemplateId, TemplateMeta> = {
  "royal-emerald": {
    id: "royal-emerald",
    name: "Royal Emerald",
    tagline: "A palace invitation in deep emerald and antique gold.",
    description:
      "Built for a grand Pakistani Muslim wedding. Gold linework draws itself across deep emerald, Mughal-inspired geometry frames the names, and each section arrives through a slow ornamental reveal.",
    traits: ["Royal", "Traditional-modern", "Ornamental", "Luxurious"],
    palette: ["#08241D", "#0F3D32", "#C9A227", "#F5EFE3", "#E8D9A8"],
    typography: "High-contrast Cormorant display with Jost small caps",
    motion: "Gold line drawing, ornament reveals, gentle parallax",
    colorScheme: "dark",
    supports: { accent: true, backgroundVariant: true, typographyVariant: false },
  },
  "ivory-rose": {
    id: "ivory-rose",
    name: "Ivory & Rose",
    tagline: "Soft luxury, styled like a fashion editorial.",
    description:
      "Romantic and photograph-led. Wide ivory margins, dusty rose accents and fine botanical linework, with masked typography and slow image drifts borrowed from print editorial layouts.",
    traits: ["Romantic", "Editorial", "Soft", "Photographic"],
    palette: ["#F6EBE6", "#E7CFC8", "#B76E79", "#C08C74", "#4A3B37"],
    typography: "Playfair Display editorial serif with a Pinyon script accent",
    motion: "Mask reveals, slow image zoom, drifting petals",
    colorScheme: "light",
    supports: { accent: true, backgroundVariant: true, typographyVariant: true },
  },
  "midnight-crescent": {
    id: "midnight-crescent",
    name: "Midnight Crescent",
    tagline: "A wedding film opening, lit by moonlight.",
    description:
      "Dark and cinematic. A crescent rises over deep navy, gold dust drifts through the frame, and names emerge from darkness behind masked type. Designed for evening celebrations.",
    traits: ["Cinematic", "Dramatic", "Atmospheric", "Contemporary"],
    palette: ["#070B17", "#101A32", "#D8B978", "#EFE7D6", "#1B2847"],
    typography: "Cormorant display with wide Jost tracking",
    motion: "Atmospheric particles, light bloom, scroll-linked backgrounds",
    colorScheme: "dark",
    supports: { accent: true, backgroundVariant: false, typographyVariant: false },
  },
  "mughal-arch": {
    id: "mughal-arch",
    name: "Mughal Arch",
    tagline: "Contemporary South Asian architecture, in sand and sage.",
    description:
      "Architecture as layout. Arches are the containers: they draw themselves open, frame the photographs, and carry the event timeline. Restrained pattern, generous stone-like space.",
    traits: ["Architectural", "Sophisticated", "Earthy", "Structured"],
    palette: ["#EDE4D4", "#DBCBB2", "#B9C3AC", "#B3653C", "#4B4437"],
    typography: "Marcellus roman capitals with Jost detailing",
    motion: "Self-drawing arches, pattern reveals, architectural depth",
    colorScheme: "light",
    supports: { accent: true, backgroundVariant: true, typographyVariant: false },
  },
  "minimal-signature": {
    id: "minimal-signature",
    name: "Minimal Signature",
    tagline: "Type, space and photography. Nothing else.",
    description:
      "An ultra-modern invitation with almost no ornament. Names are set at poster scale, the grid does the work, and motion is limited to letter reveals and image masks. Quiet and expensive.",
    traits: ["Minimal", "Modern", "Typographic", "Editorial"],
    palette: ["#F4F1EC", "#171614", "#A08B5F", "#6B6B46", "#DED8CE"],
    typography: "Italiana poster display with Jost micro-type",
    motion: "Letter-by-letter reveals, image masking, subtle grain",
    colorScheme: "light",
    supports: { accent: true, backgroundVariant: true, typographyVariant: true },
  },
};

export const TEMPLATE_LIST: readonly TemplateMeta[] = TEMPLATE_IDS.map(
  (id) => TEMPLATE_META[id],
);

export function templateMeta(id: TemplateId): TemplateMeta {
  return TEMPLATE_META[id];
}
