import type {
  Appearance,
  IslamicContent,
  MusicConfig,
  RsvpConfig,
  SectionId,
  WeddingData,
} from "./types";
import { SECTION_IDS } from "./types";

/**
 * Editable default wording. These are neutral, widely-used texts offered as a
 * starting point — the author can replace every one of them. No personal or
 * family-specific religious detail is ever invented by the platform.
 */
export const DEFAULT_ISLAMIC: IslamicContent = {
  bismillahArabic: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
  bismillahTransliteration: "Bismillāhir-Raḥmānir-Raḥīm",
  bismillahTranslation:
    "In the name of Allah, the Most Gracious, the Most Merciful.",
  verseArabic:
    "وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوٓا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً",
  verseTranslation:
    "And among His signs is that He created for you spouses from among yourselves, that you may find tranquillity in them; and He has placed between you affection and mercy.",
  verseReference: "Surah Ar-Rum 30:21",
  duaText:
    "Bārakallāhu lakumā wa bāraka ʿalaykumā wa jamaʿa baynakumā fī khayr.",
  nikahWording: null,
};

export const DEFAULT_RSVP: RsvpConfig = {
  enabled: true,
  deadline: null,
  headline: "Will you join us?",
  message:
    "Your presence would mean the world to us. Kindly let us know before the date below.",
  confirmationMessage:
    "JazakAllahu khayran. Your response has been recorded — we cannot wait to celebrate with you.",
  askPhone: true,
  askGuestCount: true,
  maxGuests: 6,
  askEventSelection: true,
  askMealPreference: false,
  mealOptions: [],
  askMessage: true,
  customQuestions: [],
};

export const DEFAULT_MUSIC: MusicConfig = {
  enabled: false,
  url: null,
  title: null,
  credit: null,
  loop: true,
};

export const DEFAULT_APPEARANCE: Appearance = {
  templateId: "royal-emerald",
  accent: null,
  backgroundVariant: "default",
  typographyVariant: "default",
  animationIntensity: "balanced",
  galleryStyle: "auto",
};

/** Sections an author gets on a brand-new invitation. */
export const DEFAULT_SECTIONS: Record<SectionId, boolean> = {
  bismillah: true,
  message: true,
  couple: true,
  countdown: true,
  events: true,
  venue: true,
  story: false,
  dressCode: false,
  gallery: true,
  rsvp: true,
  family: true,
  verse: true,
  closing: true,
};

export const SECTION_LABELS: Record<SectionId, string> = {
  bismillah: "Bismillah",
  message: "Invitation message",
  couple: "Couple introduction",
  countdown: "Countdown",
  events: "Events",
  venue: "Venue & directions",
  story: "Our story",
  dressCode: "Dress code",
  gallery: "Gallery",
  rsvp: "RSVP",
  family: "Family & gratitude",
  verse: "Qur'anic verse or dua",
  closing: "Closing",
};

export const SECTION_ORDER: readonly SectionId[] = SECTION_IDS;

export const DEFAULT_INVITATION_MESSAGE =
  "With hearts full of gratitude to Allah, we invite you to share in the joy of our nikah as two families become one.";

export const DEFAULT_FAMILY_WORDING =
  "Together with their families, who request the honour of your presence.";

export const DEFAULT_GRATITUDE =
  "Thank you for your duas, your kindness, and for being part of our story.";

export const DEFAULT_CLOSING = "We look forward to celebrating with you.";

export type WeddingDataDraft = Partial<WeddingData>;
