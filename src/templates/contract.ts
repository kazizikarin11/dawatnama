import type { ComponentType } from "react";
import type { SectionPlan } from "@/lib/wedding/sections";
import type { TemplateId, WeddingData } from "@/lib/wedding/types";

/**
 * The contract every template implements.
 *
 * A template receives normalized data and a section plan — nothing else. It may
 * not fetch, may not write, and may not know whether it is being rendered for a
 * guest, inside the editor preview, or as a thumbnail.
 */

export type RenderMode =
  /** The real public invitation. */
  | "live"
  /** Inside the editor's device frame. */
  | "preview"
  /** Small, non-interactive card on the template picker. */
  | "thumbnail";

export interface TemplateProps {
  data: WeddingData;
  sections: SectionPlan;
  mode: RenderMode;
}

export type TemplateComponent = ComponentType<TemplateProps>;

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  /** One line shown on the picker card. */
  tagline: string;
  /** Two or three sentences for the detail panel. */
  description: string;
  /** Short design-direction words, shown as chips. */
  traits: readonly string[];
  /** Representative swatches, dominant colour first. */
  palette: readonly string[];
  typography: string;
  motion: string;
  colorScheme: "light" | "dark";
  /** Appearance controls this template actually honours. */
  supports: {
    accent: boolean;
    backgroundVariant: boolean;
    typographyVariant: boolean;
  };
}
