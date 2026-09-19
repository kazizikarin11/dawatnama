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
  LetterReveal,
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
  CineLabel,
  Crescent,
  GoldMotes,
  LightBloom,
  ScrollBackdrop,
  Starfield,
} from "./decor";
import { MIDNIGHT } from "./theme";

/**
 * TEMPLATE 03 — MIDNIGHT CRESCENT
 *
 * A wedding film opening. Names emerge from darkness, a crescent rises, gold
 * dust drifts through the frame. Composition is full-bleed and centred with very
 * long vertical pauses between beats; events run as a horizontal filmstrip
 * rather than a list. Motion language: bloom, atmospheric particles, masked
 * typography, scroll-linked backgrounds.
 */
export default function MidnightCrescentTemplate({
  data,
  sections,
  mode,
}: TemplateProps) {
  return (
    <div
      style={tokensToStyle(MIDNIGHT, accentFor(data, true))}
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
/* Cover — names rise out of the dark                                   */
/* ================================================================== */

function Cover({ data, mode }: { data: WeddingData; mode: TemplateProps["mode"] }) {
  const { open } = useStage();
  const names = coupleNames(data);
  const date = formatLongDate(effectiveDate(data));

  return (
    <CoverLayer exit="iris" className="bg-[var(--t-bg)]">
      {data.heroImage && (
        <div aria-hidden className="absolute inset-0">
          <SmartImage
            image={data.heroImage}
            priority
            sizes="100vw"
            className="scale-110 opacity-30"
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,transparent_5%,var(--t-bg)_72%)]" />
        </div>
      )}

      {/* The night sky is rendered in WebGL here — real depth, tilt parallax and
          moonlight bloom. The CSS starfield stays as the fallback layer. */}
      <CoverCanvas template="midnight-crescent" />
      <Starfield count={30} />
      <GoldMotes count={8} />
      <LightBloom intensity={0.34} />

      <div className="relative flex min-h-full flex-1 flex-col items-center justify-center px-7 py-16 text-center">
        <Crescent className="absolute top-[7%] right-[8%] opacity-90" size={96} delay={0.2} />

        {data.islamic.bismillahArabic && (
          <Reveal delay={0.7} durationScale={2}>
            <p lang="ar" dir="rtl" className="text-fluid-base text-[var(--t-accent-soft)]">
              {data.islamic.bismillahArabic}
            </p>
          </Reveal>
        )}

        <Reveal delay={1.1} className="mt-12">
          <CineLabel>The wedding of</CineLabel>
        </Reveal>

        {/* Letter-by-letter emergence, the signature of this template. */}
        <div className="mt-8 font-[family-name:var(--font-display)] text-[var(--t-ink)]">
          <LetterReveal
            text={names.firstShort || "Bride"}
            className="text-fluid-3xl leading-[1.05] font-light"
            delay={1.4}
          />
          <MaskedLine delay={2} className="my-2.5">
            <span className="text-fluid-2xl leading-none font-light text-[var(--t-accent)]">
              &amp;
            </span>
          </MaskedLine>
          <LetterReveal
            text={names.secondShort || "Groom"}
            className="text-fluid-3xl leading-[1.05] font-light"
            delay={2.2}
          />
        </div>

        {(date || data.hijriDate) && (
          <Reveal delay={2.9} className="mt-14 space-y-2">
            {date && (
              <p className="text-[0.7rem] tracking-[0.4em] text-[var(--t-ink-soft)] uppercase">
                {date}
              </p>
            )}
            {data.hijriDate && (
              <p className="text-[0.62rem] tracking-[0.32em] text-[var(--t-ink-muted)] uppercase">
                {data.hijriDate}
              </p>
            )}
          </Reveal>
        )}

        <Reveal delay={3.2} className="mt-12">
          <button
            type="button"
            data-cover-action
            onClick={open}
            disabled={mode === "thumbnail"}
            className="tap-target group relative px-10 py-4 text-[0.65rem] tracking-[0.4em] text-[var(--t-accent)] uppercase"
          >
            <span className="relative z-10">Open invitation</span>
            <span
              aria-hidden
              className="absolute inset-0 border border-[var(--t-accent)]/50 transition-colors duration-500 group-hover:border-[var(--t-accent)]"
            />
            {/* Pulsing halo, cinematic but only one element. */}
            <span
              aria-hidden
              className="absolute inset-0 border border-[var(--t-accent)]/30"
              style={{ animation: "dawat-pulse-ring 3.4s ease-out infinite" }}
            />
          </button>
        </Reveal>
      </div>
    </CoverLayer>
  );
}

/* ================================================================== */
/* Sections                                                            */
/* ================================================================== */

function SectionTitle({
  label,
  title,
}: {
  label: string;
  title?: string | null;
}) {
  return (
    <div className="text-center">
      <Reveal>
        <CineLabel>{label}</CineLabel>
      </Reveal>
      {title && (
        <h2 className="mt-6 font-[family-name:var(--font-display)] text-fluid-2xl font-light text-balance-heading text-[var(--t-ink)]">
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
      <Starfield count={26} />
      <LightBloom intensity={0.28} />

      <div className="invite-container relative text-center">
        {islamic.bismillahArabic && (
          <Reveal durationScale={1.8}>
            <p lang="ar" dir="rtl" className="text-fluid-2xl leading-[2] text-[var(--t-accent-soft)]">
              {islamic.bismillahArabic}
            </p>
          </Reveal>
        )}

        {islamic.bismillahTranslation && (
          <Reveal delay={0.3} className="mt-8">
            <p className="text-fluid-base leading-[1.9] text-pretty-body text-[var(--t-ink-soft)]">
              {islamic.bismillahTranslation}
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}

function MessageSection({ data }: { data: WeddingData }) {
  return (
    <section className="invite-section relative bg-gradient-to-b from-[var(--t-bg)] via-[var(--t-bg-alt)] to-[var(--t-bg)]">
      <ScrollBackdrop>
        <Starfield count={30} />
      </ScrollBackdrop>

      <div className="invite-container relative text-center">
        {data.familyInvitationWording && (
          <Reveal>
            <p className="font-[family-name:var(--font-display)] text-fluid-lg leading-relaxed text-balance-heading text-[var(--t-accent-soft)] italic">
              {data.familyInvitationWording}
            </p>
          </Reveal>
        )}

        {data.invitationMessage && (
          <Reveal delay={0.2} className="mt-9">
            <p className="text-fluid-base leading-[2] text-pretty-body text-[var(--t-ink-soft)]">
              {data.invitationMessage}
            </p>
          </Reveal>
        )}
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
        <SectionTitle label="The couple" />

        {data.couple.shortDescription && (
          <Reveal delay={0.15} className="mt-8">
            <p className="mx-auto max-w-2xl text-center text-fluid-base leading-relaxed text-pretty-body text-[var(--t-ink-soft)]">
              {data.couple.shortDescription}
            </p>
          </Reveal>
        )}

        <div className="mt-16 grid gap-14 sm:grid-cols-2 sm:gap-8">
          {parties.map((party, index) => (
            <div key={index} className="text-center">
              {party.photo && (
                <ClipReveal from="bottom" delay={index * 0.12}>
                  <div className="relative mx-auto aspect-[3/4] w-full max-w-[19rem] overflow-hidden">
                    <SmartImage
                      image={party.photo}
                      sizes="(max-width: 640px) 86vw, 34vw"
                      className="animate-ken-burns opacity-90"
                    />
                    {/* Bottom fade so type can sit against the frame. */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-transparent to-transparent" />
                  </div>
                </ClipReveal>
              )}

              <Reveal delay={0.16} className="mt-7">
                <h3 className="font-[family-name:var(--font-display)] text-fluid-xl font-light text-[var(--t-ink)]">
                  {party.name || (index === 0 ? "Bride" : "Groom")}
                </h3>
                {party.parents && (
                  <p className="mt-3 text-[0.62rem] tracking-[0.3em] text-[var(--t-accent)] uppercase">
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
    { value: countdown?.minutes, label: "Mins" },
    { value: countdown?.seconds, label: "Secs" },
  ];

  return (
    <section className="relative flex min-h-[70svh] items-center overflow-hidden bg-gradient-to-b from-[var(--t-bg)] via-[var(--t-bg-alt)] to-[var(--t-bg)]">
      <Starfield count={34} />
      <LightBloom intensity={0.34} />
      <GoldMotes count={10} />

      <div className="invite-container relative py-20 text-center">
        <Crescent className="mx-auto opacity-90" size={92} />

        <div className="mt-10">
          <SectionTitle
            label={countdown?.isPast ? "Alhamdulillah" : "Until the nikah"}
            title={formatLongDate(date)}
          />
        </div>

        {countdown?.isPast ? (
          <Reveal className="mt-8">
            <p className="text-fluid-base text-[var(--t-ink-soft)]">
              {countdown.isToday
                ? "Tonight, we celebrate."
                : "Thank you for celebrating with us."}
            </p>
          </Reveal>
        ) : (
          <RevealGroup className="mt-12 grid grid-cols-4 gap-3 sm:gap-6">
            {cells.map((cell) => (
              <RevealItem key={cell.label}>
                <p
                  className="font-[family-name:var(--font-display)] text-fluid-2xl leading-none font-light text-[var(--t-accent-soft)]"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {cell.value === undefined ? "—" : String(cell.value).padStart(2, "0")}
                </p>
                <p className="mt-3 text-[0.58rem] tracking-[0.34em] text-[var(--t-ink-muted)] uppercase">
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

/** Events as a horizontal filmstrip — swipeable on mobile, filmic on desktop. */
function EventsSection({ data }: { data: WeddingData }) {
  const events = enabledEvents(data);

  return (
    <section className="invite-section relative bg-[var(--t-bg)]">
      <div className="invite-container relative">
        <SectionTitle label="The programme" title="Events" />
      </div>

      <div className="mt-14">
        <div className="snap-rail gap-4 px-[max(1.25rem,5vw)] pb-3 sm:gap-6">
          {events.map((event) => {
            const parts = formatDateParts(event.date);
            const when = eventWhen(event);
            const directions = directionsUrl(event.venue);

            return (
              <article
                key={event.id}
                className="w-[82vw] shrink-0 snap-center sm:w-[46vw] lg:w-[30vw]"
              >
                <div className="relative overflow-hidden border border-[var(--t-line)] bg-[color-mix(in_oklab,var(--t-surface)_55%,transparent)]">
                  {event.image ? (
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <SmartImage
                        image={event.image}
                        sizes="(max-width: 640px) 82vw, 30vw"
                        className="opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-[color-mix(in_oklab,var(--t-bg)_40%,transparent)] to-transparent" />
                    </div>
                  ) : (
                    <div className="relative aspect-[4/5]">
                      <Starfield count={18} />
                      <LightBloom intensity={0.3} />
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 p-6">
                    {parts && (
                      <p className="text-[0.6rem] tracking-[0.34em] text-[var(--t-accent)] uppercase">
                        {parts.weekday} · {parts.day} {parts.monthShort}
                      </p>
                    )}
                    <h3 className="mt-3 font-[family-name:var(--font-display)] text-fluid-xl font-light text-[var(--t-ink)]">
                      {event.name}
                    </h3>
                    {event.subtitle && (
                      <p className="mt-1 text-fluid-xs text-[var(--t-ink-muted)] italic">
                        {event.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 px-1">
                  {when && (
                    <p className="text-fluid-sm text-[var(--t-ink-soft)]">{when}</p>
                  )}
                  {event.venue && (
                    <p className="mt-2 text-fluid-sm text-[var(--t-ink)]">
                      {event.venue.name}
                      {event.venue.address && (
                        <span className="mt-1 block text-fluid-xs text-[var(--t-ink-muted)]">
                          {event.venue.address}
                        </span>
                      )}
                    </p>
                  )}
                  {event.description && (
                    <p className="mt-3 text-fluid-xs leading-[1.9] text-[var(--t-ink-muted)]">
                      {event.description}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    {event.dressCode && (
                      <span className="border border-[var(--t-line)] px-3 py-1.5 text-[0.58rem] tracking-[0.28em] text-[var(--t-ink-muted)] uppercase">
                        {event.dressCode}
                      </span>
                    )}
                    {directions && (
                      <a
                        href={directions}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tap-target inline-grid place-items-center border border-[var(--t-accent)]/60 px-4 text-[0.58rem] tracking-[0.28em] text-[var(--t-accent)] uppercase transition-colors duration-300 hover:bg-[color-mix(in_oklab,var(--t-accent)_14%,transparent)]"
                      >
                        Directions
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-6 text-center text-[0.6rem] tracking-[0.3em] text-[var(--t-ink-muted)] uppercase">
          Swipe to see more
        </p>
      </div>
    </section>
  );
}

function VenueSection({ data }: { data: WeddingData }) {
  const events = eventsWithVenue(data);

  return (
    <section className="invite-section relative bg-gradient-to-b from-[var(--t-bg)] via-[var(--t-bg-alt)] to-[var(--t-bg)]">
      <div className="invite-container-wide relative">
        <SectionTitle label="Locations" title="Where to find us" />

        <div className="mt-14 space-y-16">
          {events.map((event, index) => {
            const venue = event.venue;
            if (!venue) return null;
            const directions = directionsUrl(venue);

            return (
              <div
                key={event.id}
                className={cn(
                  "grid items-center gap-8 lg:grid-cols-2 lg:gap-14",
                  index % 2 === 1 && "lg:[direction:rtl]",
                )}
              >
                {venue.image && (
                  <ClipReveal from="bottom">
                    <Parallax strength={22}>
                      <div className="relative aspect-[16/11] overflow-hidden">
                        <SmartImage
                          image={venue.image}
                          sizes="(max-width: 1024px) 92vw, 46vw"
                          className="opacity-85"
                        />
                        <div className="absolute inset-0 bg-[var(--t-overlay)] opacity-30" />
                      </div>
                    </Parallax>
                  </ClipReveal>
                )}

                <div className="text-center lg:[direction:ltr] lg:text-left">
                  <Reveal>
                    <CineLabel>{event.name}</CineLabel>
                    <h3 className="mt-5 font-[family-name:var(--font-display)] text-fluid-xl font-light text-[var(--t-ink)]">
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
                        className="tap-target mt-7 inline-grid place-items-center border border-[var(--t-accent)] px-8 text-[0.62rem] tracking-[0.34em] text-[var(--t-accent)] uppercase transition-colors duration-300 hover:bg-[color-mix(in_oklab,var(--t-accent)_16%,transparent)]"
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
      <ScrollBackdrop>
        <Starfield count={28} />
      </ScrollBackdrop>

      <div className="invite-container relative">
        <SectionTitle label="How it began" title="Our Story" />

        <div className="mt-14 space-y-16">
          {data.story.map((milestone, index) => (
            <article key={milestone.id} className="text-center">
              {milestone.image && (
                <ScrollScale className="relative mx-auto aspect-[5/4] w-full" from={1.18} to={1}>
                  <SmartImage
                    image={milestone.image}
                    sizes="(max-width: 640px) 92vw, 30rem"
                    className="opacity-80"
                  />
                </ScrollScale>
              )}

              <Reveal delay={0.12} className="mt-7">
                {milestone.date && <CineLabel>{milestone.date}</CineLabel>}
                <h3 className="mt-4 font-[family-name:var(--font-display)] text-fluid-lg font-light text-[var(--t-ink)]">
                  {milestone.title}
                </h3>
                {milestone.description && (
                  <p className="mx-auto mt-4 max-w-md text-fluid-sm leading-[1.9] text-pretty-body text-[var(--t-ink-muted)]">
                    {milestone.description}
                  </p>
                )}
              </Reveal>

              {index < data.story.length - 1 && (
                <div
                  aria-hidden
                  className="mx-auto mt-14 h-14 w-px bg-gradient-to-b from-[var(--t-line)] to-transparent"
                />
              )}
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
    <section className="invite-section-tight relative bg-gradient-to-b from-[var(--t-bg)] via-[var(--t-bg-alt)] to-[var(--t-bg)]">
      <div className="invite-container relative text-center">
        <SectionTitle label="Attire" title={dress.title ?? "Dress code"} />

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
                <span
                  className="block size-12 border border-[var(--t-line)]"
                  style={{ backgroundColor: colour }}
                  title={colour}
                />
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
        <SectionTitle label="Moments" title="Gallery" />
      </div>

      <div className="mt-12">
        <Gallery
          images={data.gallery}
          fallback="marquee"
          preference={data.appearance.galleryStyle}
        />
      </div>
    </section>
  );
}

function RsvpSection({ data, mode }: { data: WeddingData; mode: TemplateProps["mode"] }) {
  return (
    <section id="rsvp" className="invite-section relative bg-gradient-to-b from-[var(--t-bg)] via-[var(--t-bg-alt)] to-[var(--t-bg)]">
      <Starfield count={24} />
      <LightBloom intensity={0.24} />

      <div className="invite-container relative">
        <SectionTitle label="RSVP" title={data.rsvp.headline ?? "Will you join us?"} />

        {data.rsvp.message && (
          <Reveal delay={0.15} className="mt-6">
            <p className="text-center text-fluid-sm leading-relaxed text-pretty-body text-[var(--t-ink-soft)]">
              {data.rsvp.message}
            </p>
          </Reveal>
        )}

        <Reveal delay={0.2} className="mt-12">
          <RsvpForm data={data} mode={mode} variant="cinematic" />
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
        <SectionTitle label="With gratitude" title="Our Families" />

        {(familyNames.bride || familyNames.groom) && (
          <RevealGroup className="mt-10 space-y-6">
            {[familyNames.bride, familyNames.groom]
              .filter((name): name is string => Boolean(name))
              .map((name) => (
                <RevealItem key={name}>
                  <p className="font-[family-name:var(--font-display)] text-fluid-lg font-light text-[var(--t-accent-soft)]">
                    {name}
                  </p>
                </RevealItem>
              ))}
          </RevealGroup>
        )}

        {gratitudeMessage && (
          <Reveal delay={0.2} className="mt-10">
            <p className="text-fluid-base leading-[1.95] text-pretty-body text-[var(--t-ink-soft)]">
              {gratitudeMessage}
            </p>
          </Reveal>
        )}

        {contacts.length > 0 && (
          <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2">
            {contacts.map((contact) => (
              <RevealItem key={contact.id}>
                <div className="border border-[var(--t-line)] bg-[color-mix(in_oklab,var(--t-surface)_45%,transparent)] px-5 py-6">
                  <p className="text-fluid-sm text-[var(--t-ink)]">{contact.name}</p>
                  {contact.role && (
                    <p className="mt-1 text-[0.58rem] tracking-[0.3em] text-[var(--t-ink-muted)] uppercase">
                      {contact.role}
                    </p>
                  )}
                  <div className="mt-4 flex justify-center gap-4">
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                        className="tap-target inline-grid place-items-center px-2 text-fluid-xs text-[var(--t-accent)]"
                      >
                        Call
                      </a>
                    )}
                    {contact.whatsapp && (
                      <a
                        href={`https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tap-target inline-grid place-items-center px-2 text-fluid-xs text-[var(--t-accent)]"
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
    <section className="invite-section relative bg-gradient-to-b from-[var(--t-bg)] via-[var(--t-bg-alt)] to-[var(--t-bg)]">
      <Starfield count={30} />
      <LightBloom intensity={0.3} />

      <div className="invite-container relative text-center">
        {islamic.verseArabic && (
          <Reveal durationScale={1.7}>
            <p lang="ar" dir="rtl" className="text-fluid-xl leading-[2.2] text-[var(--t-accent-soft)]">
              {islamic.verseArabic}
            </p>
          </Reveal>
        )}

        {islamic.verseTranslation && (
          <Reveal delay={0.25} className="mt-9">
            <p className="font-[family-name:var(--font-display)] text-fluid-lg leading-relaxed text-pretty-body text-[var(--t-ink-soft)] italic">
              &ldquo;{islamic.verseTranslation}&rdquo;
            </p>
          </Reveal>
        )}

        {islamic.verseReference && (
          <Reveal delay={0.32} className="mt-6">
            <CineLabel>{islamic.verseReference}</CineLabel>
          </Reveal>
        )}

        {islamic.duaText && (
          <Reveal delay={0.4} className="mt-10">
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
    <section className="relative flex min-h-[90svh] items-center overflow-hidden bg-[var(--t-bg)]">
      <Starfield count={60} />
      <GoldMotes count={14} />
      <LightBloom intensity={0.45} />

      <div className="invite-container relative py-24 text-center">
        <Crescent className="mx-auto" size={76} />

        <h2 className="mt-12 font-[family-name:var(--font-display)] font-light text-[var(--t-ink)]">
          <MaskedLine className="text-fluid-2xl">{names.firstShort}</MaskedLine>
          <MaskedLine delay={0.12} className="my-2 text-fluid-lg text-[var(--t-accent)] italic">
            &amp;
          </MaskedLine>
          <MaskedLine delay={0.24} className="text-fluid-2xl">
            {names.secondShort}
          </MaskedLine>
        </h2>

        {(date || time) && (
          <Reveal delay={0.4} className="mt-12">
            <p className="text-[0.64rem] tracking-[0.38em] text-[var(--t-ink-muted)] uppercase">
              {[date, time].filter(Boolean).join(" · ")}
            </p>
          </Reveal>
        )}

        {data.closingMessage && (
          <Reveal delay={0.5} className="mt-10">
            <p className="mx-auto max-w-lg text-fluid-base leading-[1.95] text-pretty-body text-[var(--t-ink-soft)]">
              {data.closingMessage}
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
