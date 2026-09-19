"use client";

import { useMemo } from "react";
import { resolveSections } from "@/lib/wedding/sections";
import type { WeddingData } from "@/lib/wedding/types";
import { MotionSettingsProvider } from "@/components/motion/motion-settings";
import { TemplateOutlet } from "@/templates/registry";
import type { RenderMode } from "@/templates/contract";
import { MusicProvider } from "./music";
import { InvitationStageProvider } from "./stage";

/**
 * The single entry point for rendering an invitation, used identically by the
 * public page, the editor preview and the template picker thumbnails.
 *
 *   data -> section plan -> template resolver -> selected template
 *
 * No business logic lives in the templates themselves, and no template-specific
 * logic lives here.
 */
export function InvitationRenderer({
  data,
  mode = "live",
}: {
  data: WeddingData;
  mode?: RenderMode;
}) {
  const sections = useMemo(() => resolveSections(data), [data]);

  return (
    <MotionSettingsProvider
      intensity={mode === "thumbnail" ? "calm" : data.appearance.animationIntensity}
    >
      <MusicProvider config={data.music} enabled={mode !== "thumbnail"}>
        <InvitationStageProvider mode={mode}>
          <TemplateOutlet data={data} sections={sections} mode={mode} />
        </InvitationStageProvider>
      </MusicProvider>
    </MotionSettingsProvider>
  );
}
