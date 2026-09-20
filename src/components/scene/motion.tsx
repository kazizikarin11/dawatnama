"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type Transition,
} from "motion/react";
import {
  useEffect,
  useMemo,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";
import { useMotionSettings } from "@/components/motion/motion-settings";
import type { ImageAsset } from "@/lib/wedding/types";
import { SmartImage } from "@/components/media/smart-image";
import { useScene } from "./scene-deck";

/**
 * Scene motion primitives.
 *
 * Everything here animates against the *scene's* lifecycle instead of a
 * `whileInView` observer, which is what makes the experience feel choreographed:
 * a scene's timeline starts when the guest arrives at it, and can retreat when
 * they leave. Templates compose these rather than writing animation by hand, so
 * five motion languages stay consistent in quality and in reduced-motion
 * behaviour.
 */

const EASE_SILK = [0.22, 1, 0.36, 1] as const;
const EASE_DRAPE = [0.65, 0, 0.35, 1] as const;

/** Scenes animate in on arrival and can settle back when left behind. */
function useSceneAnimation() {
  const { state, active, seen } = useScene();
  const settings = useMotionSettings();

  return {
    play: active || (state === "exiting" && seen),
    exiting: state === "exiting",
    settings,
  };
}

/* ------------------------------------------------------------------ */
/* Text                                                               */
/* ------------------------------------------------------------------ */

export interface RevealProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: ElementType;
  delay?: number;
  /** Distance travelled, in px. */
  distance?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  durationScale?: number;
}

/** The general-purpose scene reveal: travel plus fade, nothing that reflows. */
export function SceneReveal({
  children,
  className,
  style,
  as = "div",
  delay = 0,
  distance,
  direction = "up",
  durationScale = 1,
}: RevealProps) {
  const { play, settings } = useSceneAnimation();
  const Tag = motion[as as keyof typeof motion] as typeof motion.div;
  const travel = distance ?? settings.distance;

  const offset =
    direction === "none"
      ? {}
      : direction === "up"
        ? { y: travel }
        : direction === "down"
          ? { y: -travel }
          : direction === "left"
            ? { x: travel }
            : { x: -travel };

  return (
    <Tag
      className={className}
      style={style}
      initial={{ opacity: 0, ...offset }}
      animate={play ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offset }}
      transition={{
        duration: settings.duration * durationScale,
        delay: settings.enabled ? delay : 0,
        ease: EASE_SILK,
      }}
    >
      {children}
    </Tag>
  );
}

/**
 * A line of type rising out from behind a mask. The observer is the scene, so the
 * classic problem — text translated outside an `overflow: hidden` wrapper never
 * registering as visible — cannot occur.
 */
export function TextReveal({
  children,
  className,
  wrapperClassName,
  delay = 0,
  durationScale = 1.2,
  as = "span",
}: {
  children: ReactNode;
  className?: string;
  wrapperClassName?: string;
  delay?: number;
  durationScale?: number;
  as?: ElementType;
}) {
  const { play, settings } = useSceneAnimation();
  const Tag = motion[as as keyof typeof motion] as typeof motion.span;

  const hidden = {
    y: settings.enabled ? "112%" : "0%",
    opacity: settings.enabled ? 0 : 1,
  };

  return (
    <span className={cn("block overflow-hidden", wrapperClassName)}>
      <Tag
        className={cn("block", className)}
        initial={hidden}
        animate={play ? { y: "0%", opacity: 1 } : hidden}
        transition={{
          duration: settings.duration * durationScale,
          delay: settings.enabled ? delay : 0,
          ease: EASE_SILK,
        }}
      >
        {children}
      </Tag>
    </span>
  );
}

/**
 * The names. Characters rise individually from behind a mask, each arriving
 * blurred and settling sharp, with tracking that closes as the word resolves.
 * This is the one place worth spending this much motion on.
 */
export function SplitTextReveal({
  text,
  className,
  characterClassName,
  delay = 0,
  stagger,
  /** Larger values feel heavier and more deliberate. */
  durationScale = 1.35,
}: {
  text: string;
  className?: string;
  characterClassName?: string;
  delay?: number;
  stagger?: number;
  durationScale?: number;
}) {
  const { play, settings } = useSceneAnimation();
  const characters = useMemo(() => Array.from(text), [text]);

  // Long names would otherwise take far too long to resolve.
  const step =
    stagger ?? Math.min(settings.stagger, 0.85 / Math.max(characters.length, 1));

  if (!settings.enabled || !settings.letterReveals) {
    return (
      <TextReveal className={className} delay={delay}>
        {text}
      </TextReveal>
    );
  }

  return (
    <span className={cn("block", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="flex flex-wrap justify-center overflow-hidden py-[0.12em]">
        {characters.map((character, index) => (
          <motion.span
            key={`${character}-${index}`}
            className={cn("inline-block will-change-transform", characterClassName)}
            initial={{ y: "108%", opacity: 0, filter: "blur(9px)" }}
            animate={
              play
                ? { y: "0%", opacity: 1, filter: "blur(0px)" }
                : { y: "108%", opacity: 0, filter: "blur(9px)" }
            }
            transition={{
              duration: settings.duration * durationScale,
              delay: delay + index * step,
              ease: EASE_SILK,
            }}
          >
            {character === " " ? "\u00A0" : character}
          </motion.span>
        ))}
      </span>
    </span>
  );
}

/** Tracking that closes as the scene resolves — quiet, and very typographic. */
export function TrackingReveal({
  children,
  className,
  delay = 0,
  from = "0.6em",
  to = "0.3em",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  from?: string;
  to?: string;
}) {
  const { play, settings } = useSceneAnimation();

  return (
    <motion.span
      className={cn("inline-block", className)}
      initial={{ opacity: 0, letterSpacing: from }}
      animate={
        play
          ? { opacity: 1, letterSpacing: to }
          : { opacity: 0, letterSpacing: from }
      }
      transition={{
        duration: settings.slowDuration,
        delay: settings.enabled ? delay : 0,
        ease: EASE_SILK,
      }}
    >
      {children}
    </motion.span>
  );
}

/* ------------------------------------------------------------------ */
/* Imagery                                                            */
/* ------------------------------------------------------------------ */

/**
 * Cinematic photography reveal: the frame opens with a clip, while the image
 * inside starts slightly over-scaled and softly out of focus, then settles.
 */
export function ImageReveal({
  image,
  className,
  imageClassName,
  sizes,
  priority,
  delay = 0,
  from = "bottom",
  /** Keeps a slow drift running while the scene is active. */
  drift = true,
  overlay,
}: {
  image: ImageAsset | null;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  delay?: number;
  from?: "bottom" | "top" | "left" | "right";
  drift?: boolean;
  overlay?: ReactNode;
}) {
  const { play, settings } = useSceneAnimation();
  if (!image) return null;

  const closed = {
    bottom: "inset(100% 0% 0% 0%)",
    top: "inset(0% 0% 100% 0%)",
    left: "inset(0% 100% 0% 0%)",
    right: "inset(0% 0% 0% 100%)",
  }[from];

  const open = "inset(0% 0% 0% 0%)";

  return (
    <motion.div
      className={cn("relative overflow-hidden", className)}
      initial={{ clipPath: settings.enabled ? closed : open }}
      animate={{ clipPath: play || !settings.enabled ? open : closed }}
      transition={{
        duration: settings.slowDuration * 1.15,
        delay: settings.enabled ? delay : 0,
        ease: EASE_DRAPE,
      }}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ scale: settings.enabled ? 1.14 : 1, filter: "blur(10px)" }}
        animate={
          play || !settings.enabled
            ? { scale: drift && settings.ambient ? 1.04 : 1, filter: "blur(0px)" }
            : { scale: 1.14, filter: "blur(10px)" }
        }
        transition={{
          duration: settings.slowDuration * (drift ? 5 : 1.6),
          delay: settings.enabled ? delay + 0.1 : 0,
          ease: "easeOut",
        }}
      >
        <SmartImage
          image={image}
          sizes={sizes}
          priority={priority}
          className={imageClassName}
        />
      </motion.div>
      {overlay}
    </motion.div>
  );
}

/**
 * Scroll-linked depth. `depth` is how far the layer travels across the scene's
 * full pass: negative moves against the scroll, which reads as "further away".
 */
export function ParallaxLayer({
  children,
  className,
  depth = 40,
  style,
}: {
  children: ReactNode;
  className?: string;
  depth?: number;
  style?: CSSProperties;
}) {
  const { progress } = useScene();
  const settings = useMotionSettings();
  const value = useMotionValue(0.5);

  useEffect(() => {
    value.set(progress);
  }, [progress, value]);

  const smooth = useSpring(value, { stiffness: 90, damping: 26, mass: 0.35 });
  const travel = depth * settings.parallax;
  const y = useTransform(smooth, [0, 1], [travel, -travel]);

  return (
    <motion.div className={className} style={{ ...style, y }}>
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Ornament                                                           */
/* ------------------------------------------------------------------ */

/** Ink an SVG path on scene arrival. */
export function OrnamentReveal({
  d,
  className,
  delay = 0,
  durationScale = 2.2,
  strokeWidth = 1,
  opacity = 1,
}: {
  d: string;
  className?: string;
  delay?: number;
  durationScale?: number;
  strokeWidth?: number;
  opacity?: number;
}) {
  const { play, settings } = useSceneAnimation();

  return (
    <motion.path
      d={d}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      initial={{ pathLength: settings.enabled ? 0 : 1, opacity: 0 }}
      animate={
        play || !settings.enabled
          ? { pathLength: 1, opacity }
          : { pathLength: settings.enabled ? 0 : 1, opacity: 0 }
      }
      transition={{
        pathLength: {
          duration: settings.duration * durationScale,
          delay: settings.enabled ? delay : 0,
          ease: "easeInOut",
        },
        opacity: { duration: 0.4, delay: settings.enabled ? delay : 0 },
      }}
    />
  );
}

/**
 * A single sweep of light across the scene — the "expensive" cue. Runs once on
 * arrival, never loops, and is skipped entirely under reduced motion.
 */
export function GoldSweep({
  className,
  delay = 0,
  duration = 1.8,
}: {
  className?: string;
  delay?: number;
  duration?: number;
}) {
  const { play, settings } = useSceneAnimation();
  if (!settings.enabled) return null;

  return (
    <motion.div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: play ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="absolute top-0 h-full w-[45%]"
        style={{
          background:
            "linear-gradient(100deg, transparent, color-mix(in oklab, var(--t-accent) 26%, transparent), transparent)",
          filter: "blur(6px)",
        }}
        initial={{ x: "-140%" }}
        animate={play ? { x: "260%" } : { x: "-140%" }}
        transition={{ duration, delay, ease: EASE_DRAPE }}
      />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Numbers                                                            */
/* ------------------------------------------------------------------ */

/**
 * A rolling digit column. Each digit is a strip of 0–9 translated to the right
 * position, so a change animates as a physical roll rather than a text swap.
 */
export function RollingNumber({
  value,
  digits = 2,
  className,
  digitClassName,
}: {
  value: number | null;
  /** Minimum number of digits; the value is never truncated if it is longer. */
  digits?: number;
  className?: string;
  digitClassName?: string;
}) {
  const settings = useMotionSettings();
  const text =
    value === null
      ? "—".repeat(digits)
      : String(Math.max(0, value)).padStart(digits, "0");

  /**
   * The window is taller than 1em because display serifs draw figures with
   * ascenders and descenders that a 1em box clips, and lining tabular figures are
   * requested so the digits share one baseline and one width while rolling.
   */
  const windowHeight = "1.16em";

  return (
    <span
      className={cn("inline-flex items-baseline", className)}
      style={{ fontVariantNumeric: "lining-nums tabular-nums" }}
      aria-label={text}
    >
      {Array.from(text).map((character, index) => {
        const numeric = Number(character);

        if (Number.isNaN(numeric)) {
          return (
            <span key={index} aria-hidden className={digitClassName}>
              {character}
            </span>
          );
        }

        return (
          <span
            key={index}
            aria-hidden
            className={cn("relative inline-block overflow-hidden", digitClassName)}
            style={{ height: windowHeight }}
          >
            <motion.span
              className="flex flex-col"
              animate={{ y: `calc(${-numeric} * ${windowHeight})` }}
              transition={
                settings.enabled ? { duration: 0.7, ease: EASE_SILK } : { duration: 0.001 }
              }
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <span
                  key={digit}
                  className="block text-center"
                  style={{ height: windowHeight, lineHeight: windowHeight }}
                >
                  {digit}
                </span>
              ))}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Particles                                                          */
/* ------------------------------------------------------------------ */

/**
 * A light DOM particle field for scenes where WebGL would be overkill. Counts are
 * capped and placement is deterministic so server and client agree.
 */
export function ParticleField({
  count = 14,
  className,
  colorVar = "--t-accent",
  size = 2,
  rise = true,
}: {
  count?: number;
  className?: string;
  colorVar?: string;
  size?: number;
  rise?: boolean;
}) {
  const { active } = useScene();
  const settings = useMotionSettings();

  if (!settings.ambient) return null;

  const particles = Array.from({ length: count }, (_, index) => ({
    left: ((index * 2654435761) % 1000) / 10,
    top: ((index * 40503 + 331) % 1000) / 10,
    scale: 0.5 + ((index * 7) % 5) * 0.22,
    duration: 9 + ((index * 5) % 8),
    delay: (index % 6) * 0.9,
    drift: ((index % 3) - 1) * 22,
  }));

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {particles.map((particle, index) => (
        <motion.span
          key={index}
          className="absolute rounded-full"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: size * particle.scale,
            height: size * particle.scale,
            backgroundColor: `var(${colorVar})`,
          }}
          animate={
            active
              ? {
                  opacity: [0, 0.7, 0],
                  y: rise ? [0, -70] : [0, 70],
                  x: [0, particle.drift],
                }
              : { opacity: 0 }
          }
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export const sceneTransitions = {
  silk: (duration = 0.9, delay = 0): Transition => ({ duration, delay, ease: EASE_SILK }),
  drape: (duration = 1.1, delay = 0): Transition => ({ duration, delay, ease: EASE_DRAPE }),
};
