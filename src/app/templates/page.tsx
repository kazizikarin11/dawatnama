import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getRepository } from "@/lib/repository";
import { DEMO_SLUG } from "@/lib/demo/demo-wedding";
import { TEMPLATE_LIST } from "@/templates/meta";
import { TemplateCard } from "@/components/templates/template-card";
import { ButtonLink } from "@/components/ui/controls";

export const metadata: Metadata = {
  title: "Templates",
  description:
    "Five independently designed invitation templates — royal emerald, soft ivory, dark cinematic, architectural and minimal editorial. One set of wedding information renders in all five.",
};

export default async function TemplatesPage() {
  const session = await getSession();
  const invitations = session
    ? await (await getRepository()).listByOwner(session.userId)
    : [];

  // "Preview with your invitation" uses the author's real content when they have
  // some, and the fictional demo wedding otherwise.
  const previewSlug = invitations.find((entry) => entry.slug)?.slug ?? DEMO_SLUG;
  const usingOwnContent = previewSlug !== DEMO_SLUG;

  return (
    <main className="bg-bone text-ink">
      <header className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
          <Link
            href="/"
            className="text-fluid-xs tracking-label-tight text-ink-muted underline decoration-line underline-offset-4 transition-colors hover:text-ink"
          >
            Dawatnama
          </Link>

          <h1 className="mt-7 max-w-2xl font-display text-fluid-3xl leading-tight font-light">
            Five designs. One set of wedding information.
          </h1>

          <p className="mt-5 max-w-xl text-fluid-base leading-relaxed text-pretty-body text-ink-soft">
            Each template was designed as its own thing — different layout,
            typography, decoration and motion language. Switching between them
            never asks you to type anything twice.
          </p>

          <p className="mt-6 text-fluid-xs text-ink-muted">
            {usingOwnContent
              ? "Previews below use your own invitation content."
              : "Previews below use a fictional demonstration wedding."}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATE_LIST.map((template) => (
            <li key={template.id}>
              <TemplateCard
                template={template}
                footer={
                  <div className="space-y-3">
                    <p className="text-fluid-xs leading-relaxed text-ink-muted">
                      {template.description}
                    </p>
                    <ButtonLink
                      href={`/invite/${previewSlug}?template=${template.id}`}
                      variant="primary"
                      className="w-full"
                      external
                    >
                      Preview with {usingOwnContent ? "your" : "this"} invitation
                    </ButtonLink>
                  </div>
                }
              />
            </li>
          ))}
        </ul>

        <div className="mt-14 border border-line bg-paper px-6 py-10 text-center">
          <h2 className="font-display text-fluid-2xl font-light">
            Ready to make yours?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-fluid-sm leading-relaxed text-ink-soft">
            Enter your details once, choose a design, and share a single link with
            every guest.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/dashboard/invitations/new" variant="emerald">
              Create an invitation
            </ButtonLink>
            <ButtonLink href={`/invite/${DEMO_SLUG}`} external>
              See the demo
            </ButtonLink>
          </div>
        </div>
      </div>
    </main>
  );
}
