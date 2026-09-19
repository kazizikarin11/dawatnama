"use client";

import { useSyncExternalStore } from "react";
import { countdownFrom, type CountdownParts } from "@/lib/wedding/format";
import {
  getClockServerSnapshot,
  getClockSnapshot,
  subscribeToClock,
} from "./clock";

/**
 * Ticking countdown.
 *
 * Returns null on the server and on the first client render, so the markup
 * matches and templates can show their static date until the first tick lands a
 * frame later. No layout shift, no hydration mismatch, and one shared interval
 * for every countdown on the page.
 */
export function useCountdown(target: number | null): CountdownParts | null {
  const now = useSyncExternalStore(
    subscribeToClock,
    getClockSnapshot,
    getClockServerSnapshot,
  );

  if (target === null || now === 0) return null;
  return countdownFrom(target, now);
}
