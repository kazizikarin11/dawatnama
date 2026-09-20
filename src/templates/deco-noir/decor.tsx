"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils/cn";
import { useMotionSettings } from "@/components/motion/motion-settings";
import { OrnamentReveal } from "@/components/scene/motion";
import { useScene } from "@/components/scene/scene-deck";

/**
 * Deco Noir decoration.
 *
 * Everything here is straight lines, stepped forms and hard symmetry. Where the
 * other templates curve, this one steps; where they fade, this one wipes. Motion
 * is fast and decisive rather than slow and atmospheric, which is what keeps it
 * clearly apart from Midnight Crescent despite both being dark.
 */

/** A stepped sunburst fan that opens from its base. */
export function DecoFan({
  className,
  delay = 0,
  rays = 9,
  size = 160,
}: {
  className?: string;
  delay?: number;
  rays?: number;
  size?: number;
}) {
  const { active } = useScene();
  const settings = useMotionSettings();

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none relative", className)}
      style={{ width: size, height: size / 2 }}
    >
      {Array.from({ length: rays }, (_, index) => {
        // Rays sweep from -80deg to +80deg, opening outward from the middle.
        const angle = -80 + (160 / (rays - 1)) * index;
        const length = index % 2 === 0 ? 1 : 0.76;

        return (
          <motion.span
            key={index}
            className="absolute bottom-0 left-1/2 origin-bottom bg-[var(--t-accent)]"
            style={{
              width: 2,
              height: (size / 2) * length,
              marginLeft: -1,
              rotate: `${angle}deg`,
            }}
            initial={{ scaleY: settings.enabled ? 0 : 1, opacity: 0 }}
            animate={
              active ? { scaleY: 1, opacity: 0.8 } : { scaleY: settings.enabled ? 0 : 1, opacity: 0 }
            }
            transition={{
              duration: 0.75,
              // Opens from the centre outward, not left to right.
              delay: delay + Math.abs(index - (rays - 1) / 2) * 0.07,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        );
      })}
    </div>
  );
}

/** A stepped deco frame that draws itself in two strokes. */
export function DecoFrame({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 160"
      preserveAspectRatio="none"
      className={cn("pointer-events-none h-full w-full text-[var(--t-accent)]", className)}
      fill="none"
    >
      {/* Outer, with the corners stepped rather than mitred */}
      <OrnamentReveal
        d="M8 152 L8 26 L20 14 L80 14 L92 26 L92 152"
        delay={delay}
        strokeWidth={0.9}
        opacity={0.85}
        durationScale={2.6}
      />
      {/* Inner */}
      <OrnamentReveal
        d="M14 152 L14 30 L23 21 L77 21 L86 30 L86 152"
        delay={delay + 0.2}
        strokeWidth={0.5}
        opacity={0.45}
        durationScale={2.6}
      />
      {/* The keystone step at the crown */}
      <OrnamentReveal d="M42 14 L42 6 L58 6 L58 14" delay={delay + 0.5} strokeWidth={0.9} opacity={0.8} />
    </svg>
  );
}

/** A chevron band, the deco equivalent of a rule. */
export function ChevronBand({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 18"
      preserveAspectRatio="none"
      className={cn("pointer-events-none w-full text-[var(--t-accent)]", className)}
      style={{ height: 18 }}
    >
      <OrnamentReveal
        d="M2 14 L14 4 L26 14 L38 4 L50 14 L62 4 L74 14 L86 4 L98 14 L110 4 L122 14 L134 4 L146 14 L158 4 L170 14 L182 4 L194 14"
        delay={delay}
        strokeWidth={1.1}
        opacity={0.85}
        durationScale={2.4}
      />
    </svg>
  );
}

/** A stepped geometric tiling — the inlaid floor of a deco lobby. */
export function DecoGrid({
  className,
  opacity = 0.1,
  scale = 46,
}: {
  className?: string;
  opacity?: number;
  scale?: number;
}) {
  const raw = useId().replace(/:/g, "");
  const id = `deco-${raw}`;

  return (
    <svg
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      style={{ opacity }}
    >
      <defs>
        <pattern id={id} width={scale} height={scale} patternUnits="userSpaceOnUse">
          <path
            d={`M0 ${scale / 2} L${scale / 2} 0 L${scale} ${scale / 2} L${scale / 2} ${scale} Z`}
            fill="none"
            stroke="var(--t-accent)"
            strokeWidth="0.7"
          />
          <path
            d={`M${scale * 0.28} ${scale / 2} L${scale / 2} ${scale * 0.28} L${scale * 0.72} ${scale / 2} L${scale / 2} ${scale * 0.72} Z`}
            fill="none"
            stroke="var(--t-accent)"
            strokeWidth="0.45"
            opacity="0.7"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * A hard-edged wipe used between deco scenes: a brass edge crosses the frame and
 * the content is behind it. Fast, with no blur — the opposite of a crossfade.
 */
export function BrassWipe({ delay = 0 }: { delay?: number }) {
  const { active } = useScene();
  const settings = useMotionSettings();
  if (!settings.enabled) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-y-0 w-[3px] bg-[var(--t-accent)]"
        initial={{ left: "-5%", opacity: 0 }}
        animate={active ? { left: "105%", opacity: [0, 0.9, 0.9, 0] } : { left: "-5%", opacity: 0 }}
        transition={{ duration: 1.1, delay, ease: [0.65, 0, 0.35, 1] }}
      />
    </div>
  );
}
