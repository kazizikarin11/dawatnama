import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL, hasSupabase } from "./config";

/**
 * Server-side Supabase client bound to the request's cookies, so RLS sees the
 * signed-in user. Returns null in local mode.
 */
export async function createClient() {
  if (!hasSupabase) return null;

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render, where cookies are read-only.
          // Session refresh is handled by middleware instead.
        }
      },
    },
  });
}
