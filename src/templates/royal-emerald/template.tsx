"use client";

import { cn } from "@/lib/utils/cn";
import {
  coupleNames,
  directionsUrl,
  eventWhen,
  formatLongDate,
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
import type { WeddingData, WeddingEvent } from "@/lib/wedding/types";
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
  ArchFrame,
  CornerFlourishes,
  GoldDivider,
  GoldDust,
  LatticePattern,
  SectionLabel,
} from "./ornaments";
import { ROYAL_EMERALD, ROYAL_EMERALD_ALT } from "./theme";

/**
 * TEMPLATE 01 — ROYAL EMERALD
 *
 * A palace invitation. Deep emerald grounds, antique gold linework that draws
 * itself in, Mughal-inspired geometry, and ornamental arches used as the primary
 * framing device. Motion language: slow ink-drawn lines, ornament reveals,
 * gentle parallax, never more than one focal animation at a time.
 */
export default function RoyalEmeraldTemplate({ data, sections, mode }: TemplateProps) {
  const tokens =
    data.appearance.backgroundVariant === "alt" ? ROYAL_EMERALD_ALT : ROYAL_EMERALD;

  return (
    <div
      style={tokensToStyle(tokens, accentFor(data, true))}
      className="surface-grain relative isolate w-full overflow-hidden font-[family-name:var(--font-sans)]"
    >
      <Cover data={data} mode={mode} />

      <StageBody>
        <h1 className="sr-only">
          Wedding invitation — {coupleNames(data).combined}
        </h1>

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
/* Cover                                                               */
/* ================================================================== */

function Cover({ data, mode }: { data: WeddingData; mode: TemplateProps["mode"] }) {
  const { open } = useStage();
  const names = coupleNames(data);
  const date = formatLongDate(effectiveDate(data));

  return (
    <CoverLayer exit="veil" className="bg-[var(--t-bg)]">
      {/* Hero photograph, held far back so the type stays the subject. */}
      {data.heroImage && (
        <div aria-hidden className="absolute inset-0">
          <SmartImage
            image={data.heroImage}
            priority
            sizes="100vw"
            className="scale-105 opacity-25"
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,var(--t-bg)_78%)]" />
        </div>
      )}

      <LatticePattern opacity={0.16} scale={72} />
      {/* WebGL gold dust when the device can afford it; the CSS motes below are
          the fallback and stay lighter so the two never double up. */}
      <CoverCanvas template="royal-emerald" />
      <GoldDust count={10} />
      <CornerFlourishes delay={0.5} />

      <div className="relative flex min-h-full flex-1 flex-col items-center justify-center px-7 py-16 text-center">
        {data.islamic.bismillahArabic && (
          <Reveal delay={0.15} durationScale={1.6}>
            <p
              lang="ar"
              dir="rtl"
              className="text-fluid-lg text-[var(--t-accent-soft)]"
            >
              {data.islamic.bismillahArabic}
            </p>
          </Reveal>
        )}

        <Reveal delay={0.5} className="mt-8 w-full">
          <GoldDivider delay={0.7} width="min(14rem, 60%)" />
        </Reveal>

        <p className="mt-9 text-fluid-xs tracking-label text-[var(--t-accent)]">
          <MaskedLine delay={0.9}>
            {data.familyInvitationWording ? "Together with our families" : "The wedding of"}
          </MaskedLine>
        </p>

        {/* Names arrive one after the other, framed by the arch. */}
        <div className="relative mt-8 w-full max-w-[19rem] px-6 pt-10 pb-8">
          <ArchFrame delay={1.5} className="absolute inset-0" />

          <p className="relative font-[family-name:var(--font-display)] text-[var(--t-ink)]">
            <MaskedLine
              delay={1.1}
              className="text-fluid-3xl leading-[1.05] font-light"
            >
              {names.firstShort || "Bride"}
            </MaskedLine>

            <MaskedLine delay={1.4} className="my-1.5 block">
              <span className="font-[family-name:var(--font-display)] text-fluid-2xl leading-none font-light text-[var(--t-accent)]">
                &amp;
              </span>
            </MaskedLine>

            <MaskedLine
              delay={1.7}
              className="text-fluid-3xl leading-[1.05] font-light"
            >
              {names.secondShort || "Groom"}
            </MaskedLine>
          </p>
        </div>

        {(date || data.hijriDate) && (
          <Reveal delay={2.3} className="mt-11">
            <div className="space-y-1">
              {date && (
                <p className="text-fluid-sm tracking-label-tight text-[var(--t-ink-soft)]">
                  {date}
                </p>
              )}
              {data.hijriDate && (
                <p className="text-fluid-xs tracking-label text-[var(--t-ink-muted)]">
                  {data.hijriDate}
                </p>
              )}
            </div>
          </Reveal>
        )}

        <Reveal delay={2.6} className="mt-10">
          <button
            type="button"
            data-cover-action
            onClick={open}
            disabled={mode === "thumbnail"}
            className={cn(
              "tap-target group relative overflow-hidden px-10 py-4",
              "border border-[var(--t-accent)] text-fluid-xs tracking-label text-[var(--t-accent)]",
              "transition-colors duration-500 hover:text-[var(--t-bg)]",
            )}
          >
            <span className="relative z-10">Open invitation</span>
            <span
              aria-hidden
              className="absolute inset-0 origin-bottom scale-y-0 bg-[var(--t-accent)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100"
            />
          </button>
        </Reveal>
      </div>
    </CoverLayer>
  );
}

/* ================================================================== */
/* Shared section furniture                                            */
/* ================================================================== */

function SectionHeading({
  label,
  title,
  className,
}: {
  label: string;
  title?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("text-center", className)}>
      <Reveal>
        <SectionLabel>{label}</SectionLabel>
      </Reveal>
      {title && (
        <h2 className="mt-5 font-[family-name:var(--font-display)] text-fluid-2xl font-light text-balance-heading text-[var(--t-ink)]">
          <MaskedLine>{title}</MaskedLine>
        </h2>
      )}
    </div>
  );
}

/* ================================================================== */
/* Sections                                                            */
/* ================================================================== */

function BismillahSection({ data }: { data: WeddingData }) {
  const { islamic } = data;

  return (
    <section className="invite-section relative bg-[var(--t-bg)]">
      <LatticePattern opacity={0.07} scale={56} />
      <div className="invite-container relative text-center">
        {islamic.bismillahArabic && (
          <Reveal durationScale={1.6}>
            <p
              lang="ar"
              dir="rtl"
              className="text-fluid-2xl leading-[2] text-[var(--t-accent-soft)]"
            >
              {islamic.bismillahArabic}
            </p>
          </Reveal>
        )}

        {islamic.bismillahTransliteration && (
          <Reveal delay={0.2} className="mt-6">
            <p className="text-fluid-sm tracking-editorial text-[var(--t-ink-muted)] italic">
              {islamic.bismillahTransliteration}
            </p>
          </Reveal>
        )}

        {islamic.bismillahTranslation && (
          <Reveal delay={0.3} className="mt-3">
            <p className="text-fluid-base text-pretty-body text-[var(--t-ink-soft)]">
              {islamic.bismillahTranslation}
            </p>
          </Reveal>
        )}

        <GoldDivider className="mt-12" delay={0.4} />
      </div>
    </section>
  );
}

function MessageSection({ data }: { data: WeddingData }) {
  return (
    <section className="invite-section relative bg-[var(--t-bg-alt)]">
      <div className="invite-container relative">
        <div className="relative px-5 py-14 sm:px-10">
          <CornerFlourishes />

          <div className="space-y-7 text-center">
            {data.familyInvitationWording && (
              <Reveal>
                <p className="font-[family-name:var(--font-display)] text-fluid-lg leading-relaxed text-balance-heading text-[var(--t-accent-soft)] italic">
                  {data.familyInvitationWording}
                </p>
              </Reveal>
            )}

            {data.invitationMessage && (
              <Reveal delay={0.15}>
                <p className="text-fluid-base leading-[1.95] text-pretty-body text-[var(--t-ink-soft)]">
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

function CoupleSection({ data }: { data: WeddingData }) {
  const { bride, groom, order } = data.couple;
  const parties = order === "groom-first" ? [groom, bride] : [bride, groom];

  return (
    <section className="invite-section relative bg-[var(--t-bg)]">
      <LatticePattern opacity={0.06} scale={80} />

      <div className="invite-container relative">
        <SectionHeading label="The couple" />

        {data.couple.shortDescription && (
          <Reveal delay={0.15} className="mt-7">
            <p className="text-center text-fluid-base leading-relaxed text-pretty-body text-[var(--t-ink-soft)]">
              {data.couple.shortDescription}
            </p>
          </Reveal>
        )}

        <div className="mt-16 space-y-20">
          {parties.map((party, index) => (
            <div key={index} className="text-center">
              {party.photo && (
                <ClipReveal from="bottom" className="mx-auto w-[74%] max-w-[17rem]">
                  <ArchFrame delay={0.3} className="p-[6px]">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <SmartImage
                        image={party.photo}
                        sizes="(max-width: 640px) 74vw, 17rem"
                        className="animate-ken-burns"
                      />
                      <div className="absolute inset-0 bg-[var(--t-overlay)] opacity-30" />
                    </div>
                  </ArchFrame>
                </ClipReveal>
              )}

              <Reveal delay={0.2} className="mt-8">
                <h3 className="font-[family-name:var(--font-display)] text-fluid-2xl font-light text-[var(--t-ink)]">
                  {party.name || (index === 0 ? "Bride" : "Groom")}
                </h3>
              </Reveal>

              {party.parents && (
                <Reveal delay={0.28} className="mt-3">
                  <p className="text-fluid-xs tracking-label-tight text-[var(--t-accent)]">
                    {party.parents}
                  </p>
                </Reveal>
              )}

              {party.description && (
                <Reveal delay={0.34} className="mt-5">
                  <p className="mx-auto max-w-sm text-fluid-sm leading-[1.9] text-pretty-body text-[var(--t-ink-muted)]">
                    {party.description}
                  </p>
                </Reveal>
              )}

              {index === 0 && parties.length > 1 && (
                <GoldDivider className="mt-16" width="min(10rem, 45%)" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CountdownSection({ data }: { data: WeddingData }) {
  const date = effectiveDate(data);
  const target = toTimestamp(date, effectiveTime(data));
  const countdown = useCountdown(target);

  const cells = [
    { value: countdown?.days, label: "Days" },
    { value: countdown?.hours, label: "Hours" },
    { value: countdown?.minutes, label: "Minutes" },
    { value: countdown?.seconds, label: "Seconds" },
  ];

  return (
    <section className="invite-section-tight relative bg-[var(--t-bg-alt)]">
      <div className="invite-container relative text-center">
        <SectionHeading
          label={countdown?.isPast ? "With gratitude" : "Counting down"}
          title={formatLongDate(date)}
        />

        {countdown?.isPast ? (
          <Reveal className="mt-8">
            <p className="text-fluid-base text-[var(--t-ink-soft)]">
              {countdown.isToday
                ? "Today is the day. Alhamdulillah."
                : "Thank you to everyone who celebrated with us."}
            </p>
          </Reveal>
        ) : (
          <RevealGroup className="mt-10 grid grid-cols-4 gap-2 sm:gap-4">
            {cells.map((cell) => (
              <RevealItem key={cell.label}>
                <div className="border border-[var(--t-line)] bg-[color-mix(in_oklab,var(--t-surface)_45%,transparent)] px-1 py-4 sm:py-6">
                  <span
                    className="block font-[family-name:var(--font-display)] text-fluid-xl font-light text-[var(--t-accent-soft)] tabular-nums"
                    /* Reserves the digits' width so the ticking cannot shift layout. */
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {cell.value === undefined ? "—" : String(cell.value).padStart(2, "0")}
                  </span>
                  <span className="mt-2 block text-[0.6rem] tracking-label text-[var(--t-ink-muted)]">
                    {cell.label}
                  </span>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </div>
    </section>
  );
}

function EventsSection({ data }: { data: WeddingData }) {
  const events = enabledEvents(data);

  return (
    <section className="invite-section relative bg-[var(--t-bg)]">
      <LatticePattern opacity={0.05} scale={96} />

      <div className="invite-container relative">
        <SectionHeading label="Celebrations" title="The Events" />

        <div className="mt-14 space-y-14">
          {events.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function EventCard({ event, index }: { event: WeddingEvent; index: number }) {
  const when = eventWhen(event);
  const directions = directionsUrl(event.venue);

  return (
    <Reveal delay={index * 0.05}>
      <article className="relative border border-[var(--t-line)] bg-[color-mix(in_oklab,var(--t-surface)_35%,transparent)]">
        {event.image && (
          <ScrollScale className="relative aspect-[16/10]" from={1.14} to={1}>
            <SmartImage
              image={event.image}
              sizes="(max-width: 640px) 92vw, 32rem"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-transparent to-transparent" />
          </ScrollScale>
        )}

        <div className="px-6 py-9 text-center sm:px-9">
          <h3 className="font-[family-name:var(--font-display)] text-fluid-xl font-light text-[var(--t-ink)]">
            {event.name}
          </h3>

          {event.subtitle && (
            <p className="mt-2 text-fluid-xs tracking-label-tight text-[var(--t-accent)]">
              {event.subtitle}
            </p>
          )}

          <GoldDivider className="mt-6" width="min(8rem, 40%)" />

          {when && (
            <p className="mt-6 text-fluid-sm text-[var(--t-ink-soft)]">{when}</p>
          )}

          {event.venue && (
            <div className="mt-4 space-y-1">
              <p className="text-fluid-sm text-[var(--t-ink)]">{event.venue.name}</p>
              {event.venue.address && (
                <p className="text-fluid-xs leading-relaxed text-[var(--t-ink-muted)]">
                  {event.venue.address}
                </p>
              )}
            </div>
          )}

          {event.description && (
            <p className="mt-6 text-fluid-sm leading-[1.9] text-pretty-body text-[var(--t-ink-muted)]">
              {event.description}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {event.dressCode && (
              <span className="border border-[var(--t-line)] px-4 py-2 text-[0.65rem] tracking-label text-[var(--t-ink-soft)]">
                {event.dressCode}
              </span>
            )}

            {directions && (
              <a
                href={directions}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target inline-grid place-items-center border border-[var(--t-accent)] px-5 text-[0.65rem] tracking-label text-[var(--t-accent)] transition-colors duration-300 hover:bg-[color-mix(in_oklab,var(--t-accent)_16%,transparent)]"
              >
                Get directions
              </a>
            )}
          </div>
        </div>
      </article>
    </Reveal>
  );
}

function VenueSection({ data }: { data: WeddingData }) {
  const events = eventsWithVenue(data);

  return (
    <section className="invite-section relative bg-[var(--t-bg-alt)]">
      <div className="invite-container relative">
        <SectionHeading label="Where to find us" title="Venues" />

        <div className="mt-14 space-y-16">
          {events.map((event) => {
            const venue = event.venue;
            if (!venue) return null;
            const directions = directionsUrl(venue);

            return (
              <div key={event.id} className="text-center">
                <Reveal>
                  <p className="text-fluid-xs tracking-label text-[var(--t-accent)]">
                    {event.name}
                  </p>
                </Reveal>

                {venue.image && (
                  <ClipReveal from="bottom" className="mt-6">
                    <Parallax strength={18}>
                      <div className="relative aspect-[4/3] overflow-hidden border border-[var(--t-line)]">
                        <SmartImage
                          image={venue.image}
                          sizes="(max-width: 640px) 92vw, 32rem"
                        />
                        <div className="absolute inset-0 bg-[var(--t-overlay)] opacity-25" />
                      </div>
                    </Parallax>
                  </ClipReveal>
                )}

                <Reveal delay={0.15} className="mt-7">
                  <h3 className="font-[family-name:var(--font-display)] text-fluid-lg font-light text-[var(--t-ink)]">
                    {venue.name}
                  </h3>
                </Reveal>

                {venue.address && (
                  <Reveal delay={0.2} className="mt-3">
                    <p className="mx-auto max-w-xs text-fluid-sm leading-relaxed text-[var(--t-ink-muted)]">
                      {venue.address}
                    </p>
                  </Reveal>
                )}

                {venue.note && (
                  <Reveal delay={0.24} className="mt-2">
                    <p className="text-fluid-xs text-[var(--t-ink-muted)] italic">
                      {venue.note}
                    </p>
                  </Reveal>
                )}

                {directions && (
                  <Reveal delay={0.3} className="mt-7">
                    <a
                      href={directions}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tap-target inline-grid place-items-center border border-[var(--t-accent)] px-8 text-fluid-xs tracking-label text-[var(--t-accent)] transition-colors duration-300 hover:bg-[color-mix(in_oklab,var(--t-accent)_16%,transparent)]"
                    >
                      Get directions
                    </a>
                  </Reveal>
                )}
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
      <LatticePattern opacity={0.05} scale={72} />

      <div className="invite-container relative">
        <SectionHeading label="How it began" title="Our Story" />

        <ol className="mt-14 space-y-14">
          {data.story.map((milestone, index) => (
            <li key={milestone.id} className="relative pl-8">
              {/* Continuous gold spine through the timeline. */}
              <span
                aria-hidden
                className="absolute top-2 left-[3px] h-full w-px bg-[var(--t-line)]"
                style={{
                  display: index === data.story.length - 1 ? "none" : undefined,
                }}
              />
              <span
                aria-hidden
                className="absolute top-[6px] left-0 size-[7px] rotate-45 bg-[var(--t-accent)]"
              />

              <Reveal>
                {milestone.date && (
                  <p className="text-fluid-xs tracking-label text-[var(--t-accent)]">
                    {milestone.date}
                  </p>
                )}
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-fluid-lg font-light text-[var(--t-ink)]">
                  {milestone.title}
                </h3>
                {milestone.description && (
                  <p className="mt-3 text-fluid-sm leading-[1.9] text-pretty-body text-[var(--t-ink-muted)]">
                    {milestone.description}
                  </p>
                )}
              </Reveal>

              {milestone.image && (
                <ClipReveal from="left" className="mt-5">
                  <div className="relative aspect-[5/3] overflow-hidden border border-[var(--t-line)]">
                    <SmartImage
                      image={milestone.image}
                      sizes="(max-width: 640px) 84vw, 26rem"
                    />
                  </div>
                </ClipReveal>
              )}
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
        <SectionHeading label="Attire" title={dress.title ?? "Dress code"} />

        {dress.description && (
          <Reveal delay={0.15} className="mt-6">
            <p className="text-fluid-base leading-relaxed text-pretty-body text-[var(--t-ink-soft)]">
              {dress.description}
            </p>
          </Reveal>
        )}

        {dress.palette.length > 0 && (
          <RevealGroup className="mt-9 flex flex-wrap justify-center gap-4">
            {dress.palette.map((colour) => (
              <RevealItem key={colour}>
                <span
                  className="block size-11 rounded-full border border-[var(--t-line)]"
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
        <SectionHeading label="Moments" title="Gallery" />
      </div>

      <div className="invite-container-wide mt-12">
        <Gallery
          images={data.gallery}
          fallback="mosaic"
          preference={data.appearance.galleryStyle}
        />
      </div>
    </section>
  );
}

function RsvpSection({ data, mode }: { data: WeddingData; mode: TemplateProps["mode"] }) {
  return (
    <section id="rsvp" className="invite-section relative bg-[var(--t-bg-alt)]">
      <LatticePattern opacity={0.06} scale={64} />

      <div className="invite-container relative">
        <SectionHeading label="RSVP" title={data.rsvp.headline ?? "Will you join us?"} />

        {data.rsvp.message && (
          <Reveal delay={0.15} className="mt-6">
            <p className="text-center text-fluid-sm leading-relaxed text-pretty-body text-[var(--t-ink-soft)]">
              {data.rsvp.message}
            </p>
          </Reveal>
        )}

        <Reveal delay={0.2} className="mt-11">
          <div className="relative border border-[var(--t-line)] bg-[color-mix(in_oklab,var(--t-surface)_35%,transparent)] px-5 py-9 sm:px-8">
            <CornerFlourishes />
            <RsvpForm data={data} mode={mode} variant="ornate" />
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
        <SectionHeading label="With love" title="Our Families" />

        {(familyNames.bride || familyNames.groom) && (
          <RevealGroup className="mt-11 space-y-8">
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
          <Reveal delay={0.2} className="mt-11">
            <p className="text-fluid-base leading-[1.95] text-pretty-body text-[var(--t-ink-soft)]">
              {gratitudeMessage}
            </p>
          </Reveal>
        )}

        {contacts.length > 0 && (
          <>
            <GoldDivider className="mt-14" width="min(10rem, 45%)" />
            <RevealGroup className="mt-10 grid gap-5 sm:grid-cols-2">
              {contacts.map((contact) => (
                <RevealItem key={contact.id}>
                  <div className="border border-[var(--t-line)] px-5 py-6">
                    <p className="text-fluid-sm text-[var(--t-ink)]">{contact.name}</p>
                    {contact.role && (
                      <p className="mt-1 text-[0.65rem] tracking-label text-[var(--t-ink-muted)]">
                        {contact.role}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap justify-center gap-3">
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                          className="tap-target inline-grid place-items-center px-3 text-fluid-xs text-[var(--t-accent)] underline decoration-[var(--t-line)] underline-offset-4"
                        >
                          Call
                        </a>
                      )}
                      {contact.whatsapp && (
                        <a
                          href={`https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tap-target inline-grid place-items-center px-3 text-fluid-xs text-[var(--t-accent)] underline decoration-[var(--t-line)] underline-offset-4"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </>
        )}
      </div>
    </section>
  );
}

function VerseSection({ data }: { data: WeddingData }) {
  const { islamic } = data;

  return (
    <section className="invite-section relative bg-[var(--t-bg-alt)]">
      <LatticePattern opacity={0.08} scale={56} />

      <div className="invite-container relative text-center">
        {islamic.verseArabic && (
          <Reveal durationScale={1.5}>
            <p
              lang="ar"
              dir="rtl"
              className="text-fluid-xl leading-[2.2] text-[var(--t-accent-soft)]"
            >
              {islamic.verseArabic}
            </p>
          </Reveal>
        )}

        {islamic.verseTranslation && (
          <Reveal delay={0.2} className="mt-8">
            <p className="font-[family-name:var(--font-display)] text-fluid-lg leading-relaxed text-pretty-body text-[var(--t-ink-soft)] italic">
              &ldquo;{islamic.verseTranslation}&rdquo;
            </p>
          </Reveal>
        )}

        {islamic.verseReference && (
          <Reveal delay={0.28} className="mt-5">
            <p className="text-fluid-xs tracking-label text-[var(--t-accent)]">
              {islamic.verseReference}
            </p>
          </Reveal>
        )}

        {islamic.duaText && (
          <>
            <GoldDivider className="mt-14" width="min(10rem, 45%)" />
            <Reveal delay={0.34} className="mt-10">
              <p className="text-fluid-sm leading-relaxed text-[var(--t-ink-muted)] italic">
                {islamic.duaText}
              </p>
            </Reveal>
          </>
        )}
      </div>
    </section>
  );
}

function ClosingSection({ data }: { data: WeddingData }) {
  const names = coupleNames(data);
  const date = formatLongDate(effectiveDate(data));
  const time = formatTimeRange(effectiveTime(data), null);
  const weekday = formatWeekday(effectiveDate(data));

  return (
    <section className="relative flex min-h-[85svh] items-center bg-[var(--t-bg)]">
      <LatticePattern opacity={0.12} scale={72} />
      <GoldDust count={10} />

      <div className="invite-container relative py-24 text-center">
        <CornerFlourishes />

        <Reveal>
          <p className="text-fluid-xs tracking-label text-[var(--t-accent)]">
            Barakallahu lakuma
          </p>
        </Reveal>

        <h2 className="mt-9 font-[family-name:var(--font-display)] font-light text-[var(--t-ink)]">
          <MaskedLine className="text-fluid-2xl">{names.firstShort}</MaskedLine>
          <MaskedLine delay={0.1} className="my-1 text-fluid-lg text-[var(--t-accent)] italic">
            &amp;
          </MaskedLine>
          <MaskedLine delay={0.2} className="text-fluid-2xl">
            {names.secondShort}
          </MaskedLine>
        </h2>

        <GoldDivider className="mt-10" />

        {(date || weekday) && (
          <Reveal delay={0.3} className="mt-10 space-y-1">
            <p className="text-fluid-sm tracking-label-tight text-[var(--t-ink-soft)]">
              {[weekday, date].filter(Boolean).join(" · ")}
            </p>
            {time && (
              <p className="text-fluid-xs tracking-label text-[var(--t-ink-muted)]">
                {time}
              </p>
            )}
          </Reveal>
        )}

        {data.closingMessage && (
          <Reveal delay={0.4} className="mt-10">
            <p className="text-fluid-base leading-[1.95] text-pretty-body text-[var(--t-ink-soft)]">
              {data.closingMessage}
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
