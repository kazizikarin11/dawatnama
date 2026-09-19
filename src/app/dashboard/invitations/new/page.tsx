import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/actions/auth";
import { NewInvitationForm } from "@/components/dashboard/new-invitation-form";

export const metadata: Metadata = {
  title: "Create an invitation",
  robots: { index: false, follow: false },
};

export default async function NewInvitationPage() {
  await requireSession();

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        href="/dashboard"
        className="text-fluid-xs tracking-label-tight text-ink-muted underline decoration-line underline-offset-4 transition-colors hover:text-ink"
      >
        Back to dashboard
      </Link>

      <h1 className="mt-7 font-display text-fluid-3xl font-light">
        Create an invitation
      </h1>
      <p className="mt-4 max-w-xl text-fluid-base leading-relaxed text-ink-soft">
        Start with the names and the date. You will add events, venues,
        photographs, wording and RSVP settings in the editor, with a live preview
        beside you.
      </p>

      <NewInvitationForm />
    </main>
  );
}
