/**
 * Adaptive display typography.
 *
 * Names are the hero of the experience and their length is completely outside our
 * control: "Ali" and "Muhammad Abdul Rahman" have to look deliberate in the same
 * composition. Rather than one clamp that compromises for both, the size steps
 * down as the string grows, so a short name can be set enormous and a long one
 * still fits without wrapping awkwardly or overflowing.
 */

export type DisplayScale = "poster" | "hero" | "title";

const SCALES: Record<DisplayScale, Array<{ maxLength: number; size: string; tracking: string }>> = {
  // Full-screen cover and closing names.
  poster: [
    { maxLength: 5, size: "clamp(3.6rem, 22vw, 7.5rem)", tracking: "-0.01em" },
    { maxLength: 8, size: "clamp(3rem, 17vw, 6rem)", tracking: "-0.005em" },
    { maxLength: 11, size: "clamp(2.4rem, 13.5vw, 4.75rem)", tracking: "0" },
    { maxLength: 15, size: "clamp(2rem, 10.5vw, 3.75rem)", tracking: "0" },
    { maxLength: 22, size: "clamp(1.65rem, 8vw, 2.85rem)", tracking: "0.005em" },
    { maxLength: Infinity, size: "clamp(1.4rem, 6.5vw, 2.25rem)", tracking: "0.01em" },
  ],
  // Section headings and event titles.
  hero: [
    { maxLength: 8, size: "clamp(2.4rem, 13vw, 4rem)", tracking: "0" },
    { maxLength: 14, size: "clamp(2rem, 10vw, 3.25rem)", tracking: "0" },
    { maxLength: 22, size: "clamp(1.6rem, 7.5vw, 2.5rem)", tracking: "0.005em" },
    { maxLength: Infinity, size: "clamp(1.35rem, 6vw, 2rem)", tracking: "0.01em" },
  ],
  title: [
    { maxLength: 14, size: "clamp(1.5rem, 7vw, 2.25rem)", tracking: "0" },
    { maxLength: 26, size: "clamp(1.25rem, 5.5vw, 1.75rem)", tracking: "0.005em" },
    { maxLength: Infinity, size: "clamp(1.1rem, 4.5vw, 1.5rem)", tracking: "0.01em" },
  ],
};

export interface DisplayTypeStyle {
  fontSize: string;
  letterSpacing: string;
  lineHeight: string;
}

export function displayType(
  text: string | null | undefined,
  scale: DisplayScale = "poster",
  lineHeight = "0.96",
): DisplayTypeStyle {
  const length = (text ?? "").trim().length || 1;
  const steps = SCALES[scale];
  const step = steps.find((entry) => length <= entry.maxLength) ?? steps[steps.length - 1]!;

  return {
    fontSize: step.size,
    letterSpacing: step.tracking,
    lineHeight,
  };
}

/**
 * One size for a set of names.
 *
 * Sizing each name independently makes a pair look accidental — "Ahmed" would be
 * set noticeably larger than "Fatima" purely because it has one fewer character.
 * The longest name decides the step, so the couple always reads as one
 * composition.
 */
export function displayTypeForSet(
  texts: Array<string | null | undefined>,
  scale: DisplayScale = "poster",
  lineHeight = "0.96",
): DisplayTypeStyle {
  const longest = texts.reduce<string>((carry, text) => {
    const candidate = (text ?? "").trim();
    return candidate.length > carry.length ? candidate : carry;
  }, "");

  return displayType(longest, scale, lineHeight);
}

/** True when a name is long enough that per-character motion would drag. */
export function isLongName(text: string | null | undefined): boolean {
  return (text ?? "").trim().length > 14;
}
