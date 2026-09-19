"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { saveInvitation } from "@/lib/actions/invitations";
import { coupleNames } from "@/lib/wedding/format";
import type { WeddingData } from "@/lib/wedding/types";
import { Badge, Button, ButtonLink } from "@/components/ui/controls";
import { EditorProvider, serializeDraft, useEditor } from "./context";
import { EditorPreview } from "./preview";
import { ContentPanel } from "./panels/content-panel";
import { DesignPanel } from "./panels/design-panel";
import { EventsPanel } from "./panels/events-panel";
import { GalleryPanel } from "./panels/gallery-panel";
import { PublishPanel } from "./panels/publish-panel";
import { RsvpPanel } from "./panels/rsvp-panel";

/**
 * The editor.
 *
 * Mobile-first: on a phone the author gets full-width panels with a bottom bar
 * that opens the preview as a sheet. From `lg` up, the preview sits permanently
 * beside the controls. Either way it is the same live preview and the same panels.
 */

const TABS = [
  { id: "content", label: "Content" },
  { id: "events", label: "Events" },
  { id: "gallery", label: "Gallery" },
  { id: "rsvp", label: "RSVP" },
  { id: "design", label: "Design" },
  { id: "publish", label: "Publish" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function EditorShell({
  invitation,
  ownerId,
  rsvpCount,
}: {
  invitation: WeddingData;
  ownerId: string;
  rsvpCount: number;
}) {
  return (
    <EditorProvider initial={invitation}>
      <EditorBody ownerId={ownerId} rsvpCount={rsvpCount} />
    </EditorProvider>
  );
}

function EditorBody({
  ownerId,
  rsvpCount,
}: {
  ownerId: string;
  rsvpCount: number;
}) {
  const editor = useEditor();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("content");
  const [saving, startSaving] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );
  const [previewOpen, setPreviewOpen] = useState(false);

  const { draft, dirty } = editor;
  const names = coupleNames(draft);

  function save() {
    setMessage(null);
    startSaving(async () => {
      const result = await saveInvitation(serializeDraft(draft));
      if (!result.ok || !result.data) {
        setMessage({ tone: "error", text: result.error ?? "Could not save." });
        return;
      }
      editor.reset(result.data);
      setMessage({ tone: "ok", text: "Saved." });
      router.refresh();
    });
  }

  // Warn before losing unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => {
    if (message?.tone !== "ok") return;
    const timer = setTimeout(() => setMessage(null), 2600);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div className="mx-auto max-w-[110rem] px-4 pb-28 sm:px-6 lg:pb-10">
      {/* Header ------------------------------------------------------- */}
      <header className="flex flex-wrap items-start justify-between gap-4 py-6">
        <div className="min-w-0">
          <Link
            href="/dashboard"
            className="text-fluid-xs tracking-label-tight text-ink-muted underline decoration-line underline-offset-4 transition-colors hover:text-ink"
          >
            All invitations
          </Link>

          <h1 className="mt-3 truncate font-display text-fluid-2xl font-light">
            {names.combined}
          </h1>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Badge tone={draft.status === "published" ? "live" : "draft"}>
              {draft.status === "published" ? "Published" : "Draft"}
            </Badge>
            {dirty && <Badge>Unsaved changes</Badge>}
            {rsvpCount > 0 && <Badge>{rsvpCount} RSVPs</Badge>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink href={`/dashboard/invitations/${draft.id}/rsvp`}>
            RSVPs
          </ButtonLink>
          {draft.slug && (
            <ButtonLink href={`/invite/${draft.slug}`} external>
              Open live
            </ButtonLink>
          )}
          <Button variant="emerald" onClick={save} disabled={saving || !dirty}>
            {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </Button>
        </div>
      </header>

      {message && (
        <p
          role="status"
          className={cn(
            "mb-5 border px-4 py-3 text-fluid-sm",
            message.tone === "ok"
              ? "border-emerald/40 bg-emerald/8 text-emerald"
              : "border-rose/50 bg-rose/8 text-rose",
          )}
        >
          {message.text}
        </p>
      )}

      {/* Body --------------------------------------------------------- */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_28rem] xl:grid-cols-[minmax(0,1fr)_32rem]">
        <div className="min-w-0">
          <div
            role="tablist"
            aria-label="Editor sections"
            className="snap-rail -mx-4 gap-1 border-b border-line px-4 sm:mx-0 sm:px-0"
          >
            {TABS.map((entry) => (
              <button
                key={entry.id}
                role="tab"
                aria-selected={tab === entry.id}
                onClick={() => setTab(entry.id)}
                className={cn(
                  "tap-target shrink-0 snap-start border-b-2 px-4 text-fluid-xs tracking-label-tight transition-colors",
                  tab === entry.id
                    ? "border-ink text-ink"
                    : "border-transparent text-ink-muted hover:text-ink",
                )}
              >
                {entry.label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {tab === "content" && <ContentPanel ownerId={ownerId} />}
            {tab === "events" && <EventsPanel ownerId={ownerId} />}
            {tab === "gallery" && <GalleryPanel ownerId={ownerId} />}
            {tab === "rsvp" && <RsvpPanel />}
            {tab === "design" && <DesignPanel />}
            {tab === "publish" && <PublishPanel />}
          </div>
        </div>

        {/* Desktop preview, sticky beside the controls. */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 h-[calc(100svh-8rem)] border border-line bg-paper">
            <EditorPreview draft={draft} />
          </div>
        </aside>
      </div>

      {/* Mobile bottom bar ------------------------------------------- */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bone/95 px-4 py-3 backdrop-blur-md safe-bottom lg:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setPreviewOpen(true)}
          >
            Preview
          </Button>
          <Button
            variant="emerald"
            className="flex-1"
            onClick={save}
            disabled={saving || !dirty}
          >
            {saving ? "Saving…" : dirty ? "Save" : "Saved"}
          </Button>
        </div>
      </div>

      {/* Mobile preview sheet --------------------------------------- */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-bone lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Invitation preview"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-fluid-xs tracking-label text-ink-muted">Preview</p>
            <Button variant="secondary" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </div>
          <div className="min-h-0 flex-1">
            <EditorPreview draft={draft} />
          </div>
        </div>
      )}
    </div>
  );
}
