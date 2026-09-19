import { SECTION_ORDER } from "./defaults";
import type { SectionId, WeddingData, WeddingEvent } from "./types";

/**
 * A section renders only when the author enabled it AND real content exists.
 * This lives here once so that all five templates stay free of emptiness checks
 * and none of them can leave an awkward gap behind a disabled section.
 */

export function enabledEvents(data: WeddingData): WeddingEvent[] {
  return data.events.filter((event) => event.enabled);
}

export function eventsWithVenue(data: WeddingData): WeddingEvent[] {
  return enabledEvents(data).filter((event) => event.venue !== null);
}

export function rsvpEvents(data: WeddingData): WeddingEvent[] {
  const events = enabledEvents(data);
  const required = events.filter((event) => event.rsvpRequired);
  return required.length > 0 ? required : events;
}

/** The event the countdown and hero date refer to. */
export function primaryEvent(data: WeddingData): WeddingEvent | null {
  const events = enabledEvents(data).filter((event) => event.date !== null);
  if (events.length === 0) return null;

  const nikah = events.find((event) => /nikah|nikkah|akad/i.test(event.name));
  if (nikah) return nikah;

  const sorted = [...events].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  return sorted[0] ?? null;
}

/** Wedding date if set, otherwise inferred from the primary event. */
export function effectiveDate(data: WeddingData): string | null {
  return data.weddingDate ?? primaryEvent(data)?.date ?? null;
}

export function effectiveTime(data: WeddingData): string | null {
  return data.weddingTime ?? primaryEvent(data)?.startTime ?? null;
}

function hasContent(data: WeddingData, id: SectionId): boolean {
  const { couple, islamic } = data;

  switch (id) {
    case "bismillah":
      return Boolean(
        islamic.bismillahArabic ||
          islamic.bismillahTransliteration ||
          islamic.bismillahTranslation,
      );
    case "message":
      return Boolean(data.invitationMessage || data.familyInvitationWording);
    case "couple":
      return Boolean(
        couple.shortDescription ||
          couple.bride.description ||
          couple.groom.description ||
          couple.bride.photo ||
          couple.groom.photo ||
          couple.bride.parents ||
          couple.groom.parents,
      );
    case "countdown":
      return effectiveDate(data) !== null;
    case "events":
      return enabledEvents(data).length > 0;
    case "venue":
      return eventsWithVenue(data).length > 0;
    case "story":
      return data.story.length > 0;
    case "dressCode":
      return Boolean(
        data.dressCode &&
          (data.dressCode.title ||
            data.dressCode.description ||
            data.dressCode.palette.length > 0),
      );
    case "gallery":
      return data.gallery.length > 0;
    case "rsvp":
      return data.rsvp.enabled;
    case "family":
      return Boolean(
        data.familyNames.bride ||
          data.familyNames.groom ||
          data.gratitudeMessage ||
          data.contacts.length > 0,
      );
    case "verse":
      return Boolean(islamic.verseArabic || islamic.verseTranslation || islamic.duaText);
    case "closing":
      return Boolean(
        data.closingMessage || couple.bride.name || couple.groom.name,
      );
    default:
      return false;
  }
}

export interface SectionPlan {
  /** Ordered, renderable sections. */
  readonly order: readonly SectionId[];
  has: (id: SectionId) => boolean;
  /** Index within the rendered flow, useful for alternating layouts. */
  indexOf: (id: SectionId) => number;
}

export function resolveSections(data: WeddingData): SectionPlan {
  const order = SECTION_ORDER.filter(
    (id) => data.sections[id] && hasContent(data, id),
  );
  const set = new Set(order);

  return {
    order,
    has: (id) => set.has(id),
    indexOf: (id) => order.indexOf(id),
  };
}

/** Reasons an author may want to fix before publishing. */
export function invitationWarnings(data: WeddingData): string[] {
  const warnings: string[] = [];
  if (!data.couple.bride.name || !data.couple.groom.name)
    warnings.push("Add both the bride's and groom's names.");
  if (!data.slug) warnings.push("Choose a public link for the invitation.");
  if (effectiveDate(data) === null)
    warnings.push("Add a wedding date so the countdown can appear.");
  if (enabledEvents(data).length === 0)
    warnings.push("Add at least one event, such as the Nikah.");
  if (eventsWithVenue(data).length === 0)
    warnings.push("Add a venue to at least one event.");
  if (!data.heroImage)
    warnings.push("Add a cover image for a richer opening and social preview.");
  return warnings;
}
