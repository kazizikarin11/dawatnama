import type { Venue, WeddingData, WeddingEvent } from "./types";

/**
 * Formatting is done manually against UTC rather than through
 * `toLocaleDateString`, so the server and the client always produce the exact
 * same string and hydration never mismatches.
 */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function parts(iso: string | null) {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return null;
  return { year, month, day, weekday: date.getUTCDay(), date };
}

export function isValidDate(iso: string | null): boolean {
  return parts(iso) !== null;
}

/** `12 December 2026` */
export function formatLongDate(iso: string | null): string | null {
  const p = parts(iso);
  if (!p) return null;
  return `${p.day} ${MONTHS[p.month - 1]} ${p.year}`;
}

/** `Saturday` */
export function formatWeekday(iso: string | null): string | null {
  const p = parts(iso);
  return p ? (DAYS[p.weekday] ?? null) : null;
}

/** `12.12.2026` — used by the minimal template. */
export function formatNumericDate(iso: string | null, separator = "."): string | null {
  const p = parts(iso);
  if (!p) return null;
  return [
    String(p.day).padStart(2, "0"),
    String(p.month).padStart(2, "0"),
    String(p.year),
  ].join(separator);
}

export function formatDateParts(iso: string | null) {
  const p = parts(iso);
  if (!p) return null;
  return {
    day: String(p.day).padStart(2, "0"),
    monthName: MONTHS[p.month - 1] as string,
    monthShort: (MONTHS[p.month - 1] as string).slice(0, 3),
    year: String(p.year),
    weekday: DAYS[p.weekday] as string,
  };
}

/** `4:30 PM` */
export function formatTime(time: string | null): string | null {
  if (!time) return null;
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = match[2];
  const meridiem = hours >= 12 ? "PM" : "AM";
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return `${display}:${minutes} ${meridiem}`;
}

/** `4:30 PM – 9:00 PM`, or just the start time when there is no end. */
export function formatTimeRange(
  start: string | null,
  end: string | null,
): string | null {
  const from = formatTime(start);
  const to = formatTime(end);
  if (from && to) return `${from} – ${to}`;
  return from ?? null;
}

/** UTC timestamp for countdowns; noon avoids timezone edge cases. */
export function toTimestamp(iso: string | null, time: string | null): number | null {
  const p = parts(iso);
  if (!p) return null;
  const match = time ? /^(\d{2}):(\d{2})$/.exec(time) : null;
  const hours = match ? Number(match[1]) : 12;
  const minutes = match ? Number(match[2]) : 0;
  return Date.UTC(p.year, p.month - 1, p.day, hours, minutes);
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  isToday: boolean;
}

export function countdownFrom(target: number, now: number): CountdownParts {
  const diff = target - now;
  if (diff <= 0) {
    const hoursSince = Math.abs(diff) / 3_600_000;
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: true,
      isToday: hoursSince <= 24,
    };
  }

  const seconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(seconds / 86_400),
    hours: Math.floor((seconds % 86_400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
    isPast: false,
    isToday: seconds < 86_400,
  };
}

/* ------------------------------------------------------------------ */
/* Names                                                               */
/* ------------------------------------------------------------------ */

export interface CoupleNames {
  first: string;
  second: string;
  firstShort: string;
  secondShort: string;
  /** `Fatima & Ahmed`, or a single name, or a safe fallback. */
  combined: string;
  brideFirst: boolean;
}

export function coupleNames(data: WeddingData): CoupleNames {
  const { bride, groom, order } = data.couple;
  const brideFirst = order !== "groom-first";

  const primary = brideFirst ? bride : groom;
  const secondary = brideFirst ? groom : bride;

  const first = primary.name.trim();
  const second = secondary.name.trim();

  const firstShort = (primary.shortName ?? firstWord(first)).trim();
  const secondShort = (secondary.shortName ?? firstWord(second)).trim();

  const combined =
    firstShort && secondShort
      ? `${firstShort} & ${secondShort}`
      : firstShort || secondShort || "Our Wedding";

  return { first, second, firstShort, secondShort, combined, brideFirst };
}

function firstWord(value: string): string {
  return value.split(/\s+/)[0] ?? "";
}

/** Splits a name into letters for letter-by-letter reveals. */
export function letters(value: string): string[] {
  return Array.from(value);
}

/* ------------------------------------------------------------------ */
/* Venue                                                               */
/* ------------------------------------------------------------------ */

/**
 * Directions link. Uses the author's own map link when present, otherwise
 * builds a plain Google Maps search URL — no paid Maps API required.
 */
export function directionsUrl(venue: Venue | null): string | null {
  if (!venue) return null;
  if (venue.mapLink) return venue.mapLink;

  if (venue.latitude !== null && venue.longitude !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`;
  }

  const query = [venue.name, venue.address].filter(Boolean).join(", ");
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** `Saturday, 12 December 2026 · 4:30 PM` for an event. */
export function eventWhen(event: WeddingEvent): string | null {
  const date = formatLongDate(event.date);
  const weekday = formatWeekday(event.date);
  const time = formatTimeRange(event.startTime, event.endTime);

  const datePart = date ? [weekday, date].filter(Boolean).join(", ") : null;
  return [datePart, time].filter(Boolean).join(" · ") || null;
}
