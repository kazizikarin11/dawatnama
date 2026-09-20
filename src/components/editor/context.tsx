"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createId } from "@/lib/utils/id";
import { normalizeWedding } from "@/lib/wedding/normalize";
import type {
  Appearance,
  ContactPerson,
  CoupleParty,
  ImageAsset,
  IslamicContent,
  MusicConfig,
  RsvpConfig,
  SectionId,
  SeoConfig,
  StoryMilestone,
  WeddingData,
  WeddingEvent,
} from "@/lib/wedding/types";

/**
 * Editor state.
 *
 * The draft is a plain WeddingData object, which is the same shape the templates
 * consume — so the preview is not an approximation of the invitation, it *is* the
 * invitation. Every edit is a pure patch, and normalization only runs at save
 * time so typing never fights the normalizer.
 */

interface EditorApi {
  draft: WeddingData;
  dirty: boolean;
  patch: (partial: Partial<WeddingData>) => void;
  /** Replaces the draft wholesale, e.g. after a successful save. */
  reset: (next: WeddingData) => void;
  markClean: () => void;

  setParty: (role: "bride" | "groom", partial: Partial<CoupleParty>) => void;
  setAppearance: (partial: Partial<Appearance>) => void;
  setIslamic: (partial: Partial<IslamicContent>) => void;
  setRsvp: (partial: Partial<RsvpConfig>) => void;
  setMusic: (partial: Partial<MusicConfig>) => void;
  setSeo: (partial: Partial<SeoConfig>) => void;
  toggleSection: (id: SectionId, value: boolean) => void;

  /** Optionally pre-named, so a common function can be added in one tap. */
  addEvent: (name?: string) => void;
  updateEvent: (id: string, partial: Partial<WeddingEvent>) => void;
  removeEvent: (id: string) => void;
  moveEvent: (id: string, direction: -1 | 1) => void;

  addImage: (image: ImageAsset) => void;
  updateImage: (id: string, partial: Partial<ImageAsset>) => void;
  removeImage: (id: string) => void;
  moveImage: (id: string, direction: -1 | 1) => void;
  setHeroImage: (image: ImageAsset | null) => void;

  addStory: () => void;
  updateStory: (id: string, partial: Partial<StoryMilestone>) => void;
  removeStory: (id: string) => void;

  addContact: () => void;
  updateContact: (id: string, partial: Partial<ContactPerson>) => void;
  removeContact: (id: string) => void;
}

const EditorContext = createContext<EditorApi | null>(null);

export function useEditor(): EditorApi {
  const context = useContext(EditorContext);
  if (!context) throw new Error("useEditor must be used inside an EditorProvider");
  return context;
}

function reorder<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (index < 0 || target < 0 || target >= items.length) return items;

  const next = [...items];
  const moved = next[index];
  const swapped = next[target];
  if (moved === undefined || swapped === undefined) return items;

  next[index] = swapped;
  next[target] = moved;
  return next;
}

export function EditorProvider({
  initial,
  children,
}: {
  initial: WeddingData;
  children: ReactNode;
}) {
  const [draft, setDraft] = useState<WeddingData>(initial);
  const [dirty, setDirty] = useState(false);

  const patch = useCallback((partial: Partial<WeddingData>) => {
    setDraft((current) => ({ ...current, ...partial }));
    setDirty(true);
  }, []);

  const reset = useCallback((next: WeddingData) => {
    setDraft(next);
    setDirty(false);
  }, []);

  const api = useMemo<EditorApi>(() => {
    const setEvents = (events: WeddingEvent[]) =>
      patch({ events: events.map((event, index) => ({ ...event, order: index })) });

    return {
      draft,
      dirty,
      patch,
      reset,
      markClean: () => setDirty(false),

      setParty: (role, partial) =>
        setDraft((current) => {
          setDirty(true);
          return {
            ...current,
            couple: {
              ...current.couple,
              [role]: { ...current.couple[role], ...partial },
            },
          };
        }),

      setAppearance: (partial) =>
        setDraft((current) => {
          setDirty(true);
          return { ...current, appearance: { ...current.appearance, ...partial } };
        }),

      setIslamic: (partial) =>
        setDraft((current) => {
          setDirty(true);
          return { ...current, islamic: { ...current.islamic, ...partial } };
        }),

      setRsvp: (partial) =>
        setDraft((current) => {
          setDirty(true);
          return { ...current, rsvp: { ...current.rsvp, ...partial } };
        }),

      setMusic: (partial) =>
        setDraft((current) => {
          setDirty(true);
          return { ...current, music: { ...current.music, ...partial } };
        }),

      setSeo: (partial) =>
        setDraft((current) => {
          setDirty(true);
          return { ...current, seo: { ...current.seo, ...partial } };
        }),

      toggleSection: (id, value) =>
        setDraft((current) => {
          setDirty(true);
          return { ...current, sections: { ...current.sections, [id]: value } };
        }),

      /* Events ----------------------------------------------------- */

      addEvent: (name) =>
        setEvents([
          ...draft.events,
          {
            id: createId("event"),
            // Guarded because this is also used directly as a click handler,
            // where the first argument would be the event object.
            name: typeof name === "string" && name.trim() ? name.trim() : "New event",
            subtitle: null,
            description: null,
            date: draft.weddingDate,
            startTime: null,
            endTime: null,
            venue: null,
            dressCode: null,
            image: null,
            rsvpRequired: false,
            enabled: true,
            order: draft.events.length,
          },
        ]),

      updateEvent: (id, partial) =>
        setEvents(
          draft.events.map((event) =>
            event.id === id ? { ...event, ...partial } : event,
          ),
        ),

      removeEvent: (id) => setEvents(draft.events.filter((event) => event.id !== id)),

      moveEvent: (id, direction) =>
        setEvents(
          reorder(
            draft.events,
            draft.events.findIndex((event) => event.id === id),
            direction,
          ),
        ),

      /* Gallery ---------------------------------------------------- */

      addImage: (image) => patch({ gallery: [...draft.gallery, image] }),

      updateImage: (id, partial) =>
        patch({
          gallery: draft.gallery.map((image) =>
            image.id === id ? { ...image, ...partial } : image,
          ),
        }),

      removeImage: (id) =>
        patch({ gallery: draft.gallery.filter((image) => image.id !== id) }),

      moveImage: (id, direction) =>
        patch({
          gallery: reorder(
            draft.gallery,
            draft.gallery.findIndex((image) => image.id === id),
            direction,
          ),
        }),

      setHeroImage: (image) => patch({ heroImage: image }),

      /* Story ------------------------------------------------------ */

      addStory: () =>
        patch({
          story: [
            ...draft.story,
            {
              id: createId("story"),
              title: "A moment we remember",
              date: null,
              description: null,
              image: null,
              order: draft.story.length,
            },
          ],
        }),

      updateStory: (id, partial) =>
        patch({
          story: draft.story.map((entry) =>
            entry.id === id ? { ...entry, ...partial } : entry,
          ),
        }),

      removeStory: (id) =>
        patch({ story: draft.story.filter((entry) => entry.id !== id) }),

      /* Contacts --------------------------------------------------- */

      addContact: () =>
        patch({
          contacts: [
            ...draft.contacts,
            {
              id: createId("contact"),
              name: "",
              role: null,
              phone: null,
              whatsapp: null,
              order: draft.contacts.length,
            },
          ],
        }),

      updateContact: (id, partial) =>
        patch({
          contacts: draft.contacts.map((entry) =>
            entry.id === id ? { ...entry, ...partial } : entry,
          ),
        }),

      removeContact: (id) =>
        patch({ contacts: draft.contacts.filter((entry) => entry.id !== id) }),
    };
  }, [draft, dirty, patch, reset]);

  return <EditorContext.Provider value={api}>{children}</EditorContext.Provider>;
}

/** The exact payload the save action expects. */
export function serializeDraft(draft: WeddingData): string {
  return JSON.stringify(normalizeWedding(draft));
}
