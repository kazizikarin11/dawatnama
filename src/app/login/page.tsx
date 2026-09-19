import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getSession } from "@/lib/auth/session";
import { hasSupabase } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="grid min-h-screen-safe lg:grid-cols-2">
      <div className="flex items-center justify-center bg-bone px-6 py-16">
        <AuthForm localMode={!hasSupabase} />
      </div>

      {/* Quiet editorial panel; hidden on mobile where it would only cost height. */}
      <aside className="surface-grain relative hidden items-end bg-emerald-deep p-12 lg:flex">
        <div className="relative max-w-md text-bone">
          <p className="text-fluid-xs tracking-label text-brass">
            Content is reusable
          </p>
          <p className="mt-6 font-display text-fluid-2xl leading-tight font-light">
            Enter your wedding details once. Change the design as many times as you
            like.
          </p>
          <p className="mt-6 text-fluid-sm leading-relaxed text-bone/65">
            Five independently designed templates, one set of information, and a
            single link to share with every guest.
          </p>
        </div>
      </aside>
    </main>
  );
}
