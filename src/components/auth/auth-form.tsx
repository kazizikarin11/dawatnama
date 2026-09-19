"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signIn, signUp, type AuthResult } from "@/lib/actions/auth";
import { Button, TextInput } from "@/components/ui/controls";

const INITIAL: AuthResult = { error: null };

export function AuthForm({ localMode }: { localMode: boolean }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, INITIAL);

  return (
    <div className="w-full max-w-sm">
      <p className="text-fluid-xs tracking-label text-brass">Dawatnama</p>

      <h1 className="mt-6 font-display text-fluid-2xl font-light">
        {mode === "signin" ? "Welcome back" : "Create your account"}
      </h1>

      <p className="mt-3 text-fluid-sm leading-relaxed text-ink-muted">
        {mode === "signin"
          ? "Sign in to manage your invitations and RSVPs."
          : "One account holds every invitation you create."}
      </p>

      {localMode && (
        <div className="mt-6 border border-brass/40 bg-brass/8 px-4 py-3">
          <p className="text-fluid-xs leading-relaxed text-ink-soft">
            <strong className="font-normal text-ink">Local development mode.</strong>{" "}
            Supabase is not configured, so any email signs you in and data is stored
            in a JSON file on this machine. Add Supabase credentials for real
            accounts and row level security.
          </p>
        </div>
      )}

      <form action={formAction} className="mt-8 space-y-5">
        {mode === "signup" && (
          <TextInput
            name="displayName"
            label="Your name"
            autoComplete="name"
            placeholder="Fatima Hasan"
          />
        )}

        <TextInput
          name="email"
          type="email"
          label="Email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
        />

        {!localMode && (
          <TextInput
            name="password"
            type="password"
            label="Password"
            required
            minLength={8}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            hint={mode === "signup" ? "At least 8 characters." : undefined}
          />
        )}

        {state.error && (
          <p role="alert" className="text-fluid-xs text-rose">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full py-3.5">
          {pending
            ? "One moment…"
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="tap-target mt-6 text-fluid-xs text-ink-muted underline decoration-line underline-offset-4 transition-colors hover:text-ink"
      >
        {mode === "signin"
          ? "Don't have an account? Create one"
          : "Already have an account? Sign in"}
      </button>

      <p className="mt-10 text-fluid-xs text-ink-muted">
        <Link href="/" className="underline decoration-line underline-offset-4">
          Back to Dawatnama
        </Link>
      </p>
    </div>
  );
}
