"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils/cn";
import { useMotionSettings } from "@/components/motion/motion-settings";
import { DrawPath } from "@/components/motion/primitives";

/**
 * Ivory & Rose decoration: fine botanical linework and paper texture. Nothing
 * heavy, nothing symmetrical — the ornament behaves like a printed flourish in
 * the margin of an editorial spread.
 */

/** A single drawn stem with leaves. Mirrors horizontally on request. */
export function BotanicalStem({
  className,
  flip = false,
  delay = 0,
}: {
  className?: string;
  flip?: boolean;
  delay?: number;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 240"
      className={cn(
        "pointer-events-none text-[var(--t-accent)]",
        flip && "scale-x-[-1]",
        className,
      )}
      fill="none"
    >
      <DrawPath
        d="M60 236 C60 180 52 140 34 104 C22 80 18 52 26 22"
        stroke="currentColor"
        strokeWidth={1}
        delay={delay}
        durationScale={2.6}
        opacity={0.6}
      />
      {[
        "M46 176 C28 168 18 152 16 132 C34 134 48 150 52 170",
        "M40 140 C58 132 74 136 86 150 C68 160 50 158 40 146",
        "M32 98 C16 88 10 70 12 50 C28 58 38 76 38 94",
        "M28 66 C46 58 62 62 72 76 C56 86 38 82 28 72",
      ].map((leaf, index) => (
        <DrawPath
          key={leaf}
          d={leaf}
          stroke="currentColor"
          strokeWidth={0.8}
          delay={delay + 0.3 + index * 0.16}
          durationScale={1.8}
          opacity={0.45}
        />
      ))}
      <circle cx="26" cy="20" r="3.2" fill="currentColor" opacity="0.45" />
    </svg>
  );
}

/** Paired stems framing a centred composition. */
export function BotanicalFrame({ delay = 0 }: { delay?: number }) {
  return (
    <>
      <BotanicalStem className="absolute -top-6 -left-4 h-40 w-20 opacity-70 sm:h-52 sm:w-24" delay={delay} />
      <BotanicalStem
        className="absolute -right-4 -bottom-6 h-40 w-20 rotate-180 opacity-70 sm:h-52 sm:w-24"
        delay={delay + 0.2}
      />
    </>
  );
}

/** Drifting petals — ambient, and never rendered under reduced motion. */
export function Petals({ count = 9 }: { count?: number }) {
  const settings = useMotionSettings();
  if (!settings.ambient) return null;

  const petals = Array.from({ length: count }, (_, index) => ({
    left: ((index * 2654435761) % 1000) / 10,
    delay: (index % 5) * 1.6,
    duration: 16 + ((index * 3) % 8),
    size: 6 + ((index * 5) % 7),
    drift: ((index % 3) - 1) * 40,
  }));

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {petals.map((petal, index) => (
        <motion.span
          key={index}
          className="absolute rounded-[60%_40%_60%_40%] bg-[var(--t-accent-soft)]"
          style={{
            left: `${petal.left}%`,
            top: "-6%",
            width: petal.size,
            height: petal.size * 0.72,
          }}
          initial={{ opacity: 0, y: 0, rotate: 0 }}
          animate={{
            opacity: [0, 0.75, 0],
            y: ["0vh", "108vh"],
            x: [0, petal.drift],
            rotate: [0, 220],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

/** Editorial section label: a rule, a numeral, and small caps. */
export function EditorialLabel({
  index,
  children,
}: {
  index?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 text-[var(--t-accent)]">
      {index && (
        <span className="font-[family-name:var(--font-editorial)] text-fluid-sm italic">
          {index}
        </span>
      )}
      <span aria-hidden className="h-px w-10 bg-current opacity-50" />
      <span className="text-fluid-xs tracking-label">{children}</span>
    </div>
  );
}

/** Handwritten accent, used sparingly for a single word. */
export function ScriptAccent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-[family-name:var(--font-script)] text-[var(--t-accent)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
