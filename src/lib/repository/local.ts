import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createId } from "@/lib/utils/id";
import { normalizeWedding } from "@/lib/wedding/normalize";
import type { RsvpResponse, RsvpSubmission, WeddingData } from "@/lib/wedding/types";
import {
  summarize,
  type InvitationRepository,
  type InvitationSummary,
} from "./types";

/**
 * Development repository backed by a JSON file on disk.
 *
 * This exists so the whole platform — dashboard, editor, publishing, RSVP — can
 * be run and demonstrated before any Supabase project is connected. It is not
 * intended for production: serverless filesystems are ephemeral, and there is no
 * row-level security. When Supabase env vars are present the Supabase
 * repository is used instead.
 *
 * Records are never removed; `archive` sets a flag.
 */

interface StoredInvitation {
  ownerId: string;
  archivedAt: string | null;
  data: WeddingData;
}

interface StoreShape {
  version: 1;
  invitations: StoredInvitation[];
  responses: RsvpResponse[];
}

const STORE_PATH = join(process.cwd(), ".data", "dawatnama.json");

const EMPTY: StoreShape = { version: 1, invitations: [], responses: [] };

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    return {
      version: 1,
      invitations: Array.isArray(parsed.invitations)
        ? parsed.invitations.map((entry) => ({
            ownerId: String(entry.ownerId ?? ""),
            archivedAt: entry.archivedAt ?? null,
            data: normalizeWedding(entry.data),
          }))
        : [],
      responses: Array.isArray(parsed.responses) ? parsed.responses : [],
    };
  } catch {
    return { ...EMPTY, invitations: [], responses: [] };
  }
}

async function writeStore(store: StoreShape): Promise<void> {
  try {
    await mkdir(dirname(STORE_PATH), { recursive: true });
    await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch (error) {
    // Serverless hosts have a read-only filesystem, so local mode cannot persist
    // there. Fail with an instruction rather than an unhandled filesystem error.
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "EROFS" || code === "EACCES" || code === "EPERM") {
      throw new Error(
        "This deployment has no database configured. Add NEXT_PUBLIC_SUPABASE_URL " +
          "and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to enable saving invitations.",
      );
    }
    throw error;
  }
}

export class LocalRepository implements InvitationRepository {
  readonly kind = "local" as const;

  async listByOwner(ownerId: string): Promise<InvitationSummary[]> {
    const store = await readStore();
    return store.invitations
      .filter((entry) => entry.ownerId === ownerId && !entry.archivedAt)
      .map((entry) =>
        summarize(
          entry.data,
          store.responses.filter((response) => response.invitationId === entry.data.id),
        ),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getById(id: string, ownerId: string): Promise<WeddingData | null> {
    const store = await readStore();
    const found = store.invitations.find(
      (entry) => entry.data.id === id && entry.ownerId === ownerId && !entry.archivedAt,
    );
    return found ? found.data : null;
  }

  async getBySlug(slug: string, allowDraft = false): Promise<WeddingData | null> {
    const store = await readStore();
    const found = store.invitations.find(
      (entry) => entry.data.slug === slug && !entry.archivedAt,
    );
    if (!found) return null;
    if (!allowDraft && found.data.status !== "published") return null;
    return found.data;
  }

  async create(ownerId: string, data: WeddingData): Promise<WeddingData> {
    const store = await readStore();
    const record = normalizeWedding({
      ...data,
      id: data.id || createId("inv"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    store.invitations.push({ ownerId, archivedAt: null, data: record });
    await writeStore(store);
    return record;
  }

  async update(ownerId: string, data: WeddingData): Promise<WeddingData> {
    const store = await readStore();
    const index = store.invitations.findIndex(
      (entry) => entry.data.id === data.id && entry.ownerId === ownerId,
    );
    const record = normalizeWedding({ ...data, updatedAt: new Date().toISOString() });

    if (index === -1) {
      store.invitations.push({ ownerId, archivedAt: null, data: record });
    } else {
      const existing = store.invitations[index];
      store.invitations[index] = {
        ownerId,
        archivedAt: existing?.archivedAt ?? null,
        data: { ...record, createdAt: existing?.data.createdAt ?? record.createdAt },
      };
    }

    await writeStore(store);
    return record;
  }

  async duplicate(ownerId: string, id: string): Promise<WeddingData | null> {
    const source = await this.getById(id, ownerId);
    if (!source) return null;

    const store = await readStore();
    const taken = new Set(store.invitations.map((entry) => entry.data.slug));
    let slug = `${source.slug || "invitation"}-copy`;
    let counter = 2;
    while (taken.has(slug)) {
      slug = `${source.slug || "invitation"}-copy-${counter}`;
      counter += 1;
    }

    return this.create(ownerId, {
      ...source,
      id: createId("inv"),
      slug,
      status: "draft",
    });
  }

  async archive(ownerId: string, id: string): Promise<void> {
    const store = await readStore();
    const index = store.invitations.findIndex(
      (entry) => entry.data.id === id && entry.ownerId === ownerId,
    );
    const existing = store.invitations[index];
    if (index === -1 || !existing) return;

    store.invitations[index] = {
      ...existing,
      archivedAt: new Date().toISOString(),
    };
    await writeStore(store);
  }

  async isSlugAvailable(slug: string, exceptId?: string): Promise<boolean> {
    const store = await readStore();
    return !store.invitations.some(
      (entry) =>
        entry.data.slug === slug && !entry.archivedAt && entry.data.id !== exceptId,
    );
  }

  async listResponses(invitationId: string, ownerId: string): Promise<RsvpResponse[]> {
    const store = await readStore();
    const owns = store.invitations.some(
      (entry) => entry.data.id === invitationId && entry.ownerId === ownerId,
    );
    if (!owns) return [];

    return store.responses
      .filter((entry) => entry.invitationId === invitationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async submitResponse(
    invitationId: string,
    submission: RsvpSubmission,
  ): Promise<RsvpResponse> {
    const store = await readStore();
    const response: RsvpResponse = {
      id: createId("rsvp"),
      invitationId,
      guestName: submission.guestName,
      phone: submission.phone ?? null,
      attendance: submission.attendance,
      guestCount: submission.guestCount ?? 1,
      eventIds: submission.eventIds ?? [],
      mealPreference: submission.mealPreference ?? null,
      message: submission.message ?? null,
      answers: submission.answers ?? {},
      createdAt: new Date().toISOString(),
    };

    store.responses.push(response);
    await writeStore(store);
    return response;
  }
}
