"use client";

import { useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils/cn";
import { formatLongDate } from "@/lib/wedding/format";
import { rsvpEvents } from "@/lib/wedding/sections";
import type { RsvpAttendance, WeddingData } from "@/lib/wedding/types";
import type { RenderMode } from "@/templates/contract";
import { useMotionSettings } from "@/components/motion/motion-settings";

/**
 * The RSVP form. One implementation of the logic — field visibility, validation,
 * submission, deadline handling, confirmation — with five visual variants so each
 * template keeps its own identity without duplicating any behaviour.
 */

export type RsvpVariant =
  | "ornate"
  | "editorial"
  | "cinematic"
  | "architectural"
  | "minimal";

const FIELD_BASE =
  "w-full bg-transparent text-[var(--t-ink)] placeholder:text-[color-mix(in_oklab,var(--t-ink-muted)_70%,transparent)] transition-colors duration-300 outline-none";

const VARIANTS: Record<
  RsvpVariant,
  { field: string; label: string; button: string; chip: string; chipOn: string }
> = {
  ornate: {
    field:
      "border border-[var(--t-line)] bg-[color-mix(in_oklab,var(--t-surface)_60%,transparent)] px-4 py-3 focus:border-[var(--t-accent)]",
    label: "text-fluid-xs tracking-label text-[var(--t-accent)]",
    button:
      "border border-[var(--t-accent)] bg-[color-mix(in_oklab,var(--t-accent)_14%,transparent)] tracking-label text-fluid-xs text-[var(--t-accent)] hover:bg-[color-mix(in_oklab,var(--t-accent)_26%,transparent)]",
    chip: "border border-[var(--t-line)] text-[var(--t-ink-soft)]",
    chipOn:
      "border-[var(--t-accent)] bg-[color-mix(in_oklab,var(--t-accent)_18%,transparent)] text-[var(--t-ink)]",
  },
  editorial: {
    field:
      "border-b border-[var(--t-line)] px-1 py-3 focus:border-[var(--t-accent)] rounded-none",
    label: "text-fluid-xs tracking-label-tight text-[var(--t-ink-muted)]",
    button:
      "bg-[var(--t-ink)] text-[var(--t-bg)] tracking-label-tight text-fluid-xs hover:bg-[var(--t-accent)]",
    chip: "border border-[var(--t-line)] text-[var(--t-ink-soft)] rounded-full",
    chipOn:
      "border-[var(--t-accent)] bg-[var(--t-accent)] text-[var(--t-bg)] rounded-full",
  },
  cinematic: {
    field:
      "border border-[color-mix(in_oklab,var(--t-line)_80%,transparent)] bg-[color-mix(in_oklab,var(--t-surface)_45%,transparent)] px-4 py-3 backdrop-blur-sm focus:border-[var(--t-accent)]",
    label: "text-fluid-xs tracking-label text-[var(--t-ink-muted)]",
    button:
      "border border-[var(--t-accent)] tracking-label text-fluid-xs text-[var(--t-accent)] hover:bg-[color-mix(in_oklab,var(--t-accent)_18%,transparent)]",
    chip: "border border-[color-mix(in_oklab,var(--t-line)_70%,transparent)] text-[var(--t-ink-soft)]",
    chipOn: "border-[var(--t-accent)] text-[var(--t-accent)]",
  },
  architectural: {
    field:
      "border border-[var(--t-line)] bg-[var(--t-surface)] px-4 py-3 focus:border-[var(--t-accent)]",
    label: "text-fluid-xs tracking-label text-[var(--t-ink-muted)]",
    button:
      "bg-[var(--t-accent)] text-[var(--t-bg)] tracking-label text-fluid-xs hover:opacity-90",
    chip: "border border-[var(--t-line)] text-[var(--t-ink-soft)]",
    chipOn: "border-[var(--t-accent)] bg-[var(--t-accent)] text-[var(--t-bg)]",
  },
  minimal: {
    field:
      "border-b border-[var(--t-line)] py-3 focus:border-[var(--t-ink)] rounded-none",
    label: "text-fluid-xs tracking-label text-[var(--t-ink-muted)]",
    button:
      "border border-[var(--t-ink)] tracking-label text-fluid-xs text-[var(--t-ink)] hover:bg-[var(--t-ink)] hover:text-[var(--t-bg)]",
    chip: "border border-[var(--t-line)] text-[var(--t-ink-soft)]",
    chipOn: "border-[var(--t-ink)] bg-[var(--t-ink)] text-[var(--t-bg)]",
  },
};

interface RsvpFormProps {
  data: WeddingData;
  mode: RenderMode;
  variant: RsvpVariant;
  className?: string;
}

export function RsvpForm({ data, mode, variant, className }: RsvpFormProps) {
  const styles = VARIANTS[variant];
  const settings = useMotionSettings();
  const events = useMemo(() => rsvpEvents(data), [data]);
  const { rsvp } = data;

  const [attendance, setAttendance] = useState<RsvpAttendance>("attending");
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [selectedEvents, setSelectedEvents] = useState<string[]>(
    events.map((event) => event.id),
  );
  const [meal, setMeal] = useState(rsvp.mealOptions[0] ?? "");
  const [message, setMessage] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const deadlinePassed = useMemo(() => {
    if (!rsvp.deadline) return false;
    const today = new Date().toISOString().slice(0, 10);
    return rsvp.deadline < today;
  }, [rsvp.deadline]);

  const attending = attendance === "attending";

  const toggleEvent = (id: string) => {
    setSelectedEvents((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const name = guestName.trim();
    if (name.length < 2) {
      setError("Please enter your name so the couple know who replied.");
      return;
    }

    const missing = rsvp.customQuestions.find(
      (question) => question.required && !answers[question.id]?.trim(),
    );
    if (missing) {
      setError(`Please answer: ${missing.label}`);
      return;
    }

    setError(null);

    // The editor preview must never write a real response.
    if (mode !== "live" || !data.slug) {
      setStatus("done");
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch(`/api/invite/${data.slug}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: name,
          phone: rsvp.askPhone ? phone.trim() || null : null,
          attendance,
          guestCount: attending && rsvp.askGuestCount ? guestCount : attending ? 1 : 0,
          eventIds: attending && rsvp.askEventSelection ? selectedEvents : [],
          mealPreference: attending && rsvp.askMealPreference ? meal : null,
          message: rsvp.askMessage ? message.trim() || null : null,
          answers,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Your response could not be saved.");
      }

      setStatus("done");
    } catch (submitError) {
      setStatus("error");
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Your response could not be saved.",
      );
    }
  }

  if (deadlinePassed) {
    return (
      <div className={cn("text-center", className)}>
        <p className="text-fluid-base text-[var(--t-ink-soft)]">
          The RSVP window closed on {formatLongDate(rsvp.deadline)}. Please contact
          the family directly and they will do their best to accommodate you.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <AnimatePresence mode="wait" initial={false}>
        {status === "done" ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: settings.enabled ? 16 : 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: settings.duration }}
            className="py-6 text-center"
            role="status"
            aria-live="polite"
          >
            <p className="text-fluid-lg text-[var(--t-ink)]">
              {rsvp.confirmationMessage ?? "Thank you — your response has been recorded."}
            </p>
            {mode !== "live" && (
              <p className="mt-3 text-fluid-xs tracking-label text-[var(--t-ink-muted)]">
                Preview mode — nothing was saved
              </p>
            )}
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            noValidate
            initial={false}
            className="space-y-7 text-left"
          >
            {/* Attendance -------------------------------------------------- */}
            <fieldset>
              <legend className={cn("mb-3 block", styles.label)}>
                Will you attend?
              </legend>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["attending", "Joyfully accept"],
                    ["not-attending", "Regretfully decline"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAttendance(value)}
                    aria-pressed={attendance === value}
                    className={cn(
                      "tap-target px-4 py-3 text-fluid-sm transition-colors duration-300",
                      attendance === value ? styles.chipOn : styles.chip,
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Name -------------------------------------------------------- */}
            <Field label="Your name" htmlFor="rsvp-name" labelClass={styles.label}>
              <input
                id="rsvp-name"
                name="guestName"
                type="text"
                required
                autoComplete="name"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="Full name"
                className={cn(FIELD_BASE, styles.field)}
              />
            </Field>

            {rsvp.askPhone && (
              <Field
                label="Phone number"
                htmlFor="rsvp-phone"
                labelClass={styles.label}
                hint="So the family can reach you about arrangements."
              >
                <input
                  id="rsvp-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+92 300 0000000"
                  className={cn(FIELD_BASE, styles.field)}
                />
              </Field>
            )}

            {/* Attending-only fields --------------------------------------- */}
            {attending && rsvp.askGuestCount && (
              <Field
                label="Guests attending"
                htmlFor="rsvp-guests"
                labelClass={styles.label}
                hint={`Including yourself, up to ${rsvp.maxGuests}.`}
              >
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setGuestCount((value) => Math.max(1, value - 1))}
                    aria-label="One guest fewer"
                    className={cn("tap-target px-4 text-fluid-lg", styles.chip)}
                  >
                    −
                  </button>
                  <input
                    id="rsvp-guests"
                    name="guestCount"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={rsvp.maxGuests}
                    value={guestCount}
                    onChange={(event) =>
                      setGuestCount(
                        Math.min(
                          rsvp.maxGuests,
                          Math.max(1, Number(event.target.value) || 1),
                        ),
                      )
                    }
                    className={cn(FIELD_BASE, styles.field, "w-20 text-center")}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setGuestCount((value) => Math.min(rsvp.maxGuests, value + 1))
                    }
                    aria-label="One guest more"
                    className={cn("tap-target px-4 text-fluid-lg", styles.chip)}
                  >
                    +
                  </button>
                </div>
              </Field>
            )}

            {attending && rsvp.askEventSelection && events.length > 0 && (
              <fieldset>
                <legend className={cn("mb-3 block", styles.label)}>
                  Which events will you join?
                </legend>
                <div className="flex flex-wrap gap-2">
                  {events.map((event) => {
                    const on = selectedEvents.includes(event.id);
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => toggleEvent(event.id)}
                        aria-pressed={on}
                        className={cn(
                          "tap-target px-4 py-2 text-fluid-sm transition-colors duration-300",
                          on ? styles.chipOn : styles.chip,
                        )}
                      >
                        {event.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {attending && rsvp.askMealPreference && rsvp.mealOptions.length > 0 && (
              <Field label="Meal preference" htmlFor="rsvp-meal" labelClass={styles.label}>
                <select
                  id="rsvp-meal"
                  name="mealPreference"
                  value={meal}
                  onChange={(event) => setMeal(event.target.value)}
                  className={cn(FIELD_BASE, styles.field)}
                >
                  {rsvp.mealOptions.map((option) => (
                    <option key={option} value={option} className="text-black">
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {/* Custom questions ------------------------------------------- */}
            {rsvp.customQuestions.map((question) => {
              const id = `rsvp-q-${question.id}`;
              const value = answers[question.id] ?? "";
              const setValue = (next: string) =>
                setAnswers((current) => ({ ...current, [question.id]: next }));

              return (
                <Field
                  key={question.id}
                  label={question.label}
                  htmlFor={id}
                  labelClass={styles.label}
                  required={question.required}
                >
                  {question.type === "boolean" ? (
                    <div className="flex gap-3">
                      {["Yes", "No"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setValue(option)}
                          aria-pressed={value === option}
                          className={cn(
                            "tap-target px-5 py-2 text-fluid-sm",
                            value === option ? styles.chipOn : styles.chip,
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : question.type === "select" ? (
                    <select
                      id={id}
                      value={value}
                      required={question.required}
                      onChange={(event) => setValue(event.target.value)}
                      className={cn(FIELD_BASE, styles.field)}
                    >
                      <option value="" className="text-black">
                        Please choose
                      </option>
                      {question.options.map((option) => (
                        <option key={option} value={option} className="text-black">
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : question.type === "longtext" ? (
                    <textarea
                      id={id}
                      rows={3}
                      value={value}
                      required={question.required}
                      onChange={(event) => setValue(event.target.value)}
                      className={cn(FIELD_BASE, styles.field, "resize-none")}
                    />
                  ) : (
                    <input
                      id={id}
                      type="text"
                      value={value}
                      required={question.required}
                      onChange={(event) => setValue(event.target.value)}
                      className={cn(FIELD_BASE, styles.field)}
                    />
                  )}
                </Field>
              );
            })}

            {rsvp.askMessage && (
              <Field
                label="A note for the couple"
                htmlFor="rsvp-message"
                labelClass={styles.label}
              >
                <textarea
                  id="rsvp-message"
                  name="message"
                  rows={4}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Duas, wishes, or anything you'd like them to know."
                  className={cn(FIELD_BASE, styles.field, "resize-none")}
                />
              </Field>
            )}

            {error && (
              <p role="alert" className="text-fluid-sm text-[var(--t-accent)]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className={cn(
                "tap-target w-full px-8 py-4 transition-all duration-300 disabled:opacity-60",
                styles.button,
              )}
            >
              {status === "sending" ? "Sending…" : "Send response"}
            </button>

            {rsvp.deadline && (
              <p className="text-center text-fluid-xs text-[var(--t-ink-muted)]">
                Kindly respond by {formatLongDate(rsvp.deadline)}
              </p>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  labelClass,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  labelClass: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={cn("mb-2 block", labelClass)}>
        {label}
        {required && <span aria-hidden> *</span>}
      </label>
      {children}
      {hint && (
        <p className="mt-2 text-fluid-xs text-[var(--t-ink-muted)]">{hint}</p>
      )}
    </div>
  );
}
