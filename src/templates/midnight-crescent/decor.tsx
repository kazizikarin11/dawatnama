"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { cn } from "@/lib/utils/cn";
import { useMotionSettings } from "@/components/motion/motion-settings";

/**
 * Midnight Crescent decoration: a crescent, a restrained starfield, gold dust
 * and light bloom. All placement is derived from an index rather than
 * `Math.random`, so the server and client render identical markup.
 */

/** The crescent: one disc, one offset disc punched out of it. */
export function Crescent({
  className,
  delay = 0,
  size = 180,
}: {
  className?: string;
  delay?: number;
  size?: number;
}) {
  const settings = useMotionSettings();

  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 100 100"
      className={cn("pointer-events-none", className)}
      style={{ width: size, height: size }}
      initial={{ opacity: 0, scale: settings.enabled ? 0.82 : 1, rotate: -14 }}
      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: settings.slowDuration * 1.3, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <defs>
        <mask id="crescent-mask">
          <rect width="100" height="100" fill="black" />
          <circle cx="50" cy="50" r="38" fill="white" />
          <circle cx="66" cy="42" r="34" fill="black" />
        </mask>
        <radialGradient id="crescent-fill" cx="35%" cy="60%" r="70%">
          <stop offset="0%" stopColor="var(--t-accent-soft)" />
          <stop offset="100%" stopColor="var(--t-accent)" />
        </radialGradient>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="38"
        fill="url(#crescent-fill)"
        mask="url(#crescent-mask)"
      />
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="var(--t-accent)"
        strokeWidth="0.3"
        opacity="0.4"
      />
    </motion.svg>
  );
}

/** Sparse stars, fading in and out at different rates. */
export function Starfield({
  count = 44,
  className,
}: {
  count?: number;
  className?: string;
}) {
  const settings = useMotionSettings();

  const stars = Array.from({ length: count }, (_, index) => ({
    left: ((index * 2654435761) % 10000) / 100,
    top: ((index * 40503 + 977) % 10000) / 100,
    size: index % 11 === 0 ? 2.2 : index % 4 === 0 ? 1.5 : 1,
    duration: 3 + (index % 7),
    delay: (index % 13) * 0.42,
    peak: 0.25 + ((index % 5) * 0.14),
  }));

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {stars.map((star, index) =>
        settings.ambient ? (
          <motion.span
            key={index}
            className="absolute rounded-full bg-[var(--t-ink)]"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: star.size,
              height: star.size,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.06, star.peak, 0.06] }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ) : (
          <span
            key={index}
            className="absolute rounded-full bg-[var(--t-ink)]"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: star.size,
              height: star.size,
              opacity: star.peak * 0.7,
            }}
          />
        ),
      )}
    </div>
  );
}

/** Soft radial bloom behind focal type. */
export function LightBloom({
  className,
  intensity = 0.4,
}: {
  className?: string;
  intensity?: number;
}) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        background:
          "radial-gradient(60% 45% at 50% 38%, color-mix(in oklab, var(--t-accent) 26%, transparent), transparent 70%)",
        opacity: intensity,
      }}
    />
  );
}

/** Background that drifts slowly as the section scrolls past. */
export function ScrollBackdrop({ children }: { children?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const settings = useMotionSettings();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    settings.parallax > 0 ? ["-6%", "6%"] : ["0%", "0%"],
  );

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-[-8%]">
        {children}
      </motion.div>
    </div>
  );
}

/** Slow rising gold motes. */
export function GoldMotes({ count = 18 }: { count?: number }) {
  const settings = useMotionSettings();
  if (!settings.ambient) return null;

  const motes = Array.from({ length: count }, (_, index) => ({
    left: ((index * 97 + 13) % 100),
    size: 1 + ((index * 3) % 3) * 0.7,
    duration: 14 + ((index * 7) % 11),
    delay: (index % 9) * 1.1,
    drift: ((index % 5) - 2) * 14,
  }));

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {motes.map((mote, index) => (
        <motion.span
          key={index}
          className="absolute rounded-full bg-[var(--t-accent)]"
          style={{
            left: `${mote.left}%`,
            bottom: "-4%",
            width: mote.size,
            height: mote.size,
            filter: "blur(0.3px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.65, 0], y: ["0vh", "-84vh"], x: [0, mote.drift] }}
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

/** Wide-tracked cinematic label. */
export function CineLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[0.62rem] tracking-[0.42em] text-[var(--t-accent)] uppercase">
      {children}
    </span>
  );
}
