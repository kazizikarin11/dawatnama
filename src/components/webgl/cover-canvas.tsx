"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { TemplateId } from "@/lib/wedding/types";
import { useMotionSettings } from "@/components/motion/motion-settings";
import { useStage } from "@/components/invitation/stage";
import { detectWebgl } from "./capability";
import { COVER_PRESETS } from "./presets";
import type { CoverScene } from "./cover-scene";

/**
 * The WebGL layer behind an invitation's cover.
 *
 * Three.js is imported only after mount and only once the device has passed the
 * capability gate, so it never lands in the initial payload and never runs on a
 * phone that cannot afford it. Guests who ask for reduced motion, or authors who
 * chose the calm animation setting, get the CSS ornament layer instead — which is
 * always present underneath, so nothing is missing when the canvas sits out.
 */
export function CoverCanvas({
  template,
  className,
}: {
  template: TemplateId;
  className?: string;
}) {
  const settings = useMotionSettings();
  const { stage, mode } = useStage();
  const container = useRef<HTMLDivElement>(null);
  const scene = useRef<CoverScene | null>(null);
  const [active, setActive] = useState(false);

  // Thumbnails never animate, and calm intensity opts out of WebGL entirely.
  const wanted =
    settings.enabled && settings.intensity !== "calm" && mode !== "thumbnail";

  useEffect(() => {
    if (!wanted) return;

    const capability = detectWebgl();
    if (!capability.supported) return;

    let cancelled = false;
    let instance: CoverScene | null = null;

    // Deferred so the cover's type and layout paint first; the canvas is
    // atmosphere and must never delay the words.
    const idle = window.setTimeout(() => {
      void import("./cover-scene")
        .then(({ CoverScene: SceneClass }) => {
          if (cancelled || !container.current) return;

          instance = new SceneClass({
            container: container.current,
            preset: COVER_PRESETS[template],
            tier: capability.tier,
          });

          scene.current = instance;
          instance.start();
          setActive(true);
        })
        .catch(() => {
          // A failed chunk or a lost context is not worth surfacing to a guest.
        });
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(idle);
      instance?.dispose();
      scene.current = null;
    };
  }, [wanted, template]);

  // Resolve the field outward as the guest opens the invitation.
  useEffect(() => {
    if (stage !== "cover") scene.current?.burst();
  }, [stage]);

  // Never burn a frame on a backgrounded tab.
  useEffect(() => {
    if (!active) return;

    const onVisibility = () => {
      if (document.hidden) scene.current?.stop();
      else scene.current?.start();
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [active]);

  if (!wanted) return null;

  return (
    <div
      ref={container}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-1000",
        active ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}
