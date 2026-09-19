import Link from "next/link";
import { DEMO_SLUG } from "@/lib/demo/demo-wedding";
import { SITE } from "@/lib/site";
import { TEMPLATE_LIST } from "@/templates/meta";

const STEPS = [
  {
    step: "01",
    title: "Enter your details once",
    body: "Names, dates, the Nikah, the Mehndi, venues, photographs, your invitation wording. Add as many events as your family is actually holding.",
  },
  {
    step: "02",
    title: "Choose a design",
    body: "Five independently designed templates. Switch between them freely — your information never has to be entered again.",
  },
  {
    step: "03",
    title: "Share one link",
    body: "Publish to your own address, send it through WhatsApp, and watch the RSVPs arrive in your dashboard.",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-bone text-ink">
      {/* Header ----------------------------------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-bone/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="font-display text-fluid-lg tracking-editorial">
            Dawatnama
          </Link>
          <nav className="flex items-center gap-1 sm:gap-3">
            <Link
              href="/templates"
              className="tap-target hidden place-items-center px-4 text-fluid-xs tracking-label-tight text-ink-soft transition-colors hover:text-ink sm:grid"
            >
              Templates
            </Link>
            <Link
              href="/dashboard"
              className="tap-target grid place-items-center bg-emerald px-5 text-fluid-xs tracking-label-tight text-bone transition-colors hover:bg-emerald-deep"
            >
              Create invitation
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero ------------------------------------------------------------- */}
      <section className="relative overflow-hidden border-b border-line/70">
        <div className="surface-grain mx-auto max-w-6xl px-5 pt-20 pb-24 sm:px-8 sm:pt-28 sm:pb-32">
          <p className="text-fluid-xs tracking-label text-brass">
            Digital wedding invitations
          </p>

          <h1 className="mt-7 max-w-3xl font-display text-fluid-4xl leading-[0.98] font-light text-balance-heading">
            Invitations for elegant Muslim weddings, built to be
            <em className="text-brass italic"> felt</em>.
          </h1>

          <p className="mt-8 max-w-xl text-fluid-lg leading-relaxed text-pretty-body text-ink-soft">
            {SITE.description}
          </p>

          <div className="mt-11 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="tap-target grid place-items-center bg-ink px-8 text-fluid-xs tracking-label text-bone transition-colors hover:bg-emerald-deep"
            >
              Start an invitation
            </Link>
            <Link
              href={`/invite/${DEMO_SLUG}`}
              className="tap-target grid place-items-center border border-ink px-8 text-fluid-xs tracking-label text-ink transition-colors hover:bg-ink hover:text-bone"
            >
              See a live invitation
            </Link>
          </div>

          <p className="mt-6 text-fluid-xs text-ink-muted">
            The demonstration invitation uses a fictional couple and placeholder
            artwork.
          </p>
        </div>
      </section>

      {/* Steps ------------------------------------------------------------ */}
      <section className="border-b border-line/70">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <h2 className="font-display text-fluid-2xl font-light">
            Content is reusable. Design is template-driven.
          </h2>

          <div className="mt-14 grid gap-12 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((item) => (
              <div key={item.step} className="border-t border-line pt-6">
                <p className="text-fluid-xs tracking-label text-brass">{item.step}</p>
                <h3 className="mt-4 font-display text-fluid-xl font-light">
                  {item.title}
                </h3>
                <p className="mt-3 text-fluid-sm leading-relaxed text-pretty-body text-ink-soft">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates -------------------------------------------------------- */}
      <section className="border-b border-line/70">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-fluid-xs tracking-label text-brass">Five designs</p>
              <h2 className="mt-4 font-display text-fluid-2xl font-light">
                Not five colour variations
              </h2>
            </div>
            <Link
              href="/templates"
              className="tap-target grid place-items-center border border-ink px-6 text-fluid-xs tracking-label transition-colors hover:bg-ink hover:text-bone"
            >
              Compare all five
            </Link>
          </div>

          <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATE_LIST.map((template) => (
              <li
                key={template.id}
                className="group flex flex-col border border-line bg-paper p-6 transition-shadow duration-500 hover:shadow-[var(--shadow-sheet)]"
              >
                {/* Palette strip stands in for a thumbnail on the landing page. */}
                <div className="flex h-24 overflow-hidden">
                  {template.palette.map((colour) => (
                    <span
                      key={colour}
                      className="flex-1 transition-[flex-grow] duration-700 group-hover:first:grow-[2]"
                      style={{ backgroundColor: colour }}
                    />
                  ))}
                </div>

                <h3 className="mt-6 font-display text-fluid-xl font-light">
                  {template.name}
                </h3>
                <p className="mt-2 flex-1 text-fluid-sm leading-relaxed text-ink-soft">
                  {template.tagline}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {template.traits.map((trait) => (
                    <span
                      key={trait}
                      className="border border-line px-2.5 py-1 text-[0.65rem] tracking-label-tight text-ink-muted"
                    >
                      {trait}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/invite/${DEMO_SLUG}?template=${template.id}`}
                  className="tap-target mt-6 grid place-items-center border border-ink px-5 text-fluid-xs tracking-label-tight transition-colors hover:bg-ink hover:text-bone"
                >
                  Preview this design
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Footer ----------------------------------------------------------- */}
      <footer className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-fluid-lg">Dawatnama</p>
          <p className="text-fluid-xs text-ink-muted">
            {SITE.tagline}. Built mobile-first.
          </p>
        </div>
      </footer>
    </div>
  );
}
