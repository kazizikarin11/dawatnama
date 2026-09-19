"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils/cn";
import { useMotionSettings } from "@/components/motion/motion-settings";

/**
 * Arch outline.
 *
 * Drawn with elliptical border radii rather than an SVG path, because a path in a
 * stretched viewBox distorts its shoulders and — combined with a dash-based
 * "draw" animation — renders only part of itself at arbitrary aspect ratios.
 * Borders scale exactly, stay a true hairline at any size, and cost nothing.
 *
 * The reveal is a bottom-up wipe, so the arch still reads as being set out rather
 * than simply appearing. The observer sits on an unclipped wrapper.
 */

export type ArchShape = "tall" | "wide" | "pointed";

const RADII: Record<ArchShape, string> = {
  // horizontal / vertical radii: straight sides, elliptical top. The vertical
  // figure is generous so the dome reads as an arch rather than a rounded box.
  tall: "50% 50% 0 0 / 42% 42% 0 0",
  wide: "50% 50% 0 0 / 26% 26% 0 0",
  pointed: "50% 50% 0 0 / 52% 52% 0 0",
};

export function ArchOutline({
  className,
  shape = "tall",
  delay = 0,
  double = true,
  once = true,
  opacity = 1,
}: {
  className?: string;
  shape?: ArchShape;
  delay?: number;
  /** Adds the finer secondary line just inside the main arch. */
  double?: boolean;
  once?: boolean;
  opacity?: number;
}) {
  const settings = useMotionSettings();
  const wrapper = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapper, { once, amount: 0.1 });

  const closed = { clipPath: "inset(100% 0% 0% 0%)" };
  const open = { clipPath: "inset(0% 0% 0% 0%)" };
  const hidden = settings.enabled ? closed : open;
  const radius = RADII[shape];

  return (
    <div
      ref={wrapper}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{ opacity }}
    >
      <motion.div
        className="absolute inset-0"
        initial={hidden}
        animate={inView ? open : hidden}
        transition={{
          duration: settings.slowDuration * 1.4,
          delay: settings.enabled ? delay : 0,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <span
          className="absolute inset-0 border border-b-0 border-current"
          style={{ borderRadius: radius }}
        />
        {double && (
          <span
            className="absolute inset-[7px] border border-b-0 border-current opacity-45"
            style={{ borderRadius: radius }}
          />
        )}
      </motion.div>
    </div>
  );
}

/** A row of small arches used as a plinth. Scales down gracefully on phones. */
export function ArchRow({
  count = 7,
  className,
  delay = 0,
  shape = "wide",
}: {
  count?: number;
  className?: string;
  delay?: number;
  shape?: ArchShape;
}) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none flex items-end justify-center gap-1.5", className)}
    >
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className="relative h-8 w-8">
          <ArchOutline shape={shape} double={false} delay={delay + index * 0.07} opacity={0.6} />
        </span>
      ))}
    </div>
  );
}
