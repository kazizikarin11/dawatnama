import Link from "next/link";
import { requireSession } from "@/lib/actions/auth";
import { signOut } from "@/lib/actions/auth";
import { hasSupabase } from "@/lib/supabase/config";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="min-h-screen-safe bg-bone text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-bone/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-5">
            <Link href="/dashboard" className="font-display text-fluid-lg">
              Dawatnama
            </Link>
            <Link
              href="/templates"
              className="hidden text-fluid-xs tracking-label-tight text-ink-muted transition-colors hover:text-ink sm:block"
            >
              Templates
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {!hasSupabase && (
              <span className="hidden border border-brass/40 px-2.5 py-1 text-[0.6rem] tracking-label-tight text-brass sm:inline-grid">
                Local mode
              </span>
            )}
            <span className="hidden max-w-[12rem] truncate text-fluid-xs text-ink-muted sm:block">
              {session.email ?? "Signed in"}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="tap-target inline-grid place-items-center border border-line px-4 text-fluid-xs tracking-label-tight text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
