"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { normalizeWedding } from "@/lib/wedding/normalize";
import type { WeddingData } from "@/lib/wedding/types";
import { InvitationRenderer } from "@/components/invitation/invitation-renderer";

/**
 * Live preview.
 *
 * The draft is pushed through the same normalizer the server uses, then rendered
 * by the same InvitationRenderer a guest gets. Mobile is the default frame
 * because that is where invitations are actually opened.
 *
 * `replayKey` remounts the renderer so the author can watch the opening sequence
 * again after editing it.
 */

export type PreviewDevice = "mobile" | "desktop";

export function EditorPreview({
  draft,
  className,
}: {
  draft: WeddingData;
  className?: string;
}) {
  const [device, setDevice] = useState<PreviewDevice>("mobile");
  const [replayKey, setReplayKey] = useState(0);

  // Normalizing here means the preview shows exactly what will be saved,
  // including graceful handling of half-finished fields.
  const data = normalizeWedding(draft);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <p className="text-fluid-xs tracking-label text-ink-muted">Live preview</p>

        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="Preview size"
            className="flex border border-line"
          >
            {(["mobile", "desktop"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDevice(option)}
                aria-pressed={device === option}
                className={cn(
                  "tap-target px-3 text-[0.62rem] tracking-label-tight capitalize transition-colors",
                  device === option
                    ? "bg-ink text-bone"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setReplayKey((value) => value + 1)}
            className="tap-target border border-line px-3 text-[0.62rem] tracking-label-tight text-ink-muted transition-colors hover:text-ink"
          >
            Replay opening
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center overflow-hidden bg-bone-dim p-4">
        <div
          className={cn(
            "relative overflow-hidden bg-black shadow-[var(--shadow-lift)]",
            device === "mobile"
              ? "aspect-[390/844] w-full max-w-[390px] rounded-[2rem] border-[8px] border-ink"
              : "aspect-[16/10] w-full rounded-lg border border-ink/20",
          )}
        >
          {/* The invitation scrolls inside its own frame, exactly as on a phone. */}
          <div className="no-scrollbar absolute inset-0 overflow-y-auto overscroll-contain">
            <InvitationRenderer key={replayKey} data={data} mode="preview" />
          </div>
        </div>
      </div>
    </div>
  );
}
