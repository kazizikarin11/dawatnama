"use client";

import dynamic from "next/dynamic";
import type { TemplateId } from "@/lib/wedding/types";
import type { TemplateProps } from "./contract";

/**
 * Template resolver.
 *
 * Each template is its own lazily-imported chunk, so a guest downloads the one
 * design their invitation uses and none of the other four. Server rendering is
 * preserved, so the public invitation stays crawlable and shareable.
 *
 * The components are referenced statically in `TemplateOutlet` rather than looked
 * up and returned, so React never sees a component created during render.
 */

/**
 * All five templates run the cinematic scene system: a deck of full-viewport
 * scenes built from the invitation's own data. Each one carries its own motion
 * language — gold linework, botanical drift, night glow, drawn architecture and
 * pure typography respectively — over the same shared scene engine.
 *
 * The earlier single-page compositions are kept alongside at `./<name>/template`
 * for reference and are no longer routed to.
 */
const RoyalEmerald = dynamic(() => import("./royal-emerald/cinematic"));
const IvoryRose = dynamic(() => import("./ivory-rose/cinematic"));
const MidnightCrescent = dynamic(() => import("./midnight-crescent/cinematic"));
const MughalArch = dynamic(() => import("./mughal-arch/cinematic"));
const MinimalSignature = dynamic(() => import("./minimal-signature/cinematic"));
const PeacockZari = dynamic(() => import("./peacock-zari/cinematic"));
const VelvetMaroon = dynamic(() => import("./velvet-maroon/cinematic"));
const SageLinen = dynamic(() => import("./sage-linen/cinematic"));
const DecoNoir = dynamic(() => import("./deco-noir/cinematic"));
const CalligraphyAzure = dynamic(() => import("./calligraphy-azure/cinematic"));

export const FALLBACK_TEMPLATE_ID: TemplateId = "royal-emerald";

const IMPLEMENTED: ReadonlySet<TemplateId> = new Set<TemplateId>([
  "royal-emerald",
  "ivory-rose",
  "midnight-crescent",
  "mughal-arch",
  "minimal-signature",
  "peacock-zari",
  "velvet-maroon",
  "sage-linen",
  "deco-noir",
  "calligraphy-azure",
]);

export function isTemplateImplemented(id: TemplateId): boolean {
  return IMPLEMENTED.has(id);
}

/** Renders the selected template. Unknown ids fall back rather than failing. */
export function TemplateOutlet({ data, sections, mode }: TemplateProps) {
  const props = { data, sections, mode };

  switch (data.appearance.templateId) {
    case "ivory-rose":
      return <IvoryRose {...props} />;
    case "midnight-crescent":
      return <MidnightCrescent {...props} />;
    case "mughal-arch":
      return <MughalArch {...props} />;
    case "minimal-signature":
      return <MinimalSignature {...props} />;
    case "peacock-zari":
      return <PeacockZari {...props} />;
    case "velvet-maroon":
      return <VelvetMaroon {...props} />;
    case "sage-linen":
      return <SageLinen {...props} />;
    case "deco-noir":
      return <DecoNoir {...props} />;
    case "calligraphy-azure":
      return <CalligraphyAzure {...props} />;
    case "royal-emerald":
    default:
      return <RoyalEmerald {...props} />;
  }
}
