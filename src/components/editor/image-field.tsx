"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { createId } from "@/lib/utils/id";
import { createClient } from "@/lib/supabase/browser";
import { hasSupabase } from "@/lib/supabase/config";
import type { ImageAsset } from "@/lib/wedding/types";
import { Button, Label, TextInput } from "@/components/ui/controls";
import { SmartImage } from "@/components/media/smart-image";

/**
 * Image input used everywhere in the editor.
 *
 * With Supabase configured it uploads to the `invitation-media` bucket under a
 * folder named after the author's user id, which is exactly what the storage
 * policy allows. Without Supabase it accepts a URL, so the editor is still fully
 * usable in local mode.
 */
export function ImageField({
  label,
  value,
  onChange,
  ownerId,
  hint,
  aspect = "aspect-[4/3]",
  fallback,
}: {
  label: string;
  value: ImageAsset | null;
  onChange: (next: ImageAsset | null) => void;
  ownerId: string;
  hint?: string;
  aspect?: string;
  /**
   * Supplied artwork this field can be reset to. Used by the couple portraits,
   * which ship with an illustration: without this, removing a photograph leaves
   * an empty frame and no way back to the original.
   */
  fallback?: { label: string; image: ImageAsset };
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function upload(file: File) {
    const client = createClient();
    if (!client) return;

    setStatus("uploading");
    setMessage(null);

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${ownerId}/${createId("img")}.${extension}`;

    const { error } = await client.storage
      .from("invitation-media")
      .upload(path, file, { cacheControl: "31536000", upsert: false });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    const { data } = client.storage.from("invitation-media").getPublicUrl(path);

    onChange({
      id: createId("img"),
      url: data.publicUrl,
      alt: value?.alt ?? label,
      width: null,
      height: null,
      blurDataURL: null,
      caption: value?.caption ?? null,
    });

    setStatus("idle");
  }

  return (
    <div>
      <Label>{label}</Label>

      <div className="flex items-start gap-4">
        <div
          className={cn(
            "relative w-28 shrink-0 overflow-hidden border border-line bg-bone-dim",
            aspect,
          )}
        >
          {value ? (
            <SmartImage image={value} sizes="112px" />
          ) : (
            <span className="grid h-full place-items-center text-[0.6rem] tracking-label-tight text-ink-muted">
              None
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <TextInput
            value={value?.url ?? ""}
            placeholder={hasSupabase ? "Upload, or paste an image URL" : "https://…"}
            onChange={(event) => {
              const url = event.target.value.trim();
              if (!url) {
                onChange(null);
                return;
              }
              onChange({
                id: value?.id ?? createId("img"),
                url,
                alt: value?.alt ?? label,
                width: value?.width ?? null,
                height: value?.height ?? null,
                blurDataURL: null,
                caption: value?.caption ?? null,
              });
            }}
          />

          <TextInput
            value={value?.alt ?? ""}
            placeholder="Describe the photograph (for screen readers)"
            onChange={(event) =>
              value && onChange({ ...value, alt: event.target.value })
            }
            disabled={!value}
          />

          <div className="flex flex-wrap items-center gap-2">
            {hasSupabase && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void upload(file);
                    event.target.value = "";
                  }}
                />
                <Button
                  variant="secondary"
                  disabled={status === "uploading"}
                  onClick={() => fileRef.current?.click()}
                >
                  {status === "uploading" ? "Uploading…" : "Upload"}
                </Button>
              </>
            )}

            {fallback && value?.url !== fallback.image.url && (
              <Button variant="secondary" onClick={() => onChange(fallback.image)}>
                {fallback.label}
              </Button>
            )}

            {value && (
              <Button variant="ghost" onClick={() => onChange(null)}>
                Remove
              </Button>
            )}
          </div>

          {hint && <p className="text-fluid-xs text-ink-muted">{hint}</p>}
          {message && <p className="text-fluid-xs text-rose">{message}</p>}
        </div>
      </div>
    </div>
  );
}
