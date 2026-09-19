"use client";

import {
  motion,
  useInView,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type Transition,
} from "motion/react";
import { useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { useMotionSettings } from "./motion-settings";

/**
 * The shared animation vocabulary. Every template composes its motion from
 * these primitives, which keeps timing consistent, keeps reduced-motion
 * handling in one place, and keeps transforms on the compositor.
 *
 * All reveals animate `opacity` and `transform` only — never layout properties —
 * so nothing here can cause a layout shift.
 */

const EASE_SILK = [0.22, 1, 0.36, 1] as const;
const EASE_RISE = [0.16, 1, 0.3, 1] as const;

type Direction = "up" | "down" | "left" | "right" | "none";

function offset(direction: Direction, distance: number) {
  switch (direction) {
    case "up":
      return { y: distance };
    case "down":
      return { y: -distance };
    case "left":
      return { x: distance };
    case "right":
      return { x: -distance };
    default:
      return {};
  }
}

export interface RevealProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: ElementType;
  direction?: Direction;
  delay?: number;
  /** Multiplies the configured duration. */
  durationScale?: number;
  /** Animate once on entering the viewport (default) or every time. */
  once?: boolean;
  /** How far into the viewport before it triggers. */
  amount?: number;
}

/** Fade and travel into view. The workhorse for section content. */
export function Reveal({
  children,
  className,
  style,
  as = "div",
  direction = "up",
  delay = 0,
  durationScale = 1,
  once = true,
  amount = 0.25,
}: RevealProps) {
  const settings = useMotionSettings();
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  return (
    <MotionTag
      className={className}
      style={style}
      initial={{ opacity: 0, ...offset(direction, settings.distance) }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount }}
      transition={{
        duration: settings.duration * durationScale,
        delay: settings.enabled ? delay : 0,
        ease: EASE_SILK,
      }}
    >
      {children}
    </MotionTag>
  );
}

/** Staggers direct children that are `<RevealItem>`s. */
export function RevealGroup({
  children,
  className,
  style,
  as = "div",
  delay = 0,
  once = true,
  amount = 0.2,
}: Omit<RevealProps, "direction" | "durationScale">) {
  const settings = useMotionSettings();
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  return (
    <MotionTag
      className={className}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: settings.stagger,
            delayChildren: settings.enabled ? delay : 0,
          },
        },
      }}
    >
      {children}
    </MotionTag>
  );
}

export function RevealItem({
  children,
  className,
  style,
  as = "div",
  direction = "up",
  durationScale = 1,
}: Omit<RevealProps, "delay" | "once" | "amount">) {
  const settings = useMotionSettings();
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  return (
    <MotionTag
      className={className}
      style={style}
      variants={{
        hidden: { opacity: 0, ...offset(direction, settings.distance) },
        visible: { opacity: 1, x: 0, y: 0 },
      }}
      transition={{ duration: settings.duration * durationScale, ease: EASE_SILK }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Text that rises out from behind a mask, line by line. The mask is a wrapper
 * with `overflow: hidden`, which is what gives the expensive, typeset feel.
 *
 * The viewport is observed on the *wrapper*, not the moving text. The text
 * starts translated fully below the mask, so its own visible area is zero — a
 * `whileInView` on it would never trigger and the line would never appear.
 */
export function MaskedLine({
  children,
  className,
  wrapperClassName,
  delay = 0,
  once = true,
  durationScale = 1.15,
  as = "span",
}: {
  children: ReactNode;
  className?: string;
  wrapperClassName?: string;
  delay?: number;
  once?: boolean;
  durationScale?: number;
  as?: ElementType;
}) {
  const settings = useMotionSettings();
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.span;
  const wrapper = useRef<HTMLSpanElement>(null);
  const inView = useInView(wrapper, { once, amount: 0.3 });

  const hidden = {
    y: settings.enabled ? "110%" : "0%",
    opacity: settings.enabled ? 0 : 1,
  };

  return (
    <span ref={wrapper} className={cn("block overflow-hidden", wrapperClassName)}>
      <MotionTag
        className={cn("block", className)}
        initial={hidden}
        animate={inView ? { y: "0%", opacity: 1 } : hidden}
        transition={{
          duration: settings.duration * durationScale,
          delay: settings.enabled ? delay : 0,
          ease: EASE_RISE,
        }}
      >
        {children}
      </MotionTag>
    </span>
  );
}

/**
 * Letter-by-letter reveal. Falls back to a single masked line when reduced
 * motion is on or intensity is calm, so long names never turn into a slow
 * sequence of dozens of animated nodes on a low-end phone.
 */
export function LetterReveal({
  text,
  className,
  letterClassName,
  delay = 0,
  stagger,
  once = true,
}: {
  text: string;
  className?: string;
  letterClassName?: string;
  delay?: number;
  stagger?: number;
  once?: boolean;
}) {
  const settings = useMotionSettings();

  if (!settings.letterReveals) {
    return (
      <MaskedLine className={className} delay={delay} once={once}>
        {text}
      </MaskedLine>
    );
  }

  const characters = Array.from(text);
  const step = stagger ?? settings.stagger * 0.7;

  return (
    <LetterRow
      characters={characters}
      text={text}
      className={className}
      letterClassName={letterClassName}
      delay={delay}
      step={step}
      once={once}
      duration={settings.duration}
    />
  );
}

/**
 * Split-letter row. Like MaskedLine, the observer watches the row rather than
 * the letters, which are offset beyond the clip and would otherwise never
 * register as visible.
 */
function LetterRow({
  characters,
  text,
  className,
  letterClassName,
  delay,
  step,
  once,
  duration,
}: {
  characters: string[];
  text: string;
  className?: string;
  letterClassName?: string;
  delay: number;
  step: number;
  once: boolean;
  duration: number;
}) {
  const row = useRef<HTMLSpanElement>(null);
  const inView = useInView(row, { once, amount: 0.25 });

  return (
    <span
      ref={row}
      className={cn("inline-flex flex-wrap justify-center overflow-hidden", className)}
    >
      <span className="sr-only">{text}</span>
      {characters.map((character, index) => (
        <motion.span
          key={`${character}-${index}`}
          aria-hidden
          className={cn("inline-block", letterClassName)}
          initial={{ opacity: 0, y: "60%" }}
          animate={inView ? { opacity: 1, y: "0%" } : { opacity: 0, y: "60%" }}
          transition={{
            duration,
            delay: delay + index * step,
            ease: EASE_RISE,
          }}
        >
          {character === " " ? "\u00A0" : character}
        </motion.span>
      ))}
    </span>
  );
}

/**
 * Wipes content into view behind a moving clip edge.
 *
 * The observer sits on an unclipped wrapper. A fully-clipped element reports no
 * visible area, so observing the clipped element itself would mean the wipe never
 * starts and the content — usually a photograph — stays invisible for good.
 */
export function ClipReveal({
  children,
  className,
  from = "bottom",
  delay = 0,
  once = true,
  durationScale = 1.4,
}: {
  children: ReactNode;
  className?: string;
  from?: "bottom" | "top" | "left" | "right";
  delay?: number;
  once?: boolean;
  durationScale?: number;
}) {
  const settings = useMotionSettings();
  const wrapper = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapper, { once, amount: 0.15 });

  const closed = {
    bottom: "inset(100% 0% 0% 0%)",
    top: "inset(0% 0% 100% 0%)",
    left: "inset(0% 100% 0% 0%)",
    right: "inset(0% 0% 0% 100%)",
  }[from];

  const open = "inset(0% 0% 0% 0%)";
  const hidden = { clipPath: settings.enabled ? closed : open };

  return (
    <div ref={wrapper} className={className}>
      <motion.div
        initial={hidden}
        animate={inView ? { clipPath: open } : hidden}
        transition={{
          duration: settings.duration * durationScale,
          delay: settings.enabled ? delay : 0,
          ease: EASE_SILK,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Draws an SVG path as though it were being inked in. Used for the gold
 * linework in Royal Emerald and the arches in Mughal Arch.
 */
export function DrawPath({
  d,
  className,
  delay = 0,
  durationScale = 2,
  once = true,
  strokeWidth = 1,
  stroke = "currentColor",
  opacity,
  strokeLinecap = "round",
}: {
  d: string;
  className?: string;
  delay?: number;
  durationScale?: number;
  once?: boolean;
  strokeWidth?: number;
  stroke?: string;
  opacity?: number;
  strokeLinecap?: "butt" | "round" | "square";
}) {
  const settings = useMotionSettings();
  const path = useRef<SVGPathElement>(null);
  // Observed on the path itself, but with a low threshold: a hairline stroke in a
  // stretched viewBox can otherwise sit below an `amount` cutoff and never draw.
  const inView = useInView(path, { once, amount: 0.01 });

  return (
    <motion.path
      ref={path}
      d={d}
      className={className}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap={strokeLinecap}
      fill="none"
      vectorEffect="non-scaling-stroke"
      initial={{
        pathLength: settings.enabled ? 0 : 1,
        opacity: settings.enabled ? 0 : (opacity ?? 1),
      }}
      animate={
        inView
          ? { pathLength: 1, opacity: opacity ?? 1 }
          : { pathLength: settings.enabled ? 0 : 1, opacity: settings.enabled ? 0 : (opacity ?? 1) }
      }
      transition={{
        pathLength: {
          duration: settings.duration * durationScale,
          delay: settings.enabled ? delay : 0,
          ease: "easeInOut",
        },
        opacity: { duration: 0.3, delay: settings.enabled ? delay : 0 },
      }}
    />
  );
}

/**
 * Scroll-linked vertical parallax. `strength` is in px of total travel;
 * the spring keeps it from feeling mechanical on fast flicks.
 */
export function useParallax(
  target: React.RefObject<HTMLElement | null>,
  strength = 60,
): MotionValue<number> {
  const settings = useMotionSettings();
  const { scrollYProgress } = useScroll({
    target,
    offset: ["start end", "end start"],
  });

  const travel = strength * settings.parallax;
  const raw = useTransform(scrollYProgress, [0, 1], [travel, -travel]);
  return useSpring(raw, { stiffness: 120, damping: 30, mass: 0.4 });
}

export function Parallax({
  children,
  className,
  strength = 60,
  style,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const y = useParallax(ref, strength);

  return (
    <div ref={ref} className={className} style={style}>
      <motion.div style={{ y }} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}

/** Scroll-linked scale, for slow cinematic image pushes. */
export function ScrollScale({
  children,
  className,
  from = 1.12,
  to = 1,
}: {
  children: ReactNode;
  className?: string;
  from?: number;
  to?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settings = useMotionSettings();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    settings.parallax > 0 ? [from, to] : [1, 1],
  );

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <motion.div style={{ scale }} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}

export const transitions = {
  silk: (duration = 0.8, delay = 0): Transition => ({
    duration,
    delay,
    ease: EASE_SILK,
  }),
  rise: (duration = 0.9, delay = 0): Transition => ({
    duration,
    delay,
    ease: EASE_RISE,
  }),
};
