import { cookies } from "next/headers";
import { createId } from "@/lib/utils/id";
import { hasSupabase } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Authentication.
 *
 * With Supabase configured this is Supabase Auth, and every query is additionally
 * protected by row level security.
 *
 * Without it, the platform falls back to a development-only cookie so the
 * dashboard and editor can be used immediately. That mode is clearly labelled in
 * the UI and is not a security boundary — it exists for local work only.
 */

export const LOCAL_SESSION_COOKIE = "dawatnama_local_session";

export interface Session {
  userId: string;
  email: string | null;
  displayName: string | null;
  mode: "supabase" | "local";
}

export async function getSession(): Promise<Session | null> {
  if (hasSupabase) {
    const client = await createClient();
    if (!client) return null;

    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return null;

    const meta = data.user.user_metadata as { display_name?: string } | null;
    return {
      userId: data.user.id,
      email: data.user.email ?? null,
      displayName: meta?.display_name ?? null,
      mode: "supabase",
    };
  }

  const store = await cookies();
  const raw = store.get(LOCAL_SESSION_COOKIE)?.value;
  if (!raw) return null;

  const [userId, email] = raw.split("::");
  if (!userId) return null;

  return {
    userId,
    email: email ? decodeURIComponent(email) : null,
    displayName: null,
    mode: "local",
  };
}

export function newLocalSessionValue(email: string): string {
  return `${createId("user")}::${encodeURIComponent(email)}`;
}
