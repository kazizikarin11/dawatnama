"use client";

import { useEditor } from "../context";
import { ImageField } from "../image-field";
import {
  Button,
  Panel,
  Select,
  TextArea,
  TextInput,
} from "@/components/ui/controls";

/**
 * General information: who, when, the wording, and the optional Islamic content.
 * Every religious text is editable and nothing is invented by the platform.
 */
export function ContentPanel({ ownerId }: { ownerId: string }) {
  const editor = useEditor();
  const { draft } = editor;

  return (
    <div className="space-y-4">
      <Panel title="The couple">
        <div className="space-y-6">
          {(["bride", "groom"] as const).map((role) => {
            const party = draft.couple[role];
            return (
              <div key={role} className="space-y-4 border-b border-line pb-6 last:border-0 last:pb-0">
                <p className="text-fluid-xs tracking-label-tight text-brass capitalize">
                  {role}
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <TextInput
                    label="Full name"
                    value={party.name}
                    onChange={(event) =>
                      editor.setParty(role, { name: event.target.value })
                    }
                    placeholder={role === "bride" ? "Fatima Zahra Hasan" : "Ahmed Bilal Khan"}
                  />
                  <TextInput
                    label="Short name"
                    value={party.shortName ?? ""}
                    onChange={(event) =>
                      editor.setParty(role, { shortName: event.target.value || null })
                    }
                    hint="Used where the design sets names very large."
                    placeholder={role === "bride" ? "Fatima" : "Ahmed"}
                  />
                </div>

                <TextInput
                  label="Parents"
                  value={party.parents ?? ""}
                  onChange={(event) =>
                    editor.setParty(role, { parents: event.target.value || null })
                  }
                  placeholder="Daughter of Mr. & Mrs. …"
                />

                <TextArea
                  label="A short introduction"
                  rows={3}
                  value={party.description ?? ""}
                  onChange={(event) =>
                    editor.setParty(role, { description: event.target.value || null })
                  }
                />

                <ImageField
                  label="Portrait"
                  ownerId={ownerId}
                  value={party.photo}
                  onChange={(image) => editor.setParty(role, { photo: image })}
                  aspect="aspect-[3/4]"
                />
              </div>
            );
          })}

          <Select
            label="Whose name comes first?"
            value={draft.couple.order}
            onChange={(event) =>
              editor.patch({
                couple: {
                  ...draft.couple,
                  order: event.target.value === "groom-first" ? "groom-first" : "bride-first",
                },
              })
            }
          >
            <option value="bride-first">Bride first</option>
            <option value="groom-first">Groom first</option>
          </Select>

          <TextArea
            label="About you both"
            rows={3}
            value={draft.couple.shortDescription ?? ""}
            onChange={(event) =>
              editor.patch({
                couple: {
                  ...draft.couple,
                  shortDescription: event.target.value || null,
                },
              })
            }
            hint="One or two sentences, shown in the couple section."
          />
        </div>
      </Panel>

      <Panel title="Date and cover">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Wedding date"
              type="date"
              value={draft.weddingDate ?? ""}
              onChange={(event) => editor.patch({ weddingDate: event.target.value || null })}
            />
            <TextInput
              label="Start time"
              type="time"
              value={draft.weddingTime ?? ""}
              onChange={(event) => editor.patch({ weddingTime: event.target.value || null })}
              hint="Drives the countdown."
            />
          </div>

          <TextInput
            label="Hijri date"
            value={draft.hijriDate ?? ""}
            onChange={(event) => editor.patch({ hijriDate: event.target.value || null })}
            placeholder="Rajab 1448 AH"
            hint="Optional, and entered by you so it is always accurate."
          />

          <ImageField
            label="Cover image"
            ownerId={ownerId}
            value={draft.heroImage}
            onChange={(image) => editor.patch({ heroImage: image })}
            hint="Used on the opening cover and in the WhatsApp preview."
          />
        </div>
      </Panel>

      <Panel title="Invitation wording">
        <div className="space-y-4">
          <TextArea
            label="Invitation message"
            rows={4}
            value={draft.invitationMessage ?? ""}
            onChange={(event) =>
              editor.patch({ invitationMessage: event.target.value || null })
            }
          />
          <TextArea
            label="Family invitation wording"
            rows={2}
            value={draft.familyInvitationWording ?? ""}
            onChange={(event) =>
              editor.patch({ familyInvitationWording: event.target.value || null })
            }
            placeholder="Mr. & Mrs. … together with Mr. & Mrs. … request the honour of your presence."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Bride's family"
              value={draft.familyNames.bride ?? ""}
              onChange={(event) =>
                editor.patch({
                  familyNames: { ...draft.familyNames, bride: event.target.value || null },
                })
              }
              placeholder="The Hasan Family"
            />
            <TextInput
              label="Groom's family"
              value={draft.familyNames.groom ?? ""}
              onChange={(event) =>
                editor.patch({
                  familyNames: { ...draft.familyNames, groom: event.target.value || null },
                })
              }
              placeholder="The Khan Family"
            />
          </div>

          <TextArea
            label="Gratitude message"
            rows={3}
            value={draft.gratitudeMessage ?? ""}
            onChange={(event) =>
              editor.patch({ gratitudeMessage: event.target.value || null })
            }
          />

          <TextArea
            label="Closing message"
            rows={2}
            value={draft.closingMessage ?? ""}
            onChange={(event) =>
              editor.patch({ closingMessage: event.target.value || null })
            }
          />
        </div>
      </Panel>

      <Panel
        title="Islamic content"
        description="All of this is optional and fully editable. Replace any wording with your own."
      >
        <div className="space-y-4">
          <TextInput
            label="Bismillah (Arabic)"
            value={draft.islamic.bismillahArabic ?? ""}
            onChange={(event) =>
              editor.setIslamic({ bismillahArabic: event.target.value || null })
            }
            dir="rtl"
            lang="ar"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Transliteration"
              value={draft.islamic.bismillahTransliteration ?? ""}
              onChange={(event) =>
                editor.setIslamic({
                  bismillahTransliteration: event.target.value || null,
                })
              }
            />
            <TextInput
              label="Translation"
              value={draft.islamic.bismillahTranslation ?? ""}
              onChange={(event) =>
                editor.setIslamic({ bismillahTranslation: event.target.value || null })
              }
            />
          </div>

          <TextArea
            label="Qur'anic verse (Arabic)"
            rows={3}
            value={draft.islamic.verseArabic ?? ""}
            onChange={(event) =>
              editor.setIslamic({ verseArabic: event.target.value || null })
            }
            dir="rtl"
            lang="ar"
          />
          <TextArea
            label="Verse translation"
            rows={3}
            value={draft.islamic.verseTranslation ?? ""}
            onChange={(event) =>
              editor.setIslamic({ verseTranslation: event.target.value || null })
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Reference"
              value={draft.islamic.verseReference ?? ""}
              onChange={(event) =>
                editor.setIslamic({ verseReference: event.target.value || null })
              }
              placeholder="Surah Ar-Rum 30:21"
            />
            <TextInput
              label="Dua"
              value={draft.islamic.duaText ?? ""}
              onChange={(event) =>
                editor.setIslamic({ duaText: event.target.value || null })
              }
            />
          </div>
        </div>
      </Panel>

      <Panel title="Dress code">
        <div className="space-y-4">
          <TextInput
            label="Heading"
            value={draft.dressCode?.title ?? ""}
            onChange={(event) =>
              editor.patch({
                dressCode: {
                  title: event.target.value || null,
                  description: draft.dressCode?.description ?? null,
                  palette: draft.dressCode?.palette ?? [],
                },
              })
            }
            placeholder="A note on attire"
          />
          <TextArea
            label="Description"
            rows={3}
            value={draft.dressCode?.description ?? ""}
            onChange={(event) =>
              editor.patch({
                dressCode: {
                  title: draft.dressCode?.title ?? null,
                  description: event.target.value || null,
                  palette: draft.dressCode?.palette ?? [],
                },
              })
            }
          />
          <div>
            <p className="mb-2 text-fluid-xs tracking-label-tight text-ink-muted">
              Suggested colours
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {(draft.dressCode?.palette ?? []).map((colour, index) => (
                <span key={`${colour}-${index}`} className="flex items-center gap-1">
                  <input
                    type="color"
                    value={colour}
                    aria-label={`Colour ${index + 1}`}
                    onChange={(event) => {
                      const palette = [...(draft.dressCode?.palette ?? [])];
                      palette[index] = event.target.value;
                      editor.patch({
                        dressCode: {
                          title: draft.dressCode?.title ?? null,
                          description: draft.dressCode?.description ?? null,
                          palette,
                        },
                      });
                    }}
                    className="size-9 cursor-pointer border border-line bg-paper"
                  />
                  <button
                    type="button"
                    aria-label={`Remove colour ${index + 1}`}
                    onClick={() =>
                      editor.patch({
                        dressCode: {
                          title: draft.dressCode?.title ?? null,
                          description: draft.dressCode?.description ?? null,
                          palette: (draft.dressCode?.palette ?? []).filter(
                            (_, entry) => entry !== index,
                          ),
                        },
                      })
                    }
                    className="text-fluid-xs text-ink-muted hover:text-rose"
                  >
                    ×
                  </button>
                </span>
              ))}

              <Button
                variant="secondary"
                onClick={() =>
                  editor.patch({
                    dressCode: {
                      title: draft.dressCode?.title ?? null,
                      description: draft.dressCode?.description ?? null,
                      palette: [...(draft.dressCode?.palette ?? []), "#0f3d32"],
                    },
                  })
                }
              >
                Add colour
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Our story" description="Optional milestones, shown in order.">
        <div className="space-y-5">
          {draft.story.map((milestone) => (
            <div key={milestone.id} className="space-y-3 border-b border-line pb-5 last:border-0 last:pb-0">
              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput
                  label="Title"
                  value={milestone.title}
                  onChange={(event) =>
                    editor.updateStory(milestone.id, { title: event.target.value })
                  }
                />
                <TextInput
                  label="When"
                  value={milestone.date ?? ""}
                  onChange={(event) =>
                    editor.updateStory(milestone.id, { date: event.target.value || null })
                  }
                  placeholder="June 2022"
                />
              </div>
              <TextArea
                label="Description"
                rows={2}
                value={milestone.description ?? ""}
                onChange={(event) =>
                  editor.updateStory(milestone.id, {
                    description: event.target.value || null,
                  })
                }
              />
              <ImageField
                label="Photograph"
                ownerId={ownerId}
                value={milestone.image}
                onChange={(image) => editor.updateStory(milestone.id, { image })}
              />
              <Button variant="ghost" onClick={() => editor.removeStory(milestone.id)}>
                Remove milestone
              </Button>
            </div>
          ))}

          <Button variant="secondary" onClick={editor.addStory}>
            Add milestone
          </Button>
        </div>
      </Panel>

      <Panel title="Contacts" description="Who guests should call with questions.">
        <div className="space-y-5">
          {draft.contacts.map((contact) => (
            <div key={contact.id} className="space-y-3 border-b border-line pb-5 last:border-0 last:pb-0">
              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput
                  label="Name"
                  value={contact.name}
                  onChange={(event) =>
                    editor.updateContact(contact.id, { name: event.target.value })
                  }
                />
                <TextInput
                  label="Relationship"
                  value={contact.role ?? ""}
                  onChange={(event) =>
                    editor.updateContact(contact.id, { role: event.target.value || null })
                  }
                  placeholder="Bride's brother"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput
                  label="Phone"
                  type="tel"
                  value={contact.phone ?? ""}
                  onChange={(event) =>
                    editor.updateContact(contact.id, { phone: event.target.value || null })
                  }
                />
                <TextInput
                  label="WhatsApp"
                  type="tel"
                  value={contact.whatsapp ?? ""}
                  onChange={(event) =>
                    editor.updateContact(contact.id, {
                      whatsapp: event.target.value || null,
                    })
                  }
                />
              </div>
              <Button variant="ghost" onClick={() => editor.removeContact(contact.id)}>
                Remove contact
              </Button>
            </div>
          ))}

          <Button variant="secondary" onClick={editor.addContact}>
            Add contact
          </Button>
        </div>
      </Panel>
    </div>
  );
}
