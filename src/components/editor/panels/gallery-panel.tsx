"use client";

import { createId } from "@/lib/utils/id";
import type { GalleryStyle } from "@/lib/wedding/types";
import { Button, Panel, Select, TextInput } from "@/components/ui/controls";
import { SmartImage } from "@/components/media/smart-image";
import { useEditor } from "../context";
import { ImageField } from "../image-field";

const STYLES: Array<{ value: GalleryStyle; label: string; note: string }> = [
  { value: "auto", label: "Template default", note: "Each design uses the layout it was built for." },
  { value: "filmstrip", label: "Filmstrip", note: "Swipeable horizontal rail." },
  { value: "stack", label: "Offset stack", note: "Alternating vertical spread with parallax." },
  { value: "marquee", label: "Marquee", note: "Two slow counter-scrolling rows." },
  { value: "mosaic", label: "Mosaic", note: "Asymmetric editorial grid." },
];

export function GalleryPanel({ ownerId }: { ownerId: string }) {
  const editor = useEditor();
  const { draft } = editor;

  return (
    <div className="space-y-4">
      <Panel
        title="Gallery"
        description="Photographs appear in this order. The gallery section hides itself when there are no images."
        actions={
          <Button
            variant="secondary"
            onClick={() =>
              editor.addImage({
                id: createId("img"),
                url: "",
                alt: "Wedding photograph",
                width: null,
                height: null,
                blurDataURL: null,
                caption: null,
              })
            }
          >
            Add photograph
          </Button>
        }
      >
        <Select
          label="Gallery style"
          value={draft.appearance.galleryStyle}
          onChange={(event) =>
            editor.setAppearance({
              galleryStyle: event.target.value as GalleryStyle,
            })
          }
          hint={
            STYLES.find((style) => style.value === draft.appearance.galleryStyle)?.note
          }
        >
          {STYLES.map((style) => (
            <option key={style.value} value={style.value}>
              {style.label}
            </option>
          ))}
        </Select>

        <div className="mt-6 space-y-5">
          {draft.gallery.length === 0 && (
            <p className="text-fluid-sm text-ink-muted">
              No photographs yet. The gallery section will stay hidden until you add
              one.
            </p>
          )}

          {draft.gallery.map((image, index) => (
            <div
              key={image.id}
              className="flex flex-wrap items-start gap-4 border-b border-line pb-5 last:border-0 last:pb-0"
            >
              <div className="relative aspect-square w-20 shrink-0 overflow-hidden border border-line bg-bone-dim">
                {image.url ? (
                  <SmartImage image={image} sizes="80px" />
                ) : (
                  <span className="grid h-full place-items-center text-[0.6rem] text-ink-muted">
                    {index + 1}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-3">
                <TextInput
                  value={image.url}
                  placeholder="Image URL"
                  onChange={(event) =>
                    editor.updateImage(image.id, { url: event.target.value })
                  }
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextInput
                    value={image.alt}
                    placeholder="Alt text"
                    onChange={(event) =>
                      editor.updateImage(image.id, { alt: event.target.value })
                    }
                  />
                  <TextInput
                    value={image.caption ?? ""}
                    placeholder="Caption (optional)"
                    onChange={(event) =>
                      editor.updateImage(image.id, {
                        caption: event.target.value || null,
                      })
                    }
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    variant="ghost"
                    aria-label="Move earlier"
                    disabled={index === 0}
                    onClick={() => editor.moveImage(image.id, -1)}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    aria-label="Move later"
                    disabled={index === draft.gallery.length - 1}
                    onClick={() => editor.moveImage(image.id, 1)}
                  >
                    ↓
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={!image.url}
                    onClick={() => editor.setHeroImage(image)}
                  >
                    Set as cover
                  </Button>
                  <Button variant="ghost" onClick={() => editor.removeImage(image.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Cover image">
        <ImageField
          label="Hero photograph"
          ownerId={ownerId}
          value={draft.heroImage}
          onChange={(image) => editor.setHeroImage(image)}
          hint="Shown on the opening cover and used for link previews."
        />
      </Panel>
    </div>
  );
}
