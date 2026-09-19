"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { RsvpResponse, WeddingData } from "@/lib/wedding/types";
import { rsvpTotals } from "@/lib/repository/types";
import { Button, EmptyState, TextInput } from "@/components/ui/controls";

/**
 * RSVP management: totals, search, filtering, per-event breakdown and CSV export.
 * Export is built in the browser from data already on the page, so there is no
 * extra endpoint to secure.
 */

type Filter = "all" | "attending" | "not-attending";

export function RsvpManager({
  invitation,
  responses,
}: {
  invitation: WeddingData;
  responses: RsvpResponse[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const totals = useMemo(() => rsvpTotals(responses), [responses]);
  const eventNames = useMemo(
    () => new Map(invitation.events.map((event) => [event.id, event.name])),
    [invitation.events],
  );

  const perEvent = useMemo(() => {
    return invitation.events
      .filter((event) => event.enabled)
      .map((event) => ({
        id: event.id,
        name: event.name,
        guests: responses
          .filter(
            (response) =>
              response.attendance === "attending" &&
              response.eventIds.includes(event.id),
          )
          .reduce((total, response) => total + Math.max(1, response.guestCount), 0),
      }));
  }, [invitation.events, responses]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return responses.filter((response) => {
      if (filter !== "all" && response.attendance !== filter) return false;
      if (!needle) return true;
      return [response.guestName, response.phone ?? "", response.message ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [responses, query, filter]);

  function exportCsv() {
    const questionColumns = invitation.rsvp.customQuestions;

    const header = [
      "Name",
      "Phone",
      "Attending",
      "Guests",
      "Events",
      "Meal preference",
      "Message",
      ...questionColumns.map((question) => question.label),
      "Submitted",
    ];

    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

    const rows = visible.map((response) =>
      [
        response.guestName,
        response.phone ?? "",
        response.attendance === "attending" ? "Yes" : "No",
        String(response.guestCount),
        response.eventIds.map((id) => eventNames.get(id) ?? id).join("; "),
        response.mealPreference ?? "",
        response.message ?? "",
        ...questionColumns.map((question) => response.answers[question.id] ?? ""),
        response.createdAt,
      ]
        .map(escape)
        .join(","),
    );

    const csv = [header.map(escape).join(","), ...rows].join("\r\n");
    // BOM so Excel opens non-ASCII names correctly.
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${invitation.slug || "invitation"}-rsvps.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const stats = [
    { label: "Responses", value: totals.responses },
    { label: "Attending", value: totals.attending },
    { label: "Declined", value: totals.notAttending },
    { label: "Total guests", value: totals.guests },
  ];

  return (
    <div>
      <section aria-label="Totals" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-line bg-paper px-4 py-5">
            <p className="font-display text-fluid-2xl font-light tabular-nums">
              {stat.value}
            </p>
            <p className="mt-2 text-fluid-xs tracking-label-tight text-ink-muted">
              {stat.label}
            </p>
          </div>
        ))}
      </section>

      {perEvent.length > 0 && totals.attending > 0 && (
        <section className="mt-4 border border-line bg-paper px-5 py-4">
          <h2 className="text-fluid-xs tracking-label text-ink-muted">
            Expected guests per event
          </h2>
          <ul className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
            {perEvent.map((event) => (
              <li key={event.id} className="text-fluid-sm">
                <span className="text-ink-soft">{event.name}</span>{" "}
                <span className="tabular-nums text-ink">{event.guests}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 flex flex-wrap items-end gap-3">
        <TextInput
          className="min-w-[14rem] flex-1"
          label="Search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name, phone or message"
          type="search"
        />

        <div role="group" aria-label="Filter responses" className="flex border border-line">
          {(
            [
              ["all", "All"],
              ["attending", "Attending"],
              ["not-attending", "Declined"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={cn(
                "tap-target px-4 text-fluid-xs tracking-label-tight transition-colors",
                filter === value ? "bg-ink text-bone" : "text-ink-muted hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <Button variant="secondary" onClick={exportCsv} disabled={visible.length === 0}>
          Export CSV
        </Button>
      </div>

      <div className="mt-6">
        {responses.length === 0 ? (
          <EmptyState
            title="No responses yet"
            body="As guests reply through the invitation, they will appear here with their party size and the events they are joining."
          />
        ) : visible.length === 0 ? (
          <EmptyState
            title="Nothing matches"
            body="Try a different search term or clear the filter."
          />
        ) : (
          <>
            {/* Cards on mobile, a table from sm up. */}
            <ul className="space-y-3 sm:hidden">
              {visible.map((response) => (
                <li key={response.id} className="border border-line bg-paper p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-fluid-sm text-ink">{response.guestName}</p>
                    <span
                      className={cn(
                        "shrink-0 border px-2 py-0.5 text-[0.6rem] tracking-label-tight",
                        response.attendance === "attending"
                          ? "border-emerald/50 text-emerald"
                          : "border-line text-ink-muted",
                      )}
                    >
                      {response.attendance === "attending" ? "Attending" : "Declined"}
                    </span>
                  </div>

                  <dl className="mt-3 space-y-1 text-fluid-xs text-ink-muted">
                    {response.phone && <dd>{response.phone}</dd>}
                    {response.attendance === "attending" && (
                      <dd>{response.guestCount} guest(s)</dd>
                    )}
                    {response.eventIds.length > 0 && (
                      <dd>
                        {response.eventIds
                          .map((id) => eventNames.get(id) ?? id)
                          .join(", ")}
                      </dd>
                    )}
                    {response.mealPreference && <dd>{response.mealPreference}</dd>}
                  </dl>

                  {response.message && (
                    <p className="mt-3 border-t border-line pt-3 text-fluid-xs leading-relaxed text-ink-soft">
                      {response.message}
                    </p>
                  )}
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto border border-line bg-paper sm:block">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">Guest responses</caption>
                <thead>
                  <tr className="border-b border-line">
                    {["Guest", "Attending", "Guests", "Events", "Note", "Date"].map(
                      (heading) => (
                        <th
                          key={heading}
                          scope="col"
                          className="px-4 py-3 text-fluid-xs tracking-label-tight font-normal text-ink-muted"
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((response) => (
                    <tr key={response.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3.5 align-top">
                        <p className="text-fluid-sm text-ink">{response.guestName}</p>
                        {response.phone && (
                          <p className="mt-1 text-fluid-xs text-ink-muted">
                            {response.phone}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <span
                          className={cn(
                            "inline-grid place-items-center border px-2 py-0.5 text-[0.6rem] tracking-label-tight",
                            response.attendance === "attending"
                              ? "border-emerald/50 text-emerald"
                              : "border-line text-ink-muted",
                          )}
                        >
                          {response.attendance === "attending" ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-top text-fluid-sm tabular-nums text-ink-soft">
                        {response.attendance === "attending" ? response.guestCount : "—"}
                      </td>
                      <td className="px-4 py-3.5 align-top text-fluid-xs text-ink-soft">
                        {response.eventIds.length > 0
                          ? response.eventIds
                              .map((id) => eventNames.get(id) ?? id)
                              .join(", ")
                          : "—"}
                      </td>
                      <td className="max-w-[18rem] px-4 py-3.5 align-top text-fluid-xs leading-relaxed text-ink-soft">
                        {response.mealPreference && (
                          <span className="block text-ink-muted">
                            {response.mealPreference}
                          </span>
                        )}
                        {response.message ?? (response.mealPreference ? "" : "—")}
                      </td>
                      <td className="px-4 py-3.5 align-top text-fluid-xs whitespace-nowrap text-ink-muted">
                        {response.createdAt.slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
