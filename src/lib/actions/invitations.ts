"use server";

import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/repository";
import { buildCoupleSlug, validateSlug } from "@/lib/utils/slug";
import { createEmptyWedding, normalizeWedding } from "@/lib/wedding/normalize";
import { invitationWarnings } from "@/lib/wedding/sections";
import {
  DEFAULT_CLOSING,
  DEFAULT_FAMILY_WORDING,
  DEFAULT_GRATITUDE,
  DEFAULT_INVITATION_MESSAGE,
} from "@/lib/wedding/defaults";
import { TEMPLATE_IDS, type TemplateId, type WeddingData } from "@/lib/wedding/types";
import { requireSession } from "./auth";

/**
 * Server actions for the creator side. Every one of them re-establishes the
 * session and re-normalizes the payload, so nothing the browser sends is trusted
 * and the stored shape is always valid.
 */

export interface ActionResult<T = undefined> {
  ok: boolean;
  error: string | null;
  data?: T;
}

/** Finds a free slug near the one requested. */
async function uniqueSlug(base: string, exceptId?: string): Promise<string> {
  const repository = await getRepository();
  const seed = base || "our-wedding";

  if (await repository.isSlugAvailable(seed, exceptId)) return seed;

  for (let suffix = 2; suffix < 60; suffix += 1) {
    const candidate = `${seed}-${suffix}`;
    if (await repository.isSlugAvailable(candidate, exceptId)) return candidate;
  }

  return `${seed}-${Date.now().toString(36)}`;
}

export async function createInvitation(formData: FormData): Promise<ActionResult<string>> {
  const session = await requireSession();
  const repository = await getRepository();

  const brideName = String(formData.get("brideName") ?? "").trim();
  const groomName = String(formData.get("groomName") ?? "").trim();
  const weddingDate = String(formData.get("weddingDate") ?? "").trim();
  const requestedTemplate = String(formData.get("templateId") ?? "");

  if (!brideName || !groomName) {
    return { ok: false, error: "Please enter both names." };
  }

  const templateId: TemplateId = TEMPLATE_IDS.includes(requestedTemplate as TemplateId)
    ? (requestedTemplate as TemplateId)
    : "royal-emerald";

  const slug = await uniqueSlug(buildCoupleSlug(brideName, groomName));

  // A new invitation starts with editable default wording and one Nikah event,
  // because every Muslim wedding has a nikah — everything else is the author's call.
  const draft = normalizeWedding({
    ...createEmptyWedding({ brideName, groomName, slug, templateId }),
    weddingDate: weddingDate || null,
    invitationMessage: DEFAULT_INVITATION_MESSAGE,
    familyInvitationWording: DEFAULT_FAMILY_WORDING,
    gratitudeMessage: DEFAULT_GRATITUDE,
    closingMessage: DEFAULT_CLOSING,
    events: [
      {
        name: "Nikah",
        subtitle: "The marriage ceremony",
        date: weddingDate || null,
        enabled: true,
        rsvpRequired: true,
        order: 0,
      },
    ],
  });

  try {
    const saved = await repository.create(session.userId, draft);
    revalidatePath("/dashboard");
    return { ok: true, error: null, data: saved.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not create the invitation.",
    };
  }
}

export async function saveInvitation(payload: string): Promise<ActionResult<WeddingData>> {
  const session = await requireSession();
  const repository = await getRepository();

  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return { ok: false, error: "The changes could not be read." };
  }

  const data = normalizeWedding(parsed);

  if (!data.id) return { ok: false, error: "This invitation no longer exists." };

  const slugCheck = validateSlug(data.slug);
  if (!slugCheck.valid) {
    return { ok: false, error: slugCheck.reason ?? "That link cannot be used." };
  }

  if (!(await repository.isSlugAvailable(data.slug, data.id))) {
    return { ok: false, error: "That link is already taken. Try another." };
  }

  // Publishing is only allowed once the invitation can actually be read.
  if (data.status === "published") {
    const warnings = invitationWarnings(data);
    const blocking = warnings.filter(
      (warning) => !warning.startsWith("Add a cover image"),
    );
    if (blocking.length > 0) {
      return { ok: false, error: blocking[0] ?? "Add the missing details first." };
    }
  }

  try {
    const existing = await repository.getById(data.id, session.userId);
    const saved = existing
      ? await repository.update(session.userId, data)
      : await repository.create(session.userId, data);

    revalidatePath("/dashboard");
    revalidatePath(`/invite/${saved.slug}`);
    return { ok: true, error: null, data: saved };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "The changes could not be saved.",
    };
  }
}

export async function setPublishState(
  id: string,
  published: boolean,
): Promise<ActionResult<WeddingData>> {
  const session = await requireSession();
  const repository = await getRepository();

  const existing = await repository.getById(id, session.userId);
  if (!existing) return { ok: false, error: "This invitation no longer exists." };

  const next: WeddingData = {
    ...existing,
    status: published ? "published" : "draft",
  };

  if (published) {
    const blocking = invitationWarnings(next).filter(
      (warning) => !warning.startsWith("Add a cover image"),
    );
    if (blocking.length > 0) {
      return { ok: false, error: blocking[0] ?? "Add the missing details first." };
    }
  }

  const saved = await repository.update(session.userId, next);
  revalidatePath("/dashboard");
  revalidatePath(`/invite/${saved.slug}`);
  return { ok: true, error: null, data: saved };
}

export async function duplicateInvitation(id: string): Promise<ActionResult<string>> {
  const session = await requireSession();
  const repository = await getRepository();

  const copy = await repository.duplicate(session.userId, id);
  if (!copy) return { ok: false, error: "This invitation could not be duplicated." };

  revalidatePath("/dashboard");
  return { ok: true, error: null, data: copy.id };
}

/**
 * Soft delete. The record is archived and stops resolving publicly, so an
 * accidental tap can never destroy a wedding invitation.
 */
export async function archiveInvitation(id: string): Promise<ActionResult> {
  const session = await requireSession();
  const repository = await getRepository();

  await repository.archive(session.userId, id);
  revalidatePath("/dashboard");
  return { ok: true, error: null };
}

export async function checkSlugAvailability(
  slug: string,
  exceptId: string,
): Promise<{ available: boolean; reason: string | null }> {
  await requireSession();

  const validation = validateSlug(slug);
  if (!validation.valid) return { available: false, reason: validation.reason };

  const repository = await getRepository();
  const available = await repository.isSlugAvailable(slug, exceptId);
  return {
    available,
    reason: available ? null : "That link is already taken.",
  };
}
