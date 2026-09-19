/**
 * Dawatnama — normalized wedding data contract.
 *
 * This is the ONLY shape that templates are allowed to read. Templates never talk
 * to the database, never read form state, and never receive template-specific
 * content. Anything a template needs must exist here for all templates.
 *
 *   Wedding Data -> Invitation Configuration -> Template Renderer -> Template
 */

export const TEMPLATE_IDS = [
  "royal-emerald",
  "ivory-rose",
  "midnight-crescent",
  "mughal-arch",
  "minimal-signature",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

/** Every section the public invitation can render, in canonical order. */
export const SECTION_IDS = [
  "bismillah",
  "message",
  "couple",
  "countdown",
  "events",
  "venue",
  "story",
  "dressCode",
  "gallery",
  "rsvp",
  "family",
  "verse",
  "closing",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export type InvitationStatus = "draft" | "published";

export type AnimationIntensity = "calm" | "balanced" | "cinematic";

export type GalleryStyle = "auto" | "stack" | "marquee" | "mosaic" | "filmstrip";

export interface ImageAsset {
  id: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  blurDataURL: string | null;
  caption: string | null;
}

export interface Venue {
  id: string;
  name: string;
  address: string | null;
  mapLink: string | null;
  latitude: number | null;
  longitude: number | null;
  image: ImageAsset | null;
  note: string | null;
}

export interface WeddingEvent {
  id: string;
  /** Free-form so any function is supported: Mehndi, Nikah, Dholki, Walima, ... */
  name: string;
  subtitle: string | null;
  description: string | null;
  /** ISO date (yyyy-mm-dd) or null when not decided yet. */
  date: string | null;
  /** 24h HH:mm or null. */
  startTime: string | null;
  endTime: string | null;
  venue: Venue | null;
  dressCode: string | null;
  image: ImageAsset | null;
  rsvpRequired: boolean;
  enabled: boolean;
  order: number;
}

export interface StoryMilestone {
  id: string;
  title: string;
  date: string | null;
  description: string | null;
  image: ImageAsset | null;
  order: number;
}

export type RsvpQuestionType = "text" | "longtext" | "select" | "boolean";

export interface RsvpQuestion {
  id: string;
  label: string;
  type: RsvpQuestionType;
  options: string[];
  required: boolean;
  order: number;
}

export interface RsvpConfig {
  enabled: boolean;
  /** ISO date (yyyy-mm-dd) or null for no deadline. */
  deadline: string | null;
  headline: string | null;
  message: string | null;
  confirmationMessage: string | null;
  askPhone: boolean;
  askGuestCount: boolean;
  maxGuests: number;
  askEventSelection: boolean;
  askMealPreference: boolean;
  mealOptions: string[];
  askMessage: boolean;
  customQuestions: RsvpQuestion[];
}

export interface MusicConfig {
  enabled: boolean;
  url: string | null;
  title: string | null;
  credit: string | null;
  loop: boolean;
}

/**
 * Optional Islamic content. Nothing here is forced into a template and all
 * wording is author-supplied; the platform only provides editable defaults.
 */
export interface IslamicContent {
  bismillahArabic: string | null;
  bismillahTransliteration: string | null;
  bismillahTranslation: string | null;
  verseArabic: string | null;
  verseTranslation: string | null;
  verseReference: string | null;
  duaText: string | null;
  nikahWording: string | null;
}

export interface CoupleParty {
  /** Display name exactly as the author typed it. */
  name: string;
  /** Optional shorter form used by templates that set names very large. */
  shortName: string | null;
  parents: string | null;
  description: string | null;
  photo: ImageAsset | null;
}

export type CoupleOrder = "bride-first" | "groom-first";

export interface Couple {
  bride: CoupleParty;
  groom: CoupleParty;
  order: CoupleOrder;
  shortDescription: string | null;
}

export interface DressCode {
  title: string | null;
  description: string | null;
  palette: string[];
}

export interface ContactPerson {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  whatsapp: string | null;
  order: number;
}

export interface Appearance {
  templateId: TemplateId;
  /** Optional accent override; templates that don't support it ignore it. */
  accent: string | null;
  backgroundVariant: "default" | "alt";
  typographyVariant: "default" | "alt";
  animationIntensity: AnimationIntensity;
  galleryStyle: GalleryStyle;
}

export interface SeoConfig {
  title: string | null;
  description: string | null;
  ogImageUrl: string | null;
}

export interface WeddingData {
  id: string;
  slug: string;
  status: InvitationStatus;

  couple: Couple;

  /** ISO date (yyyy-mm-dd) of the primary celebration, or null. */
  weddingDate: string | null;
  /** Optional time of the primary celebration, HH:mm. */
  weddingTime: string | null;
  hijriDate: string | null;

  invitationMessage: string | null;
  familyInvitationWording: string | null;
  familyNames: { bride: string | null; groom: string | null };
  gratitudeMessage: string | null;
  closingMessage: string | null;

  heroImage: ImageAsset | null;
  gallery: ImageAsset[];
  events: WeddingEvent[];
  story: StoryMilestone[];
  dressCode: DressCode | null;
  contacts: ContactPerson[];

  rsvp: RsvpConfig;
  music: MusicConfig;
  islamic: IslamicContent;

  /** Author intent per section. Availability also depends on real content. */
  sections: Record<SectionId, boolean>;
  appearance: Appearance;
  seo: SeoConfig;

  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* RSVP responses                                                      */
/* ------------------------------------------------------------------ */

export type RsvpAttendance = "attending" | "not-attending";

export interface RsvpResponse {
  id: string;
  invitationId: string;
  guestName: string;
  phone: string | null;
  attendance: RsvpAttendance;
  guestCount: number;
  eventIds: string[];
  mealPreference: string | null;
  message: string | null;
  answers: Record<string, string>;
  createdAt: string;
}

export interface RsvpSubmission {
  guestName: string;
  phone?: string | null;
  attendance: RsvpAttendance;
  guestCount?: number;
  eventIds?: string[];
  mealPreference?: string | null;
  message?: string | null;
  answers?: Record<string, string>;
}
