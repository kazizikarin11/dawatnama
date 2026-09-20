"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils/cn";
import { useMotionSettings } from "@/components/motion/motion-settings";
import { OrnamentReveal } from "@/components/scene/motion";
import { useScene } from "@/components/scene/scene-deck";

/**
 * Velvet Maroon decoration.
 *
 * The governing image is a theatre curtain. Scenes are revealed by two velvet
 * panels drawing apart rather than by anything fading, and the ornament is heavy
 * brass filigree rather than fine linework — this template is the formal one.
 */

/**
 * Two velvet panels that part when the scene becomes active. Placed over a
 * scene's content, it reads as the curtain going up on that moment.
 */
export function VelvetCurtain({ delay = 0 }: { delay?: number }) {
  const { active } = useScene();
  const settings = useMotionSettings();

  if (!settings.enabled) return null;

  const panel =
    "absolute inset-y-0 w-1/2 bg-[linear-gradient(90deg,var(--t-bg),var(--t-bg-alt)_55%,var(--t-surface))]";

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      <motion.div
        className={cn(panel, "left-0")}
        initial={{ x: "0%" }}
        animate={active ? { x: "-101%" } : { x: "0%" }}
        transition={{ duration: 1.9, delay, ease: [0.65, 0, 0.35, 1] }}
      >
        {/* Vertical pleats, so the panel reads as fabric */}
        <span className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0_14px,rgba(0,0,0,0.22)_14px_16px)]" />
        <span className="absolute inset-y-0 right-0 w-8 bg-[linear-gradient(90deg,transparent,rgba(0,0,0,0.45))]" />
      </motion.div>

      <motion.div
        className={cn(panel, "right-0")}
        initial={{ x: "0%" }}
        animate={active ? { x: "101%" } : { x: "0%" }}
        transition={{ duration: 1.9, delay, ease: [0.65, 0, 0.35, 1] }}
      >
        <span className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0_14px,rgba(0,0,0,0.22)_14px_16px)]" />
        <span className="absolute inset-y-0 left-0 w-8 bg-[linear-gradient(270deg,transparent,rgba(0,0,0,0.45))]" />
      </motion.div>
    </div>
  );
}

/** A heavy brass corner, drawn in. Used at the four corners of formal scenes. */
export function BrassCorner({
  className,
  delay = 0,
  flipX = false,
  flipY = false,
}: {
  className?: string;
  delay?: number;
  flipX?: boolean;
  flipY?: boolean;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 90 90"
      className={cn(
        "pointer-events-none text-[var(--t-accent)]",
        flipX && "scale-x-[-1]",
        flipY && "scale-y-[-1]",
        className,
      )}
      fill="none"
    >
      <OrnamentReveal d="M4 86 L4 30 C 4 14 14 4 30 4 L86 4" delay={delay} strokeWidth={1.4} opacity={0.85} />
      <OrnamentReveal d="M12 86 L12 32 C 12 20 20 12 32 12 L86 12" delay={delay + 0.14} strokeWidth={0.8} opacity={0.5} />
      {/* A filigree scroll tucked into the corner */}
      <OrnamentReveal
        d="M20 40 C 32 40 40 32 40 20 C 40 30 48 34 56 30"
        delay={delay + 0.3}
        strokeWidth={1}
        opacity={0.7}
      />
      <circle cx="40" cy="40" r="3.2" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

/** A brass rule with a central lozenge, weighted for formal typography. */
export function BrassRule({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 20"
      preserveAspectRatio="none"
      className={cn("pointer-events-none w-full text-[var(--t-accent)]", className)}
      style={{ height: 20 }}
    >
      <OrnamentReveal d="M2 10 L78 10" delay={delay} strokeWidth={1.4} opacity={0.8} />
      <OrnamentReveal d="M122 10 L198 10" delay={delay} strokeWidth={1.4} opacity={0.8} />
      <OrnamentReveal
        d="M86 10 L100 3 L114 10 L100 17 Z"
        delay={delay + 0.2}
        strokeWidth={1.1}
        opacity={0.9}
      />
    </svg>
  );
}

/** Damask-like tiling, very low contrast: the pattern woven into the velvet. */
export function DamaskPattern({
  className,
  opacity = 0.08,
  scale = 60,
}: {
  className?: string;
  opacity?: number;
  scale?: number;
}) {
  const raw = useId().replace(/:/g, "");
  const id = `damask-${raw}`;
  const half = scale / 2;

  return (
    <svg
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      style={{ opacity }}
    >
      <defs>
        <pattern id={id} width={scale} height={scale} patternUnits="userSpaceOnUse">
          {/* A four-petal rosette, the simplest damask unit */}
          <path
            d={`M${half} ${half * 0.25} C ${half * 1.5} ${half * 0.6}, ${half * 1.5} ${half * 1.4}, ${half} ${half * 1.75}
                C ${half * 0.5} ${half * 1.4}, ${half * 0.5} ${half * 0.6}, ${half} ${half * 0.25} Z`}
            fill="none"
            stroke="var(--t-accent)"
            strokeWidth="0.7"
          />
          <path
            d={`M${half * 0.25} ${half} C ${half * 0.6} ${half * 0.5}, ${half * 1.4} ${half * 0.5}, ${half * 1.75} ${half}
                C ${half * 1.4} ${half * 1.5}, ${half * 0.6} ${half * 1.5}, ${half * 0.25} ${half} Z`}
            fill="none"
            stroke="var(--t-accent)"
            strokeWidth="0.7"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** A slow warm shine, as if light were moving over foil. */
export function FoilShine({ delay = 0 }: { delay?: number }) {
  const { active } = useScene();
  const settings = useMotionSettings();
  if (!settings.enabled) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute top-0 h-full w-[38%]"
        style={{
          background:
            "linear-gradient(100deg, transparent, color-mix(in oklab, var(--t-accent) 26%, transparent), transparent)",
          filter: "blur(8px)",
        }}
        initial={{ x: "-140%" }}
        animate={active ? { x: "280%" } : { x: "-140%" }}
        transition={{ duration: 2.6, delay, ease: [0.65, 0, 0.35, 1] }}
      />
    </div>
  );
}
