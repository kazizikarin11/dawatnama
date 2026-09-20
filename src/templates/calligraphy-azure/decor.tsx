"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils/cn";
import { useMotionSettings } from "@/components/motion/motion-settings";
import { OrnamentReveal } from "@/components/scene/motion";
import { useScene } from "@/components/scene/scene-deck";

/**
 * Calligraphy Azure decoration.
 *
 * This is the one template where the writing itself is the ornament. Every mark
 * here is a stroke that draws on as if a qalam were moving across the page, so
 * the motion language is "being written" rather than "being revealed". Nothing
 * fades in; things are inscribed.
 */

/**
 * A calligraphic swash — the long horizontal terminal stroke that ends a line of
 * Arabic. Used as this template's rule, drawn right to left the way it is written.
 */
export function Swash({
  className,
  delay = 0,
  mirrored = false,
}: {
  className?: string;
  delay?: number;
  mirrored?: boolean;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 220 40"
      className={cn(
        "pointer-events-none w-full text-[var(--t-accent)]",
        mirrored && "scale-x-[-1]",
        className,
      )}
      fill="none"
      style={{ height: 40 }}
    >
      {/* The main stroke, thick in the middle and tapering at both ends */}
      <OrnamentReveal
        d="M8 26 C 40 26, 62 10, 96 10 C 132 10, 150 26, 186 26 C 200 26, 208 22, 214 16"
        delay={delay}
        strokeWidth={2.2}
        opacity={0.9}
        durationScale={2.6}
      />
      {/* A finer companion stroke below, as a second pass of the pen */}
      <OrnamentReveal
        d="M24 32 C 56 32, 74 20, 104 20 C 136 20, 152 32, 180 32"
        delay={delay + 0.3}
        strokeWidth={0.9}
        opacity={0.5}
        durationScale={2.4}
      />
      {/* Three dots, as under a letter */}
      <circle cx="96" cy="34" r="2" fill="currentColor" opacity="0.7" />
      <circle cx="104" cy="34" r="2" fill="currentColor" opacity="0.7" />
      <circle cx="100" cy="38" r="2" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

/**
 * A large abstract calligraphic flourish for backgrounds. Not real letterforms —
 * deliberately abstract, so it never risks misrendering scripture as decoration.
 */
export function InkFlourish({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 300 300"
      className={cn("pointer-events-none text-[var(--t-accent)]", className)}
      fill="none"
    >
      <OrnamentReveal
        d="M40 210 C 70 150, 120 120, 170 150 C 210 174, 200 230, 156 238 C 120 244, 104 210, 130 188 C 150 170, 182 178, 190 204"
        delay={delay}
        strokeWidth={2}
        opacity={0.5}
        durationScale={3.4}
      />
      <OrnamentReveal
        d="M188 200 C 214 150, 246 130, 268 92"
        delay={delay + 0.5}
        strokeWidth={1.6}
        opacity={0.4}
        durationScale={2.6}
      />
      <OrnamentReveal
        d="M62 236 C 110 252, 190 252, 240 232"
        delay={delay + 0.8}
        strokeWidth={1.1}
        opacity={0.3}
        durationScale={2.6}
      />
    </svg>
  );
}

/**
 * A page-edge rule pair, like the ruled margins of a manuscript. Illuminated
 * manuscripts frame the text block; so does this.
 */
export function ManuscriptFrame({
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
      <OrnamentReveal
        d="M6 6 L94 6 L94 154 L6 154 Z"
        delay={delay}
        strokeWidth={0.7}
        opacity={0.7}
        durationScale={3}
      />
      <OrnamentReveal
        d="M11 11 L89 11 L89 149 L11 149 Z"
        delay={delay + 0.25}
        strokeWidth={0.35}
        opacity={0.45}
        durationScale={3}
      />
    </svg>
  );
}

/** Ink spreading into paper: a soft bloom that grows once, then settles. */
export function InkBleed({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  const { active } = useScene();
  const settings = useMotionSettings();

  return (
    <motion.div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        background:
          "radial-gradient(48% 36% at 50% 42%, color-mix(in oklab, var(--t-accent) 16%, transparent), transparent 72%)",
      }}
      initial={{ opacity: 0, scale: settings.enabled ? 0.82 : 1 }}
      animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.82 }}
      transition={{ duration: 3, delay, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}

/**
 * Gold leaf specks, as flaked off an illuminated page. Static positions, so the
 * server and client agree, and they only breathe rather than travel.
 */
export function GoldLeaf({ count = 12 }: { count?: number }) {
  const settings = useMotionSettings();
  if (!settings.ambient) return null;

  const flakes = Array.from({ length: count }, (_, index) => ({
    left: ((index * 2654435761) % 1000) / 10,
    top: ((index * 40503 + 611) % 1000) / 10,
    size: 2 + ((index * 3) % 4),
    duration: 5 + (index % 6),
    delay: (index % 7) * 0.7,
    rotate: (index % 4) * 24,
  }));

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {flakes.map((flake, index) => (
        <motion.span
          key={index}
          className="absolute bg-[var(--t-accent)]"
          style={{
            left: `${flake.left}%`,
            top: `${flake.top}%`,
            width: flake.size,
            height: flake.size,
            rotate: `${flake.rotate}deg`,
          }}
          animate={{ opacity: [0.1, 0.55, 0.1] }}
          transition={{
            duration: flake.duration,
            delay: flake.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
