import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeWedding } from "@/lib/wedding/normalize";
import type {
  ImageAsset,
  RsvpResponse,
  RsvpSubmission,
  WeddingData,
  WeddingEvent,
} from "@/lib/wedding/types";
import {
  summarize,
  type InvitationRepository,
  type InvitationSummary,
} from "./types";

/**
 * Supabase-backed repository.
 *
 * Reads are a single request using nested selects. Writes fan out to the child
 * tables and then prune rows the author removed in the editor, so the database
 * always mirrors the normalized object the editor is holding.
 */

const SELECT = `
  id, slug, status, template_id, wedding_date, wedding_time, hijri_date,
  invitation_message, family_invitation_wording, family_bride_names,
  family_groom_names, gratitude_message, closing_message,
  dress_code, islamic, seo, archived_at, created_at, updated_at,
  couples (*),
  venues (*),
  events (*),
  gallery_images (*),
  story_milestones (*),
  contacts (*),
  music (*),
  invitation_settings (*),
  rsvp_settings (*),
  rsvp_questions (*)
`;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: string | null | undefined): value is string =>
  typeof value === "string" && UUID_RE.test(value);

type Row = Record<string, unknown>;

/** Supabase returns embedded 1:1 rows as an object, or an array in some shapes. */
function one(value: unknown): Row {
  if (Array.isArray(value)) return (value[0] as Row) ?? {};
  return (value as Row) ?? {};
}

function many(value: unknown): Row[] {
  return Array.isArray(value) ? (value as Row[]) : [];
}

function imageRowToAsset(row: Row): ImageAsset | null {
  const url = row.url;
  if (typeof url !== "string" || url.length === 0) return null;
  return {
    id: String(row.id ?? ""),
    url,
    alt: typeof row.alt === "string" ? row.alt : "",
    width: typeof row.width === "number" ? row.width : null,
    height: typeof row.height === "number" ? row.height : null,
    blurDataURL:
      typeof row.blur_data_url === "string" ? row.blur_data_url : null,
    caption: typeof row.caption === "string" ? row.caption : null,
  };
}

/* ------------------------------------------------------------------ */
/* Row -> WeddingData                                                  */
/* ------------------------------------------------------------------ */

function rowToWedding(row: Row): WeddingData {
  const couple = one(row.couples);
  const settings = one(row.invitation_settings);
  const rsvp = one(row.rsvp_settings);
  const music = one(row.music);

  const venues = new Map(
    many(row.venues).map((venue) => [String(venue.id), venue]),
  );

  const images = many(row.gallery_images).sort(
    (a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0),
  );

  const hero = images.find((image) => image.is_hero === true);

  return normalizeWedding({
    id: row.id,
    slug: row.slug,
    status: row.status,

    couple: {
      order: couple.name_order,
      shortDescription: couple.short_description,
      bride: {
        name: couple.bride_name,
        shortName: couple.bride_short_name,
        parents: couple.bride_parents,
        description: couple.bride_description,
        photo: couple.bride_photo,
      },
      groom: {
        name: couple.groom_name,
        shortName: couple.groom_short_name,
        parents: couple.groom_parents,
        description: couple.groom_description,
        photo: couple.groom_photo,
      },
    },

    weddingDate: row.wedding_date,
    weddingTime: row.wedding_time,
    hijriDate: row.hijri_date,

    invitationMessage: row.invitation_message,
    familyInvitationWording: row.family_invitation_wording,
    familyNames: {
      bride: row.family_bride_names,
      groom: row.family_groom_names,
    },
    gratitudeMessage: row.gratitude_message,
    closingMessage: row.closing_message,

    heroImage: hero ? imageRowToAsset(hero) : null,
    gallery: images
      .filter((image) => image.in_gallery !== false)
      .map(imageRowToAsset)
      .filter(Boolean),

    events: many(row.events)
      .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
      .map((event) => {
        const venue = event.venue_id ? venues.get(String(event.venue_id)) : undefined;
        return {
          id: event.id,
          name: event.name,
          subtitle: event.subtitle,
          description: event.description,
          date: event.event_date,
          startTime: event.start_time,
          endTime: event.end_time,
          dressCode: event.dress_code,
          image: event.image,
          rsvpRequired: event.rsvp_required,
          enabled: event.enabled,
          order: event.sort_order,
          venue: venue
            ? {
                id: venue.id,
                name: venue.name,
                address: venue.address,
                mapLink: venue.map_link,
                latitude: venue.latitude,
                longitude: venue.longitude,
                image: venue.image,
                note: venue.note,
              }
            : null,
        };
      }),

    story: many(row.story_milestones)
      .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
      .map((entry) => ({
        id: entry.id,
        title: entry.title,
        date: entry.milestone_date,
        description: entry.description,
        image: entry.image,
        order: entry.sort_order,
      })),

    contacts: many(row.contacts)
      .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        role: entry.role,
        phone: entry.phone,
        whatsapp: entry.whatsapp,
        order: entry.sort_order,
      })),

    dressCode: row.dress_code,
    islamic: row.islamic,
    seo: row.seo,

    rsvp: {
      enabled: rsvp.enabled,
      deadline: rsvp.deadline,
      headline: rsvp.headline,
      message: rsvp.message,
      confirmationMessage: rsvp.confirmation_message,
      askPhone: rsvp.ask_phone,
      askGuestCount: rsvp.ask_guest_count,
      maxGuests: rsvp.max_guests,
      askEventSelection: rsvp.ask_event_selection,
      askMealPreference: rsvp.ask_meal_preference,
      mealOptions: rsvp.meal_options,
      askMessage: rsvp.ask_message,
      customQuestions: many(row.rsvp_questions)
        .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
        .map((question) => ({
          id: question.id,
          label: question.label,
          type: question.question_type,
          options: question.options,
          required: question.required,
          order: question.sort_order,
        })),
    },

    music: {
      enabled: music.enabled,
      url: music.url,
      title: music.title,
      credit: music.credit,
      loop: music.loop_track,
    },

    appearance: {
      templateId: row.template_id,
      accent: settings.accent,
      backgroundVariant: settings.background_variant,
      typographyVariant: settings.typography_variant,
      animationIntensity: settings.animation_intensity,
      galleryStyle: settings.gallery_style,
    },

    sections: settings.sections,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function responseRowToResponse(row: Row): RsvpResponse {
  return {
    id: String(row.id),
    invitationId: String(row.invitation_id),
    guestName: String(row.guest_name ?? ""),
    phone: typeof row.phone === "string" ? row.phone : null,
    attendance: row.attendance === "not-attending" ? "not-attending" : "attending",
    guestCount: typeof row.guest_count === "number" ? row.guest_count : 1,
    eventIds: Array.isArray(row.event_ids) ? row.event_ids.map(String) : [],
    mealPreference:
      typeof row.meal_preference === "string" ? row.meal_preference : null,
    message: typeof row.message === "string" ? row.message : null,
    answers:
      row.answers && typeof row.answers === "object"
        ? (row.answers as Record<string, string>)
        : {},
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

/* ------------------------------------------------------------------ */
/* Repository                                                          */
/* ------------------------------------------------------------------ */

export class SupabaseRepository implements InvitationRepository {
  readonly kind = "supabase" as const;

  constructor(private readonly client: SupabaseClient) {}

  async listByOwner(ownerId: string): Promise<InvitationSummary[]> {
    const { data, error } = await this.client
      .from("invitations")
      .select(SELECT)
      .eq("owner_id", ownerId)
      .is("archived_at", null)
      .order("updated_at", { ascending: false });

    if (error || !data) return [];

    const ids = data.map((row) => String((row as Row).id));
    const { data: responses } = await this.client
      .from("rsvp_responses")
      .select("id, invitation_id, guest_name, attendance, guest_count, created_at")
      .in("invitation_id", ids.length > 0 ? ids : ["00000000-0000-0000-0000-000000000000"]);

    const grouped = new Map<string, RsvpResponse[]>();
    for (const row of responses ?? []) {
      const response = responseRowToResponse(row as Row);
      const bucket = grouped.get(response.invitationId) ?? [];
      bucket.push(response);
      grouped.set(response.invitationId, bucket);
    }

    return data.map((row) => {
      const wedding = rowToWedding(row as Row);
      return summarize(wedding, grouped.get(wedding.id) ?? []);
    });
  }

  async getById(id: string, ownerId: string): Promise<WeddingData | null> {
    const { data, error } = await this.client
      .from("invitations")
      .select(SELECT)
      .eq("id", id)
      .eq("owner_id", ownerId)
      .is("archived_at", null)
      .maybeSingle();

    if (error || !data) return null;
    return rowToWedding(data as Row);
  }

  async getBySlug(slug: string, allowDraft = false): Promise<WeddingData | null> {
    let query = this.client
      .from("invitations")
      .select(SELECT)
      .eq("slug", slug)
      .is("archived_at", null);

    if (!allowDraft) query = query.eq("status", "published");

    const { data, error } = await query.maybeSingle();
    if (error || !data) return null;
    return rowToWedding(data as Row);
  }

  async create(ownerId: string, data: WeddingData): Promise<WeddingData> {
    const { data: inserted, error } = await this.client
      .from("invitations")
      .insert({ owner_id: ownerId, ...invitationColumns(data) })
      .select("id")
      .single();

    if (error || !inserted) {
      throw new Error(error?.message ?? "Could not create the invitation.");
    }

    const id = String((inserted as Row).id);
    await this.writeChildren(id, data);
    const saved = await this.getById(id, ownerId);
    if (!saved) throw new Error("The invitation was created but could not be read back.");
    return saved;
  }

  async update(ownerId: string, data: WeddingData): Promise<WeddingData> {
    const { error } = await this.client
      .from("invitations")
      .update(invitationColumns(data))
      .eq("id", data.id)
      .eq("owner_id", ownerId);

    if (error) throw new Error(error.message);

    await this.writeChildren(data.id, data);
    const saved = await this.getById(data.id, ownerId);
    if (!saved) throw new Error("The invitation could not be read back after saving.");
    return saved;
  }

  async duplicate(ownerId: string, id: string): Promise<WeddingData | null> {
    const source = await this.getById(id, ownerId);
    if (!source) return null;

    const base = source.slug || "invitation";
    let slug = `${base}-copy`;
    let counter = 2;
    while (!(await this.isSlugAvailable(slug))) {
      slug = `${base}-copy-${counter}`;
      counter += 1;
      if (counter > 50) break;
    }

    // Strip child ids so the database mints fresh ones for the copy.
    return this.create(ownerId, {
      ...source,
      id: "",
      slug,
      status: "draft",
      events: source.events.map((event) => stripEventIds(event)),
      gallery: source.gallery.map((image) => ({ ...image, id: "" })),
      story: source.story.map((entry) => ({ ...entry, id: "" })),
      contacts: source.contacts.map((entry) => ({ ...entry, id: "" })),
      rsvp: {
        ...source.rsvp,
        customQuestions: source.rsvp.customQuestions.map((question) => ({
          ...question,
          id: "",
        })),
      },
    });
  }

  async archive(ownerId: string, id: string): Promise<void> {
    await this.client
      .from("invitations")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id)
      .eq("owner_id", ownerId);
  }

  async isSlugAvailable(slug: string, exceptId?: string): Promise<boolean> {
    let query = this.client
      .from("invitations")
      .select("id")
      .eq("slug", slug)
      .is("archived_at", null);

    if (exceptId && isUuid(exceptId)) query = query.neq("id", exceptId);

    const { data } = await query.limit(1);
    return (data ?? []).length === 0;
  }

  async listResponses(invitationId: string): Promise<RsvpResponse[]> {
    const { data } = await this.client
      .from("rsvp_responses")
      .select("*")
      .eq("invitation_id", invitationId)
      .order("created_at", { ascending: false });

    return (data ?? []).map((row) => responseRowToResponse(row as Row));
  }

  async submitResponse(
    invitationId: string,
    submission: RsvpSubmission,
  ): Promise<RsvpResponse> {
    const { data, error } = await this.client
      .from("rsvp_responses")
      .insert({
        invitation_id: invitationId,
        guest_name: submission.guestName,
        phone: submission.phone ?? null,
        attendance: submission.attendance,
        guest_count: submission.guestCount ?? 1,
        event_ids: (submission.eventIds ?? []).filter(isUuid),
        meal_preference: submission.mealPreference ?? null,
        message: submission.message ?? null,
        answers: submission.answers ?? {},
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Your response could not be saved.");
    }
    return responseRowToResponse(data as Row);
  }

  /* ---------------------------------------------------------------- */
  /* Child writes                                                     */
  /* ---------------------------------------------------------------- */

  private async writeChildren(invitationId: string, data: WeddingData) {
    await this.client.from("couples").upsert({
      invitation_id: invitationId,
      name_order: data.couple.order,
      short_description: data.couple.shortDescription,
      bride_name: data.couple.bride.name,
      bride_short_name: data.couple.bride.shortName,
      bride_parents: data.couple.bride.parents,
      bride_description: data.couple.bride.description,
      bride_photo: data.couple.bride.photo,
      groom_name: data.couple.groom.name,
      groom_short_name: data.couple.groom.shortName,
      groom_parents: data.couple.groom.parents,
      groom_description: data.couple.groom.description,
      groom_photo: data.couple.groom.photo,
    });

    await this.client.from("invitation_settings").upsert({
      invitation_id: invitationId,
      accent: data.appearance.accent,
      background_variant: data.appearance.backgroundVariant,
      typography_variant: data.appearance.typographyVariant,
      animation_intensity: data.appearance.animationIntensity,
      gallery_style: data.appearance.galleryStyle,
      sections: data.sections,
    });

    await this.client.from("rsvp_settings").upsert({
      invitation_id: invitationId,
      enabled: data.rsvp.enabled,
      deadline: data.rsvp.deadline,
      headline: data.rsvp.headline,
      message: data.rsvp.message,
      confirmation_message: data.rsvp.confirmationMessage,
      ask_phone: data.rsvp.askPhone,
      ask_guest_count: data.rsvp.askGuestCount,
      max_guests: data.rsvp.maxGuests,
      ask_event_selection: data.rsvp.askEventSelection,
      ask_meal_preference: data.rsvp.askMealPreference,
      meal_options: data.rsvp.mealOptions,
      ask_message: data.rsvp.askMessage,
    });

    await this.client.from("music").upsert({
      invitation_id: invitationId,
      enabled: data.music.enabled,
      url: data.music.url,
      title: data.music.title,
      credit: data.music.credit,
      loop_track: data.music.loop,
    });

    // Venues first: events reference them.
    const venueIdByEvent = new Map<string, string | null>();
    const keptVenues: string[] = [];

    for (const event of data.events) {
      if (!event.venue) {
        venueIdByEvent.set(event.id, null);
        continue;
      }

      const payload = {
        invitation_id: invitationId,
        name: event.venue.name,
        address: event.venue.address,
        map_link: event.venue.mapLink,
        latitude: event.venue.latitude,
        longitude: event.venue.longitude,
        image: event.venue.image,
        note: event.venue.note,
      };

      const { data: venueRow } = isUuid(event.venue.id)
        ? await this.client
            .from("venues")
            .upsert({ id: event.venue.id, ...payload })
            .select("id")
            .single()
        : await this.client.from("venues").insert(payload).select("id").single();

      const venueId = venueRow ? String((venueRow as Row).id) : null;
      if (venueId) keptVenues.push(venueId);
      venueIdByEvent.set(event.id, venueId);
    }

    const keptEvents: string[] = [];
    for (const [index, event] of data.events.entries()) {
      const payload = {
        invitation_id: invitationId,
        venue_id: venueIdByEvent.get(event.id) ?? null,
        name: event.name,
        subtitle: event.subtitle,
        description: event.description,
        event_date: event.date,
        start_time: event.startTime,
        end_time: event.endTime,
        dress_code: event.dressCode,
        image: event.image,
        rsvp_required: event.rsvpRequired,
        enabled: event.enabled,
        sort_order: index,
      };

      const { data: eventRow } = isUuid(event.id)
        ? await this.client
            .from("events")
            .upsert({ id: event.id, ...payload })
            .select("id")
            .single()
        : await this.client.from("events").insert(payload).select("id").single();

      if (eventRow) keptEvents.push(String((eventRow as Row).id));
    }

    // Gallery, including the hero. The hero flag is cleared first so the
    // single-hero unique index can never be violated mid-write.
    await this.client
      .from("gallery_images")
      .update({ is_hero: false })
      .eq("invitation_id", invitationId);

    const keptImages: string[] = [];
    const imageRows: Array<{ asset: ImageAsset; hero: boolean; inGallery: boolean }> = [
      ...data.gallery.map((asset) => ({ asset, hero: false, inGallery: true })),
    ];

    if (data.heroImage) {
      const existing = imageRows.find((row) => row.asset.url === data.heroImage?.url);
      if (existing) {
        existing.hero = true;
      } else {
        imageRows.unshift({ asset: data.heroImage, hero: true, inGallery: false });
      }
    }

    for (const [index, row] of imageRows.entries()) {
      const payload = {
        invitation_id: invitationId,
        url: row.asset.url,
        alt: row.asset.alt,
        caption: row.asset.caption,
        width: row.asset.width,
        height: row.asset.height,
        blur_data_url: row.asset.blurDataURL,
        is_hero: row.hero,
        in_gallery: row.inGallery,
        sort_order: index,
      };

      const { data: imageRow } = isUuid(row.asset.id)
        ? await this.client
            .from("gallery_images")
            .upsert({ id: row.asset.id, ...payload })
            .select("id")
            .single()
        : await this.client
            .from("gallery_images")
            .insert(payload)
            .select("id")
            .single();

      if (imageRow) keptImages.push(String((imageRow as Row).id));
    }

    const keptStory: string[] = [];
    for (const [index, entry] of data.story.entries()) {
      const payload = {
        invitation_id: invitationId,
        title: entry.title,
        milestone_date: entry.date,
        description: entry.description,
        image: entry.image,
        sort_order: index,
      };
      const { data: storyRow } = isUuid(entry.id)
        ? await this.client
            .from("story_milestones")
            .upsert({ id: entry.id, ...payload })
            .select("id")
            .single()
        : await this.client
            .from("story_milestones")
            .insert(payload)
            .select("id")
            .single();
      if (storyRow) keptStory.push(String((storyRow as Row).id));
    }

    const keptContacts: string[] = [];
    for (const [index, entry] of data.contacts.entries()) {
      const payload = {
        invitation_id: invitationId,
        name: entry.name,
        role: entry.role,
        phone: entry.phone,
        whatsapp: entry.whatsapp,
        sort_order: index,
      };
      const { data: contactRow } = isUuid(entry.id)
        ? await this.client
            .from("contacts")
            .upsert({ id: entry.id, ...payload })
            .select("id")
            .single()
        : await this.client.from("contacts").insert(payload).select("id").single();
      if (contactRow) keptContacts.push(String((contactRow as Row).id));
    }

    const keptQuestions: string[] = [];
    for (const [index, question] of data.rsvp.customQuestions.entries()) {
      const payload = {
        invitation_id: invitationId,
        label: question.label,
        question_type: question.type,
        options: question.options,
        required: question.required,
        sort_order: index,
      };
      const { data: questionRow } = isUuid(question.id)
        ? await this.client
            .from("rsvp_questions")
            .upsert({ id: question.id, ...payload })
            .select("id")
            .single()
        : await this.client
            .from("rsvp_questions")
            .insert(payload)
            .select("id")
            .single();
      if (questionRow) keptQuestions.push(String((questionRow as Row).id));
    }

    // Prune rows the author removed in the editor.
    await Promise.all([
      this.prune("events", invitationId, keptEvents),
      this.prune("venues", invitationId, keptVenues),
      this.prune("gallery_images", invitationId, keptImages),
      this.prune("story_milestones", invitationId, keptStory),
      this.prune("contacts", invitationId, keptContacts),
      this.prune("rsvp_questions", invitationId, keptQuestions),
    ]);
  }

  private async prune(table: string, invitationId: string, keep: string[]) {
    let query = this.client.from(table).delete().eq("invitation_id", invitationId);
    if (keep.length > 0) query = query.not("id", "in", `(${keep.join(",")})`);
    await query;
  }
}

function invitationColumns(data: WeddingData) {
  return {
    slug: data.slug,
    status: data.status,
    template_id: data.appearance.templateId,
    wedding_date: data.weddingDate,
    wedding_time: data.weddingTime,
    hijri_date: data.hijriDate,
    invitation_message: data.invitationMessage,
    family_invitation_wording: data.familyInvitationWording,
    family_bride_names: data.familyNames.bride,
    family_groom_names: data.familyNames.groom,
    gratitude_message: data.gratitudeMessage,
    closing_message: data.closingMessage,
    dress_code: data.dressCode ?? {},
    islamic: data.islamic,
    seo: data.seo,
  };
}

function stripEventIds(event: WeddingEvent): WeddingEvent {
  return {
    ...event,
    id: "",
    venue: event.venue ? { ...event.venue, id: "" } : null,
  };
}
