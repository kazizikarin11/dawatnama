export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/** Supports both the newer publishable key name and the classic anon key. */
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

/**
 * When false the platform runs in local mode: a JSON-file repository and a
 * development-only session cookie. Everything else behaves identically.
 */
export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);
