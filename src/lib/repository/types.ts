import type {
  RsvpResponse,
  RsvpSubmission,
  WeddingData,
} from "@/lib/wedding/types";

/**
 * Storage contract. The editor, dashboard and public page depend only on this,
 * which is what lets the platform run against Supabase in production and a
 * local JSON file during development without changing a single component.
 */

export interface InvitationSummary {
  id: string;
  slug: string;
  status: WeddingData["status"];
  templateId: WeddingData["appearance"]["templateId"];
  title: string;
  weddingDate: string | null;
  heroImageUrl: string | null;
  rsvpCount: number;
  attendingCount: number;
  updatedAt: string;
}

export interface RsvpTotals {
  responses: number;
  attending: number;
  notAttending: number;
  /** Attending responses multiplied out by party size. */
  guests: number;
}

export interface InvitationRepository {
  readonly kind: "supabase" | "local";

  listByOwner(ownerId: string): Promise<InvitationSummary[]>;
  getById(id: string, ownerId: string): Promise<WeddingData | null>;
  /** Public read. Returns drafts only when `allowDraft` is set (editor preview). */
  getBySlug(slug: string, allowDraft?: boolean): Promise<WeddingData | null>;

  create(ownerId: string, data: WeddingData): Promise<WeddingData>;
  update(ownerId: string, data: WeddingData): Promise<WeddingData>;
  duplicate(ownerId: string, id: string): Promise<WeddingData | null>;
  /** Soft delete: the record is archived and stops resolving publicly. */
  archive(ownerId: string, id: string): Promise<void>;

  isSlugAvailable(slug: string, exceptId?: string): Promise<boolean>;

  listResponses(invitationId: string, ownerId: string): Promise<RsvpResponse[]>;
  submitResponse(
    invitationId: string,
    submission: RsvpSubmission,
  ): Promise<RsvpResponse>;
}

export function summarize(data: WeddingData, rsvp: RsvpResponse[]): InvitationSummary {
  const attending = rsvp.filter((entry) => entry.attendance === "attending");
  const names = [data.couple.bride.name, data.couple.groom.name].filter(Boolean);

  return {
    id: data.id,
    slug: data.slug,
    status: data.status,
    templateId: data.appearance.templateId,
    title: names.length > 0 ? names.join(" & ") : "Untitled invitation",
    weddingDate: data.weddingDate,
    heroImageUrl: data.heroImage?.url ?? null,
    rsvpCount: rsvp.length,
    attendingCount: attending.length,
    updatedAt: data.updatedAt,
  };
}

export function rsvpTotals(responses: RsvpResponse[]): RsvpTotals {
  const attending = responses.filter((entry) => entry.attendance === "attending");
  return {
    responses: responses.length,
    attending: attending.length,
    notAttending: responses.length - attending.length,
    guests: attending.reduce(
      (total, entry) => total + Math.max(1, entry.guestCount),
      0,
    ),
  };
}
