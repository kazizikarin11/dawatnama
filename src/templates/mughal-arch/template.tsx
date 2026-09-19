"use client";

import { cn } from "@/lib/utils/cn";
import {
  coupleNames,
  directionsUrl,
  eventWhen,
  formatDateParts,
  formatLongDate,
  formatTimeRange,
  toTimestamp,
} from "@/lib/wedding/format";
import {
  effectiveDate,
  effectiveTime,
  enabledEvents,
  eventsWithVenue,
} from "@/lib/wedding/sections";
import type { WeddingData } from "@/lib/wedding/types";
import { SmartImage } from "@/components/media/smart-image";
import {
  ClipReveal,
  MaskedLine,
  Parallax,
  Reveal,
  RevealGroup,
  RevealItem,
} from "@/components/motion/primitives";
import { InvitationDock } from "@/components/invitation/dock";
import { Gallery } from "@/components/invitation/gallery";
import { RsvpForm } from "@/components/invitation/rsvp-form";
import { CoverLayer, StageBody, useStage } from "@/components/invitation/stage";
import { useCountdown } from "@/components/invitation/use-countdown";
import { CoverCanvas } from "@/components/webgl/cover-canvas";
import type { TemplateProps } from "@/templates/contract";
import { accentFor, tokensToStyle } from "@/templates/tokens";
import {
  ArchClip,
  ArchColonnade,
  DrawnArch,
  JaliScreen,
  StoneLabel,
} from "./decor";
import { MUGHAL, MUGHAL_ALT } from "./theme";

/**
 * TEMPLATE 04 — MUGHAL ARCH
 *
 * Architecture used as layout. Arches are the containers: they draw themselves
 * open, they frame every photograph, and the event timeline passes through them
 * like a colonnade. Pattern is restrained to a faint jali screen, space is
 * generous and stone-like. Contemporary, not historical pastiche.
 */
export default function MughalArchTemplate({ data, sections, mode }: TemplateProps) {
  const tokens = data.appearance.backgroundVariant === "alt" ? MUGHAL_ALT : MUGHAL;

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
          {sections.has("message") && <MessageSection data={data} />}
          {sections.has("couple") && <CoupleSection data={data} />}
          {sections.has("countdown") && <CountdownSection data={data} />}
          {sections.has("events") && <EventsSection data={data} />}
          {sections.has("venue") && <VenueSection data={data} />}
          {sections.has("story") && <StorySection data={data} />}
          {sections.has("dressCode") && <DressCodeSection data={data} />}
          {sections.has("gallery") && <GallerySection data={data} />}
          {sections.has("rsvp") && <RsvpSection data={data} mode={mode} />}
          {sections.has("family") && <FamilySection data={data} />}
          {sections.has("verse") && <VerseSection data={data} />}
          {sections.has("closing") && <ClosingSection data={data} />}
        </main>
      </StageBody>

      <InvitationDock data={data} />
    </div>
  );
}

/* ================================================================== */
/* Cover — a single great arch                                          */
/* ================================================================== */

function Cover({ data, mode }: { data: WeddingData; mode: TemplateProps["mode"] }) {
  const { open } = useStage();
  const names = coupleNames(data);
  const parts = formatDateParts(effectiveDate(data));

  return (
    <CoverLayer exit="veil" className="bg-[var(--t-bg)]">
      <JaliScreen opacity={0.08} scale={64} />
      <CoverCanvas template="mughal-arch" />

      <div className="relative flex min-h-full flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="relative w-full max-w-[21rem]">
          {/* The great arch is set out around the names. */}
          <DrawnArch className="absolute inset-0" delay={0.4} />

          <div className="relative px-7 pt-11 pb-9 text-center">
            {data.heroImage && (
              <ClipReveal from="bottom" delay={0.9} className="mx-auto mb-7 w-[58%]">
                <ArchClip className="relative aspect-[3/4] overflow-hidden">
                  <SmartImage image={data.heroImage} priority sizes="60vw" />
                </ArchClip>
              </ClipReveal>
            )}

            {data.islamic.bismillahArabic && (
              <Reveal delay={0.2}>
                <p lang="ar" dir="rtl" className="text-fluid-sm text-[var(--t-ink-soft)]">
                  {data.islamic.bismillahArabic}
                </p>
              </Reveal>
            )}

            <Reveal delay={1.2} className="mt-7">
              <StoneLabel>The wedding of</StoneLabel>
            </Reveal>

            <p className="mt-6 font-[family-name:var(--font-architectural)] text-[var(--t-ink)]">
              <MaskedLine
                delay={1.4}
                className="text-fluid-2xl leading-[1.15] tracking-[0.06em] uppercase"
              >
                {names.firstShort || "Bride"}
              </MaskedLine>
              <MaskedLine delay={1.6} className="my-2">
                <span className="text-fluid-base tracking-[0.3em] text-[var(--t-accent)]">
                  AND
                </span>
              </MaskedLine>
              <MaskedLine
                delay={1.8}
                className="text-fluid-2xl leading-[1.15] tracking-[0.06em] uppercase"
              >
                {names.secondShort || "Groom"}
              </MaskedLine>
            </p>

            {parts && (
              <Reveal delay={2.2} className="mt-9">
                <div className="flex items-center justify-center gap-3 text-[var(--t-ink-soft)]">
                  <span className="text-fluid-xs tracking-[0.28em] uppercase">
                    {parts.day}
                  </span>
                  <span aria-hidden className="h-px w-5 bg-[var(--t-line)]" />
                  <span className="text-fluid-xs tracking-[0.28em] uppercase">
                    {parts.monthName}
                  </span>
                  <span aria-hidden className="h-px w-5 bg-[var(--t-line)]" />
                  <span className="text-fluid-xs tracking-[0.28em] uppercase">
                    {parts.year}
                  </span>
                </div>
                {data.hijriDate && (
                  <p className="mt-2 text-[0.62rem] tracking-[0.26em] text-[var(--t-ink-muted)] uppercase">
                    {data.hijriDate}
                  </p>
                )}
              </Reveal>
            )}
          </div>
        </div>

        <Reveal delay={2.5} className="mt-9">
          <button
            type="button"
            data-cover-action
            onClick={open}
            disabled={mode === "thumbnail"}
            className="tap-target bg-[var(--t-accent)] px-10 py-4 font-[family-name:var(--font-architectural)] text-fluid-xs tracking-[0.34em] text-[var(--t-surface)] uppercase transition-opacity duration-300 hover:opacity-90"
          >
            Open invitation
          </button>
        </Reveal>

        <ArchColonnade className="mt-8" count={7} delay={2.7} />
      </div>
    </CoverLayer>
  );
}

/* ================================================================== */
/* Sections                                                            */
/* ================================================================== */

function SectionHead({ label, title }: { label: string; title?: string | null }) {
  return (
    <div className="text-center">
      <Reveal>
        <StoneLabel>{label}</StoneLabel>
      </Reveal>
      {title && (
        <h2 className="mt-6 font-[family-name:var(--font-architectural)] text-fluid-2xl tracking-[0.04em] text-balance-heading text-[var(--t-ink)] uppercase">
          <MaskedLine>{title}</MaskedLine>
        </h2>
      )}
    </div>
  );
}

function BismillahSection({ data }: { data: WeddingData }) {
  const { islamic } = data;

  return (
    <section className="invite-section relative bg-[var(--t-bg)]">
      <div className="invite-container relative text-center">
        {islamic.bismillahArabic && (
          <Reveal durationScale={1.5}>
            <p lang="ar" dir="rtl" className="text-fluid-2xl leading-[2] text-[var(--t-ink)]">
              {islamic.bismillahArabic}
            </p>
          </Reveal>
        )}

        {islamic.bismillahTranslation && (
          <Reveal delay={0.25} className="mt-8">
            <p className="text-fluid-base leading-[1.9] text-pretty-body text-[var(--t-ink-soft)]">
              {islamic.bismillahTranslation}
            </p>
          </Reveal>
        )}

        <ArchColonnade className="mt-12" count={5} />
      </div>
    </section>
  );
}

function MessageSection({ data }: { data: WeddingData }) {
  return (
    <section className="invite-section relative bg-[var(--t-bg-alt)]">
      <JaliScreen opacity={0.08} scale={44} />

      <div className="invite-container relative">
        <div className="relative px-6 py-14 text-center">
          <DrawnArch variant="wide" className="absolute inset-0 h-full w-full opacity-70" />

          {data.familyInvitationWording && (
            <Reveal>
              <p className="font-[family-name:var(--font-architectural)] text-fluid-lg leading-relaxed text-balance-heading text-[var(--t-ink)]">
                {data.familyInvitationWording}
              </p>
            </Reveal>
          )}

          {data.invitationMessage && (
            <Reveal delay={0.16} className="mt-7">
              <p className="text-fluid-base leading-[1.95] text-pretty-body text-[var(--t-ink-soft)]">
                {data.invitationMessage}
              </p>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

function CoupleSection({ data }: { data: WeddingData }) {
  const { bride, groom, order } = data.couple;
  const parties = order === "groom-first" ? [groom, bride] : [bride, groom];

  return (
    <section className="invite-section relative bg-[var(--t-bg)]">
      <div className="invite-container-wide relative">
        <SectionHead label="The couple" />

        {/* Two arches, side by side like a pavilion front. */}
        <div className="mt-16 grid gap-12 sm:grid-cols-2 sm:gap-8">
          {parties.map((party, index) => (
            <div key={index} className="text-center">
              {party.photo ? (
                <ClipReveal from="bottom" delay={index * 0.12} className="mx-auto w-full max-w-[17rem]">
                  <div className="relative">
                    <ArchClip className="relative aspect-[3/4] overflow-hidden">
                      <SmartImage
                        image={party.photo}
                        sizes="(max-width: 640px) 80vw, 30vw"
                      />
                    </ArchClip>
                    <DrawnArch
                      className="absolute inset-0 h-full w-full"
                      delay={0.3 + index * 0.12}
                      double={false}
                    />
                  </div>
                </ClipReveal>
              ) : (
                <div className="relative mx-auto aspect-[3/4] w-full max-w-[17rem]">
                  <JaliScreen opacity={0.2} scale={38} />
                  <DrawnArch className="absolute inset-0 h-full w-full" double={false} />
                </div>
              )}

              <Reveal delay={0.18} className="mt-8">
                <h3 className="font-[family-name:var(--font-architectural)] text-fluid-lg tracking-[0.06em] text-[var(--t-ink)] uppercase">
                  {party.name || (index === 0 ? "Bride" : "Groom")}
                </h3>
                {party.parents && (
                  <p className="mt-3 text-fluid-xs text-[var(--t-accent)]">
                    {party.parents}
                  </p>
                )}
                {party.description && (
                  <p className="mx-auto mt-5 max-w-xs text-fluid-sm leading-[1.9] text-pretty-body text-[var(--t-ink-muted)]">
                    {party.description}
                  </p>
                )}
              </Reveal>
            </div>
          ))}
        </div>

        {data.couple.shortDescription && (
          <Reveal delay={0.2} className="mt-16">
            <p className="mx-auto max-w-2xl text-center font-[family-name:var(--font-architectural)] text-fluid-lg leading-relaxed text-pretty-body text-[var(--t-ink-soft)]">
              {data.couple.shortDescription}
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}

function CountdownSection({ data }: { data: WeddingData }) {
  const date = effectiveDate(data);
  const countdown = useCountdown(toTimestamp(date, effectiveTime(data)));

  const cells = [
    { value: countdown?.days, label: "Days" },
    { value: countdown?.hours, label: "Hours" },
    { value: countdown?.minutes, label: "Minutes" },
    { value: countdown?.seconds, label: "Seconds" },
  ];

  return (
    <section className="invite-section-tight relative bg-[var(--t-bg-alt)]">
      <div className="invite-container relative text-center">
        <SectionHead
          label={countdown?.isPast ? "With gratitude" : "The days ahead"}
          title={formatLongDate(date)}
        />

        {countdown?.isPast ? (
          <Reveal className="mt-8">
            <p className="text-fluid-base text-[var(--t-ink-soft)]">
              {countdown.isToday ? "Today, alhamdulillah." : "Thank you for joining us."}
            </p>
          </Reveal>
        ) : (
          /* Each unit sits inside its own small arch. */
          <RevealGroup className="mt-12 grid grid-cols-4 gap-2 sm:gap-5">
            {cells.map((cell) => (
              <RevealItem key={cell.label}>
                <div className="relative pt-3">
                  <DrawnArch
                    variant="wide"
                    double={false}
                    className="absolute inset-0 h-full w-full opacity-60"
                  />
                  <div className="relative px-1 py-5">
                    <p
                      className="font-[family-name:var(--font-architectural)] text-fluid-xl leading-none text-[var(--t-ink)]"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {cell.value === undefined ? "—" : String(cell.value).padStart(2, "0")}
                    </p>
                    <p className="mt-2 text-[0.58rem] tracking-[0.24em] text-[var(--t-ink-muted)] uppercase">
                      {cell.label}
                    </p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </div>
    </section>
  );
}

/** The programme as a colonnade: an arch per event, connected by a stone line. */
function EventsSection({ data }: { data: WeddingData }) {
  const events = enabledEvents(data);

  return (
    <section className="invite-section relative bg-[var(--t-bg)]">
      <JaliScreen opacity={0.06} scale={68} />

      <div className="invite-container-wide relative">
        <SectionHead label="The programme" title="Events" />

        <div className="relative mt-16">
          {/* Continuous plinth line behind the arches. */}
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 hidden h-px bg-[var(--t-line)] lg:block"
          />

          <div className="grid gap-14 lg:grid-cols-2 lg:gap-10">
            {events.map((event, index) => {
              const when = eventWhen(event);
              const directions = directionsUrl(event.venue);
              const parts = formatDateParts(event.date);

              return (
                <Reveal key={event.id} delay={index * 0.06}>
                  <article className="relative h-full pt-4">
                    <DrawnArch
                      variant="wide"
                      className="absolute inset-0 h-full w-full"
                      delay={index * 0.08}
                    />

                    <div className="relative px-6 pt-10 pb-9 text-center sm:px-9">
                      {event.image && (
                        <ClipReveal from="bottom" className="mx-auto mb-7 w-[74%]">
                          <ArchClip className="relative aspect-[4/5] overflow-hidden">
                            <SmartImage
                              image={event.image}
                              sizes="(max-width: 1024px) 60vw, 22vw"
                            />
                          </ArchClip>
                        </ClipReveal>
                      )}

                      {parts && (
                        <p className="text-[0.6rem] tracking-[0.3em] text-[var(--t-accent)] uppercase">
                          {parts.weekday}, {parts.day} {parts.monthName}
                        </p>
                      )}

                      <h3 className="mt-4 font-[family-name:var(--font-architectural)] text-fluid-lg tracking-[0.06em] text-[var(--t-ink)] uppercase">
                        {event.name}
                      </h3>

                      {event.subtitle && (
                        <p className="mt-2 text-fluid-xs text-[var(--t-ink-muted)]">
                          {event.subtitle}
                        </p>
                      )}

                      {when && (
                        <p className="mt-5 text-fluid-sm text-[var(--t-ink-soft)]">{when}</p>
                      )}

                      {event.venue && (
                        <p className="mt-3 text-fluid-sm text-[var(--t-ink)]">
                          {event.venue.name}
                          {event.venue.address && (
                            <span className="mt-1 block text-fluid-xs text-[var(--t-ink-muted)]">
                              {event.venue.address}
                            </span>
                          )}
                        </p>
                      )}

                      {event.description && (
                        <p className="mt-5 text-fluid-sm leading-[1.9] text-pretty-body text-[var(--t-ink-muted)]">
                          {event.description}
                        </p>
                      )}

                      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                        {event.dressCode && (
                          <span className="border border-[var(--t-line)] px-3 py-1.5 text-[0.58rem] tracking-[0.24em] text-[var(--t-ink-muted)] uppercase">
                            {event.dressCode}
                          </span>
                        )}
                        {directions && (
                          <a
                            href={directions}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tap-target inline-grid place-items-center bg-[var(--t-accent)] px-5 text-[0.58rem] tracking-[0.24em] text-[var(--t-surface)] uppercase transition-opacity hover:opacity-90"
                          >
                            Directions
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function VenueSection({ data }: { data: WeddingData }) {
  const events = eventsWithVenue(data);

  return (
    <section className="invite-section relative bg-[var(--t-bg-alt)]">
      <div className="invite-container-wide relative">
        <SectionHead label="Locations" title="Venues" />

        <div className="mt-14 space-y-16">
          {events.map((event, index) => {
            const venue = event.venue;
            if (!venue) return null;
            const directions = directionsUrl(venue);

            return (
              <div
                key={event.id}
                className={cn(
                  "grid items-center gap-8 lg:grid-cols-12 lg:gap-14",
                  index % 2 === 1 && "lg:[direction:rtl]",
                )}
              >
                {venue.image && (
                  <ClipReveal from="bottom" className="lg:col-span-7">
                    <Parallax strength={18}>
                      <ArchClip variant="wide" className="relative aspect-[16/11] overflow-hidden">
                        <SmartImage
                          image={venue.image}
                          sizes="(max-width: 1024px) 92vw, 52vw"
                        />
                      </ArchClip>
                    </Parallax>
                  </ClipReveal>
                )}

                <div className="text-center lg:col-span-5 lg:[direction:ltr] lg:text-left">
                  <Reveal>
                    <StoneLabel>{event.name}</StoneLabel>
                    <h3 className="mt-5 font-[family-name:var(--font-architectural)] text-fluid-lg tracking-[0.05em] text-[var(--t-ink)] uppercase">
                      {venue.name}
                    </h3>
                    {venue.address && (
                      <p className="mt-4 text-fluid-sm leading-relaxed text-[var(--t-ink-muted)]">
                        {venue.address}
                      </p>
                    )}
                    {venue.note && (
                      <p className="mt-2 text-fluid-xs text-[var(--t-ink-muted)] italic">
                        {venue.note}
                      </p>
                    )}
                    {directions && (
                      <a
                        href={directions}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tap-target mt-7 inline-grid place-items-center border border-[var(--t-ink)] px-8 text-[0.62rem] tracking-[0.3em] text-[var(--t-ink)] uppercase transition-colors duration-300 hover:bg-[var(--t-ink)] hover:text-[var(--t-surface)]"
                      >
                        Get directions
                      </a>
                    )}
                  </Reveal>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StorySection({ data }: { data: WeddingData }) {
  return (
    <section className="invite-section relative bg-[var(--t-bg)]">
      <div className="invite-container-wide relative">
        <SectionHead label="How it began" title="Our Story" />

        <ol className="mt-16 space-y-16">
          {data.story.map((milestone, index) => (
            <li
              key={milestone.id}
              className={cn(
                "grid gap-7 lg:grid-cols-12 lg:items-center lg:gap-14",
                index % 2 === 1 && "lg:[direction:rtl]",
              )}
            >
              {milestone.image && (
                <ClipReveal from={index % 2 === 0 ? "left" : "right"} className="lg:col-span-5">
                  <ArchClip className="relative mx-auto aspect-[3/4] w-[72%] overflow-hidden lg:w-full">
                    <SmartImage
                      image={milestone.image}
                      sizes="(max-width: 1024px) 72vw, 34vw"
                    />
                  </ArchClip>
                </ClipReveal>
              )}

              <div className="text-center lg:col-span-7 lg:[direction:ltr] lg:text-left">
                <Reveal>
                  {milestone.date && (
                    <p className="text-[0.6rem] tracking-[0.3em] text-[var(--t-accent)] uppercase">
                      {milestone.date}
                    </p>
                  )}
                  <h3 className="mt-4 font-[family-name:var(--font-architectural)] text-fluid-lg tracking-[0.05em] text-[var(--t-ink)] uppercase">
                    {milestone.title}
                  </h3>
                  {milestone.description && (
                    <p className="mt-5 text-fluid-sm leading-[1.95] text-pretty-body text-[var(--t-ink-muted)]">
                      {milestone.description}
                    </p>
                  )}
                </Reveal>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function DressCodeSection({ data }: { data: WeddingData }) {
  const dress = data.dressCode;
  if (!dress) return null;

  return (
    <section className="invite-section-tight relative bg-[var(--t-bg-alt)]">
      <div className="invite-container relative text-center">
        <SectionHead label="Attire" title={dress.title ?? "Dress code"} />

        {dress.description && (
          <Reveal delay={0.15} className="mt-7">
            <p className="text-fluid-base leading-relaxed text-pretty-body text-[var(--t-ink-soft)]">
              {dress.description}
            </p>
          </Reveal>
        )}

        {dress.palette.length > 0 && (
          <RevealGroup className="mt-10 flex justify-center gap-3">
            {dress.palette.map((colour) => (
              <RevealItem key={colour}>
                <ArchClip className="size-14">
                  <span className="block h-full w-full" style={{ backgroundColor: colour }} />
                </ArchClip>
                <span className="sr-only">{colour}</span>
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </div>
    </section>
  );
}

function GallerySection({ data }: { data: WeddingData }) {
  return (
    <section className="invite-section relative bg-[var(--t-bg)]">
      <div className="invite-container relative">
        <SectionHead label="Moments" title="Gallery" />
      </div>

      <div className="mt-12">
        <Gallery
          images={data.gallery}
          fallback="filmstrip"
          preference={data.appearance.galleryStyle}
          className="invite-container-wide"
        />
      </div>
    </section>
  );
}

function RsvpSection({ data, mode }: { data: WeddingData; mode: TemplateProps["mode"] }) {
  return (
    <section id="rsvp" className="invite-section relative bg-[var(--t-bg-alt)]">
      <JaliScreen opacity={0.07} scale={48} />

      <div className="invite-container relative">
        <SectionHead label="RSVP" title={data.rsvp.headline ?? "Will you join us?"} />

        {data.rsvp.message && (
          <Reveal delay={0.15} className="mt-6">
            <p className="text-center text-fluid-sm leading-relaxed text-pretty-body text-[var(--t-ink-soft)]">
              {data.rsvp.message}
            </p>
          </Reveal>
        )}

        <Reveal delay={0.2} className="mt-11">
          <div className="border border-[var(--t-line)] bg-[var(--t-surface)] px-5 py-9 sm:px-8">
            <RsvpForm data={data} mode={mode} variant="architectural" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FamilySection({ data }: { data: WeddingData }) {
  const { familyNames, contacts, gratitudeMessage } = data;

  return (
    <section className="invite-section relative bg-[var(--t-bg)]">
      <div className="invite-container relative text-center">
        <SectionHead label="With love" title="Our Families" />

        {(familyNames.bride || familyNames.groom) && (
          <RevealGroup className="mt-11 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {[familyNames.bride, familyNames.groom]
              .filter((name): name is string => Boolean(name))
              .map((name) => (
                <RevealItem key={name}>
                  <p className="font-[family-name:var(--font-architectural)] text-fluid-lg tracking-[0.05em] text-[var(--t-ink)] uppercase">
                    {name}
                  </p>
                </RevealItem>
              ))}
          </RevealGroup>
        )}

        {gratitudeMessage && (
          <Reveal delay={0.2} className="mt-10">
            <p className="mx-auto max-w-2xl text-fluid-base leading-[1.95] text-pretty-body text-[var(--t-ink-soft)]">
              {gratitudeMessage}
            </p>
          </Reveal>
        )}

        {contacts.length > 0 && (
          <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2">
            {contacts.map((contact) => (
              <RevealItem key={contact.id}>
                <div className="border border-[var(--t-line)] bg-[var(--t-surface)] px-5 py-6">
                  <p className="text-fluid-sm text-[var(--t-ink)]">{contact.name}</p>
                  {contact.role && (
                    <p className="mt-1 text-[0.58rem] tracking-[0.26em] text-[var(--t-ink-muted)] uppercase">
                      {contact.role}
                    </p>
                  )}
                  <div className="mt-4 flex justify-center gap-4">
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                        className="tap-target inline-grid place-items-center px-2 text-fluid-xs text-[var(--t-accent)] underline underline-offset-4"
                      >
                        Call
                      </a>
                    )}
                    {contact.whatsapp && (
                      <a
                        href={`https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tap-target inline-grid place-items-center px-2 text-fluid-xs text-[var(--t-accent)] underline underline-offset-4"
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
      </div>
    </section>
  );
}

function VerseSection({ data }: { data: WeddingData }) {
  const { islamic } = data;

  return (
    <section className="invite-section relative bg-[var(--t-bg-alt)]">
      <JaliScreen opacity={0.1} scale={40} />

      <div className="invite-container relative text-center">
        <div className="relative px-6 py-12">
          <DrawnArch variant="wide" className="absolute inset-0 h-full w-full opacity-70" />

          {islamic.verseArabic && (
            <Reveal durationScale={1.5}>
              <p lang="ar" dir="rtl" className="text-fluid-lg leading-[2.1] text-[var(--t-ink)]">
                {islamic.verseArabic}
              </p>
            </Reveal>
          )}

          {islamic.verseTranslation && (
            <Reveal delay={0.22} className="mt-8">
              <p className="font-[family-name:var(--font-architectural)] text-fluid-base leading-relaxed text-pretty-body text-[var(--t-ink-soft)]">
                &ldquo;{islamic.verseTranslation}&rdquo;
              </p>
            </Reveal>
          )}

          {islamic.verseReference && (
            <Reveal delay={0.3} className="mt-6">
              <p className="text-[0.6rem] tracking-[0.3em] text-[var(--t-accent)] uppercase">
                {islamic.verseReference}
              </p>
            </Reveal>
          )}

          {islamic.duaText && (
            <Reveal delay={0.38} className="mt-8">
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
  const date = formatLongDate(effectiveDate(data));
  const time = formatTimeRange(effectiveTime(data), null);

  return (
    <section className="relative flex min-h-[80svh] items-center overflow-hidden bg-[var(--t-bg)]">
      <JaliScreen opacity={0.12} scale={56} />

      <div className="invite-container relative py-24 text-center">
        <div className="relative mx-auto max-w-[20rem] px-6 py-14">
          <DrawnArch className="absolute inset-0 h-full w-full" />

          <h2 className="font-[family-name:var(--font-architectural)] text-[var(--t-ink)]">
            <MaskedLine className="text-fluid-2xl tracking-[0.06em] uppercase">
              {names.firstShort}
            </MaskedLine>
            <MaskedLine delay={0.12} className="my-2">
              <span className="text-fluid-sm tracking-[0.3em] text-[var(--t-accent)]">
                AND
              </span>
            </MaskedLine>
            <MaskedLine delay={0.24} className="text-fluid-2xl tracking-[0.06em] uppercase">
              {names.secondShort}
            </MaskedLine>
          </h2>

          {(date || time) && (
            <Reveal delay={0.35} className="mt-9">
              <p className="text-[0.62rem] tracking-[0.3em] text-[var(--t-ink-muted)] uppercase">
                {[date, time].filter(Boolean).join(" · ")}
              </p>
            </Reveal>
          )}
        </div>

        {data.closingMessage && (
          <Reveal delay={0.45} className="mt-10">
            <p className="mx-auto max-w-xl text-fluid-base leading-[1.95] text-pretty-body text-[var(--t-ink-soft)]">
              {data.closingMessage}
            </p>
          </Reveal>
        )}

        <ArchColonnade className="mt-14" count={11} delay={0.5} />
      </div>
    </section>
  );
}
