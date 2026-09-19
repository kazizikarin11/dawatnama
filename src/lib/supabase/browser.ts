"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL, hasSupabase } from "./config";

let cached: ReturnType<typeof createBrowserClient> | null = null;

/** Browser Supabase client, used for auth forms and media uploads. */
export function createClient() {
  if (!hasSupabase) return null;
  cached ??= createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  return cached;
}
