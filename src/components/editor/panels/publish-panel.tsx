"use client";

import { useEffect, useState, useTransition } from "react";
import { checkSlugAvailability } from "@/lib/actions/invitations";
import { invitationUrl } from "@/lib/site";
import { slugify } from "@/lib/utils/slug";
import { coupleNames, formatLongDate } from "@/lib/wedding/format";
import { effectiveDate, invitationWarnings } from "@/lib/wedding/sections";
import { Panel, TextArea, TextInput, Toggle } from "@/components/ui/controls";
import { SharePanel } from "@/components/share/share-panel";
import { useEditor } from "../context";

/**
 * Link, publish state, SEO and sharing.
 *
 * Slug availability is checked against the database as the author types, and
 * publishing is blocked with a plain-language reason when something essential is
 * still missing.
 */
export function PublishPanel() {
  const editor = useEditor();
  const { draft } = editor;

  /** The last slug we heard back about, so the message can be derived in render. */
  const [checked, setChecked] = useState<{
    slug: string;
    available: boolean;
    reason: string | null;
  } | null>(null);
  const [, startTransition] = useTransition();

  // Debounced so a fast typist does not trigger a request per keystroke.
  useEffect(() => {
    const slug = draft.slug;
    if (!slug) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      startTransition(async () => {
        const result = await checkSlugAvailability(slug, draft.id);
        if (cancelled) return;
        setChecked({ slug, available: result.available, reason: result.reason });
      });
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draft.slug, draft.id]);

  const slugStatus = !draft.slug
    ? { tone: "error" as const, text: "A link is required." }
    : checked?.slug === draft.slug
      ? checked.available
        ? { tone: "ok" as const, text: "This link is available." }
        : {
            tone: "error" as const,
            text: checked.reason ?? "That link is already taken.",
          }
      : { tone: "muted" as const, text: "Checking availability…" };

  const warnings = invitationWarnings(draft);
  const names = coupleNames(draft).combined;
  const url = draft.slug ? invitationUrl(draft.slug) : "";

  return (
    <div className="space-y-4">
      <Panel title="Public link">
        <div className="space-y-4">
          <TextInput
            label="Invitation address"
            value={draft.slug}
            onChange={(event) => editor.patch({ slug: slugify(event.target.value) })}
            placeholder="ahmed-and-fatima"
          />

          <p className="border border-dashed border-line bg-bone-dim px-3 py-2.5 text-fluid-sm break-all text-ink-soft">
            {url || "/invite/…"}
          </p>

          <p
            aria-live="polite"
            className={
              slugStatus.tone === "error"
                ? "text-fluid-xs text-rose"
                : slugStatus.tone === "ok"
                  ? "text-fluid-xs text-emerald"
                  : "text-fluid-xs text-ink-muted"
            }
          >
            {slugStatus.text}
          </p>
        </div>
      </Panel>

      <Panel title="Publish">
        <div className="space-y-5">
          <Toggle
            label="Published"
            description="Only published invitations can be opened by guests. Drafts stay private to you."
            checked={draft.status === "published"}
            onChange={(value) => editor.patch({ status: value ? "published" : "draft" })}
          />

          {warnings.length > 0 && (
            <div className="border border-brass/40 bg-brass/8 px-4 py-3">
              <p className="text-fluid-xs tracking-label-tight text-brass">
                Before publishing
              </p>
              <ul className="mt-2.5 space-y-1.5">
                {warnings.map((warning) => (
                  <li key={warning} className="text-fluid-xs leading-relaxed text-ink-soft">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Panel>

      {draft.status === "published" && url && (
        <Panel
          title="Share"
          description="The link opens beautifully from WhatsApp on a phone, and the QR code suits printed cards."
        >
          <SharePanel
            url={url}
            names={names}
            date={formatLongDate(effectiveDate(draft))}
          />
        </Panel>
      )}

      <Panel
        title="Link preview"
        description="How the invitation appears when shared. Leave blank to use your names and date automatically."
      >
        <div className="space-y-4">
          <TextInput
            label="Title"
            value={draft.seo.title ?? ""}
            onChange={(event) => editor.setSeo({ title: event.target.value || null })}
            placeholder={`${names} — Wedding Invitation`}
          />
          <TextArea
            label="Description"
            rows={3}
            value={draft.seo.description ?? ""}
            onChange={(event) =>
              editor.setSeo({ description: event.target.value || null })
            }
            placeholder={draft.couple.shortDescription ?? draft.invitationMessage ?? ""}
          />
          <p className="text-fluid-xs leading-relaxed text-ink-muted">
            The preview image is generated from your names and date, so it always
            looks correct even without a photograph.
          </p>
        </div>
      </Panel>
    </div>
  );
}
