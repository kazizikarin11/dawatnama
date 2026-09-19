"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils/cn";
import { invitationUrl } from "@/lib/site";
import { coupleNames, formatLongDate } from "@/lib/wedding/format";
import { effectiveDate } from "@/lib/wedding/sections";
import type { WeddingData } from "@/lib/wedding/types";
import { SharePanel } from "@/components/share/share-panel";
import { MusicToggle } from "./music";
import { useStage } from "./stage";

/**
 * The floating controls on a public invitation: sound and share.
 *
 * Deliberately small, always within thumb reach, and hidden until the guest has
 * opened the invitation so the cover stays pristine.
 */
export function InvitationDock({ data }: { data: WeddingData }) {
  const { opened, mode } = useStage();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (mode === "thumbnail") return null;

  const names = coupleNames(data).combined;
  const url = data.slug ? invitationUrl(data.slug) : "";

  return (
    <>
      <div
        className={cn(
          mode === "live" ? "fixed" : "absolute",
          "right-4 bottom-4 z-40 flex flex-col items-end gap-2 transition-opacity duration-700 safe-bottom",
          opened ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <MusicToggle />

        {url && (
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-label="Share this invitation"
            className={cn(
              "tap-target grid size-11 place-items-center rounded-full",
              "border border-[color-mix(in_oklab,var(--t-accent)_45%,transparent)]",
              "bg-[color-mix(in_oklab,var(--t-bg)_70%,transparent)] text-[var(--t-accent)]",
              "backdrop-blur-md transition-colors duration-300",
              "hover:bg-[color-mix(in_oklab,var(--t-accent)_16%,transparent)]",
            )}
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden fill="none">
              <path
                d="M12 3v11m0-11L8.5 6.5M12 3l3.5 3.5M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            className={cn(
              mode === "live" ? "fixed" : "absolute",
              "inset-0 z-[70] flex items-end justify-center bg-black/55 backdrop-blur-sm",
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSheetOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Share this invitation"
          >
            <motion.div
              className="w-full max-w-md border-t border-[var(--t-line)] bg-[var(--t-bg)] p-6 safe-bottom"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-fluid-xs tracking-label text-[var(--t-accent)]">
                  Share the invitation
                </h2>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="tap-target px-3 text-fluid-xs tracking-label text-[var(--t-ink-muted)]"
                >
                  Close
                </button>
              </div>

              <SharePanel
                tone="template"
                url={url}
                names={names}
                date={formatLongDate(effectiveDate(data))}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
