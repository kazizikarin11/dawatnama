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
import {
  BotanicalFrame,
  BotanicalStem,
  EditorialLabel,
  Petals,
  ScriptAccent,
} from "./decor";
import { IVORY_ROSE, IVORY_ROSE_ALT } from "./theme";

/**
 * TEMPLATE 02 — IVORY & ROSE
 *
 * Romantic soft luxury laid out like a fashion editorial: asymmetric columns,
 * numbered sections, wide paper margins, photography allowed to bleed off the
 * page. Motion language: mask reveals, slow image drift, drifting petals. Where
 * Royal Emerald is symmetrical and ornamental, this is off-centre and typographic.
 */
export default function IvoryRoseTemplate({ data, sections, mode }: TemplateProps) {
  const tokens =
    data.appearance.backgroundVariant === "alt" ? IVORY_ROSE_ALT : IVORY_ROSE;

  // Section numerals are assigned from the plan, so removing a section never
  // leaves a gap in the sequence.
  const numeral = (id: Parameters<typeof sections.indexOf>[0]) =>
    String(sections.indexOf(id) + 1).padStart(2, "0");

  return (
    <div
      style={tokensToStyle(tokens, accentFor(data, true))}
      className="surface-paper relative isolate w-full overflow-hidden font-[family-name:var(--font-sans)]"
    >
      <Cover data={data} mode={mode} />

      <StageBody>
        <h1 className="sr-only">Wedding invitation — {coupleNames(data).combined}</h1>

        <main>
          {sections.has("bismillah") && <BismillahSection data={data} />}
          {sections.has("message") && (
            <MessageSection data={data} numeral={numeral("message")} />
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
          {sections.has("dressCode") && <DressCodeSection data={data} />}
          {sections.has("gallery") && (
            <GallerySection data={data} numeral={numeral("gallery")} />
          )}
          {sections.has("rsvp") && (
            <RsvpSection data={data} mode={mode} numeral={numeral("rsvp")} />
          )}
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
/* Cover — photograph-led, text set low and left                        */
/* ================================================================== */

function Cover({ data, mode }: { data: WeddingData; mode: TemplateProps["mode"] }) {
  const { open } = useStage();
  const names = coupleNames(data);
  const parts = formatDateParts(effectiveDate(data));

  return (
    <CoverLayer exit="rise" className="bg-[var(--t-bg)]">
      {data.heroImage ? (
        <div aria-hidden className="absolute inset-0 overflow-hidden">
          <SmartImage
            image={data.heroImage}
            priority
            sizes="100vw"
            className="animate-ken-burns"
          />
          {/*
           * Warm scrim, weighted to the bottom where the type sits. Light enough
           * through the middle that the photograph is still the subject, but
           * lifted at the very top so the small Arabic line stays legible.
           */}
          <div className="absolute inset-0 bg-gradient-to-b from-[color-mix(in_oklab,var(--t-bg)_60%,transparent)] via-[color-mix(in_oklab,var(--t-bg)_14%,transparent)] to-[var(--t-bg)] via-45%" />
        </div>
      ) : (
        <div aria-hidden className="absolute inset-0 bg-[var(--t-bg-alt)]" />
      )}

      <CoverCanvas template="ivory-rose" />
      <Petals count={5} />

      <div className="relative flex min-h-full flex-1 flex-col justify-between px-7 pt-12 pb-10 sm:px-12">
        <div className="flex items-start justify-between gap-5">
          {data.islamic.bismillahArabic && (
            <Reveal delay={0.2} className="min-w-0 max-w-[15rem]">
              <p lang="ar" dir="rtl" className="text-fluid-base text-[var(--t-ink)]">
                {data.islamic.bismillahArabic}
              </p>
            </Reveal>
          )}
          <Reveal delay={0.35}>
            <p className="text-right text-fluid-xs tracking-label-tight text-[var(--t-accent)]">
              Save the date
            </p>
          </Reveal>
        </div>

        <div className="max-w-xl">
          <Reveal delay={0.5}>
            <ScriptAccent className="text-fluid-2xl">The wedding of</ScriptAccent>
          </Reveal>

          <p className="mt-4 font-[family-name:var(--font-editorial)] text-[var(--t-ink)]">
            <MaskedLine delay={0.7} className="text-fluid-3xl leading-[1.02] font-normal">
              {names.firstShort || "Bride"}
            </MaskedLine>
            <MaskedLine delay={0.95} className="text-fluid-3xl leading-[1.02] font-normal">
              <span className="text-[var(--t-accent)] italic">&amp;</span>{" "}
              {names.secondShort || "Groom"}
            </MaskedLine>
          </p>

          {parts && (
            <Reveal delay={1.3} className="mt-8">
              {/* Day and month sit on one line; the Hijri date drops beneath it
                  rather than being squeezed into a third column on a phone. */}
              <div className="flex items-center gap-3.5 text-[var(--t-ink-soft)]">
                <span className="font-[family-name:var(--font-editorial)] text-fluid-xl leading-none">
                  {parts.day}
                </span>
                <span className="h-7 w-px shrink-0 bg-[var(--t-line)]" aria-hidden />
                <span className="text-fluid-xs tracking-label-tight">
                  {parts.monthName} {parts.year}
                </span>
              </div>
              {data.hijriDate && (
                <p className="mt-2.5 text-fluid-xs tracking-label-tight text-[var(--t-ink-muted)]">
                  {data.hijriDate}
                </p>
              )}
            </Reveal>
          )}

          <Reveal delay={1.6} className="mt-9">
            <button
              type="button"
              data-cover-action
              onClick={open}
              disabled={mode === "thumbnail"}
              className="tap-target group inline-flex items-center gap-3 text-fluid-xs tracking-label text-[var(--t-ink)]"
            >
              Open invitation
              <span
                aria-hidden
                className="block h-px w-12 origin-left bg-[var(--t-accent)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-150"
              />
            </button>
          </Reveal>
        </div>
      </div>
    </CoverLayer>
  );
}

/* ================================================================== */
/* Sections                                                            */
/* ================================================================== */

function BismillahSection({ data }: { data: WeddingData }) {
  const { islamic } = data;

  return (
    <section className="invite-section bg-[var(--t-bg)]">
      <div className="invite-container relative text-center">
        <BotanicalFrame delay={0.2} />

        {islamic.bismillahArabic && (
          <Reveal durationScale={1.5}>
            <p lang="ar" dir="rtl" className="text-fluid-xl leading-[2] text-[var(--t-ink)]">
              {islamic.bismillahArabic}
            </p>
          </Reveal>
        )}

        {islamic.bismillahTranslation && (
          <Reveal delay={0.25} className="mt-7">
            <p className="font-[family-name:var(--font-editorial)] text-fluid-lg leading-relaxed text-pretty-body text-[var(--t-ink-soft)] italic">
              {islamic.bismillahTranslation}
            </p>
          </Reveal>
        )}

        {islamic.bismillahTransliteration && (
          <Reveal delay={0.35} className="mt-4">
            <p className="text-fluid-xs tracking-label text-[var(--t-accent)]">
              {islamic.bismillahTransliteration}
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}

function MessageSection({ data, numeral }: { data: WeddingData; numeral: string }) {
  return (
    <section className="invite-section bg-[var(--t-bg-alt)]">
      <div className="invite-container-wide">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <Reveal>
              <EditorialLabel index={numeral}>The invitation</EditorialLabel>
            </Reveal>
          </div>

          <div className="lg:col-span-8">
            {data.familyInvitationWording && (
              <Reveal>
                <p className="font-[family-name:var(--font-editorial)] text-fluid-xl leading-[1.45] text-balance-heading text-[var(--t-ink)]">
                  {data.familyInvitationWording}
                </p>
              </Reveal>
            )}

            {data.invitationMessage && (
              <Reveal delay={0.15} className="mt-8">
                <p className="max-w-2xl text-fluid-base leading-[1.95] text-pretty-body text-[var(--t-ink-soft)]">
                  {data.invitationMessage}
                </p>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function CoupleSection({ data, numeral }: { data: WeddingData; numeral: string }) {
  const { bride, groom, order } = data.couple;
  const parties = order === "groom-first" ? [groom, bride] : [bride, groom];

  return (
    <section className="invite-section bg-[var(--t-bg)]">
      <div className="invite-container-wide">
        <Reveal>
          <EditorialLabel index={numeral}>The couple</EditorialLabel>
        </Reveal>

        {data.couple.shortDescription && (
          <Reveal delay={0.12} className="mt-8">
            <p className="max-w-2xl font-[family-name:var(--font-editorial)] text-fluid-xl leading-[1.5] text-balance-heading text-[var(--t-ink)]">
              {data.couple.shortDescription}
            </p>
          </Reveal>
        )}

        <div className="mt-16 space-y-20 lg:space-y-28">
          {parties.map((party, index) => {
            const alignRight = index % 2 === 1;
            return (
              <article
                key={index}
                className={cn(
                  "grid items-end gap-8 lg:grid-cols-12 lg:gap-14",
                  alignRight && "lg:[direction:rtl]",
                )}
              >
                {party.photo && (
                  <ClipReveal
                    from={alignRight ? "right" : "left"}
                    className={cn(
                      "lg:col-span-7",
                      // Image bleeds past the reading column, editorial style.
                      alignRight ? "-mr-[max(1.25rem,5vw)] lg:mr-0" : "-ml-[max(1.25rem,5vw)] lg:ml-0",
                    )}
                  >
                    <ScrollScale
                      className={cn(index % 2 === 0 ? "aspect-[4/5]" : "aspect-[3/4]")}
                      from={1.16}
                      to={1}
                    >
                      <SmartImage
                        image={party.photo}
                        sizes="(max-width: 1024px) 92vw, 52vw"
                      />
                    </ScrollScale>
                  </ClipReveal>
                )}

                <div className={cn("lg:col-span-5 lg:[direction:ltr]")}>
                  <Reveal>
                    <h2 className="font-[family-name:var(--font-editorial)] text-fluid-2xl leading-tight font-normal text-[var(--t-ink)]">
                      {party.name || (index === 0 ? "Bride" : "Groom")}
                    </h2>
                  </Reveal>

                  {party.parents && (
                    <Reveal delay={0.1} className="mt-4">
                      <p className="text-fluid-xs tracking-label-tight text-[var(--t-accent)]">
                        {party.parents}
                      </p>
                    </Reveal>
                  )}

                  {party.description && (
                    <Reveal delay={0.16} className="mt-6">
                      <p className="text-fluid-sm leading-[1.95] text-pretty-body text-[var(--t-ink-muted)]">
                        {party.description}
                      </p>
                    </Reveal>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CountdownSection({ data }: { data: WeddingData }) {
  const date = effectiveDate(data);
  const countdown = useCountdown(toTimestamp(date, effectiveTime(data)));

  const cells = [
    { value: countdown?.days, label: "days" },
    { value: countdown?.hours, label: "hours" },
    { value: countdown?.minutes, label: "minutes" },
  ];

  return (
    <section className="invite-section-tight bg-[var(--t-bg-alt)]">
      <div className="invite-container-wide">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <Reveal>
              <ScriptAccent className="text-fluid-2xl">
                {countdown?.isPast ? "Alhamdulillah" : "Counting the days"}
              </ScriptAccent>
            </Reveal>
            {date && (
              <Reveal delay={0.1} className="mt-3">
                <p className="text-fluid-xs tracking-label text-[var(--t-ink-muted)]">
                  {formatLongDate(date)}
                </p>
              </Reveal>
            )}
          </div>

          {!countdown?.isPast && (
            <RevealGroup className="flex items-end gap-8">
              {cells.map((cell) => (
                <RevealItem key={cell.label}>
                  <p className="font-[family-name:var(--font-editorial)] text-fluid-3xl leading-none text-[var(--t-accent)] tabular-nums">
                    {cell.value === undefined ? "—" : cell.value}
                  </p>
                  <p className="mt-2 text-[0.65rem] tracking-label text-[var(--t-ink-muted)]">
                    {cell.label}
                  </p>
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </div>
      </div>
    </section>
  );
}

function EventsSection({ data, numeral }: { data: WeddingData; numeral: string }) {
  const events = enabledEvents(data);

  return (
    <section className="invite-section bg-[var(--t-bg)]">
      <div className="invite-container-wide">
        <Reveal>
          <EditorialLabel index={numeral}>The celebrations</EditorialLabel>
        </Reveal>

        <div className="mt-14 divide-y divide-[var(--t-line)]">
          {events.map((event, index) => {
            const when = eventWhen(event);
            const directions = directionsUrl(event.venue);
            const parts = formatDateParts(event.date);

            return (
              <article key={event.id} className="py-10 first:pt-0">
                <div className="grid gap-6 lg:grid-cols-12 lg:gap-12">
                  {/* Date block, set as editorial numerals. */}
                  <div className="lg:col-span-3">
                    <Reveal>
                      {parts ? (
                        <div className="flex items-baseline gap-3 lg:flex-col lg:gap-1">
                          <span className="font-[family-name:var(--font-editorial)] text-fluid-2xl leading-none text-[var(--t-accent)]">
                            {parts.day}
                          </span>
                          <span className="text-fluid-xs tracking-label text-[var(--t-ink-muted)]">
                            {parts.monthShort} {parts.year}
                          </span>
                        </div>
                      ) : (
                        <span className="text-fluid-xs tracking-label text-[var(--t-ink-muted)]">
                          Date to follow
                        </span>
                      )}
                    </Reveal>
                  </div>

                  <div className="lg:col-span-5">
                    <Reveal delay={0.06}>
                      <h3 className="font-[family-name:var(--font-editorial)] text-fluid-xl font-normal text-[var(--t-ink)]">
                        {event.name}
                      </h3>
                      {event.subtitle && (
                        <p className="mt-2 text-fluid-sm text-[var(--t-accent)] italic">
                          {event.subtitle}
                        </p>
                      )}
                      {when && (
                        <p className="mt-4 text-fluid-sm text-[var(--t-ink-soft)]">{when}</p>
                      )}
                      {event.venue && (
                        <p className="mt-3 text-fluid-sm text-[var(--t-ink-soft)]">
                          {event.venue.name}
                          {event.venue.address && (
                            <span className="block text-fluid-xs text-[var(--t-ink-muted)]">
                              {event.venue.address}
                            </span>
                          )}
                        </p>
                      )}
                      {event.description && (
                        <p className="mt-4 text-fluid-sm leading-[1.9] text-pretty-body text-[var(--t-ink-muted)]">
                          {event.description}
                        </p>
                      )}

                      <div className="mt-6 flex flex-wrap items-center gap-4">
                        {event.dressCode && (
                          <span className="text-[0.65rem] tracking-label text-[var(--t-ink-muted)]">
                            {event.dressCode}
                          </span>
                        )}
                        {directions && (
                          <a
                            href={directions}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tap-target group inline-flex items-center gap-2 text-fluid-xs tracking-label-tight text-[var(--t-ink)]"
                          >
                            Directions
                            <span
                              aria-hidden
                              className="block h-px w-8 origin-left bg-[var(--t-accent)] transition-transform duration-500 group-hover:scale-x-150"
                            />
                          </a>
                        )}
                      </div>
                    </Reveal>
                  </div>

                  {event.image && (
                    <ClipReveal from="bottom" className="lg:col-span-4">
                      <Parallax strength={index % 2 === 0 ? 20 : -14}>
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <SmartImage
                            image={event.image}
                            sizes="(max-width: 1024px) 92vw, 30vw"
                          />
                        </div>
                      </Parallax>
                    </ClipReveal>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function VenueSection({ data, numeral }: { data: WeddingData; numeral: string }) {
  const events = eventsWithVenue(data);

  return (
    <section className="invite-section bg-[var(--t-bg-alt)]">
      <div className="invite-container-wide">
        <Reveal>
          <EditorialLabel index={numeral}>Where</EditorialLabel>
        </Reveal>

        <div className="mt-14 grid gap-14 sm:grid-cols-2 sm:gap-10">
          {events.map((event) => {
            const venue = event.venue;
            if (!venue) return null;
            const directions = directionsUrl(venue);

            return (
              <div key={event.id}>
                {venue.image && (
                  <ClipReveal from="bottom">
                    <div className="relative aspect-[5/4] overflow-hidden">
                      <SmartImage
                        image={venue.image}
                        sizes="(max-width: 640px) 92vw, 44vw"
                        className="transition-transform duration-[1400ms] hover:scale-105"
                      />
                    </div>
                  </ClipReveal>
                )}

                <Reveal delay={0.1} className="mt-6">
                  <p className="text-fluid-xs tracking-label text-[var(--t-accent)]">
                    {event.name}
                  </p>
                  <h3 className="mt-3 font-[family-name:var(--font-editorial)] text-fluid-lg font-normal text-[var(--t-ink)]">
                    {venue.name}
                  </h3>
                  {venue.address && (
                    <p className="mt-2 text-fluid-sm leading-relaxed text-[var(--t-ink-muted)]">
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
                      className="tap-target mt-5 inline-grid place-items-center border border-[var(--t-ink)] px-6 text-fluid-xs tracking-label-tight text-[var(--t-ink)] transition-colors duration-300 hover:bg-[var(--t-ink)] hover:text-[var(--t-bg)]"
                    >
                      Get directions
                    </a>
                  )}
                </Reveal>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StorySection({ data, numeral }: { data: WeddingData; numeral: string }) {
  return (
    <section className="invite-section bg-[var(--t-bg)]">
      <div className="invite-container-wide">
        <Reveal>
          <EditorialLabel index={numeral}>Our story</EditorialLabel>
        </Reveal>

        <div className="mt-14 space-y-16">
          {data.story.map((milestone, index) => (
            <article
              key={milestone.id}
              className={cn(
                "grid gap-7 lg:grid-cols-12 lg:items-center lg:gap-14",
                index % 2 === 1 && "lg:[direction:rtl]",
              )}
            >
              {milestone.image && (
                <ClipReveal
                  from={index % 2 === 0 ? "left" : "right"}
                  className="lg:col-span-6"
                >
                  <div className="relative aspect-[5/4] overflow-hidden">
                    <SmartImage
                      image={milestone.image}
                      sizes="(max-width: 1024px) 92vw, 46vw"
                    />
                  </div>
                </ClipReveal>
              )}

              <div className="lg:col-span-6 lg:[direction:ltr]">
                <Reveal>
                  {milestone.date && (
                    <ScriptAccent className="text-fluid-xl">
                      {milestone.date}
                    </ScriptAccent>
                  )}
                  <h3 className="mt-3 font-[family-name:var(--font-editorial)] text-fluid-xl font-normal text-[var(--t-ink)]">
                    {milestone.title}
                  </h3>
                  {milestone.description && (
                    <p className="mt-4 text-fluid-sm leading-[1.95] text-pretty-body text-[var(--t-ink-muted)]">
                      {milestone.description}
                    </p>
                  )}
                </Reveal>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function DressCodeSection({ data }: { data: WeddingData }) {
  const dress = data.dressCode;
  if (!dress) return null;

  return (
    <section className="invite-section-tight bg-[var(--t-bg-alt)]">
      <div className="invite-container-wide">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <Reveal>
              <EditorialLabel>{dress.title ?? "Attire"}</EditorialLabel>
            </Reveal>
          </div>
          <div className="lg:col-span-8">
            {dress.description && (
              <Reveal>
                <p className="max-w-xl font-[family-name:var(--font-editorial)] text-fluid-lg leading-relaxed text-pretty-body text-[var(--t-ink-soft)]">
                  {dress.description}
                </p>
              </Reveal>
            )}
            {dress.palette.length > 0 && (
              <RevealGroup className="mt-8 flex gap-3">
                {dress.palette.map((colour) => (
                  <RevealItem key={colour}>
                    <span
                      className="block size-12 rounded-full"
                      style={{ backgroundColor: colour }}
                      title={colour}
                    />
                    <span className="sr-only">{colour}</span>
                  </RevealItem>
                ))}
              </RevealGroup>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function GallerySection({ data, numeral }: { data: WeddingData; numeral: string }) {
  return (
    <section className="invite-section bg-[var(--t-bg)]">
      <div className="invite-container-wide">
        <Reveal>
          <EditorialLabel index={numeral}>Moments</EditorialLabel>
        </Reveal>
      </div>

      <div className="invite-container-wide mt-12">
        <Gallery
          images={data.gallery}
          fallback="stack"
          preference={data.appearance.galleryStyle}
        />
      </div>
    </section>
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
    <section id="rsvp" className="invite-section bg-[var(--t-bg-alt)]">
      <div className="invite-container-wide">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <EditorialLabel index={numeral}>RSVP</EditorialLabel>
            </Reveal>
            <Reveal delay={0.1} className="mt-6">
              <h2 className="font-[family-name:var(--font-editorial)] text-fluid-2xl leading-tight font-normal text-[var(--t-ink)]">
                {data.rsvp.headline ?? "Will you join us?"}
              </h2>
            </Reveal>
            {data.rsvp.message && (
              <Reveal delay={0.16} className="mt-5">
                <p className="max-w-sm text-fluid-sm leading-relaxed text-pretty-body text-[var(--t-ink-muted)]">
                  {data.rsvp.message}
                </p>
              </Reveal>
            )}
            <BotanicalStem className="mt-10 hidden h-44 w-24 lg:block" delay={0.3} />
          </div>

          <div className="lg:col-span-7">
            <Reveal delay={0.12}>
              <div className="bg-[var(--t-surface)] px-6 py-9 sm:px-10">
                <RsvpForm data={data} mode={mode} variant="editorial" />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function FamilySection({ data }: { data: WeddingData }) {
  const { familyNames, contacts, gratitudeMessage } = data;

  return (
    <section className="invite-section bg-[var(--t-bg)]">
      <div className="invite-container-wide text-center">
        <Reveal>
          <ScriptAccent className="text-fluid-2xl">With love, our families</ScriptAccent>
        </Reveal>

        {(familyNames.bride || familyNames.groom) && (
          <RevealGroup className="mt-9 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {[familyNames.bride, familyNames.groom]
              .filter((name): name is string => Boolean(name))
              .map((name) => (
                <RevealItem key={name}>
                  <p className="font-[family-name:var(--font-editorial)] text-fluid-lg text-[var(--t-ink)]">
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
          <RevealGroup className="mt-12 flex flex-wrap justify-center gap-x-12 gap-y-6">
            {contacts.map((contact) => (
              <RevealItem key={contact.id}>
                <p className="text-fluid-sm text-[var(--t-ink)]">{contact.name}</p>
                {contact.role && (
                  <p className="mt-1 text-[0.65rem] tracking-label text-[var(--t-ink-muted)]">
                    {contact.role}
                  </p>
                )}
                <div className="mt-2 flex justify-center gap-4">
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                      className="tap-target inline-grid place-items-center text-fluid-xs text-[var(--t-accent)] underline underline-offset-4"
                    >
                      Call
                    </a>
                  )}
                  {contact.whatsapp && (
                    <a
                      href={`https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tap-target inline-grid place-items-center text-fluid-xs text-[var(--t-accent)] underline underline-offset-4"
                    >
                      WhatsApp
                    </a>
                  )}
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
    <section className="invite-section bg-[var(--t-bg-alt)]">
      <div className="invite-container relative text-center">
        <BotanicalFrame delay={0.2} />

        {islamic.verseTranslation && (
          <Reveal durationScale={1.4}>
            <p className="font-[family-name:var(--font-editorial)] text-fluid-xl leading-[1.6] text-balance-heading text-[var(--t-ink)] italic">
              &ldquo;{islamic.verseTranslation}&rdquo;
            </p>
          </Reveal>
        )}

        {islamic.verseArabic && (
          <Reveal delay={0.2} className="mt-8">
            <p lang="ar" dir="rtl" className="text-fluid-lg leading-[2] text-[var(--t-ink-soft)]">
              {islamic.verseArabic}
            </p>
          </Reveal>
        )}

        {islamic.verseReference && (
          <Reveal delay={0.3} className="mt-6">
            <p className="text-fluid-xs tracking-label text-[var(--t-accent)]">
              {islamic.verseReference}
            </p>
          </Reveal>
        )}

        {islamic.duaText && (
          <Reveal delay={0.38} className="mt-10">
            <p className="text-fluid-sm text-[var(--t-ink-muted)] italic">
              {islamic.duaText}
            </p>
          </Reveal>
        )}
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
      <Petals count={6} />

      <div className="invite-container-wide relative py-24 text-center">
        <Reveal>
          <ScriptAccent className="text-fluid-3xl">Barakallahu lakuma</ScriptAccent>
        </Reveal>

        <h2 className="mt-8 font-[family-name:var(--font-editorial)] text-[var(--t-ink)]">
          <MaskedLine className="text-fluid-3xl leading-[1.05]">
            {names.firstShort}
          </MaskedLine>
          <MaskedLine delay={0.12} className="text-fluid-3xl leading-[1.05]">
            <span className="text-[var(--t-accent)] italic">&amp;</span>{" "}
            {names.secondShort}
          </MaskedLine>
        </h2>

        {(date || time) && (
          <Reveal delay={0.3} className="mt-10">
            <p className="text-fluid-xs tracking-label text-[var(--t-ink-muted)]">
              {[date, time].filter(Boolean).join(" · ")}
            </p>
          </Reveal>
        )}

        {data.closingMessage && (
          <Reveal delay={0.4} className="mt-9">
            <p className="mx-auto max-w-xl text-fluid-base leading-[1.95] text-pretty-body text-[var(--t-ink-soft)]">
              {data.closingMessage}
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
