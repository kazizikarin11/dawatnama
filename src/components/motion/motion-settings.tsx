"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import type { AnimationIntensity } from "@/lib/wedding/types";

/**
 * One place decides how much motion happens. Templates and primitives read
 * these numbers instead of hardcoding durations, so the author's animation
 * intensity setting and the guest's `prefers-reduced-motion` preference are
 * always both honoured.
 */

export interface MotionSettings {
  intensity: AnimationIntensity;
  /** False when the guest asked for reduced motion. */
  enabled: boolean;
  /** Travel distance in px for reveals. */
  distance: number;
  duration: number;
  slowDuration: number;
  stagger: number;
  /** Scroll-linked parallax strength, 0 disables it. */
  parallax: number;
  /** Ambient effects: particles, drifting ornaments, ken burns. */
  ambient: boolean;
  /** Per-letter typography reveals are expensive; only above a threshold. */
  letterReveals: boolean;
}

const PRESETS: Record<AnimationIntensity, Omit<MotionSettings, "intensity" | "enabled">> = {
  calm: {
    distance: 12,
    duration: 0.5,
    slowDuration: 0.8,
    stagger: 0.03,
    parallax: 0,
    ambient: false,
    letterReveals: false,
  },
  balanced: {
    distance: 26,
    duration: 0.8,
    slowDuration: 1.2,
    stagger: 0.05,
    parallax: 0.55,
    ambient: true,
    letterReveals: true,
  },
  cinematic: {
    distance: 44,
    duration: 1.1,
    slowDuration: 1.7,
    stagger: 0.075,
    parallax: 1,
    ambient: true,
    letterReveals: true,
  },
};

const STILL: Omit<MotionSettings, "intensity" | "enabled"> = {
  distance: 0,
  duration: 0.001,
  slowDuration: 0.001,
  stagger: 0,
  parallax: 0,
  ambient: false,
  letterReveals: false,
};

const MotionSettingsContext = createContext<MotionSettings>({
  intensity: "balanced",
  enabled: true,
  ...PRESETS.balanced,
});

export function MotionSettingsProvider({
  intensity,
  children,
}: {
  intensity: AnimationIntensity;
  children: ReactNode;
}) {
  const prefersReduced = useReducedMotion();

  const value = useMemo<MotionSettings>(() => {
    const enabled = !prefersReduced;
    return {
      intensity,
      enabled,
      ...(enabled ? PRESETS[intensity] : STILL),
    };
  }, [intensity, prefersReduced]);

  return (
    <MotionSettingsContext.Provider value={value}>
      {children}
    </MotionSettingsContext.Provider>
  );
}

export function useMotionSettings(): MotionSettings {
  return useContext(MotionSettingsContext);
}
