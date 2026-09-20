"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";
import { ArchOutline, ArchRow } from "@/components/ornament/arch";

/**
 * Mughal Arch decoration.
 *
 * The arch is the layout, not an ornament laid on top of it. `ArchClip` turns any
 * content — usually a photograph — into an arch-shaped opening using an SVG
 * clip path in objectBoundingBox units, so one path definition works at every
 * size and aspect ratio without distortion.
 */

/** Normalized arch outline, expressed in a 0–1 box. */
const ARCH_CLIP = "M0,1 L0,0.46 C0,0.17 0.22,0 0.5,0 C0.78,0 1,0.17 1,0.46 L1,1 Z";

/** A flatter, wider arch for section containers. */
const ARCH_CLIP_WIDE = "M0,1 L0,0.3 C0,0.11 0.24,0 0.5,0 C0.76,0 1,0.11 1,0.3 L1,1 Z";

export function ArchClip({
  children,
  className,
  variant = "tall",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "tall" | "wide";
}) {
  const raw = useId().replace(/:/g, "");
  const id = `arch-clip-${raw}`;

  return (
    <div className={cn("relative", className)} style={{ clipPath: `url(#${id})` }}>
      <svg aria-hidden width="0" height="0" className="absolute">
        <defs>
          <clipPath id={id} clipPathUnits="objectBoundingBox">
            <path d={variant === "wide" ? ARCH_CLIP_WIDE : ARCH_CLIP} />
          </clipPath>
        </defs>
      </svg>
      {children}
    </div>
  );
}

/**
 * The arch outline. Uses elliptical border radii rather than a stretched SVG
 * path, so the shoulders keep their shape whatever the container's aspect ratio
 * is, and the whole arch is always drawn — a dash-based path reveal in a
 * non-uniformly scaled viewBox renders only a fraction of itself.
 */
export function DrawnArch({
  className,
  delay = 0,
  variant = "tall",
  double = true,
}: {
  className?: string;
  delay?: number;
  variant?: "tall" | "wide";
  double?: boolean;
}) {
  return (
    /**
     * `h-full w-full` is load-bearing. ArchOutline positions itself with
     * `absolute inset-0`, so without an explicit size this wrapper collapses to
     * zero height and the arch renders invisibly — which is exactly what it did.
     */
    <div
      className={cn(
        "pointer-events-none relative h-full w-full text-[var(--t-accent)]",
        className,
      )}
    >
      <ArchOutline
        shape={variant === "wide" ? "wide" : "tall"}
        delay={delay}
        double={double}
        opacity={0.85}
      />
    </div>
  );
}

/**
 * Jali screen: the pierced stone lattice. Rendered as a tiling pattern and kept
 * at low opacity so it reads as texture rather than decoration.
 */
export function JaliScreen({
  className,
  opacity = 0.09,
  scale = 52,
}: {
  className?: string;
  opacity?: number;
  scale?: number;
}) {
  const raw = useId().replace(/:/g, "");
  const id = `jali-${raw}`;
  const half = scale / 2;

  return (
    <svg
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      style={{ opacity }}
    >
      <defs>
        <pattern id={id} width={scale} height={scale} patternUnits="userSpaceOnUse">
          {/* Interlocking ogee curves, the base motif of a jali screen. */}
          <path
            d={`M0 ${half} C ${half * 0.5} ${half * 0.2}, ${half * 1.5} ${half * 0.2}, ${scale} ${half}
                C ${half * 1.5} ${half * 1.8}, ${half * 0.5} ${half * 1.8}, 0 ${half} Z`}
            fill="none"
            stroke="var(--t-ink)"
            strokeWidth="0.7"
          />
          {/* A hairline cross-axis only: a filled centre read as a row of eyes. */}
          <path
            d={`M${half} ${half * 0.55} L${half} ${half * 1.45}`}
            stroke="var(--t-accent)"
            strokeWidth="0.5"
            opacity="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** A row of small arches, used as a plinth beneath sections. */
export function ArchColonnade({
  count = 7,
  className,
  delay = 0,
}: {
  count?: number;
  className?: string;
  delay?: number;
}) {
  return (
    <div className={cn("text-[var(--t-accent)]", className)}>
      <ArchRow count={count} delay={delay} />
    </div>
  );
}

/** Architectural label: roman capitals between two rules. */
export function StoneLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-3 font-[family-name:var(--font-architectural)] text-fluid-xs tracking-[0.34em] text-[var(--t-accent)] uppercase">
      <span aria-hidden className="h-px w-8 bg-current opacity-50" />
      {children}
      <span aria-hidden className="h-px w-8 bg-current opacity-50" />
    </span>
  );
}
