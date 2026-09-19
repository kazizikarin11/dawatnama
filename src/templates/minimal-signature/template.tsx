"use client";

import { cn } from "@/lib/utils/cn";
import {
  coupleNames,
  directionsUrl,
  eventWhen,
  formatLongDate,
  formatNumericDate,
  formatTimeRange,
  formatWeekday,
  toTimestamp,
} from "@/lib/wedding/format";
import {
  effectiveDate,
  effectiveTime,
  enabledEvents,
  eventsWithVenue,
} from "@/lib/wedding/sections";
import type { SectionId, WeddingData } from "@/lib/wedding/types";
import { SmartImage } from "@/components/media/smart-image";
import {
  ClipReveal,
  LetterReveal,
  MaskedLine,
  Reveal,
  RevealGroup,
  RevealItem,
  ScrollScale,
} from "@/components/motion/primitives";
import { InvitationDock } from "@/components/invitation/dock";
import { Gallery } from "@/components/invitation/gallery";
import { RsvpForm } from "@/components/invitation/rsvp-form";
import { CoverLayer, StageBody, useStage } from "@/components/invitation/stage";
import { useCountdown } from "@/components/invitation/use-countdown";
import { CoverCanvas } from "@/components/webgl/cover-canvas";
import type { TemplateProps } from "@/templates/contract";
import { accentFor, tokensToStyle } from "@/templates/tokens";
import { MINIMAL, MINIMAL_ALT } from "./theme";

/**
 * TEMPLATE 05 — MINIMAL SIGNATURE
 *
 * Almost no ornament. The quality has to come from type at poster scale, a strict
 * two-column grid, hairline rules, and photography that is masked rather than
 * decorated. Motion language: letter-by-letter reveals, vertical type slides,
 * image masks. Nothing drifts, nothing sparkles.
 */
export default function MinimalSignatureTemplate({
  data,
  sections,
  mode,
}: TemplateProps) {
  const tokens = data.appearance.backgroundVariant === "alt" ? MINIMAL_ALT : MINIMAL;

  const numeral = (id: SectionId) =>
    String(sections.indexOf(id) + 1).padStart(2, "0");

  return (
    <div
      style={tokensToStyle(tokens, accentFor(data, true))}
      className="surface-grain relative isolate w-full overflow-hidden font-[family-name:var(--font-sans)]"
    >
      <Cover data={data} mode={mode} />

      <StageBody>
        <h1 className="sr-only">Wedding invitation — {coupleNames(data).combined}</h1>

        <main>
          {sections.has("bismillah") && <BismillahSection data={data} />}
          {sections.has("message") && (
            <Block index={numeral("message")} label="Invitation">
              {data.familyInvitationWording && (
                <Reveal>
                  <p className="font-[family-name:var(--font-fashion)] text-fluid-xl leading-[1.4] text-balance-heading text-[var(--t-ink)]">
                    {data.familyInvitationWording}
                  </p>
                </Reveal>
              )}
              {data.invitationMessage && (
                <Reveal delay={0.12} className="mt-8">
                  <p className="max-w-xl text-fluid-base leading-[2] text-pretty-body text-[var(--t-ink-soft)]">
                    {data.invitationMessage}
                  </p>
                </Reveal>
              )}
            </Block>
          )}
          {sections.has("couple") && (
            <CoupleSection data={data} numeral={numeral("couple")} />
          )}
          {sections.has("countdown") && <CountdownSection data={data} />}
          {sections.has("events") && (
            <EventsSection data={data} numeral={numeral("events")} />
          )}
          {sections.has("venue") && (
            <VenueSection data={data} numeral={numeral("venue")} />
          )}
          {sections.has("story") && (
            <StorySection data={data} numeral={numeral("story")} />
          )}
          {sections.has("dressCode") && (
            <DressCodeSection data={data} numeral={numeral("dressCode")} />
          )}
          {sections.has("gallery") && (
            <GallerySection data={data} numeral={numeral("gallery")} />
          )}
          {sections.has("rsvp") && (
            <RsvpSection data={data} mode={mode} numeral={numeral("rsvp")} />
          )}
          {sections.has("family") && (
            <FamilySection data={data} numeral={numeral("family")} />
          )}
          {sections.has("verse") && <VerseSection data={data} />}
          {sections.has("closing") && <ClosingSection data={data} />}
        </main>
      </StageBody>

      <InvitationDock data={data} />
    </div>
  );
}

/* ================================================================== */
/* Cover — the names are the entire composition                         */
/* ================================================================== */

function Cover({ data, mode }: { data: WeddingData; mode: TemplateProps["mode"] }) {
  const { open } = useStage();
  const names = coupleNames(data);
  const numeric = formatNumericDate(effectiveDate(data));

  return (
    <CoverLayer exit="dissolve" className="bg-[var(--t-bg)]">
      {/* Kept deliberately faint: this template's identity is restraint. */}
      <CoverCanvas template="minimal-signature" />

      <div className="relative flex min-h-full flex-1 flex-col px-6 pt-14 pb-10 sm:px-10">
        {/* Top meta row, set very small against the poster type below. */}
        <div className="flex items-start justify-between gap-4">
          <Reveal>
            <p className="text-[0.6rem] tracking-[0.3em] text-[var(--t-ink-muted)] uppercase">
              Wedding invitation
            </p>
          </Reveal>
          {numeric && (
            <Reveal delay={0.1}>
              <p className="text-[0.6rem] tracking-[0.3em] text-[var(--t-ink-muted)] uppercase">
                {numeric}
              </p>
            </Reveal>
          )}
        </div>

        {/* Type block sits high; the photograph band and the action anchor the
            base, so the page never opens with a large void in the middle. */}
        <div className="flex flex-1 flex-col justify-center py-8">
          <div className="font-[family-name:var(--font-fashion)] text-[var(--t-ink)] uppercase">
            <LetterReveal
              text={names.firstShort || "Bride"}
              className="block text-fluid-poster leading-[0.9] tracking-[0.01em]"
              delay={0.35}
              stagger={0.045}
            />

            <MaskedLine delay={0.9} className="my-3 sm:my-5">
              <span className="font-[family-name:var(--font-fashion)] text-fluid-lg text-[var(--t-accent)] lowercase italic">
                and
              </span>
            </MaskedLine>

            <LetterReveal
              text={names.secondShort || "Groom"}
              className="block text-fluid-poster leading-[0.9] tracking-[0.01em]"
              delay={1.05}
              stagger={0.045}
            />
          </div>

          <Reveal delay={1.7} className="mt-10">
            <span aria-hidden className="block h-px w-full bg-[var(--t-line)]" />
          </Reveal>

          <div className="mt-6 flex flex-wrap items-baseline justify-between gap-4">
            <Reveal delay={1.8}>
              <p className="text-fluid-sm tracking-[0.2em] text-[var(--t-ink-soft)] uppercase">
                {formatLongDate(effectiveDate(data)) ?? "Date to follow"}
              </p>
            </Reveal>
            {data.hijriDate && (
              <Reveal delay={1.9}>
                <p className="text-[0.6rem] tracking-[0.28em] text-[var(--t-ink-muted)] uppercase">
                  {data.hijriDate}
                </p>
              </Reveal>
            )}
          </div>
        </div>

        {/* The photograph enters last, and only as a band. */}
        {data.heroImage && (
          <ClipReveal from="bottom" delay={1.9} className="mt-8 mb-7">
            <div className="relative aspect-[16/9] overflow-hidden">
              <SmartImage image={data.heroImage} priority sizes="100vw" />
            </div>
          </ClipReveal>
        )}

        <Reveal delay={2.2}>
          <button
            type="button"
            data-cover-action
            onClick={open}
            disabled={mode === "thumbnail"}
            className="tap-target group flex w-full items-center justify-between border-t border-[var(--t-ink)] pt-5 text-left"
          >
            <span className="text-fluid-xs tracking-[0.3em] text-[var(--t-ink)] uppercase">
              Open invitation
            </span>
            <span
              aria-hidden
              className="text-fluid-lg text-[var(--t-accent)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-2"
            >
              →
            </span>
          </button>
        </Reveal>
      </div>
    </CoverLayer>
  );
}

/* ================================================================== */
/* Grid furniture                                                      */
/* ================================================================== */

/**
 * The template's one layout primitive: an index number and label in a narrow
 * left column, content in a wide right column. Everything else is composed from
 * it, which is what keeps the design coherent without ornament.
 */
function Block({
  index,
  label,
  children,
  className,
  alt = false,
  id,
}: {
  index?: string;
  label: string;
  children: React.ReactNode;
  className?: string;
  alt?: boolean;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "invite-section border-t border-[var(--t-line)]",
        alt ? "bg-[var(--t-bg-alt)]" : "bg-[var(--t-bg)]",
        className,
      )}
    >
      <div className="invite-container-wide">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-3">
            <Reveal>
              <div className="flex items-baseline gap-4 lg:flex-col lg:gap-3">
                {index && (
                  <span className="text-[0.6rem] tracking-[0.3em] text-[var(--t-accent)]">
                    {index}
                  </span>
                )}
                <h2 className="text-[0.66rem] tracking-[0.3em] text-[var(--t-ink-muted)] uppercase">
                  {label}
                </h2>
              </div>
            </Reveal>
          </div>
          <div className="lg:col-span-9">{children}</div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/* Sections                                                            */
/* ================================================================== */

function BismillahSection({ data }: { data: WeddingData }) {
  const { islamic } = data;

  return (
    <section className="invite-section-tight bg-[var(--t-bg)]">
      <div className="invite-container-wide">
        <div className="mx-auto max-w-xl text-center">
          {islamic.bismillahArabic && (
            <Reveal durationScale={1.4}>
              <p lang="ar" dir="rtl" className="text-fluid-xl leading-[2] text-[var(--t-ink)]">
                {islamic.bismillahArabic}
              </p>
            </Reveal>
          )}
          {islamic.bismillahTranslation && (
            <Reveal delay={0.2} className="mt-6">
              <p className="text-fluid-sm leading-relaxed text-pretty-body text-[var(--t-ink-muted)]">
                {islamic.bismillahTranslation}
              </p>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

function CoupleSection({ data, numeral }: { data: WeddingData; numeral: string }) {
  const { bride, groom, order } = data.couple;
  const parties = order === "groom-first" ? [groom, bride] : [bride, groom];

  return (
    <Block index={numeral} label="The couple">
      {data.couple.shortDescription && (
        <Reveal>
          <p className="max-w-xl font-[family-name:var(--font-fashion)] text-fluid-xl leading-[1.4] text-balance-heading text-[var(--t-ink)]">
            {data.couple.shortDescription}
          </p>
        </Reveal>
      )}

      <div className="mt-14 grid gap-12 sm:grid-cols-2 sm:gap-8">
        {parties.map((party, index) => (
          <div key={index}>
            {party.photo && (
              <ClipReveal from="bottom" delay={index * 0.1}>
                <ScrollScale className="aspect-[4/5]" from={1.14} to={1}>
                  <SmartImage
                    image={party.photo}
                    sizes="(max-width: 640px) 92vw, 42vw"
                    className="grayscale-[18%]"
                  />
                </ScrollScale>
              </ClipReveal>
            )}

            <Reveal delay={0.14} className="mt-6">
              <h3 className="font-[family-name:var(--font-fashion)] text-fluid-xl leading-tight text-[var(--t-ink)] uppercase">
                {party.name || (index === 0 ? "Bride" : "Groom")}
              </h3>
              {party.parents && (
                <p className="mt-3 text-[0.62rem] tracking-[0.26em] text-[var(--t-ink-muted)] uppercase">
                  {party.parents}
                </p>
              )}
              {party.description && (
                <p className="mt-5 text-fluid-sm leading-[1.95] text-pretty-body text-[var(--t-ink-muted)]">
                  {party.description}
                </p>
              )}
            </Reveal>
          </div>
        ))}
      </div>
    </Block>
  );
}

function CountdownSection({ data }: { data: WeddingData }) {
  const date = effectiveDate(data);
  const countdown = useCountdown(toTimestamp(date, effectiveTime(data)));

  const cells = [
    { value: countdown?.days, label: "Days" },
    { value: countdown?.hours, label: "Hrs" },
    { value: countdown?.minutes, label: "Min" },
    { value: countdown?.seconds, label: "Sec" },
  ];

  return (
    <section className="invite-section-tight border-t border-[var(--t-line)] bg-[var(--t-bg)]">
      <div className="invite-container-wide">
        {countdown?.isPast ? (
          <Reveal>
            <p className="font-[family-name:var(--font-fashion)] text-fluid-2xl text-[var(--t-ink)] uppercase">
              {countdown.isToday ? "Today" : "Alhamdulillah"}
            </p>
          </Reveal>
        ) : (
          <RevealGroup className="grid grid-cols-4 divide-x divide-[var(--t-line)]">
            {cells.map((cell) => (
              <RevealItem key={cell.label} className="px-2 first:pl-0">
                <p
                  className="font-[family-name:var(--font-fashion)] text-fluid-3xl leading-none text-[var(--t-ink)]"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {cell.value === undefined ? "—" : String(cell.value).padStart(2, "0")}
                </p>
                <p className="mt-3 text-[0.58rem] tracking-[0.28em] text-[var(--t-ink-muted)] uppercase">
                  {cell.label}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </div>
    </section>
  );
}

function EventsSection({ data, numeral }: { data: WeddingData; numeral: string }) {
  const events = enabledEvents(data);

  return (
    <Block index={numeral} label="Programme" alt>
      <div className="divide-y divide-[var(--t-line)]">
        {events.map((event) => {
          const when = eventWhen(event);
          const directions = directionsUrl(event.venue);

          return (
            <article key={event.id} className="py-8 first:pt-0 last:pb-0">
              <Reveal>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="font-[family-name:var(--font-fashion)] text-fluid-2xl leading-none text-[var(--t-ink)] uppercase">
                    {event.name}
                  </h3>
                  <p className="text-[0.62rem] tracking-[0.26em] text-[var(--t-ink-muted)] uppercase">
                    {formatNumericDate(event.date) ?? "Date to follow"}
                  </p>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    {when && (
                      <p className="text-fluid-sm text-[var(--t-ink-soft)]">{when}</p>
                    )}
                    {event.dressCode && (
                      <p className="mt-2 text-[0.62rem] tracking-[0.24em] text-[var(--t-ink-muted)] uppercase">
                        {event.dressCode}
                      </p>
                    )}
                  </div>

                  <div>
                    {event.venue && (
                      <p className="text-fluid-sm text-[var(--t-ink)]">
                        {event.venue.name}
                        {event.venue.address && (
                          <span className="mt-1 block text-fluid-xs text-[var(--t-ink-muted)]">
                            {event.venue.address}
                          </span>
                        )}
                      </p>
                    )}
                    {directions && (
                      <a
                        href={directions}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tap-target mt-3 inline-flex items-center gap-2 text-fluid-xs tracking-[0.2em] text-[var(--t-ink)] uppercase"
                      >
                        Directions
                        <span aria-hidden className="text-[var(--t-accent)]">
                          →
                        </span>
                      </a>
                    )}
                  </div>
                </div>

                {event.description && (
                  <p className="mt-5 max-w-xl text-fluid-sm leading-[1.9] text-pretty-body text-[var(--t-ink-muted)]">
                    {event.description}
                  </p>
                )}
              </Reveal>
            </article>
          );
        })}
      </div>
    </Block>
  );
}

function VenueSection({ data, numeral }: { data: WeddingData; numeral: string }) {
  const events = eventsWithVenue(data);

  return (
    <Block index={numeral} label="Locations">
      <div className="grid gap-12 sm:grid-cols-2 sm:gap-8">
        {events.map((event) => {
          const venue = event.venue;
          if (!venue) return null;
          const directions = directionsUrl(venue);

          return (
            <div key={event.id}>
              {venue.image && (
                <ClipReveal from="bottom">
                  <div className="relative aspect-[3/2] overflow-hidden">
                    <SmartImage
                      image={venue.image}
                      sizes="(max-width: 640px) 92vw, 42vw"
                      className="grayscale-[20%] transition-[filter] duration-700 hover:grayscale-0"
                    />
                  </div>
                </ClipReveal>
              )}
              <Reveal delay={0.1} className="mt-5">
                <p className="text-[0.6rem] tracking-[0.28em] text-[var(--t-accent)] uppercase">
                  {event.name}
                </p>
                <h3 className="mt-3 font-[family-name:var(--font-fashion)] text-fluid-lg text-[var(--t-ink)] uppercase">
                  {venue.name}
                </h3>
                {venue.address && (
                  <p className="mt-2 text-fluid-sm leading-relaxed text-[var(--t-ink-muted)]">
                    {venue.address}
                  </p>
                )}
                {directions && (
                  <a
                    href={directions}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-target mt-4 inline-flex items-center gap-2 border-b border-[var(--t-ink)] pb-1 text-fluid-xs tracking-[0.2em] text-[var(--t-ink)] uppercase"
                  >
                    Get directions
                  </a>
                )}
              </Reveal>
            </div>
          );
        })}
      </div>
    </Block>
  );
}

function StorySection({ data, numeral }: { data: WeddingData; numeral: string }) {
  return (
    <Block index={numeral} label="Our story" alt>
      <div className="space-y-12">
        {data.story.map((milestone) => (
          <article
            key={milestone.id}
            className="grid gap-6 border-t border-[var(--t-line)] pt-8 first:border-t-0 first:pt-0 sm:grid-cols-12"
          >
            <div className="sm:col-span-3">
              <Reveal>
                <p className="text-[0.62rem] tracking-[0.26em] text-[var(--t-accent)] uppercase">
                  {milestone.date ?? ""}
                </p>
              </Reveal>
            </div>
            <div className="sm:col-span-5">
              <Reveal>
                <h3 className="font-[family-name:var(--font-fashion)] text-fluid-lg text-[var(--t-ink)] uppercase">
                  {milestone.title}
                </h3>
                {milestone.description && (
                  <p className="mt-4 text-fluid-sm leading-[1.95] text-pretty-body text-[var(--t-ink-muted)]">
                    {milestone.description}
                  </p>
                )}
              </Reveal>
            </div>
            {milestone.image && (
              <ClipReveal from="right" className="sm:col-span-4">
                <div className="relative aspect-square overflow-hidden">
                  <SmartImage
                    image={milestone.image}
                    sizes="(max-width: 640px) 92vw, 24vw"
                    className="grayscale-[25%]"
                  />
                </div>
              </ClipReveal>
            )}
          </article>
        ))}
      </div>
    </Block>
  );
}

function DressCodeSection({ data, numeral }: { data: WeddingData; numeral: string }) {
  const dress = data.dressCode;
  if (!dress) return null;

  return (
    <Block index={numeral} label={dress.title ?? "Attire"}>
      {dress.description && (
        <Reveal>
          <p className="max-w-xl font-[family-name:var(--font-fashion)] text-fluid-lg leading-relaxed text-pretty-body text-[var(--t-ink-soft)]">
            {dress.description}
          </p>
        </Reveal>
      )}
      {dress.palette.length > 0 && (
        <RevealGroup className="mt-8 flex">
          {dress.palette.map((colour) => (
            <RevealItem key={colour}>
              <span
                className="block size-14"
                style={{ backgroundColor: colour }}
                title={colour}
              />
              <span className="sr-only">{colour}</span>
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </Block>
  );
}

function GallerySection({ data, numeral }: { data: WeddingData; numeral: string }) {
  return (
    <Block index={numeral} label="Photographs" alt>
      <Gallery
        images={data.gallery}
        fallback="mosaic"
        preference={data.appearance.galleryStyle}
      />
    </Block>
  );
}

function RsvpSection({
  data,
  mode,
  numeral,
}: {
  data: WeddingData;
  mode: TemplateProps["mode"];
  numeral: string;
}) {
  return (
    <Block index={numeral} label="RSVP" id="rsvp">
      <Reveal>
        <h3 className="max-w-xl font-[family-name:var(--font-fashion)] text-fluid-2xl leading-tight text-[var(--t-ink)] uppercase">
          {data.rsvp.headline ?? "Will you join us?"}
        </h3>
      </Reveal>

      {data.rsvp.message && (
        <Reveal delay={0.12} className="mt-5">
          <p className="max-w-lg text-fluid-sm leading-relaxed text-pretty-body text-[var(--t-ink-muted)]">
            {data.rsvp.message}
          </p>
        </Reveal>
      )}

      <Reveal delay={0.18} className="mt-10">
        <div className="max-w-xl">
          <RsvpForm data={data} mode={mode} variant="minimal" />
        </div>
      </Reveal>
    </Block>
  );
}

function FamilySection({ data, numeral }: { data: WeddingData; numeral: string }) {
  const { familyNames, contacts, gratitudeMessage } = data;

  return (
    <Block index={numeral} label="Families" alt>
      {(familyNames.bride || familyNames.groom) && (
        <RevealGroup className="flex flex-wrap gap-x-12 gap-y-4">
          {[familyNames.bride, familyNames.groom]
            .filter((name): name is string => Boolean(name))
            .map((name) => (
              <RevealItem key={name}>
                <p className="font-[family-name:var(--font-fashion)] text-fluid-lg text-[var(--t-ink)] uppercase">
                  {name}
                </p>
              </RevealItem>
            ))}
        </RevealGroup>
      )}

      {gratitudeMessage && (
        <Reveal delay={0.15} className="mt-8">
          <p className="max-w-xl text-fluid-base leading-[1.95] text-pretty-body text-[var(--t-ink-soft)]">
            {gratitudeMessage}
          </p>
        </Reveal>
      )}

      {contacts.length > 0 && (
        <RevealGroup className="mt-10 grid gap-6 sm:grid-cols-2">
          {contacts.map((contact) => (
            <RevealItem key={contact.id}>
              <div className="border-t border-[var(--t-line)] pt-4">
                <p className="text-fluid-sm text-[var(--t-ink)]">{contact.name}</p>
                {contact.role && (
                  <p className="mt-1 text-[0.58rem] tracking-[0.26em] text-[var(--t-ink-muted)] uppercase">
                    {contact.role}
                  </p>
                )}
                <div className="mt-3 flex gap-5">
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                      className="tap-target inline-grid place-items-center text-fluid-xs text-[var(--t-accent)]"
                    >
                      Call
                    </a>
                  )}
                  {contact.whatsapp && (
                    <a
                      href={`https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tap-target inline-grid place-items-center text-fluid-xs text-[var(--t-accent)]"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </Block>
  );
}

function VerseSection({ data }: { data: WeddingData }) {
  const { islamic } = data;

  return (
    <section className="invite-section border-t border-[var(--t-line)] bg-[var(--t-bg)]">
      <div className="invite-container-wide">
        <div className="mx-auto max-w-2xl text-center">
          {islamic.verseTranslation && (
            <Reveal durationScale={1.3}>
              <p className="font-[family-name:var(--font-fashion)] text-fluid-xl leading-[1.5] text-balance-heading text-[var(--t-ink)]">
                &ldquo;{islamic.verseTranslation}&rdquo;
              </p>
            </Reveal>
          )}
          {islamic.verseArabic && (
            <Reveal delay={0.18} className="mt-8">
              <p lang="ar" dir="rtl" className="text-fluid-base leading-[2] text-[var(--t-ink-soft)]">
                {islamic.verseArabic}
              </p>
            </Reveal>
          )}
          {islamic.verseReference && (
            <Reveal delay={0.26} className="mt-6">
              <p className="text-[0.6rem] tracking-[0.3em] text-[var(--t-accent)] uppercase">
                {islamic.verseReference}
              </p>
            </Reveal>
          )}
          {islamic.duaText && (
            <Reveal delay={0.34} className="mt-8">
              <p className="text-fluid-sm text-[var(--t-ink-muted)] italic">
                {islamic.duaText}
              </p>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

function ClosingSection({ data }: { data: WeddingData }) {
  const names = coupleNames(data);
  const date = effectiveDate(data);

  return (
    <section className="relative flex min-h-[85svh] flex-col justify-end border-t border-[var(--t-line)] bg-[var(--t-bg)]">
      <div className="invite-container-wide pb-16">
        <div className="font-[family-name:var(--font-fashion)] text-[var(--t-ink)] uppercase">
          <MaskedLine className="block text-fluid-poster leading-[0.9]">
            {names.firstShort}
          </MaskedLine>
          <MaskedLine delay={0.15} className="my-2">
            <span className="text-fluid-base text-[var(--t-accent)] lowercase italic">
              and
            </span>
          </MaskedLine>
          <MaskedLine delay={0.3} className="block text-fluid-poster leading-[0.9]">
            {names.secondShort}
          </MaskedLine>
        </div>

        <Reveal delay={0.5} className="mt-10">
          <span aria-hidden className="block h-px w-full bg-[var(--t-line)]" />
        </Reveal>

        <div className="mt-6 flex flex-wrap items-baseline justify-between gap-4">
          <Reveal delay={0.55}>
            <p className="text-[0.62rem] tracking-[0.28em] text-[var(--t-ink-muted)] uppercase">
              {[formatWeekday(date), formatLongDate(date), formatTimeRange(effectiveTime(data), null)]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </Reveal>
          <Reveal delay={0.6}>
            <p className="text-[0.62rem] tracking-[0.28em] text-[var(--t-accent)] uppercase">
              Barakallahu lakuma
            </p>
          </Reveal>
        </div>

        {data.closingMessage && (
          <Reveal delay={0.68} className="mt-8">
            <p className="max-w-xl text-fluid-base leading-[1.95] text-pretty-body text-[var(--t-ink-soft)]">
              {data.closingMessage}
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
