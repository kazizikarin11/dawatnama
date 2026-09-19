import { createId } from "@/lib/utils/id";
import {
  DEFAULT_APPEARANCE,
  DEFAULT_ISLAMIC,
  DEFAULT_MUSIC,
  DEFAULT_RSVP,
  DEFAULT_SECTIONS,
} from "./defaults";
import {
  SECTION_IDS,
  TEMPLATE_IDS,
  type Appearance,
  type ContactPerson,
  type Couple,
  type CoupleParty,
  type DressCode,
  type GalleryStyle,
  type ImageAsset,
  type IslamicContent,
  type MusicConfig,
  type RsvpConfig,
  type RsvpQuestion,
  type SectionId,
  type SeoConfig,
  type StoryMilestone,
  type TemplateId,
  type Venue,
  type WeddingData,
  type WeddingEvent,
} from "./types";

/**
 * Tolerant normalizer. Input can come from Supabase rows, JSON columns, local
 * storage, or a half-finished editor form. Whatever arrives, a complete and
 * renderable WeddingData comes out — templates never defend against nulls they
 * were not told about.
 */

type Unknown = Record<string, unknown>;

const asRecord = (value: unknown): Unknown =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Unknown)
    : {};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/** Trimmed string, or null when empty/absent. Never returns an empty string. */
export function text(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function intInRange(value: unknown, fallback: number, min: number, max: number) {
  const parsed = num(value);
  if (parsed === null) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function stringList(value: unknown): string[] {
  return asArray(value)
    .map((entry) => text(entry))
    .filter((entry): entry is string => entry !== null);
}

/** Accepts ISO datetimes and `yyyy-mm-dd`; returns `yyyy-mm-dd` or null. */
export function isoDate(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (dateOnly) {
    const parsed = new Date(`${dateOnly[0]}T00:00:00Z`);
    return Number.isNaN(parsed.getTime()) ? null : dateOnly[0];
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

/** Normalizes `9:5`, `09:05`, `9:05 PM` to `HH:mm`, else null. */
export function clockTime(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;

  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i.exec(raw);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toLowerCase();

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (minutes > 59) return null;

  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  if (hours > 23) return null;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function isoTimestamp(value: unknown): string {
  const raw = text(value);
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return new Date().toISOString();
}

/** Keeps only URLs safe to put in `src`/`href`. Blocks javascript: and friends. */
export function safeUrl(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  if (raw.startsWith("/") || raw.startsWith("data:image/")) return raw;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

export function normalizeImage(
  value: unknown,
  fallbackAlt = "Wedding photograph",
): ImageAsset | null {
  if (typeof value === "string") {
    const url = safeUrl(value);
    return url
      ? {
          id: createId("img"),
          url,
          alt: fallbackAlt,
          width: null,
          height: null,
          blurDataURL: null,
          caption: null,
        }
      : null;
  }

  const record = asRecord(value);
  const url = safeUrl(record.url ?? record.src ?? record.publicUrl);
  if (!url) return null;

  return {
    id: text(record.id) ?? createId("img"),
    url,
    alt: text(record.alt) ?? fallbackAlt,
    width: num(record.width),
    height: num(record.height),
    blurDataURL: text(record.blurDataURL) ?? text(record.blur_data_url),
    caption: text(record.caption),
  };
}

function normalizeGallery(value: unknown): ImageAsset[] {
  return asArray(value)
    .map((entry, index) => normalizeImage(entry, `Wedding photograph ${index + 1}`))
    .filter((entry): entry is ImageAsset => entry !== null);
}

export function normalizeVenue(value: unknown): Venue | null {
  const record = asRecord(value);
  const name = text(record.name);
  const address = text(record.address);
  const mapLink = safeUrl(record.mapLink ?? record.map_link);
  const image = normalizeImage(record.image, name ? `${name} venue` : "Venue");

  // A venue with no identifying information at all is not a venue.
  if (!name && !address && !mapLink && !image) return null;

  return {
    id: text(record.id) ?? createId("venue"),
    name: name ?? "Venue to be announced",
    address,
    mapLink,
    latitude: num(record.latitude ?? record.lat),
    longitude: num(record.longitude ?? record.lng),
    image,
    note: text(record.note),
  };
}

function normalizeEvent(value: unknown, index: number): WeddingEvent {
  const record = asRecord(value);
  const name = text(record.name) ?? text(record.title) ?? "Celebration";

  return {
    id: text(record.id) ?? createId("event"),
    name,
    subtitle: text(record.subtitle),
    description: text(record.description),
    date: isoDate(record.date),
    startTime: clockTime(record.startTime ?? record.start_time ?? record.time),
    endTime: clockTime(record.endTime ?? record.end_time),
    venue: normalizeVenue(record.venue),
    dressCode: text(record.dressCode ?? record.dress_code),
    image: normalizeImage(record.image, `${name} photograph`),
    rsvpRequired: bool(record.rsvpRequired ?? record.rsvp_required, false),
    enabled: bool(record.enabled, true),
    order: num(record.order) ?? index,
  };
}

function normalizeStory(value: unknown, index: number): StoryMilestone {
  const record = asRecord(value);
  const title = text(record.title) ?? "A moment";
  return {
    id: text(record.id) ?? createId("story"),
    title,
    date: text(record.date),
    description: text(record.description),
    image: normalizeImage(record.image, title),
    order: num(record.order) ?? index,
  };
}

function normalizeQuestion(value: unknown, index: number): RsvpQuestion | null {
  const record = asRecord(value);
  const label = text(record.label);
  if (!label) return null;

  const rawType = text(record.type);
  const type: RsvpQuestion["type"] =
    rawType === "longtext" || rawType === "select" || rawType === "boolean"
      ? rawType
      : "text";

  return {
    id: text(record.id) ?? createId("q"),
    label,
    type,
    options: type === "select" ? stringList(record.options) : [],
    required: bool(record.required, false),
    order: num(record.order) ?? index,
  };
}

function normalizeParty(value: unknown, role: "bride" | "groom"): CoupleParty {
  const record = asRecord(value);
  const name = text(record.name) ?? text(record.fullName) ?? "";
  return {
    name,
    shortName: text(record.shortName ?? record.short_name),
    parents: text(record.parents),
    description: text(record.description),
    photo: normalizeImage(record.photo, name || role),
  };
}

function normalizeCouple(value: unknown): Couple {
  const record = asRecord(value);
  const order = text(record.order) === "groom-first" ? "groom-first" : "bride-first";
  return {
    bride: normalizeParty(record.bride, "bride"),
    groom: normalizeParty(record.groom, "groom"),
    order,
    shortDescription: text(record.shortDescription ?? record.short_description),
  };
}

function normalizeRsvp(value: unknown): RsvpConfig {
  const record = asRecord(value);
  const askMealPreference = bool(record.askMealPreference, DEFAULT_RSVP.askMealPreference);
  const mealOptions = stringList(record.mealOptions);

  return {
    enabled: bool(record.enabled, DEFAULT_RSVP.enabled),
    deadline: isoDate(record.deadline),
    headline: text(record.headline) ?? DEFAULT_RSVP.headline,
    message: text(record.message) ?? DEFAULT_RSVP.message,
    confirmationMessage:
      text(record.confirmationMessage) ?? DEFAULT_RSVP.confirmationMessage,
    askPhone: bool(record.askPhone, DEFAULT_RSVP.askPhone),
    askGuestCount: bool(record.askGuestCount, DEFAULT_RSVP.askGuestCount),
    maxGuests: intInRange(record.maxGuests, DEFAULT_RSVP.maxGuests, 1, 50),
    askEventSelection: bool(record.askEventSelection, DEFAULT_RSVP.askEventSelection),
    // Asking for a meal preference without options would render an empty control.
    askMealPreference: askMealPreference && mealOptions.length > 0,
    mealOptions,
    askMessage: bool(record.askMessage, DEFAULT_RSVP.askMessage),
    customQuestions: asArray(record.customQuestions)
      .map(normalizeQuestion)
      .filter((entry): entry is RsvpQuestion => entry !== null)
      .sort((a, b) => a.order - b.order),
  };
}

function normalizeMusic(value: unknown): MusicConfig {
  const record = asRecord(value);
  const url = safeUrl(record.url);
  return {
    // Music cannot be "on" without a track to play.
    enabled: bool(record.enabled, DEFAULT_MUSIC.enabled) && url !== null,
    url,
    title: text(record.title),
    credit: text(record.credit),
    loop: bool(record.loop, true),
  };
}

function normalizeIslamic(value: unknown): IslamicContent {
  const record = asRecord(value);
  const pick = (key: keyof IslamicContent) =>
    key in record ? text(record[key]) : DEFAULT_ISLAMIC[key];

  return {
    bismillahArabic: pick("bismillahArabic"),
    bismillahTransliteration: pick("bismillahTransliteration"),
    bismillahTranslation: pick("bismillahTranslation"),
    verseArabic: pick("verseArabic"),
    verseTranslation: pick("verseTranslation"),
    verseReference: pick("verseReference"),
    duaText: pick("duaText"),
    nikahWording: pick("nikahWording"),
  };
}

function normalizeTemplateId(value: unknown): TemplateId {
  const raw = text(value);
  return TEMPLATE_IDS.includes(raw as TemplateId)
    ? (raw as TemplateId)
    : DEFAULT_APPEARANCE.templateId;
}

function normalizeAppearance(value: unknown): Appearance {
  const record = asRecord(value);
  const accent = text(record.accent);
  const galleryStyle = text(record.galleryStyle);
  const intensity = text(record.animationIntensity);

  const validGalleryStyles: GalleryStyle[] = [
    "auto",
    "stack",
    "marquee",
    "mosaic",
    "filmstrip",
  ];

  return {
    templateId: normalizeTemplateId(record.templateId ?? record.template_id),
    accent: accent && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(accent) ? accent : null,
    backgroundVariant: text(record.backgroundVariant) === "alt" ? "alt" : "default",
    typographyVariant: text(record.typographyVariant) === "alt" ? "alt" : "default",
    animationIntensity:
      intensity === "calm" || intensity === "cinematic" ? intensity : "balanced",
    galleryStyle: validGalleryStyles.includes(galleryStyle as GalleryStyle)
      ? (galleryStyle as GalleryStyle)
      : "auto",
  };
}

function normalizeSections(value: unknown): Record<SectionId, boolean> {
  const record = asRecord(value);
  const sections = {} as Record<SectionId, boolean>;
  for (const id of SECTION_IDS) {
    sections[id] = bool(record[id], DEFAULT_SECTIONS[id]);
  }
  return sections;
}

function normalizeSeo(value: unknown): SeoConfig {
  const record = asRecord(value);
  return {
    title: text(record.title),
    description: text(record.description),
    ogImageUrl: safeUrl(record.ogImageUrl ?? record.og_image_url),
  };
}

function normalizeContact(value: unknown, index: number): ContactPerson | null {
  const record = asRecord(value);
  const name = text(record.name);
  if (!name) return null;
  return {
    id: text(record.id) ?? createId("contact"),
    name,
    role: text(record.role),
    phone: text(record.phone),
    whatsapp: text(record.whatsapp),
    order: num(record.order) ?? index,
  };
}

function normalizeDressCode(value: unknown): DressCode | null {
  const record = asRecord(value);
  const title = text(record.title);
  const description = text(record.description);
  const palette = stringList(record.palette).filter((entry) =>
    /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(entry),
  );
  if (!title && !description && palette.length === 0) return null;
  return { title, description, palette };
}

export function normalizeWedding(input: unknown): WeddingData {
  const record = asRecord(input);
  const couple = normalizeCouple(record.couple);
  const familyNames = asRecord(record.familyNames ?? record.family_names);

  const events = asArray(record.events)
    .map(normalizeEvent)
    .sort((a, b) => a.order - b.order)
    .map((event, index) => ({ ...event, order: index }));

  return {
    id: text(record.id) ?? createId("inv"),
    slug: text(record.slug) ?? "",
    status: text(record.status) === "published" ? "published" : "draft",

    couple,

    weddingDate: isoDate(record.weddingDate ?? record.wedding_date),
    weddingTime: clockTime(record.weddingTime ?? record.wedding_time),
    hijriDate: text(record.hijriDate ?? record.hijri_date),

    invitationMessage: text(record.invitationMessage ?? record.invitation_message),
    familyInvitationWording: text(
      record.familyInvitationWording ?? record.family_invitation_wording,
    ),
    familyNames: {
      bride: text(familyNames.bride),
      groom: text(familyNames.groom),
    },
    gratitudeMessage: text(record.gratitudeMessage ?? record.gratitude_message),
    closingMessage: text(record.closingMessage ?? record.closing_message),

    heroImage: normalizeImage(
      record.heroImage ?? record.hero_image,
      [couple.bride.name, couple.groom.name].filter(Boolean).join(" and ") ||
        "Wedding hero photograph",
    ),
    gallery: normalizeGallery(record.gallery),
    events,
    story: asArray(record.story)
      .map(normalizeStory)
      .sort((a, b) => a.order - b.order),
    dressCode: normalizeDressCode(record.dressCode ?? record.dress_code),
    contacts: asArray(record.contacts)
      .map(normalizeContact)
      .filter((entry): entry is ContactPerson => entry !== null)
      .sort((a, b) => a.order - b.order),

    rsvp: normalizeRsvp(record.rsvp),
    music: normalizeMusic(record.music),
    islamic: normalizeIslamic(record.islamic),

    sections: normalizeSections(record.sections),
    appearance: normalizeAppearance(record.appearance),
    seo: normalizeSeo(record.seo),

    createdAt: isoTimestamp(record.createdAt ?? record.created_at),
    updatedAt: isoTimestamp(record.updatedAt ?? record.updated_at),
  };
}

export function createEmptyWedding(seed?: {
  brideName?: string;
  groomName?: string;
  slug?: string;
  templateId?: TemplateId;
}): WeddingData {
  return normalizeWedding({
    couple: {
      bride: { name: seed?.brideName ?? "" },
      groom: { name: seed?.groomName ?? "" },
    },
    slug: seed?.slug ?? "",
    appearance: { templateId: seed?.templateId ?? DEFAULT_APPEARANCE.templateId },
  });
}
