"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils/cn";
import { useMotionSettings } from "@/components/motion/motion-settings";
import { DrawPath } from "@/components/motion/primitives";
import { ArchOutline } from "@/components/ornament/arch";

/**
 * Royal Emerald's decorative system.
 *
 * Everything is SVG so it stays crisp at any density and scales with the
 * viewport instead of being a fixed-size image. Strokes use the template accent
 * token, so an author's accent override flows through the whole ornament set.
 */

/** Eight-point star points, the base unit of the geometry. */
function starPoints(cx: number, cy: number, r: number, inner = 0.52) {
  return Array.from({ length: 16 }, (_, index) => {
    const radius = index % 2 === 0 ? r : r * inner;
    const angle = (Math.PI / 8) * index - Math.PI / 2;
    return `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
}

/** Tiling Mughal-inspired lattice, used as a whisper behind sections. */
export function LatticePattern({
  className,
  opacity = 0.14,
  scale = 64,
}: {
  className?: string;
  opacity?: number;
  scale?: number;
}) {
  const id = useId().replace(/:/g, "");

  return (
    <svg
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      style={{ opacity }}
    >
      <defs>
        <pattern
          id={`lattice-${id}`}
          width={scale}
          height={scale}
          patternUnits="userSpaceOnUse"
        >
          <polygon
            points={starPoints(scale / 2, scale / 2, scale * 0.34)}
            fill="none"
            stroke="var(--t-accent)"
            strokeWidth="0.6"
          />
          <circle
            cx={scale / 2}
            cy={scale / 2}
            r={scale * 0.06}
            fill="var(--t-accent)"
            opacity="0.5"
          />
          <path
            d={`M0 0 L${scale} ${scale} M${scale} 0 L0 ${scale}`}
            stroke="var(--t-accent)"
            strokeWidth="0.3"
            opacity="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#lattice-${id})`} />
    </svg>
  );
}

/**
 * The signature arch, framing whatever it contains. Built from elliptical border
 * radii so it holds its proportions at any size, and revealed with a slow
 * bottom-up wipe.
 */
export function ArchFrame({
  children,
  className,
  delay = 0,
  inset = true,
}: {
  children?: React.ReactNode;
  className?: string;
  delay?: number;
  /** Adds the finer secondary line inside the main arch. */
  inset?: boolean;
}) {
  return (
    <div className={cn("relative text-[var(--t-accent)]", className)}>
      <ArchOutline shape="tall" delay={delay} double={inset} />
      {children}
    </div>
  );
}

/** A hairline with a small star at its centre; the section separator. */
export function GoldDivider({
  className,
  delay = 0,
  width = "min(18rem, 70%)",
}: {
  className?: string;
  delay?: number;
  width?: string;
}) {
  return (
    <div
      className={cn("mx-auto flex items-center gap-3 text-[var(--t-accent)]", className)}
      style={{ width }}
    >
      <span className="rule-fade flex-1" />
      <svg viewBox="0 0 24 24" className="size-3 shrink-0" aria-hidden>
        <motion.polygon
          points={starPoints(12, 12, 11)}
          fill="currentColor"
          initial={{ scale: 0, opacity: 0, rotate: -45 }}
          whileInView={{ scale: 1, opacity: 1, rotate: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
          style={{ originX: "50%", originY: "50%" }}
        />
      </svg>
      <span className="rule-fade flex-1" />
    </div>
  );
}

/** Corner brackets that frame a full-bleed composition. */
export function CornerFlourishes({ delay = 0 }: { delay?: number }) {
  const corners = [
    { d: "M2 30 L2 12 Q2 2 12 2 L30 2", className: "top-4 left-4" },
    { d: "M2 2 L20 2 Q30 2 30 12 L30 30", className: "top-4 right-4" },
    { d: "M2 2 L2 20 Q2 30 12 30 L30 30", className: "bottom-4 left-4" },
    { d: "M2 30 L20 30 Q30 30 30 20 L30 2", className: "bottom-4 right-4" },
  ];

  return (
    <>
      {corners.map((corner, index) => (
        <svg
          key={corner.className}
          aria-hidden
          viewBox="0 0 32 32"
          className={cn("pointer-events-none absolute size-8 text-[var(--t-accent)]", corner.className)}
        >
          <DrawPath
            d={corner.d}
            stroke="currentColor"
            strokeWidth={1}
            delay={delay + index * 0.12}
            durationScale={1.6}
            opacity={0.7}
          />
        </svg>
      ))}
    </>
  );
}

/** Slow-drifting gold motes. Ambient only, and skipped when motion is reduced. */
export function GoldDust({ count = 14 }: { count?: number }) {
  const settings = useMotionSettings();
  if (!settings.ambient) return null;

  // Deterministic pseudo-random placement so server and client agree.
  const motes = Array.from({ length: count }, (_, index) => {
    const x = ((index * 2654435761) % 1000) / 10;
    const y = ((index * 40503 + 137) % 1000) / 10;
    const size = 1 + ((index * 7) % 3) * 0.6;
    const duration = 12 + ((index * 5) % 9);
    return { x, y, size, duration, delay: (index % 7) * 0.8 };
  });

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {motes.map((mote, index) => (
        <motion.span
          key={index}
          className="absolute rounded-full bg-[var(--t-accent-soft)]"
          style={{
            left: `${mote.x}%`,
            top: `${mote.y}%`,
            width: mote.size,
            height: mote.size,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.6, 0],
            y: [0, -70 - (index % 5) * 14],
            x: [0, ((index % 3) - 1) * 18],
          }}
          transition={{
            duration: mote.duration,
            delay: mote.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/** Small ornamental label used above section titles. */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-fluid-xs tracking-label text-[var(--t-accent)]">
      <span aria-hidden className="h-px w-6 bg-current opacity-60" />
      {children}
      <span aria-hidden className="h-px w-6 bg-current opacity-60" />
    </span>
  );
}
