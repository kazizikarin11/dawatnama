"use client";

/**
 * WebGL capability gate.
 *
 * A guest on a mid-range Android phone must never be handed a shader they cannot
 * run smoothly, so the canvas only mounts when the device can clearly afford it.
 * Everything below falls back to the CSS/DOM ornament layer, which every template
 * already ships.
 */

export interface WebglCapability {
  supported: boolean;
  /** Reduce particle counts and pixel ratio on weaker hardware. */
  tier: "high" | "low";
  reason: string | null;
}

let cached: WebglCapability | null = null;

export function detectWebgl(): WebglCapability {
  if (cached) return cached;

  if (typeof window === "undefined") {
    return { supported: false, tier: "low", reason: "server" };
  }

  // Saving data is an explicit request to send less; honour it.
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;

  if (connection?.saveData) {
    cached = { supported: false, tier: "low", reason: "save-data" };
    return cached;
  }

  if (connection?.effectiveType && /(^|-)2g$/.test(connection.effectiveType)) {
    cached = { supported: false, tier: "low", reason: "slow-network" };
    return cached;
  }

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;

  if (cores <= 2 || memory <= 1) {
    cached = { supported: false, tier: "low", reason: "low-end-device" };
    return cached;
  }

  let supported = false;
  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ??
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true });
    supported = Boolean(context);

    // Release the probe context immediately rather than waiting for GC.
    const lose = (
      context as (WebGLRenderingContext & { getExtension: WebGLRenderingContext["getExtension"] }) | null
    )?.getExtension("WEBGL_lose_context") as { loseContext?: () => void } | null;
    lose?.loseContext?.();
  } catch {
    supported = false;
  }

  cached = {
    supported,
    tier: cores >= 6 && memory >= 4 ? "high" : "low",
    reason: supported ? null : "no-webgl",
  };
  return cached;
}
