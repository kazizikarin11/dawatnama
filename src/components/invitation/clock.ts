"use client";

/**
 * A single shared 1-second clock.
 *
 * Every countdown on the page subscribes to this one interval instead of running
 * its own, and the snapshot is a cached value so `useSyncExternalStore` stays
 * happy. The server snapshot is 0, which is also the client's first snapshot, so
 * hydration matches exactly and the real time arrives on the next tick.
 */

let current = 0;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function subscribeToClock(listener: () => void): () => void {
  listeners.add(listener);

  if (timer === null) {
    current = Date.now();
    timer = setInterval(() => {
      current = Date.now();
      notify();
    }, 1000);
    // Publish the initial time to whoever just subscribed.
    notify();
  } else {
    listener();
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** Cached: returns the same value until the next tick. */
export function getClockSnapshot(): number {
  return current;
}

/** The server has no clock; 0 means "not counting yet". */
export function getClockServerSnapshot(): number {
  return 0;
}
