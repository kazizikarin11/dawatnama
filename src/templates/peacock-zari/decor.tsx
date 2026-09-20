"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils/cn";
import { useMotionSettings } from "@/components/motion/motion-settings";
import { OrnamentReveal } from "@/components/scene/motion";
import { useScene } from "@/components/scene/scene-deck";

/**
 * Peacock Zari decoration.
 *
 * Two motifs carry the whole template: the peacock feather eye, and zari — the
 * flat gold thread used in South Asian embroidery. Zari is drawn as stroked line
 * work that inks itself in, so the ornament always reads as being *worked* onto
 * the cloth rather than placed on top of it.
 */

/** A single peacock feather eye, opening outward from its stem. */
export function FeatherEye({
  className,
  delay = 0,
  size = 120,
}: {
  className?: string;
  delay?: number;
  size?: number;
}) {
  const { active } = useScene();
  const settings = useMotionSettings();

  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 120 200"
      className={cn("pointer-events-none", className)}
      // The feather grows from where it would be attached to the bird.
      style={{ width: size, height: (size / 120) * 200, transformOrigin: "bottom center" }}
      initial={{ opacity: 0, scaleY: settings.enabled ? 0.72 : 1 }}
      animate={active ? { opacity: 1, scaleY: 1 } : { opacity: 0, scaleY: 0.72 }}
      transition={{ duration: settings.slowDuration * 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Stem */}
      <OrnamentReveal
        d="M60 196 L60 96"
        delay={delay}
        strokeWidth={1.2}
        opacity={0.8}
        className="text-[var(--t-accent)]"
      />
      {/* The barbs, fanning either side of the stem */}
      {[0, 1, 2, 3, 4].map((index) => {
        const spread = 16 + index * 11;
        const top = 150 - index * 16;
        return (
          <g key={index} className="text-[var(--t-accent)]">
            <OrnamentReveal
              d={`M60 ${top + 18} C ${60 - spread * 0.6} ${top + 6}, ${60 - spread} ${top - 6}, ${60 - spread} ${top - 20}`}
              delay={delay + 0.18 + index * 0.08}
              strokeWidth={0.9}
              opacity={0.55}
            />
            <OrnamentReveal
              d={`M60 ${top + 18} C ${60 + spread * 0.6} ${top + 6}, ${60 + spread} ${top - 6}, ${60 + spread} ${top - 20}`}
              delay={delay + 0.18 + index * 0.08}
              strokeWidth={0.9}
              opacity={0.55}
            />
          </g>
        );
      })}
      {/* The eye itself */}
      <motion.g
        initial={{ opacity: 0, scale: settings.enabled ? 0.5 : 1 }}
        animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
        transition={{ duration: 1.1, delay: delay + 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: "60px 62px" }}
      >
        <ellipse cx="60" cy="62" rx="34" ry="44" fill="var(--t-accent)" opacity="0.2" />
        <ellipse cx="60" cy="62" rx="34" ry="44" fill="none" stroke="var(--t-accent)" strokeWidth="1.1" opacity="0.8" />
        <ellipse cx="60" cy="64" rx="20" ry="26" fill="var(--t-accent-soft)" opacity="0.3" />
        <ellipse cx="60" cy="66" rx="10" ry="14" fill="var(--t-accent)" opacity="0.85" />
      </motion.g>
    </motion.svg>
  );
}

/**
 * A band of zari thread: parallel gold lines with a running stitch between them,
 * inked from left to right. Used to separate passages of type.
 */
export function ZariBand({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 24"
      preserveAspectRatio="none"
      className={cn("pointer-events-none w-full text-[var(--t-accent)]", className)}
      style={{ height: 24 }}
    >
      <OrnamentReveal d="M2 6 L198 6" delay={delay} strokeWidth={1} opacity={0.75} />
      <OrnamentReveal d="M2 18 L198 18" delay={delay + 0.12} strokeWidth={1} opacity={0.75} />
      {/* Running stitch, a chevron repeated across the band */}
      <OrnamentReveal
        d="M8 18 L20 6 L32 18 L44 6 L56 18 L68 6 L80 18 L92 6 L104 18 L116 6 L128 18 L140 6 L152 18 L164 6 L176 18 L188 6"
        delay={delay + 0.2}
        strokeWidth={0.8}
        opacity={0.5}
        durationScale={2.8}
      />
    </svg>
  );
}

/** A tiling scale pattern, the abstracted plumage. Texture, not decoration. */
export function PlumagePattern({
  className,
  opacity = 0.1,
  scale = 48,
}: {
  className?: string;
  opacity?: number;
  scale?: number;
}) {
  const raw = useId().replace(/:/g, "");
  const id = `plumage-${raw}`;

  return (
    <svg
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      style={{ opacity }}
    >
      <defs>
        <pattern id={id} width={scale} height={scale * 0.8} patternUnits="userSpaceOnUse">
          <path
            d={`M0 ${scale * 0.8} C 0 ${scale * 0.3}, ${scale} ${scale * 0.3}, ${scale} ${scale * 0.8}`}
            fill="none"
            stroke="var(--t-accent)"
            strokeWidth="0.8"
          />
          <circle cx={scale / 2} cy={scale * 0.52} r={scale * 0.07} fill="var(--t-accent)" opacity="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * An iridescent sweep — the shift of colour across a feather when it catches the
 * light. One pass per scene, skipped entirely under reduced motion.
 */
export function Iridescence({ delay = 0, duration = 2.4 }: { delay?: number; duration?: number }) {
  const { active } = useScene();
  const settings = useMotionSettings();
  if (!settings.enabled) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute top-0 h-full w-[60%]"
        style={{
          background:
            "linear-gradient(105deg, transparent, color-mix(in oklab, var(--t-accent) 22%, transparent), color-mix(in oklab, #4FD1C5 14%, transparent), transparent)",
          filter: "blur(10px)",
        }}
        initial={{ x: "-150%" }}
        animate={active ? { x: "250%" } : { x: "-150%" }}
        transition={{ duration, delay, ease: [0.65, 0, 0.35, 1] }}
      />
    </div>
  );
}
