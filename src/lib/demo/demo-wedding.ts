import { normalizeWedding } from "@/lib/wedding/normalize";
import type { TemplateId, WeddingData } from "@/lib/wedding/types";

/**
 * Demo content only — entirely fictional, used for template previews and visual
 * testing. Nothing in the application is designed around this couple; it passes
 * through the exact same normalizer as author-created invitations.
 */
export const DEMO_INVITATION_ID = "demo";
export const DEMO_SLUG = "ahmed-and-fatima";

const raw = {
  id: DEMO_INVITATION_ID,
  slug: DEMO_SLUG,
  status: "published",

  couple: {
    order: "bride-first",
    shortDescription:
      "Two families, one dua — joining together for a celebration of nikah, gratitude and new beginnings.",
    bride: {
      name: "Fatima Zahra Hasan",
      shortName: "Fatima",
      parents: "Daughter of Mr. & Mrs. Imran Hasan",
      description:
        "An architect from Lahore who collects old poetry, bakes on Fridays, and believes every home should hold a garden.",
      photo: { url: "/demo/portrait-bride.svg", alt: "Portrait of the bride" },
    },
    groom: {
      name: "Ahmed Bilal Khan",
      shortName: "Ahmed",
      parents: "Son of Mr. & Mrs. Sohail Khan",
      description:
        "A software engineer from Karachi who runs at dawn, keeps too many notebooks, and makes the better chai.",
      photo: { url: "/demo/portrait-groom.svg", alt: "Portrait of the groom" },
    },
  },

  weddingDate: "2026-12-12",
  weddingTime: "16:30",
  hijriDate: "Rajab 1448 AH",

  invitationMessage:
    "With hearts full of gratitude to Allah, and with the blessings of our families, we invite you to join us as we begin our life together. Your presence and your duas would make our joy complete.",
  familyInvitationWording:
    "Mr. & Mrs. Imran Hasan, together with Mr. & Mrs. Sohail Khan, request the honour of your presence.",
  familyNames: {
    bride: "The Hasan Family",
    groom: "The Khan Family",
  },
  gratitudeMessage:
    "To our parents, whose prayers carried us here — and to every guest who travelled near or far, thank you.",
  closingMessage:
    "We cannot wait to see you there, and to begin this chapter surrounded by the people we love most.",

  heroImage: {
    url: "/demo/hero-cover.svg",
    alt: "Soft evening light over a garden courtyard",
  },

  gallery: [
    { url: "/demo/gallery-01.svg", alt: "Golden hour portrait", caption: "Lahore, spring" },
    { url: "/demo/gallery-02.svg", alt: "Henna detail", caption: "Mehndi preparations" },
    { url: "/demo/gallery-03.svg", alt: "Courtyard arches", caption: "The courtyard" },
    { url: "/demo/gallery-04.svg", alt: "Evening lights", caption: "Evening of the dholki" },
    { url: "/demo/gallery-05.svg", alt: "Floral still life", caption: "Roses and motia" },
    { url: "/demo/gallery-06.svg", alt: "Two teacups", caption: "The first meeting" },
  ],

  events: [
    {
      name: "Dholki",
      subtitle: "An evening of drums and singing",
      description:
        "An intimate family night of dhol, old songs and far too much food. Come ready to clap along.",
      date: "2026-12-09",
      startTime: "20:00",
      endTime: "23:30",
      dressCode: "Casual eastern",
      rsvpRequired: false,
      venue: {
        name: "The Hasan Residence",
        address: "14-B Gulberg III, Lahore, Punjab",
        mapLink: "https://www.google.com/maps/search/?api=1&query=Gulberg+III+Lahore",
      },
      image: { url: "/demo/event-dholki.svg", alt: "Dholki evening artwork" },
    },
    {
      name: "Mehndi",
      subtitle: "Marigolds, henna and dance",
      description:
        "A courtyard filled with marigolds, henna for the bride, and a dance floor that will not stay empty.",
      date: "2026-12-10",
      startTime: "19:00",
      endTime: "00:00",
      dressCode: "Yellow, green and ivory",
      rsvpRequired: true,
      venue: {
        name: "Gulmohar Lawn",
        address: "Canal Bank Road, Block C, Lahore, Punjab",
        mapLink: "https://www.google.com/maps/search/?api=1&query=Canal+Bank+Road+Lahore",
        image: { url: "/demo/venue-lawn.svg", alt: "Gulmohar Lawn" },
      },
      image: { url: "/demo/event-mehndi.svg", alt: "Mehndi celebration artwork" },
    },
    {
      name: "Nikah",
      subtitle: "The marriage ceremony",
      description:
        "The nikah will be held after Asr prayer, followed by dinner. We request your presence a little early.",
      date: "2026-12-12",
      startTime: "16:30",
      endTime: "21:00",
      dressCode: "Formal, modest attire",
      rsvpRequired: true,
      venue: {
        name: "Noor Banquet Hall",
        address: "42 Shahjahan Avenue, Model Town, Lahore, Punjab",
        mapLink: "https://www.google.com/maps/search/?api=1&query=Model+Town+Lahore",
        note: "Parking available at the rear entrance.",
        image: { url: "/demo/venue-hall.svg", alt: "Noor Banquet Hall" },
      },
      image: { url: "/demo/event-nikah.svg", alt: "Nikah ceremony artwork" },
    },
    {
      name: "Walima",
      subtitle: "The wedding reception",
      description:
        "A reception hosted by the Khan family, with dinner served at eight.",
      date: "2026-12-13",
      startTime: "19:30",
      endTime: "23:00",
      dressCode: "Formal",
      rsvpRequired: true,
      venue: {
        name: "Serena Grand Ballroom",
        address: "Mall Road, Lahore, Punjab",
        mapLink: "https://www.google.com/maps/search/?api=1&query=Mall+Road+Lahore",
        image: { url: "/demo/venue-ballroom.svg", alt: "Serena Grand Ballroom" },
      },
      image: { url: "/demo/event-walima.svg", alt: "Walima reception artwork" },
    },
  ],

  story: [
    {
      title: "A borrowed umbrella",
      date: "June 2022",
      description:
        "They met during a monsoon downpour outside a bookshop. One umbrella, two strangers, and a long conversation about architecture.",
      image: { url: "/demo/story-01.svg", alt: "Rain on a window" },
    },
    {
      title: "Two families, one table",
      date: "March 2024",
      description:
        "Their families met over a long lunch that turned into dinner. Nobody wanted the evening to end.",
      image: { url: "/demo/story-02.svg", alt: "A long dining table" },
    },
    {
      title: "The proposal, made properly",
      date: "January 2026",
      description:
        "With both families present and duas made, the rishta was accepted — and the date was set.",
      image: { url: "/demo/story-03.svg", alt: "A ring box" },
    },
  ],

  dressCode: {
    title: "A note on attire",
    description:
      "Modest formal dress, eastern or western. Evening events are outdoors, so do bring a shawl.",
    palette: ["#0F3D32", "#C9A227", "#F5EFE3", "#B76E79"],
  },

  contacts: [
    {
      name: "Hamza Hasan",
      role: "Bride's brother",
      phone: "+92 300 0000000",
      whatsapp: "+92 300 0000000",
    },
    {
      name: "Zainab Khan",
      role: "Groom's sister",
      phone: "+92 321 0000000",
      whatsapp: "+92 321 0000000",
    },
  ],

  rsvp: {
    enabled: true,
    deadline: "2026-11-25",
    headline: "Will you join us?",
    message:
      "Kindly respond before 25 November 2026 so we can arrange seating for everyone comfortably.",
    askPhone: true,
    askGuestCount: true,
    maxGuests: 6,
    askEventSelection: true,
    askMealPreference: true,
    mealOptions: ["No preference", "Vegetarian", "No spice", "Allergy — I'll explain below"],
    askMessage: true,
    customQuestions: [
      {
        label: "Will you need transport from the city centre?",
        type: "boolean",
        required: false,
      },
      {
        label: "Which city are you travelling from?",
        type: "text",
        required: false,
      },
    ],
  },

  music: {
    enabled: false,
    url: null,
    title: null,
    credit: null,
  },

  sections: {
    bismillah: true,
    message: true,
    couple: true,
    countdown: true,
    events: true,
    venue: true,
    story: true,
    dressCode: true,
    gallery: true,
    rsvp: true,
    family: true,
    verse: true,
    closing: true,
  },

  appearance: {
    templateId: "royal-emerald",
    animationIntensity: "balanced",
    galleryStyle: "auto",
  },

  seo: {
    title: null,
    description: null,
    ogImageUrl: null,
  },

  createdAt: "2026-01-04T10:00:00.000Z",
  updatedAt: "2026-01-04T10:00:00.000Z",
};

/** A fresh normalized copy each call, so callers can mutate safely. */
export function demoWedding(templateId?: TemplateId): WeddingData {
  const data = normalizeWedding(raw);
  if (!templateId) return data;
  return { ...data, appearance: { ...data.appearance, templateId } };
}
