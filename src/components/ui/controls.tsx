"use client";

import Link from "next/link";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Platform UI primitives for the dashboard and editor.
 *
 * Deliberately quiet: hairline borders, flat surfaces, small tracked labels. The
 * chrome should never compete with the invitation being previewed beside it.
 */

const BUTTON_BASE =
  "tap-target inline-grid place-items-center px-5 text-fluid-xs tracking-label-tight transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50";

const BUTTON_VARIANTS = {
  primary: "bg-ink text-bone hover:bg-emerald-deep",
  secondary: "border border-line bg-paper text-ink hover:border-line-strong hover:bg-bone",
  emerald: "bg-emerald text-bone hover:bg-emerald-deep",
  ghost: "text-ink-soft hover:text-ink",
  danger: "border border-rose/60 text-rose hover:bg-rose/10",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;

export function Button({
  children,
  variant = "primary",
  className,
  type = "button",
  ...rest
}: {
  children: ReactNode;
  variant?: ButtonVariant;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(BUTTON_BASE, BUTTON_VARIANTS[variant], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  variant = "secondary",
  className,
  external,
}: {
  children: ReactNode;
  href: string;
  variant?: ButtonVariant;
  className?: string;
  external?: boolean;
}) {
  const classes = cn(BUTTON_BASE, BUTTON_VARIANTS[variant], className);

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

export function Label({
  children,
  htmlFor,
  className,
}: {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("mb-2 block text-fluid-xs tracking-label-tight text-ink-muted", className)}
    >
      {children}
    </label>
  );
}

const FIELD_CLASS =
  "w-full border border-line bg-paper px-3 py-2.5 text-fluid-sm text-ink outline-none transition-colors duration-200 placeholder:text-ink-muted/70 focus:border-brass";

export function TextInput({
  label,
  hint,
  className,
  id,
  ...rest
}: {
  label?: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const generated = useId();
  const fieldId = id ?? generated;

  return (
    <div className={className}>
      {label && <Label htmlFor={fieldId}>{label}</Label>}
      <input id={fieldId} className={FIELD_CLASS} {...rest} />
      {hint && <p className="mt-1.5 text-fluid-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

export function TextArea({
  label,
  hint,
  className,
  id,
  rows = 4,
  ...rest
}: {
  label?: string;
  hint?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const generated = useId();
  const fieldId = id ?? generated;

  return (
    <div className={className}>
      {label && <Label htmlFor={fieldId}>{label}</Label>}
      <textarea
        id={fieldId}
        rows={rows}
        className={cn(FIELD_CLASS, "resize-y leading-relaxed")}
        {...rest}
      />
      {hint && <p className="mt-1.5 text-fluid-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

export function Select({
  label,
  hint,
  className,
  id,
  children,
  ...rest
}: {
  label?: string;
  hint?: string;
  children: ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const generated = useId();
  const fieldId = id ?? generated;

  return (
    <div className={className}>
      {label && <Label htmlFor={fieldId}>{label}</Label>}
      <select id={fieldId} className={FIELD_CLASS} {...rest}>
        {children}
      </select>
      {hint && <p className="mt-1.5 text-fluid-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

/** Accessible switch built on a real checkbox. */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  className?: string;
}) {
  const id = useId();

  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <label htmlFor={id} className="block text-fluid-sm text-ink">
          {label}
        </label>
        {description && (
          <p className="mt-1 text-fluid-xs leading-relaxed text-ink-muted">{description}</p>
        )}
      </div>

      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 border transition-colors duration-300",
          checked ? "border-emerald bg-emerald" : "border-line bg-bone-dim",
        )}
      >
        <span
          className={cn(
            "absolute top-[3px] size-4 bg-paper transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            checked ? "translate-x-[1.4rem]" : "translate-x-[3px]",
          )}
        />
      </button>
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  className,
  actions,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={cn("border border-line bg-paper", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h2 className="text-fluid-xs tracking-label text-ink-muted">{title}</h2>
            )}
            {description && (
              <p className="mt-2 max-w-prose text-fluid-xs leading-relaxed text-ink-muted">
                {description}
              </p>
            )}
          </div>
          {actions}
        </header>
      )}
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "live" | "draft";
}) {
  const tones = {
    neutral: "border-line text-ink-muted",
    live: "border-emerald/50 bg-emerald/10 text-emerald",
    draft: "border-brass/50 bg-brass/10 text-brass",
  } as const;

  return (
    <span
      className={cn(
        "inline-grid place-items-center border px-2.5 py-1 text-[0.62rem] tracking-label-tight",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-line px-6 py-14 text-center">
      <h3 className="font-display text-fluid-xl font-light">{title}</h3>
      <p className="mx-auto mt-3 max-w-sm text-fluid-sm leading-relaxed text-ink-muted">
        {body}
      </p>
      {action && <div className="mt-7 flex justify-center">{action}</div>}
    </div>
  );
}
