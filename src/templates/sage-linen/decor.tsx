"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils/cn";
import { useMotionSettings } from "@/components/motion/motion-settings";
import { OrnamentReveal } from "@/components/scene/motion";
import { useScene } from "@/components/scene/scene-deck";

/**
 * Sage Linen decoration.
 *
 * The calmest template in the set. Nothing here sweeps, glints or bursts: a
 * eucalyptus sprig draws itself, leaves breathe on a very long cycle, and the
 * ground carries a woven linen tooth. Built for a daytime nikah, where the
 * feeling wanted is quiet rather than cinematic.
 */

/** A eucalyptus sprig: one stem, paired round leaves, inked slowly. */
export function EucalyptusSprig({
  className,
  delay = 0,
  flip = false,
}: {
  className?: string;
  delay?: number;
  flip?: boolean;
}) {
  const leaves = [
    { cx: 40, cy: 168, r: 13 },
    { cx: 78, cy: 150, r: 14 },
    { cx: 36, cy: 130, r: 14 },
    { cx: 80, cy: 110, r: 15 },
    { cx: 40, cy: 90, r: 14 },
    { cx: 76, cy: 70, r: 13 },
    { cx: 46, cy: 52, r: 11 },
  ];

  return (
    <svg
      aria-hidden
      viewBox="0 0 120 200"
      className={cn(
        "pointer-events-none text-[var(--t-accent)]",
        flip && "scale-x-[-1]",
        className,
      )}
      fill="none"
    >
      <OrnamentReveal
        d="M60 198 C 60 160 58 120 60 84 C 61 64 58 46 52 30"
        delay={delay}
        strokeWidth={1.2}
        opacity={0.75}
        durationScale={2.8}
      />
      {leaves.map((leaf, index) => (
        <motion.ellipse
          key={index}
          cx={leaf.cx}
          cy={leaf.cy}
          rx={leaf.r}
          ry={leaf.r * 0.78}
          fill="currentColor"
          opacity={0.28}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.28 }}
          transition={{
            duration: 0.9,
            delay: delay + 0.35 + index * 0.1,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ transformOrigin: `${leaf.cx}px ${leaf.cy}px` }}
        />
      ))}
      {leaves.map((leaf, index) => (
        <OrnamentReveal
          key={`outline-${index}`}
          d={`M${leaf.cx - leaf.r} ${leaf.cy} a ${leaf.r} ${leaf.r * 0.78} 0 1 0 ${leaf.r * 2} 0 a ${leaf.r} ${leaf.r * 0.78} 0 1 0 ${-leaf.r * 2} 0`}
          delay={delay + 0.4 + index * 0.1}
          strokeWidth={0.8}
          opacity={0.55}
        />
      ))}
    </svg>
  );
}

/**
 * Leaves drifting on a long, slow cycle. Deliberately fewer and slower than the
 * petals in Ivory & Rose — this should read as air moving, not as weather.
 */
export function LeafDrift({ count = 6 }: { count?: number }) {
  const settings = useMotionSettings();
  if (!settings.ambient) return null;

  const leaves = Array.from({ length: count }, (_, index) => ({
    left: ((index * 2654435761) % 1000) / 10,
    delay: (index % 4) * 3.2,
    duration: 26 + ((index * 5) % 10),
    size: 9 + ((index * 3) % 6),
    drift: ((index % 3) - 1) * 30,
    spin: index % 2 === 0 ? 140 : -140,
  }));

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {leaves.map((leaf, index) => (
        <motion.span
          key={index}
          className="absolute rounded-[70%_30%_70%_30%] bg-[var(--t-accent)]"
          style={{
            left: `${leaf.left}%`,
            top: "-8%",
            width: leaf.size,
            height: leaf.size * 0.7,
            opacity: 0.3,
          }}
          initial={{ y: 0, rotate: 0 }}
          animate={{
            y: ["0vh", "112vh"],
            x: [0, leaf.drift],
            rotate: [0, leaf.spin],
          }}
          transition={{
            duration: leaf.duration,
            delay: leaf.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

/** The woven tooth of linen: a fine cross-hatch, barely there. */
export function LinenWeave({
  className,
  opacity = 0.14,
  scale = 7,
}: {
  className?: string;
  opacity?: number;
  scale?: number;
}) {
  const raw = useId().replace(/:/g, "");
  const id = `linen-${raw}`;

  return (
    <svg
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      style={{ opacity }}
    >
      <defs>
        <pattern id={id} width={scale} height={scale} patternUnits="userSpaceOnUse">
          <path
            d={`M0 0 L0 ${scale}`}
            stroke="var(--t-ink)"
            strokeWidth="0.5"
            opacity="0.5"
          />
          <path
            d={`M0 0 L${scale} 0`}
            stroke="var(--t-ink)"
            strokeWidth="0.5"
            opacity="0.32"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** A quiet rule: a hairline with a single leaf at its centre. */
export function LeafRule({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 18"
      preserveAspectRatio="none"
      className={cn("pointer-events-none w-full text-[var(--t-accent)]", className)}
      style={{ height: 18 }}
    >
      <OrnamentReveal d="M2 9 L84 9" delay={delay} strokeWidth={0.9} opacity={0.6} />
      <OrnamentReveal d="M116 9 L198 9" delay={delay} strokeWidth={0.9} opacity={0.6} />
      <OrnamentReveal
        d="M92 9 C 96 2, 104 2, 108 9 C 104 16, 96 16, 92 9 Z"
        delay={delay + 0.18}
        strokeWidth={0.9}
        opacity={0.8}
      />
    </svg>
  );
}

/** A soft wash of light, standing in for sun through a window. */
export function DaylightWash({ intensity = 0.5 }: { intensity?: number }) {
  const { active } = useScene();
  const settings = useMotionSettings();

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "radial-gradient(70% 50% at 50% 18%, color-mix(in oklab, #FFFFFF 70%, transparent), transparent 72%)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: active || !settings.enabled ? intensity : 0 }}
      transition={{ duration: 2.4, ease: "easeInOut" }}
    />
  );
}
