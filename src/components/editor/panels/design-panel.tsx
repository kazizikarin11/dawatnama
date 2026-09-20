"use client";

import { SECTION_LABELS, SECTION_ORDER } from "@/lib/wedding/defaults";
import type { AnimationIntensity } from "@/lib/wedding/types";
import { TEMPLATE_LIST, templateMeta } from "@/templates/meta";
import { Panel, Select, TextInput, Toggle } from "@/components/ui/controls";
import { TemplateCard } from "@/components/templates/template-card";
import { useEditor } from "../context";

/**
 * Appearance.
 *
 * Customisation is deliberately bounded: template, accent, background variant,
 * animation intensity, gallery style and section visibility. There are no free
 * font or colour controls that could pull a template out of shape, and options a
 * template does not support are disabled rather than silently ignored.
 */
const INTENSITIES: Array<{ value: AnimationIntensity; label: string; note: string }> = [
  { value: "calm", label: "Calm", note: "Short fades only. Best for older phones." },
  { value: "balanced", label: "Balanced", note: "The intended experience." },
  { value: "cinematic", label: "Cinematic", note: "Longer reveals and ambient motion." },
];

export function DesignPanel() {
  const editor = useEditor();
  const { draft } = editor;
  const meta = templateMeta(draft.appearance.templateId);

  return (
    <div className="space-y-4">
      <Panel
        title="Template"
        description="Switch freely — your wording, events, photographs and RSVP settings all stay exactly as they are."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {TEMPLATE_LIST.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={draft.appearance.templateId === template.id}
              onSelect={() => editor.setAppearance({ templateId: template.id })}
            />
          ))}
        </div>
      </Panel>

      <Panel title="Appearance">
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-fluid-xs tracking-label-tight text-ink-muted">
              Accent colour
            </p>
            {meta.supports.accent ? (
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  aria-label="Accent colour"
                  value={draft.appearance.accent ?? meta.palette[2] ?? "#c9a227"}
                  onChange={(event) =>
                    editor.setAppearance({ accent: event.target.value })
                  }
                  className="size-10 cursor-pointer border border-line bg-paper"
                />
                {draft.appearance.accent && (
                  <button
                    type="button"
                    onClick={() => editor.setAppearance({ accent: null })}
                    className="tap-target text-fluid-xs text-ink-muted underline decoration-line underline-offset-4"
                  >
                    Reset to the template&rsquo;s own accent
                  </button>
                )}
              </div>
            ) : (
              <p className="text-fluid-xs text-ink-muted">
                {meta.name} uses a fixed accent to protect its palette.
              </p>
            )}
          </div>

          <Select
            label="Background"
            value={draft.appearance.backgroundVariant}
            disabled={!meta.supports.backgroundVariant}
            onChange={(event) =>
              editor.setAppearance({
                backgroundVariant: event.target.value === "alt" ? "alt" : "default",
              })
            }
            hint={
              meta.supports.backgroundVariant
                ? "A second ground colour designed for this template."
                : "This template has a single background."
            }
          >
            <option value="default">Default</option>
            <option value="alt">Alternate</option>
          </Select>

          <Select
            label="Animation"
            value={draft.appearance.animationIntensity}
            onChange={(event) =>
              editor.setAppearance({
                animationIntensity: event.target.value as AnimationIntensity,
              })
            }
            hint={
              INTENSITIES.find(
                (option) => option.value === draft.appearance.animationIntensity,
              )?.note
            }
          >
            {INTENSITIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <p className="text-fluid-xs leading-relaxed text-ink-muted">
            Guests who ask their device for reduced motion always get a still
            version, whatever is chosen here.
          </p>
        </div>
      </Panel>

      <Panel
        title="Sections"
        description="Every section is optional. Switch one off and its screens leave the invitation entirely — the sequence renumbers itself rather than leaving a gap."
      >
        <div className="space-y-4">
          {SECTION_ORDER.map((section) => (
            <Toggle
              key={section}
              label={SECTION_LABELS[section]}
              checked={draft.sections[section]}
              onChange={(value) => editor.toggleSection(section, value)}
            />
          ))}
        </div>
      </Panel>

      <Panel
        title="Music"
        description="Optional. Playback begins when a guest taps to open the invitation, never before — browsers require that, and so do we."
      >
        <div className="space-y-5">
          <TextInput
            label="Audio URL"
            value={draft.music.url ?? ""}
            onChange={(event) =>
              editor.setMusic({ url: event.target.value || null })
            }
            placeholder="https://…/nasheed.mp3"
            hint="An mp3, m4a or ogg file."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Track name"
              value={draft.music.title ?? ""}
              onChange={(event) =>
                editor.setMusic({ title: event.target.value || null })
              }
            />
            <TextInput
              label="Credit"
              value={draft.music.credit ?? ""}
              onChange={(event) =>
                editor.setMusic({ credit: event.target.value || null })
              }
            />
          </div>

          <Toggle
            label="Play background music"
            description={
              draft.music.url
                ? "A small sound control appears on the invitation."
                : "Add an audio URL first."
            }
            checked={draft.music.enabled && Boolean(draft.music.url)}
            onChange={(value) => editor.setMusic({ enabled: value })}
          />

          <Toggle
            label="Loop the track"
            checked={draft.music.loop}
            onChange={(value) => editor.setMusic({ loop: value })}
          />
        </div>
      </Panel>
    </div>
  );
}
