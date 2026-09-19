import type { Metadata } from "next";
import { requireSession } from "@/lib/actions/auth";
import { getRepository } from "@/lib/repository";
import { InvitationRow } from "@/components/dashboard/invitation-row";
import { ButtonLink, EmptyState } from "@/components/ui/controls";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const session = await requireSession();
  const repository = await getRepository();
  const invitations = await repository.listByOwner(session.userId);

  const published = invitations.filter((entry) => entry.status === "published");
  const drafts = invitations.filter((entry) => entry.status === "draft");
  const responses = invitations.reduce((total, entry) => total + entry.rsvpCount, 0);
  const attending = invitations.reduce((total, entry) => total + entry.attendingCount, 0);

  const stats = [
    { label: "Invitations", value: invitations.length },
    { label: "Published", value: published.length },
    { label: "Drafts", value: drafts.length },
    { label: "RSVPs", value: responses, note: `${attending} attending` },
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-fluid-xs tracking-label text-brass">Your account</p>
          <h1 className="mt-4 font-display text-fluid-3xl font-light">Invitations</h1>
        </div>
        <ButtonLink href="/dashboard/invitations/new" variant="emerald" className="py-3.5">
          Create invitation
        </ButtonLink>
      </div>

      <section aria-label="Overview" className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-line bg-paper px-4 py-5">
            <p className="font-display text-fluid-2xl font-light tabular-nums">
              {stat.value}
            </p>
            <p className="mt-2 text-fluid-xs tracking-label-tight text-ink-muted">
              {stat.label}
            </p>
            {stat.note && (
              <p className="mt-1 text-fluid-xs text-ink-muted">{stat.note}</p>
            )}
          </div>
        ))}
      </section>

      <section className="mt-12">
        <h2 className="text-fluid-xs tracking-label text-ink-muted">My invitations</h2>

        <div className="mt-5 space-y-4">
          {invitations.length === 0 ? (
            <EmptyState
              title="No invitations yet"
              body="Create your first invitation — enter the names and the date, and you can add events, photographs and RSVP settings next."
              action={
                <ButtonLink href="/dashboard/invitations/new" variant="emerald">
                  Create invitation
                </ButtonLink>
              }
            />
          ) : (
            invitations.map((invitation) => (
              <InvitationRow key={invitation.id} invitation={invitation} />
            ))
          )}
        </div>
      </section>
    </main>
  );
}
