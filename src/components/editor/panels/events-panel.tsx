"use client";

import { useEditor } from "../context";
import { ImageField } from "../image-field";
import {
  Button,
  Panel,
  TextArea,
  TextInput,
  Toggle,
} from "@/components/ui/controls";

/**
 * Events are fully dynamic: any number, any names, reorderable, and each one can
 * be switched off without being deleted. Nothing assumes a particular set of
 * functions — Mehndi, Nikah, Dholki, Walima or anything else.
 */
const SUGGESTIONS = [
  "Dholki",
  "Mayoun",
  "Mehndi",
  "Nikah",
  "Walima",
  "Reception",
  "Family dinner",
];

export function EventsPanel({ ownerId }: { ownerId: string }) {
  const editor = useEditor();
  const { draft } = editor;

  return (
    <div className="space-y-4">
      <Panel
        title="Events"
        description="Add as many functions as your family is holding. Guests only see the ones that are switched on."
        actions={
          <Button variant="secondary" onClick={editor.addEvent}>
            Add event
          </Button>
        }
      >
        {draft.events.length === 0 ? (
          <p className="text-fluid-sm text-ink-muted">
            No events yet. Add the Nikah to begin.
          </p>
        ) : (
          <div className="space-y-6">
            {draft.events.map((event, index) => (
              <article
                key={event.id}
                className="space-y-4 border-b border-line pb-6 last:border-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-fluid-xs tracking-label-tight text-brass">
                    Event {index + 1}
                  </p>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      aria-label="Move earlier"
                      disabled={index === 0}
                      onClick={() => editor.moveEvent(event.id, -1)}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label="Move later"
                      disabled={index === draft.events.length - 1}
                      onClick={() => editor.moveEvent(event.id, 1)}
                    >
                      ↓
                    </Button>
                    <Button variant="ghost" onClick={() => editor.removeEvent(event.id)}>
                      Remove
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <TextInput
                    label="Event name"
                    value={event.name}
                    onChange={(changed) =>
                      editor.updateEvent(event.id, { name: changed.target.value })
                    }
                    list={`event-suggestions-${event.id}`}
                  />
                  <datalist id={`event-suggestions-${event.id}`}>
                    {SUGGESTIONS.map((suggestion) => (
                      <option key={suggestion} value={suggestion} />
                    ))}
                  </datalist>

                  <TextInput
                    label="Subtitle"
                    value={event.subtitle ?? ""}
                    onChange={(changed) =>
                      editor.updateEvent(event.id, {
                        subtitle: changed.target.value || null,
                      })
                    }
                    placeholder="The marriage ceremony"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <TextInput
                    label="Date"
                    type="date"
                    value={event.date ?? ""}
                    onChange={(changed) =>
                      editor.updateEvent(event.id, { date: changed.target.value || null })
                    }
                  />
                  <TextInput
                    label="Starts"
                    type="time"
                    value={event.startTime ?? ""}
                    onChange={(changed) =>
                      editor.updateEvent(event.id, {
                        startTime: changed.target.value || null,
                      })
                    }
                  />
                  <TextInput
                    label="Ends"
                    type="time"
                    value={event.endTime ?? ""}
                    onChange={(changed) =>
                      editor.updateEvent(event.id, {
                        endTime: changed.target.value || null,
                      })
                    }
                  />
                </div>

                <TextArea
                  label="Description"
                  rows={2}
                  value={event.description ?? ""}
                  onChange={(changed) =>
                    editor.updateEvent(event.id, {
                      description: changed.target.value || null,
                    })
                  }
                />

                <TextInput
                  label="Dress code for this event"
                  value={event.dressCode ?? ""}
                  onChange={(changed) =>
                    editor.updateEvent(event.id, {
                      dressCode: changed.target.value || null,
                    })
                  }
                  placeholder="Formal, modest attire"
                />

                {/* Venue -------------------------------------------------- */}
                <div className="space-y-3 border border-line bg-bone-dim/60 p-4">
                  <p className="text-fluid-xs tracking-label-tight text-ink-muted">
                    Venue
                  </p>

                  <TextInput
                    label="Venue name"
                    value={event.venue?.name ?? ""}
                    onChange={(changed) =>
                      editor.updateEvent(event.id, {
                        venue: {
                          id: event.venue?.id ?? `venue_${event.id}`,
                          name: changed.target.value,
                          address: event.venue?.address ?? null,
                          mapLink: event.venue?.mapLink ?? null,
                          latitude: event.venue?.latitude ?? null,
                          longitude: event.venue?.longitude ?? null,
                          image: event.venue?.image ?? null,
                          note: event.venue?.note ?? null,
                        },
                      })
                    }
                    placeholder="Noor Banquet Hall"
                  />

                  <TextArea
                    label="Full address"
                    rows={2}
                    value={event.venue?.address ?? ""}
                    disabled={!event.venue}
                    onChange={(changed) =>
                      event.venue &&
                      editor.updateEvent(event.id, {
                        venue: { ...event.venue, address: changed.target.value || null },
                      })
                    }
                  />

                  <TextInput
                    label="Google Maps link"
                    value={event.venue?.mapLink ?? ""}
                    disabled={!event.venue}
                    onChange={(changed) =>
                      event.venue &&
                      editor.updateEvent(event.id, {
                        venue: { ...event.venue, mapLink: changed.target.value || null },
                      })
                    }
                    hint="Optional. Without it, directions fall back to a Maps search for the address."
                  />

                  <TextInput
                    label="Note for guests"
                    value={event.venue?.note ?? ""}
                    disabled={!event.venue}
                    onChange={(changed) =>
                      event.venue &&
                      editor.updateEvent(event.id, {
                        venue: { ...event.venue, note: changed.target.value || null },
                      })
                    }
                    placeholder="Parking available at the rear entrance."
                  />

                  {event.venue && (
                    <ImageField
                      label="Venue photograph"
                      ownerId={ownerId}
                      value={event.venue.image}
                      onChange={(image) =>
                        event.venue &&
                        editor.updateEvent(event.id, {
                          venue: { ...event.venue, image },
                        })
                      }
                    />
                  )}
                </div>

                <ImageField
                  label="Event image"
                  ownerId={ownerId}
                  value={event.image}
                  onChange={(image) => editor.updateEvent(event.id, { image })}
                />

                <div className="space-y-3 pt-1">
                  <Toggle
                    label="Show this event"
                    checked={event.enabled}
                    onChange={(value) => editor.updateEvent(event.id, { enabled: value })}
                  />
                  <Toggle
                    label="Ask guests to RSVP for this event"
                    description="When no event requires RSVP, guests can choose from all of them."
                    checked={event.rsvpRequired}
                    onChange={(value) =>
                      editor.updateEvent(event.id, { rsvpRequired: value })
                    }
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
