"use client";

import { createId } from "@/lib/utils/id";
import type { RsvpQuestionType } from "@/lib/wedding/types";
import {
  Button,
  Panel,
  Select,
  TextArea,
  TextInput,
  Toggle,
} from "@/components/ui/controls";
import { useEditor } from "../context";

export function RsvpPanel() {
  const editor = useEditor();
  const { rsvp } = editor.draft;

  const setQuestions = (questions: typeof rsvp.customQuestions) =>
    editor.setRsvp({
      customQuestions: questions.map((question, index) => ({
        ...question,
        order: index,
      })),
    });

  return (
    <div className="space-y-4">
      <Panel title="RSVP">
        <div className="space-y-5">
          <Toggle
            label="Collect RSVPs"
            description="Switch off to hide the RSVP section entirely."
            checked={rsvp.enabled}
            onChange={(value) => editor.setRsvp({ enabled: value })}
          />

          <TextInput
            label="Deadline"
            type="date"
            value={rsvp.deadline ?? ""}
            onChange={(event) => editor.setRsvp({ deadline: event.target.value || null })}
            hint="After this date the form closes politely instead of disappearing."
          />

          <TextInput
            label="Heading"
            value={rsvp.headline ?? ""}
            onChange={(event) => editor.setRsvp({ headline: event.target.value || null })}
          />

          <TextArea
            label="Message to guests"
            rows={3}
            value={rsvp.message ?? ""}
            onChange={(event) => editor.setRsvp({ message: event.target.value || null })}
          />

          <TextArea
            label="Confirmation message"
            rows={2}
            value={rsvp.confirmationMessage ?? ""}
            onChange={(event) =>
              editor.setRsvp({ confirmationMessage: event.target.value || null })
            }
            hint="Shown after a guest replies."
          />
        </div>
      </Panel>

      <Panel title="What to ask">
        <div className="space-y-5">
          <Toggle
            label="Phone number"
            checked={rsvp.askPhone}
            onChange={(value) => editor.setRsvp({ askPhone: value })}
          />

          <Toggle
            label="Number of guests"
            checked={rsvp.askGuestCount}
            onChange={(value) => editor.setRsvp({ askGuestCount: value })}
          />

          {rsvp.askGuestCount && (
            <TextInput
              label="Maximum guests per response"
              type="number"
              min={1}
              max={50}
              value={rsvp.maxGuests}
              onChange={(event) =>
                editor.setRsvp({
                  maxGuests: Math.min(50, Math.max(1, Number(event.target.value) || 1)),
                })
              }
            />
          )}

          <Toggle
            label="Which events they will attend"
            checked={rsvp.askEventSelection}
            onChange={(value) => editor.setRsvp({ askEventSelection: value })}
          />

          <Toggle
            label="A note for the couple"
            checked={rsvp.askMessage}
            onChange={(value) => editor.setRsvp({ askMessage: value })}
          />

          <div>
            <Toggle
              label="Meal preference"
              description="Needs at least one option to appear."
              checked={rsvp.askMealPreference}
              onChange={(value) => editor.setRsvp({ askMealPreference: value })}
            />

            {rsvp.askMealPreference && (
              <div className="mt-4 space-y-2">
                {rsvp.mealOptions.map((option, index) => (
                  <div key={`${option}-${index}`} className="flex items-center gap-2">
                    <TextInput
                      className="flex-1"
                      value={option}
                      onChange={(event) => {
                        const mealOptions = [...rsvp.mealOptions];
                        mealOptions[index] = event.target.value;
                        editor.setRsvp({ mealOptions });
                      }}
                    />
                    <Button
                      variant="ghost"
                      aria-label={`Remove option ${index + 1}`}
                      onClick={() =>
                        editor.setRsvp({
                          mealOptions: rsvp.mealOptions.filter(
                            (_, entry) => entry !== index,
                          ),
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  onClick={() =>
                    editor.setRsvp({ mealOptions: [...rsvp.mealOptions, ""] })
                  }
                >
                  Add option
                </Button>
              </div>
            )}
          </div>
        </div>
      </Panel>

      <Panel
        title="Custom questions"
        description="Anything else you need to know — transport, dietary needs, travel plans."
        actions={
          <Button
            variant="secondary"
            onClick={() =>
              setQuestions([
                ...rsvp.customQuestions,
                {
                  id: createId("q"),
                  label: "New question",
                  type: "text",
                  options: [],
                  required: false,
                  order: rsvp.customQuestions.length,
                },
              ])
            }
          >
            Add question
          </Button>
        }
      >
        <div className="space-y-5">
          {rsvp.customQuestions.length === 0 && (
            <p className="text-fluid-sm text-ink-muted">No custom questions.</p>
          )}

          {rsvp.customQuestions.map((question, index) => (
            <div
              key={question.id}
              className="space-y-3 border-b border-line pb-5 last:border-0 last:pb-0"
            >
              <TextInput
                label="Question"
                value={question.label}
                onChange={(event) =>
                  setQuestions(
                    rsvp.customQuestions.map((entry) =>
                      entry.id === question.id
                        ? { ...entry, label: event.target.value }
                        : entry,
                    ),
                  )
                }
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  label="Answer type"
                  value={question.type}
                  onChange={(event) =>
                    setQuestions(
                      rsvp.customQuestions.map((entry) =>
                        entry.id === question.id
                          ? {
                              ...entry,
                              type: event.target.value as RsvpQuestionType,
                            }
                          : entry,
                      ),
                    )
                  }
                >
                  <option value="text">Short text</option>
                  <option value="longtext">Long text</option>
                  <option value="select">Choose one</option>
                  <option value="boolean">Yes or no</option>
                </Select>

                {question.type === "select" && (
                  <TextInput
                    label="Options"
                    value={question.options.join(", ")}
                    onChange={(event) =>
                      setQuestions(
                        rsvp.customQuestions.map((entry) =>
                          entry.id === question.id
                            ? {
                                ...entry,
                                options: event.target.value
                                  .split(",")
                                  .map((option) => option.trim())
                                  .filter(Boolean),
                              }
                            : entry,
                        ),
                      )
                    }
                    hint="Separate with commas."
                  />
                )}
              </div>

              <Toggle
                label="Required"
                checked={question.required}
                onChange={(value) =>
                  setQuestions(
                    rsvp.customQuestions.map((entry) =>
                      entry.id === question.id ? { ...entry, required: value } : entry,
                    ),
                  )
                }
              />

              <Button
                variant="ghost"
                onClick={() =>
                  setQuestions(
                    rsvp.customQuestions.filter((entry) => entry.id !== question.id),
                  )
                }
              >
                Remove question {index + 1}
              </Button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
