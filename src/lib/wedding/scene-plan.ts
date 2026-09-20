import type { SectionPlan } from "./sections";
import {
  effectiveDate,
  effectiveTime,
} from "./sections";
import { enabledEvents, eventsWithVenue } from "./sections";
import type { StoryMilestone, Venue, WeddingData, WeddingEvent } from "./types";

/**
 * The cinematic scene plan.
 *
 * The public invitation is a sequence of full-screen scenes rather than one long
 * page, and the sequence is derived entirely from the wedding data: three events
 * produce three event scenes, six produce six, a disabled gallery produces none.
 *
 * This lives beside the section plan — and above the templates — so all five
 * templates stage the same narrative while giving it their own motion language.
 * Templates read the plan; they never decide what exists.
 */

export type SceneKind =
  | "cover"
  | "invitation"
  | "verse"
  | "couple"
  | "party"
  | "countdown"
  | "events-intro"
  | "event"
  | "venue"
  | "story"
  | "gallery"
  | "rsvp-intro"
  | "rsvp-form"
  | "family"
  | "closing";

export interface SceneNode {
  /** Stable key, also used as the scene's DOM id. */
  id: string;
  kind: SceneKind;
  /** Two-character marker for the progress rail. */
  marker: string;
  /** Announced to assistive technology. */
  label: string;

  /** Payload, present only for the kinds that need it. */
  event?: WeddingEvent;
  venue?: Venue;
  milestone?: StoryMilestone;
  party?: "bride" | "groom";
  /** Index among scenes of the same kind, for staggered motion. */
  ordinal?: number;
}

/**
 * Distinct venues across the enabled events. A single hall used for three
 * functions earns one venue scene, not three.
 */
export function distinctVenues(data: WeddingData): Array<{ venue: Venue; events: WeddingEvent[] }> {
  const groups = new Map<string, { venue: Venue; events: WeddingEvent[] }>();

  for (const event of eventsWithVenue(data)) {
    if (!event.venue) continue;
    // Group by what a guest would recognise as "the same place".
    const key = `${event.venue.name.toLowerCase()}|${(event.venue.address ?? "").toLowerCase()}`;
    const existing = groups.get(key);
    if (existing) {
      existing.events.push(event);
    } else {
      groups.set(key, { venue: event.venue, events: [event] });
    }
  }

  return [...groups.values()];
}

export function buildScenePlan(data: WeddingData, sections: SectionPlan): SceneNode[] {
  const scenes: SceneNode[] = [];
  const push = (scene: Omit<SceneNode, "marker">) =>
    scenes.push({ ...scene, marker: String(scenes.length + 1).padStart(2, "0") });

  // 01 — always the cover.
  push({ id: "cover", kind: "cover", label: "Invitation cover" });

  if (sections.has("bismillah") || sections.has("message")) {
    push({ id: "invitation", kind: "invitation", label: "The invitation" });
  }

  if (sections.has("couple")) {
    const { bride, groom, order } = data.couple;
    const parties = order === "groom-first" ? (["groom", "bride"] as const) : (["bride", "groom"] as const);

    // When both have a portrait, each gets their own screen; otherwise they share one.
    const bothPortraits = Boolean(bride.photo && groom.photo);

    if (bothPortraits) {
      parties.forEach((party, index) => {
        push({
          id: `party-${party}`,
          kind: "party",
          label: party === "bride" ? "The bride" : "The groom",
          party,
          ordinal: index,
        });
      });
    } else {
      push({ id: "couple", kind: "couple", label: "The couple" });
    }
  }

  if (sections.has("countdown") && effectiveDate(data)) {
    push({ id: "countdown", kind: "countdown", label: "Countdown" });
  }

  const events = enabledEvents(data);
  if (sections.has("events") && events.length > 0) {
    push({ id: "events-intro", kind: "events-intro", label: "The celebration" });

    events.forEach((event, index) => {
      push({
        id: `event-${event.id}`,
        kind: "event",
        label: event.name,
        event,
        ordinal: index,
      });
    });
  }

  if (sections.has("venue")) {
    /**
     * Every event scene already names its venue and offers directions, so a
     * venue scene only earns its place when it can be a full-bleed photograph of
     * somewhere new. Two is the ceiling: beyond that the film starts to repeat
     * itself, and the address is never lost either way.
     */
    const photographed = distinctVenues(data).filter(({ venue }) => venue.image);

    photographed.slice(0, 2).forEach(({ venue }, index) => {
      push({
        id: `venue-${venue.id}`,
        kind: "venue",
        label: venue.name,
        venue,
        ordinal: index,
      });
    });
  }

  if (sections.has("story")) {
    data.story.forEach((milestone, index) => {
      push({
        id: `story-${milestone.id}`,
        kind: "story",
        label: milestone.title,
        milestone,
        ordinal: index,
      });
    });
  }

  if (sections.has("gallery") && data.gallery.length > 0) {
    push({ id: "gallery", kind: "gallery", label: "Photographs" });
  }

  if (sections.has("rsvp")) {
    // Split in two: the question deserves its own screen, and the form needs room.
    push({ id: "rsvp-intro", kind: "rsvp-intro", label: "Will you join us?" });
    push({ id: "rsvp-form", kind: "rsvp-form", label: "RSVP form" });
  }

  if (sections.has("family")) {
    push({ id: "family", kind: "family", label: "Our families" });
  }

  if (sections.has("verse")) {
    push({ id: "verse", kind: "verse", label: "A prayer" });
  }

  // The closing always lands last so the film has an ending.
  push({ id: "closing", kind: "closing", label: "With love" });

  return scenes;
}

/** Convenience for templates: the moment the countdown counts to. */
export function countdownTarget(data: WeddingData) {
  return { date: effectiveDate(data), time: effectiveTime(data) };
}
