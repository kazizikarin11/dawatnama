"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasSupabase } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  LOCAL_SESSION_COOKIE,
  getSession,
  newLocalSessionValue,
} from "@/lib/auth/session";

export type AuthResult = { error: string | null };

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signIn(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  const { email, password } = readCredentials(formData);

  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };

  if (!hasSupabase) {
    // Development mode: no password check, and clearly labelled as such in the UI.
    const store = await cookies();
    store.set(LOCAL_SESSION_COOKIE, newLocalSessionValue(email), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    redirect("/dashboard");
  }

  if (password.length < 8) return { error: "Enter your password." };

  const client = await createClient();
  if (!client) return { error: "Authentication is unavailable." };

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { error: "That email and password combination didn't work." };

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function signUp(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  const { email, password } = readCredentials(formData);
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };

  if (!hasSupabase) {
    return signIn({ error: null }, formData);
  }

  if (password.length < 8) {
    return { error: "Use a password of at least 8 characters." };
  }

  const client = await createClient();
  if (!client) return { error: "Authentication is unavailable." };

  const { error } = await client.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName || null } },
  });

  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  if (hasSupabase) {
    const client = await createClient();
    await client?.auth.signOut();
  }

  const store = await cookies();
  store.delete(LOCAL_SESSION_COOKIE);

  revalidatePath("/");
  redirect("/");
}

/** Guards every creator page and action. */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
