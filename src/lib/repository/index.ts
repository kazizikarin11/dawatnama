import { createClient } from "@/lib/supabase/server";
import { LocalRepository } from "./local";
import { SupabaseRepository } from "./supabase";
import type { InvitationRepository } from "./types";

/**
 * Chooses the storage implementation. Supabase when it is configured, otherwise
 * the local JSON repository so the platform is fully usable in development.
 *
 * Server-only: never import this from a client component.
 */
export async function getRepository(): Promise<InvitationRepository> {
  const client = await createClient();
  return client ? new SupabaseRepository(client) : new LocalRepository();
}

export type { InvitationRepository, InvitationSummary, RsvpTotals } from "./types";
export { rsvpTotals, summarize } from "./types";
