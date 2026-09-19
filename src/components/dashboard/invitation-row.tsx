"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  archiveInvitation,
  duplicateInvitation,
  setPublishState,
} from "@/lib/actions/invitations";
import { invitationUrl } from "@/lib/site";
import { formatLongDate } from "@/lib/wedding/format";
import type { InvitationSummary } from "@/lib/repository/types";
import { TEMPLATE_META } from "@/templates/meta";
import { Badge, Button, ButtonLink } from "@/components/ui/controls";
import { SharePanel } from "@/components/share/share-panel";

/**
 * One invitation in "My invitations". Publishing, duplicating and archiving all
 * happen here through server actions; archive is a soft delete and asks first.
 */
export function InvitationRow({ invitation }: { invitation: InvitationSummary }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [sharing, setSharing] = useState(false);

  const template = TEMPLATE_META[invitation.templateId];
  const published = invitation.status === "published";
  const url = invitationUrl(invitation.slug);

  const run = (task: () => Promise<{ ok: boolean; error: string | null }>) => {
    setError(null);
    startTransition(async () => {
      const result = await task();
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  };

  return (
    <article className="border border-line bg-paper">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge tone={published ? "live" : "draft"}>
              {published ? "Published" : "Draft"}
            </Badge>
            <Badge>{template.name}</Badge>
          </div>

          <h3 className="mt-3.5 font-display text-fluid-xl font-light">
            {invitation.title}
          </h3>

          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-fluid-xs text-ink-muted">
            <div className="flex gap-1.5">
              <dt>Date</dt>
              <dd className="text-ink-soft">
                {formatLongDate(invitation.weddingDate) ?? "Not set"}
              </dd>
            </div>
            <div className="flex gap-1.5">
              <dt>Link</dt>
              <dd className="text-ink-soft">/invite/{invitation.slug}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt>RSVPs</dt>
              <dd className="text-ink-soft">
                {invitation.rsvpCount} ({invitation.attendingCount} attending)
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <ButtonLink href={`/dashboard/invitations/${invitation.id}`} variant="primary">
            Edit
          </ButtonLink>
          <ButtonLink href={`/dashboard/invitations/${invitation.id}/rsvp`}>
            RSVPs
          </ButtonLink>
          <ButtonLink href={`/invite/${invitation.slug}`} external>
            Preview
          </ButtonLink>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3.5">
        <Button
          variant={published ? "secondary" : "emerald"}
          disabled={pending}
          onClick={() => run(() => setPublishState(invitation.id, !published))}
        >
          {published ? "Unpublish" : "Publish"}
        </Button>

        {published && (
          <Button variant="ghost" onClick={() => setSharing((value) => !value)}>
            {sharing ? "Hide share" : "Share"}
          </Button>
        )}

        <Button
          variant="ghost"
          disabled={pending}
          onClick={() => run(() => duplicateInvitation(invitation.id))}
        >
          Duplicate
        </Button>

        {confirmingArchive ? (
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-fluid-xs text-ink-muted">
              Delete this invitation?
            </span>
            <Button
              variant="danger"
              disabled={pending}
              onClick={() => run(() => archiveInvitation(invitation.id))}
            >
              Yes, delete
            </Button>
            <Button variant="ghost" onClick={() => setConfirmingArchive(false)}>
              Cancel
            </Button>
          </span>
        ) : (
          <Button variant="ghost" onClick={() => setConfirmingArchive(true)}>
            Delete
          </Button>
        )}

        <span className="ml-auto text-fluid-xs text-ink-muted">
          Updated {new Date(invitation.updatedAt).toISOString().slice(0, 10)}
        </span>
      </div>

      {error && (
        <p role="alert" className="border-t border-line px-5 py-3 text-fluid-xs text-rose">
          {error}
        </p>
      )}

      {sharing && published && (
        <div className="border-t border-line px-5 py-5">
          <SharePanel
            url={url}
            names={invitation.title}
            date={formatLongDate(invitation.weddingDate)}
          />
          <p className="mt-4 text-fluid-xs text-ink-muted">
            Opens beautifully from WhatsApp on a phone.{" "}
            <Link
              href={`/invite/${invitation.slug}`}
              className="underline decoration-line underline-offset-4"
            >
              Open it yourself
            </Link>
          </p>
        </div>
      )}
    </article>
  );
}
