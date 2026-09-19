import { DEMO_SLUG, demoWedding } from "@/lib/demo/demo-wedding";
import { getRepository } from "@/lib/repository";
import { getSession } from "@/lib/auth/session";
import { TEMPLATE_IDS, type TemplateId, type WeddingData } from "./types";

/**
 * Resolves a public invitation by slug.
 *
 * Drafts are only served to a signed-in author (the editor's own preview), never
 * to a guest. The fictional demo invitation is served from code so the templates
 * can always be viewed, even before any wedding has been created.
 */
export async function loadInvitationBySlug(
  slug: string,
  options?: { templateOverride?: string | null; allowDraft?: boolean },
): Promise<WeddingData | null> {
  const repository = await getRepository();

  let invitation = await repository.getBySlug(slug, false);

  if (!invitation && options?.allowDraft) {
    const session = await getSession();
    if (session) {
      invitation = await repository.getBySlug(slug, true);
    }
  }

  if (!invitation && slug === DEMO_SLUG) {
    invitation = demoWedding();
  }

  if (!invitation) return null;

  const override = options?.templateOverride;
  if (override && TEMPLATE_IDS.includes(override as TemplateId)) {
    return {
      ...invitation,
      appearance: { ...invitation.appearance, templateId: override as TemplateId },
    };
  }

  return invitation;
}
