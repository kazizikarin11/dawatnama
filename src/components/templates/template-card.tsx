"use client";

import { cn } from "@/lib/utils/cn";
import type { TemplateMeta } from "@/templates/contract";

/**
 * Template picker card.
 *
 * The palette strip and type specimen are drawn from the template's own metadata,
 * so the five cards look as different from each other as the templates do.
 */
export function TemplateCard({
  template,
  selected,
  onSelect,
  footer,
}: {
  template: TemplateMeta;
  selected?: boolean;
  onSelect?: () => void;
  footer?: React.ReactNode;
}) {
  const [bg, , accent, ...rest] = template.palette;
  const ink = template.colorScheme === "dark" ? "#f5efe3" : "#2b2722";

  const specimenFont =
    {
      "royal-emerald": "var(--font-cormorant)",
      "ivory-rose": "var(--font-playfair)",
      "midnight-crescent": "var(--font-cormorant)",
      "mughal-arch": "var(--font-marcellus)",
      "minimal-signature": "var(--font-italiana)",
    }[template.id] ?? "var(--font-cormorant)";

  return (
    <div
      className={cn(
        "flex flex-col border bg-paper transition-colors duration-300",
        selected ? "border-emerald" : "border-line hover:border-line-strong",
      )}
    >
      {/* Type specimen on the template's own ground colour. */}
      <div
        className="relative flex aspect-[4/3] flex-col items-center justify-center overflow-hidden px-4 text-center"
        style={{ backgroundColor: bg }}
      >
        <span
          className="text-[0.55rem] tracking-[0.3em] uppercase"
          style={{ color: accent }}
        >
          The wedding of
        </span>
        <span
          className="mt-2 text-[1.45rem] leading-[1.1]"
          style={{
            fontFamily: specimenFont,
            color: ink,
            textTransform:
              template.id === "mughal-arch" || template.id === "minimal-signature"
                ? "uppercase"
                : "none",
            letterSpacing:
              template.id === "mughal-arch" || template.id === "minimal-signature"
                ? "0.05em"
                : "0",
          }}
        >
          Fatima
          <span className="mx-1.5" style={{ color: accent }}>
            &amp;
          </span>
          Ahmed
        </span>
        <span
          aria-hidden
          className="mt-3 h-px w-16"
          style={{ backgroundColor: accent, opacity: 0.7 }}
        />
        <span
          className="mt-3 text-[0.55rem] tracking-[0.28em] uppercase"
          style={{ color: ink, opacity: 0.6 }}
        >
          12 December 2026
        </span>

        <span aria-hidden className="absolute inset-x-0 bottom-0 flex h-2">
          {[accent, ...rest].filter(Boolean).map((colour) => (
            <span key={colour} className="flex-1" style={{ backgroundColor: colour }} />
          ))}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-fluid-lg font-light">{template.name}</h3>
          {selected && (
            <span className="text-[0.62rem] tracking-label-tight text-emerald">
              Selected
            </span>
          )}
        </div>

        <p className="mt-2 flex-1 text-fluid-xs leading-relaxed text-ink-soft">
          {template.tagline}
        </p>

        <dl className="mt-4 space-y-1.5 text-[0.68rem] leading-relaxed text-ink-muted">
          <div className="flex gap-2">
            <dt className="shrink-0 tracking-label-tight">Type</dt>
            <dd>{template.typography}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 tracking-label-tight">Motion</dt>
            <dd>{template.motion}</dd>
          </div>
        </dl>

        {onSelect && (
          <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            className={cn(
              "tap-target mt-5 grid place-items-center border px-4 text-fluid-xs tracking-label-tight transition-colors duration-300",
              selected
                ? "border-emerald bg-emerald text-bone"
                : "border-ink text-ink hover:bg-ink hover:text-bone",
            )}
          >
            {selected ? "Selected" : "Use this design"}
          </button>
        )}

        {footer && <div className="mt-3">{footer}</div>}
      </div>
    </div>
  );
}
