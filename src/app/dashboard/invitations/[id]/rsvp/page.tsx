import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/actions/auth";
import { getRepository } from "@/lib/repository";
import { coupleNames } from "@/lib/wedding/format";
import { RsvpManager } from "@/components/dashboard/rsvp-manager";
import { ButtonLink } from "@/components/ui/controls";

export const metadata: Metadata = {
  title: "RSVPs",
  robots: { index: false, follow: false },
};

export default async function RsvpPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const repository = await getRepository();

  const invitation = await repository.getById(id, session.userId);
  if (!invitation) notFound();

  const responses = await repository.listResponses(id, session.userId);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href={`/dashboard/invitations/${id}`}
            className="text-fluid-xs tracking-label-tight text-ink-muted underline decoration-line underline-offset-4 transition-colors hover:text-ink"
          >
            Back to editor
          </Link>
          <h1 className="mt-3 font-display text-fluid-3xl font-light">RSVPs</h1>
          <p className="mt-2 text-fluid-sm text-ink-muted">
            {coupleNames(invitation).combined}
            {!invitation.rsvp.enabled && " — RSVP is currently switched off"}
          </p>
        </div>

        {invitation.slug && (
          <ButtonLink href={`/invite/${invitation.slug}`} external>
            Open invitation
          </ButtonLink>
        )}
      </div>

      <div className="mt-10">
        <RsvpManager invitation={invitation} responses={responses} />
      </div>
    </main>
  );
}
