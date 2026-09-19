"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInvitation } from "@/lib/actions/invitations";
import { buildCoupleSlug } from "@/lib/utils/slug";
import type { TemplateId } from "@/lib/wedding/types";
import { TEMPLATE_LIST } from "@/templates/meta";
import { Button, TextInput } from "@/components/ui/controls";
import { TemplateCard } from "@/components/templates/template-card";

/**
 * Creation is deliberately three fields long. Everything else — events, photos,
 * RSVP, wording — is added in the editor, where the author can see it.
 */
export function NewInvitationForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [brideName, setBrideName] = useState("");
  const [groomName, setGroomName] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [templateId, setTemplateId] = useState<TemplateId>("royal-emerald");

  const slugPreview = buildCoupleSlug(brideName, groomName) || "your-names";

  function submit() {
    setError(null);

    const formData = new FormData();
    formData.set("brideName", brideName);
    formData.set("groomName", groomName);
    formData.set("weddingDate", weddingDate);
    formData.set("templateId", templateId);

    startTransition(async () => {
      const result = await createInvitation(formData);
      if (!result.ok || !result.data) {
        setError(result.error ?? "Could not create the invitation.");
        return;
      }
      router.push(`/dashboard/invitations/${result.data}`);
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="mt-10"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput
          label="Bride's name"
          value={brideName}
          onChange={(event) => setBrideName(event.target.value)}
          placeholder="Fatima Zahra Hasan"
          required
          autoComplete="off"
        />
        <TextInput
          label="Groom's name"
          value={groomName}
          onChange={(event) => setGroomName(event.target.value)}
          placeholder="Ahmed Bilal Khan"
          required
          autoComplete="off"
        />
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <TextInput
          label="Wedding date"
          type="date"
          value={weddingDate}
          onChange={(event) => setWeddingDate(event.target.value)}
          hint="You can change this at any time."
        />
        <div>
          <p className="mb-2 text-fluid-xs tracking-label-tight text-ink-muted">
            Your link will be
          </p>
          <p className="border border-dashed border-line bg-bone-dim px-3 py-2.5 text-fluid-sm text-ink-soft">
            /invite/{slugPreview}
          </p>
        </div>
      </div>

      <fieldset className="mt-12">
        <legend className="text-fluid-xs tracking-label text-ink-muted">
          Choose a design — you can switch later without re-entering anything
        </legend>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATE_LIST.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={templateId === template.id}
              onSelect={() => setTemplateId(template.id)}
            />
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="mt-6 text-fluid-sm text-rose">
          {error}
        </p>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Button type="submit" variant="emerald" disabled={pending} className="py-3.5">
          {pending ? "Creating…" : "Create and open editor"}
        </Button>
      </div>
    </form>
  );
}
