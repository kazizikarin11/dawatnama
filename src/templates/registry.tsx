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

const RoyalEmerald = dynamic(() => import("./royal-emerald/template"));
const IvoryRose = dynamic(() => import("./ivory-rose/template"));
const MidnightCrescent = dynamic(() => import("./midnight-crescent/template"));
const MughalArch = dynamic(() => import("./mughal-arch/template"));
const MinimalSignature = dynamic(() => import("./minimal-signature/template"));

export const FALLBACK_TEMPLATE_ID: TemplateId = "royal-emerald";

const IMPLEMENTED: ReadonlySet<TemplateId> = new Set<TemplateId>([
  "royal-emerald",
  "ivory-rose",
  "midnight-crescent",
  "mughal-arch",
  "minimal-signature",
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
    case "royal-emerald":
    default:
      return <RoyalEmerald {...props} />;
  }
}
