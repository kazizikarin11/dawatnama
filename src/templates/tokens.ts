import type { CSSProperties } from "react";
import type { WeddingData } from "@/lib/wedding/types";

/**
 * Template theming.
 *
 * Each template declares a small set of tokens; they are emitted as `--t-*` CSS
 * custom properties on the template root. Shared components (the music toggle,
 * the lightbox, the RSVP form) read only these variables, which is how one set
 * of shared controls picks up five completely different visual identities.
 */

export interface TemplateTokens {
  /** Page background. */
  bg: string;
  /** Secondary background for alternating bands. */
  bgAlt: string;
  /** Raised surfaces: cards, sheets, the lightbox chrome. */
  surface: string;
  /** Primary text. */
  ink: string;
  /** Secondary text. */
  inkSoft: string;
  /** Tertiary text: labels, captions, meta. */
  inkMuted: string;
  /** Metallic or signature accent. */
  accent: string;
  /** Low-contrast accent for washes. */
  accentSoft: string;
  /** Hairlines and borders. */
  line: string;
  /** Scrim over photography. */
  overlay: string;
}

export function tokensToStyle(
  tokens: TemplateTokens,
  accentOverride?: string | null,
): CSSProperties {
  const accent = accentOverride ?? tokens.accent;

  return {
    "--t-bg": tokens.bg,
    "--t-bg-alt": tokens.bgAlt,
    "--t-surface": tokens.surface,
    "--t-ink": tokens.ink,
    "--t-ink-soft": tokens.inkSoft,
    "--t-ink-muted": tokens.inkMuted,
    "--t-accent": accent,
    "--t-accent-soft": tokens.accentSoft,
    "--t-line": tokens.line,
    "--t-overlay": tokens.overlay,
    backgroundColor: tokens.bg,
    color: tokens.ink,
  } as CSSProperties;
}

/** Applies the author's accent override only when the template allows it. */
export function accentFor(data: WeddingData, supportsAccent: boolean): string | null {
  return supportsAccent ? data.appearance.accent : null;
}
