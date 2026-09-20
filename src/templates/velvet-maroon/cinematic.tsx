"use client";

import { useCallback, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils/cn";
import {
  coupleNames,
  directionsUrl,
  formatDateParts,
  formatLongDate,
  formatTime,
  formatTimeRange,
  formatWeekday,
  toTimestamp,
} from "@/lib/wedding/format";
import type { SceneNode } from "@/lib/wedding/scene-plan";
import { effectiveDate, effectiveTime } from "@/lib/wedding/sections";
import { displayType, displayTypeForSet } from "@/lib/wedding/typography";
import type { RsvpAttendance, StoryMilestone, Venue, WeddingData, WeddingEvent } from "@/lib/wedding/types";
import { SmartImage } from "@/components/media/smart-image";
import { useMotionSettings } from "@/components/motion/motion-settings";
import { RsvpForm } from "@/components/invitation/rsvp-form";
import { useStage } from "@/components/invitation/stage";
import { useCountdown } from "@/components/invitation/use-countdown";
import {
  ScrollCue,
  useOpenInvitation,
  useScene,
  useSceneNavigation,
} from "@/components/scene/scene-deck";
import {
  ImageReveal,
  ParallaxLayer,
  RollingNumber,
  SceneReveal,
  SplitTextReveal,
  TextReveal,
  TrackingReveal,
} from "@/components/scene/motion";
import { CoverCanvas } from "@/components/webgl/cover-canvas";
import type { TemplateProps } from "@/templates/contract";
import {
  DOCK_CLEAR,
  SceneBody,
  SceneSurface,
  TemplateShell,
  enabledEventCount,
  useRsvpChoice,
} from "@/templates/kit";
import { BrassCorner, BrassRule, DamaskPattern, FoilShine, VelvetCurtain } from "./decor";
import { VELVET, VELVET_ALT } from "./theme";

/**
 * TEMPLATE 07 — VELVET MAROON
 *
 * The formal one. Every important scene opens like a stage: two velvet panels draw
 * apart and the content is already there behind them, which gives the deck a
 * rhythm of announcement rather than of arrival. Ornament is heavy brass — corners
 * and weighted rules — instead of fine linework, and the ground reads as cloth.
 *
 * Kept distinct from Royal Emerald by being wine rather than green and theatrical
 * rather than architectural, and from Midnight Crescent by having no sky at all.
 */

const WINE: CSSProperties = {} as CSSProperties;

const DEEP_WINE: CSSProperties = {
  "--t-bg": "#20060E",
  "--t-bg-alt": "#360B18",
} as CSSProperties;

/** Warm cream with wine ink, for the reading scenes. */
const CREAM: CSSProperties = {
  "--t-bg": "#F4E9DA",
  "--t-bg-alt": "#E9DAC5",
  "--t-surface": "#FFFAF1",
  "--t-ink": "#3A0C18",
  "--t-ink-soft": "#5E2231",
  "--t-ink-muted": "#8E6B72",
  "--t-line": "rgba(58, 12, 24, 0.2)",
} as CSSProperties;

export default function VelvetMaroonCinematic(props: TemplateProps) {
  const tokens = props.data.appearance.backgroundVariant === "alt" ? VELVET_ALT : VELVET;

  return (
    <TemplateShell
      {...props}
      tokens={tokens}
      className="surface-grain"
      render={(node) => <SceneRouter node={node} data={props.data} mode={props.mode} />}
    />
  );
}

function SceneRouter({
  node,
  data,
  mode,
}: {
  node: SceneNode;
  data: WeddingData;
  mode: TemplateProps["mode"];
}) {
  switch (node.kind) {
    case "cover":
      return <CoverScene data={data} mode={mode} />;
    case "invitation":
      return <InvitationScene data={data} />;
    case "party":
      return <PartyScene data={data} party={node.party ?? "bride"} />;
    case "couple":
      return <CoupleScene data={data} />;
    case "countdown":
      return <CountdownScene data={data} />;
    case "events-intro":
      return <EventsIntroScene data={data} />;
    case "event":
      return node.event ? <EventScene event={node.event} ordinal={node.ordinal ?? 0} /> : null;
    case "venue":
      return node.venue ? <VenueScene venue={node.venue} /> : null;
    case "story":
      return node.milestone ? <StoryScene milestone={node.milestone} /> : null;
    case "gallery":
      return <GalleryScene data={data} />;
    case "rsvp-intro":
      return <RsvpIntroScene data={data} />;
    case "rsvp-form":
      return <RsvpFormScene data={data} mode={mode} />;
    case "family":
      return <FamilyScene data={data} />;
    case "verse":
      return <VerseScene data={data} />;
    case "closing":
      return <ClosingScene data={data} />;
    default:
      return null;
  }
}

const DISPLAY = "font-[family-name:var(--font-editorial)] font-light";

/** A formal label: brass rules with a lozenge either side. */
function SceneLabel({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-center gap-3 text-[var(--t-accent)]", className)}>
      <SceneReveal delay={delay} direction="none">
        <span className="block h-px w-7 bg-current opacity-70" />
      </SceneReveal>
      <TrackingReveal delay={delay + 0.08} className="text-[0.6rem] uppercase" from="0.5em" to="0.32em">
        {children}
      </TrackingReveal>
      <SceneReveal delay={delay} direction="none">
        <span className="block h-px w-7 bg-current opacity-70" />
      </SceneReveal>
    </div>
  );
}

/** The four brass corners, used to frame the formal scenes. */
function BrassFrame({ delay = 0 }: { delay?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-4">
      <BrassCorner className="absolute top-0 left-0 size-16" delay={delay} />
      <BrassCorner className="absolute top-0 right-0 size-16" delay={delay + 0.1} flipX />
      <BrassCorner className="absolute bottom-0 left-0 size-16" delay={delay + 0.2} flipY />
      <BrassCorner className="absolute right-0 bottom-0 size-16" delay={delay + 0.3} flipX flipY />
    </div>
  );
}

/* ---------------------------------- COVER --------------------------------- */

function CoverScene({ data, mode }: { data: WeddingData; mode: TemplateProps["mode"] }) {
  const openDeck = useOpenInvitation();
  const stage = useStage();
  const settings = useMotionSettings();
  const names = coupleNames(data);
  const parts = formatDateParts(effectiveDate(data));

  const open = useCallback(() => {
    stage.open();
    openDeck();
  }, [stage, openDeck]);

  const nameType = displayTypeForSet([names.firstShort, names.secondShort], "poster");

  return (
    <SceneSurface surface={DEEP_WINE}>
      {data.heroImage && (
        <div aria-hidden className="absolute inset-0">
          <SmartImage image={data.heroImage} priority sizes="100vw" className="scale-110 opacity-[0.16]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,transparent_3%,var(--t-bg)_74%)]" />
        </div>
      )}

      <DamaskPattern opacity={0.1} scale={54} />
      <CoverCanvas template="velvet-maroon" />
      <BrassFrame delay={2.6} />

      <SceneBody>
        {data.islamic.bismillahArabic && (
          <motion.p
            lang="ar"
            dir="rtl"
            className="text-fluid-base text-[var(--t-accent-soft)]"
            initial={{ opacity: 0, y: settings.enabled ? 10 : 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {data.islamic.bismillahArabic}
          </motion.p>
        )}

        <motion.div
          className="mt-7 w-full max-w-[12rem]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
        >
          <BrassRule delay={1.3} />
        </motion.div>

        <motion.p
          className="mt-6 text-[0.62rem] tracking-[0.42em] text-[var(--t-accent)] uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.3, delay: 1.7 }}
        >
          {data.familyInvitationWording ? "Together with their families" : "The wedding of"}
        </motion.p>

        <h1 className={cn("mt-5 text-[var(--t-ink)]", DISPLAY)}>
          <span className="block" style={nameType}>
            <SplitTextReveal text={names.firstShort || "Bride"} delay={2.1} />
          </span>
          <span className="sr-only"> and </span>
          <motion.span
            aria-hidden
            className={cn("my-1 block text-[var(--t-accent)]", DISPLAY)}
            style={{ fontSize: "clamp(1.6rem, 7.5vw, 2.6rem)", lineHeight: 1 }}
            initial={{ opacity: 0, scale: settings.enabled ? 0.65 : 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 2.95, ease: [0.22, 1, 0.36, 1] }}
          >
            &amp;
          </motion.span>
          <span className="block" style={nameType}>
            <SplitTextReveal text={names.secondShort || "Groom"} delay={3.25} />
          </span>
        </h1>

        {parts && (
          <motion.div
            className="mt-8 flex items-center gap-3.5 text-[var(--t-ink-soft)]"
            initial={{ opacity: 0, y: settings.enabled ? 12 : 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 4.1 }}
          >
            <span className="text-[0.66rem] tracking-[0.3em] uppercase">{parts.weekday}</span>
            <span aria-hidden className="h-3 w-px bg-[var(--t-line)]" />
            <span className="text-[0.66rem] tracking-[0.3em] uppercase">
              {parts.day} {parts.monthName} {parts.year}
            </span>
          </motion.div>
        )}

        {data.hijriDate && (
          <motion.p
            className="mt-2 text-[0.58rem] tracking-[0.3em] text-[var(--t-ink-muted)] uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 4.4 }}
          >
            {data.hijriDate}
          </motion.p>
        )}

        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: settings.enabled ? 14 : 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 4.7 }}
        >
          <button
            type="button"
            data-cover-action
            onClick={open}
            disabled={mode === "thumbnail"}
            className="tap-target group relative overflow-hidden px-10 py-4"
          >
            <span className="relative z-10 text-[0.62rem] tracking-[0.4em] text-[var(--t-accent)] uppercase transition-colors duration-500 group-hover:text-[var(--t-bg)]">
              Raise the curtain
            </span>
            <span aria-hidden className="absolute inset-0 border-2 border-[var(--t-accent)]" />
            <span
              aria-hidden
              className="absolute inset-[3px] border border-[var(--t-accent)] opacity-50"
              style={settings.enabled ? { animation: "dawat-breathe 4s ease-in-out infinite" } : undefined}
            />
            <span
              aria-hidden
              className="absolute inset-0 origin-center scale-x-0 bg-[var(--t-accent)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
            />
          </button>
        </motion.div>
      </SceneBody>
    </SceneSurface>
  );
}

/* ------------------------------- INVITATION ------------------------------- */

function InvitationScene({ data }: { data: WeddingData }) {
  const { islamic } = data;

  return (
    <SceneSurface surface={CREAM}>
      <DamaskPattern opacity={0.07} scale={58} />
      {/* The curtain parts on the first scene after the cover. */}
      <VelvetCurtain delay={0.1} />
      <FoilShine delay={1.8} />

      <SceneBody>
        {islamic.bismillahArabic && (
          <SceneReveal delay={1.5} durationScale={1.6}>
            <p lang="ar" dir="rtl" className="text-fluid-xl leading-[1.9] text-[var(--t-ink)]">
              {islamic.bismillahArabic}
            </p>
          </SceneReveal>
        )}

        {islamic.bismillahTranslation && (
          <SceneReveal delay={1.75} className="mt-5">
            <p className="max-w-xs text-fluid-xs leading-relaxed text-[var(--t-ink-muted)]">
              {islamic.bismillahTranslation}
            </p>
          </SceneReveal>
        )}

        <div className="my-8 w-full max-w-[11rem]">
          <BrassRule delay={1.95} />
        </div>

        {data.familyInvitationWording && (
          <h2 className={cn("text-[var(--t-ink)]", DISPLAY)}>
            <TextReveal delay={2.1} className="text-fluid-lg leading-snug">
              {data.familyInvitationWording}
            </TextReveal>
          </h2>
        )}

        {data.invitationMessage && (
          <SceneReveal delay={2.35} className="mt-6">
            <p className="max-w-sm text-fluid-sm leading-[1.95] text-[var(--t-ink-soft)]">
              {data.invitationMessage}
            </p>
          </SceneReveal>
        )}

        <ScrollCue label="Scroll" />
      </SceneBody>
    </SceneSurface>
  );
}

/* --------------------------------- COUPLE --------------------------------- */

function PartyScene({ data, party }: { data: WeddingData; party: "bride" | "groom" }) {
  const person = data.couple[party];

  return (
    <SceneSurface surface={DEEP_WINE}>
      <ImageReveal
        image={person.photo}
        className="absolute inset-0"
        sizes="100vw"
        from="bottom"
        overlay={
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-[color-mix(in_oklab,var(--t-bg)_50%,transparent)] to-[color-mix(in_oklab,var(--t-bg)_25%,transparent)]" />
        }
      />
      <VelvetCurtain delay={0.1} />

      <div className="relative mt-auto px-7 text-center" style={{ paddingBottom: DOCK_CLEAR }}>
        <ParallaxLayer depth={22}>
          <SceneLabel delay={1.5}>{party === "bride" ? "The bride" : "The groom"}</SceneLabel>

          <h2
            className={cn("mt-5 text-[var(--t-ink)]", DISPLAY)}
            style={displayType(person.name, "hero", "1.05")}
          >
            <TextReveal delay={1.7}>{person.name}</TextReveal>
          </h2>

          {person.parents && (
            <SceneReveal delay={2} className="mt-4">
              <p className="text-[0.62rem] tracking-[0.28em] text-[var(--t-accent)] uppercase">
                {person.parents}
              </p>
            </SceneReveal>
          )}

          {person.description && (
            <SceneReveal delay={2.2} className="mt-5">
              <p className="mx-auto max-w-xs text-fluid-sm leading-[1.9] text-[var(--t-ink-soft)]">
                {person.description}
              </p>
            </SceneReveal>
          )}
        </ParallaxLayer>
      </div>
    </SceneSurface>
  );
}

function CoupleScene({ data }: { data: WeddingData }) {
  const { bride, groom, order } = data.couple;
  const parties = order === "groom-first" ? [groom, bride] : [bride, groom];
  const photo = bride.photo ?? groom.photo;
  const nameType = displayTypeForSet([bride.name, groom.name], "hero", "1.05");

  return (
    <SceneSurface surface={DEEP_WINE}>
      {photo && (
        <ImageReveal
          image={photo}
          className="absolute inset-0"
          sizes="100vw"
          overlay={<div className="absolute inset-0 bg-[var(--t-bg)]/70" />}
        />
      )}
      <DamaskPattern opacity={0.09} scale={54} />
      <VelvetCurtain delay={0.1} />

      <SceneBody>
        <SceneLabel delay={1.4}>The couple</SceneLabel>

        <div className="mt-8 space-y-5">
          {parties.map((person, index) => (
            <h2 key={index} className={cn("text-[var(--t-ink)]", DISPLAY)} style={nameType}>
              <TextReveal delay={1.7 + index * 0.25}>{person.name}</TextReveal>
            </h2>
          ))}
        </div>

        {data.couple.shortDescription && (
          <SceneReveal delay={2.3} className="mt-8">
            <p className="max-w-sm text-fluid-sm leading-[1.95] text-[var(--t-ink-soft)]">
              {data.couple.shortDescription}
            </p>
          </SceneReveal>
        )}
      </SceneBody>
    </SceneSurface>
  );
}

/* -------------------------------- COUNTDOWN ------------------------------- */

function CountdownScene({ data }: { data: WeddingData }) {
  const date = effectiveDate(data);
  const countdown = useCountdown(toTimestamp(date, effectiveTime(data)));

  const cells = [
    { value: countdown?.days ?? null, label: "Days", digits: (countdown?.days ?? 0) >= 100 ? 3 : 2 },
    { value: countdown?.hours ?? null, label: "Hours", digits: 2 },
    { value: countdown?.minutes ?? null, label: "Minutes", digits: 2 },
    { value: countdown?.seconds ?? null, label: "Seconds", digits: 2 },
  ];

  return (
    <SceneSurface surface={WINE}>
      <DamaskPattern opacity={0.1} scale={50} />
      <FoilShine delay={0.8} />
      <BrassFrame delay={0.3} />

      <SceneBody>
        <SceneLabel delay={0.3}>{countdown?.isPast ? "Alhamdulillah" : "Counting down"}</SceneLabel>

        {countdown?.isPast ? (
          <>
            <h2
              className={cn("mt-10 text-[var(--t-accent-soft)]", DISPLAY)}
              style={displayType(countdown.isToday ? "Today" : "Thank you", "hero")}
            >
              <TextReveal delay={0.6}>
                {countdown.isToday ? "Today is the day" : "Thank you"}
              </TextReveal>
            </h2>
            <SceneReveal delay={1} className="mt-6">
              <p className="max-w-xs text-fluid-sm text-[var(--t-ink-soft)]">
                {countdown.isToday
                  ? "May Allah bless this day."
                  : "Thank you to everyone who celebrated with us."}
              </p>
            </SceneReveal>
          </>
        ) : (
          /* A two-by-two brass plaque, the most formal arrangement of the four. */
          <div className="mt-9 grid w-full max-w-[17rem] grid-cols-2 gap-x-5 gap-y-7">
            {cells.map((cell, index) => (
              <SceneReveal
                key={cell.label}
                delay={0.5 + index * 0.13}
                direction="up"
                className="flex flex-col items-center"
              >
                <RollingNumber
                  value={cell.value}
                  digits={cell.digits}
                  className={cn("text-[var(--t-accent-soft)]", DISPLAY)}
                  digitClassName="text-[clamp(2.4rem,15vw,3.4rem)] leading-[1]"
                />
                <span className="mt-2 w-full">
                  <BrassRule delay={0.6 + index * 0.13} />
                </span>
                <span className="text-[0.54rem] tracking-[0.3em] text-[var(--t-ink-muted)] uppercase">
                  {cell.label}
                </span>
              </SceneReveal>
            ))}
          </div>
        )}

        {date && (
          <SceneReveal delay={1.2} className="mt-9">
            <p className="text-[0.62rem] tracking-[0.3em] text-[var(--t-ink-soft)] uppercase">
              {formatWeekday(date)} · {formatLongDate(date)}
            </p>
          </SceneReveal>
        )}
      </SceneBody>
    </SceneSurface>
  );
}

/* ------------------------------ EVENTS INTRO ------------------------------ */

function EventsIntroScene({ data }: { data: WeddingData }) {
  const count = enabledEventCount(data);

  return (
    <SceneSurface surface={CREAM}>
      <DamaskPattern opacity={0.08} scale={60} />
      <VelvetCurtain delay={0.1} />

      <SceneBody>
        <SceneLabel delay={1.4}>The programme</SceneLabel>

        <h2
          className={cn("mt-7 text-[var(--t-ink)]", DISPLAY)}
          style={displayType("The Celebration", "hero", "1.02")}
        >
          <TextReveal delay={1.65}>The</TextReveal>
          <TextReveal delay={1.82}>Celebration</TextReveal>
        </h2>

        <div className="mt-8 w-full max-w-[11rem]">
          <BrassRule delay={2.1} />
        </div>

        <SceneReveal delay={2.3} className="mt-6">
          <p className="text-[0.62rem] tracking-[0.3em] text-[var(--t-accent)] uppercase">
            {count} {count === 1 ? "gathering" : "gatherings"}
          </p>
        </SceneReveal>
      </SceneBody>
    </SceneSurface>
  );
}

/* --------------------------------- EVENTS --------------------------------- */

function EventScene({ event, ordinal }: { event: WeddingEvent; ordinal: number }) {
  const parts = formatDateParts(event.date);
  const directions = directionsUrl(event.venue);
  const time = formatTimeRange(event.startTime, event.endTime);

  return (
    <SceneSurface surface={DEEP_WINE}>
      {event.image ? (
        <ImageReveal
          image={event.image}
          className="absolute inset-0"
          sizes="100vw"
          from={ordinal % 2 === 0 ? "bottom" : "top"}
          overlay={
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-[color-mix(in_oklab,var(--t-bg)_55%,transparent)] to-[color-mix(in_oklab,var(--t-bg)_30%,transparent)]" />
          }
        />
      ) : (
        <DamaskPattern opacity={0.12} scale={50} />
      )}

      {/* Every event is announced: the curtain goes up on each one. */}
      <VelvetCurtain delay={0.1} />
      <FoilShine delay={2.2} />

      <div
        className="relative flex h-full flex-col justify-end px-7 text-center"
        style={{ paddingBottom: DOCK_CLEAR }}
      >
        <ParallaxLayer depth={20}>
          {parts && (
            <SceneReveal delay={1.5} className="flex items-center justify-center gap-3">
              <span className="text-[0.58rem] tracking-[0.3em] text-[var(--t-accent)] uppercase">
                {parts.weekday}
              </span>
              <span aria-hidden className="h-3 w-px bg-[var(--t-line)]" />
              <span className="text-[0.58rem] tracking-[0.3em] text-[var(--t-accent)] uppercase">
                {parts.day} {parts.monthShort} {parts.year}
              </span>
            </SceneReveal>
          )}

          <h2
            className={cn("mt-4 text-[var(--t-ink)]", DISPLAY)}
            style={displayType(event.name, "hero", "1.02")}
          >
            <TextReveal delay={1.68}>{event.name}</TextReveal>
          </h2>

          {event.subtitle && (
            <SceneReveal delay={1.9} className="mt-2">
              <p className="text-fluid-xs text-[var(--t-accent-soft)] italic">{event.subtitle}</p>
            </SceneReveal>
          )}

          <div className="mx-auto mt-5 w-full max-w-[9rem]">
            <BrassRule delay={2.05} />
          </div>

          {time && (
            <SceneReveal delay={2.2} className="mt-4">
              <p className={cn("text-fluid-lg text-[var(--t-ink)]", DISPLAY)}>{time}</p>
            </SceneReveal>
          )}

          {event.venue && (
            <SceneReveal delay={2.35} className="mt-3">
              <p className="text-fluid-sm text-[var(--t-ink)]">{event.venue.name}</p>
              {event.venue.address && (
                <p className="mx-auto mt-1 max-w-[17rem] text-fluid-xs leading-relaxed text-[var(--t-ink-muted)]">
                  {event.venue.address}
                </p>
              )}
            </SceneReveal>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {event.dressCode && (
              <SceneReveal delay={2.5} direction="none">
                <span className="border border-[var(--t-line)] px-3.5 py-2 text-[0.55rem] tracking-[0.26em] text-[var(--t-ink-soft)] uppercase">
                  {event.dressCode}
                </span>
              </SceneReveal>
            )}
            {directions && (
              <SceneReveal delay={2.6} direction="none">
                <a
                  href={directions}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap-target inline-grid place-items-center border border-[var(--t-accent)] px-5 text-[0.55rem] tracking-[0.26em] text-[var(--t-accent)] uppercase transition-colors duration-300 hover:bg-[color-mix(in_oklab,var(--t-accent)_18%,transparent)]"
                >
                  Get directions
                </a>
              </SceneReveal>
            )}
          </div>
        </ParallaxLayer>
      </div>
    </SceneSurface>
  );
}

/* ---------------------------------- VENUE --------------------------------- */

function VenueScene({ venue }: { venue: Venue }) {
  const directions = directionsUrl(venue);

  return (
    <SceneSurface surface={DEEP_WINE}>
      {venue.image ? (
        <ImageReveal
          image={venue.image}
          className="absolute inset-0"
          sizes="100vw"
          overlay={
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-[color-mix(in_oklab,var(--t-bg)_45%,transparent)] to-transparent" />
          }
        />
      ) : (
        <DamaskPattern opacity={0.11} scale={52} />
      )}

      <SceneBody className="justify-end" style={{ paddingBottom: DOCK_CLEAR }}>
        <ParallaxLayer depth={16}>
          <SceneLabel delay={0.4}>Where to find us</SceneLabel>

          <h2
            className={cn("mt-5 text-[var(--t-ink)]", DISPLAY)}
            style={displayType(venue.name, "hero", "1.05")}
          >
            <TextReveal delay={0.6}>{venue.name}</TextReveal>
          </h2>

          {venue.address && (
            <SceneReveal delay={0.9} className="mt-4">
              <p className="mx-auto max-w-[17rem] text-fluid-sm leading-relaxed text-[var(--t-ink-soft)]">
                {venue.address}
              </p>
            </SceneReveal>
          )}

          {venue.note && (
            <SceneReveal delay={1} className="mt-2">
              <p className="text-fluid-xs text-[var(--t-ink-muted)] italic">{venue.note}</p>
            </SceneReveal>
          )}

          {directions && (
            <SceneReveal delay={1.2} className="mt-7">
              <a
                href={directions}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target inline-flex items-center gap-2.5 border border-[var(--t-accent)] px-7 py-3.5 text-[0.58rem] tracking-[0.3em] text-[var(--t-accent)] uppercase transition-colors duration-300 hover:bg-[color-mix(in_oklab,var(--t-accent)_18%,transparent)]"
              >
                <motion.svg
                  viewBox="0 0 24 24"
                  className="size-3.5"
                  fill="none"
                  aria-hidden
                  initial={{ y: -6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.9, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.5" />
                </motion.svg>
                Get directions
              </a>
            </SceneReveal>
          )}
        </ParallaxLayer>
      </SceneBody>
    </SceneSurface>
  );
}

/* ---------------------------------- STORY --------------------------------- */

function StoryScene({ milestone }: { milestone: StoryMilestone }) {
  return (
    <SceneSurface surface={CREAM}>
      <DamaskPattern opacity={0.06} scale={58} />

      <SceneBody className="justify-start">
        {milestone.date && (
          <h3
            className={cn("mt-5 text-[var(--t-accent)]", DISPLAY)}
            style={displayType(milestone.date, "hero", "1")}
          >
            <TextReveal delay={0.25}>{milestone.date}</TextReveal>
          </h3>
        )}

        <h2
          className={cn("mt-2 text-[var(--t-ink)]", DISPLAY)}
          style={displayType(milestone.title, "title", "1.15")}
        >
          <TextReveal delay={0.5}>{milestone.title}</TextReveal>
        </h2>

        {milestone.image && (
          <ImageReveal
            image={milestone.image}
            className="mt-7 aspect-[4/5] w-[76%]"
            sizes="76vw"
            delay={0.7}
            from="bottom"
          />
        )}

        {milestone.description && (
          <SceneReveal delay={1.1} className="mt-6">
            <p className="max-w-xs text-fluid-sm leading-[1.9] text-[var(--t-ink-soft)]">
              {milestone.description}
            </p>
          </SceneReveal>
        )}
      </SceneBody>
    </SceneSurface>
  );
}

/* --------------------------------- GALLERY -------------------------------- */

function GalleryScene({ data }: { data: WeddingData }) {
  const { active } = useScene();

  return (
    <SceneSurface surface={DEEP_WINE}>
      <div className="absolute inset-x-0 top-0 z-20 pt-12">
        <SceneLabel delay={0.2}>Moments</SceneLabel>
      </div>

      <div
        className="snap-rail h-full w-full"
        style={{ touchAction: "pan-x pan-y" }}
        aria-label="Photographs, swipe sideways"
      >
        {data.gallery.map((image, index) => (
          <figure key={image.id} className="relative h-full w-[86vw] shrink-0 snap-center sm:w-[70vw]">
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.06 }}
              animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.06 }}
              transition={{ duration: 1.3, delay: 0.25 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <SmartImage image={image} sizes="86vw" className="opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-transparent to-[color-mix(in_oklab,var(--t-bg)_40%,transparent)]" />
            </motion.div>

            {image.caption && (
              <figcaption
                className="absolute inset-x-0 bottom-0 px-7 text-center"
                style={{ paddingBottom: "max(4.5rem, env(safe-area-inset-bottom))" }}
              >
                <span className="text-[0.58rem] tracking-[0.3em] text-[var(--t-ink-soft)] uppercase">
                  {image.caption}
                </span>
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      <p
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 text-center text-[0.55rem] tracking-[0.3em] text-[var(--t-ink-muted)] uppercase"
        style={{ paddingBottom: "max(1.75rem, env(safe-area-inset-bottom))" }}
      >
        Swipe sideways · {data.gallery.length} photographs
      </p>
    </SceneSurface>
  );
}

/* ---------------------------------- RSVP ---------------------------------- */

function RsvpIntroScene({ data }: { data: WeddingData }) {
  const { choose } = useRsvpChoice();
  const { next } = useSceneNavigation();
  const settings = useMotionSettings();
  const [picked, setPicked] = useState<RsvpAttendance | null>(null);

  const pick = (value: RsvpAttendance) => {
    setPicked(value);
    choose(value);
    window.setTimeout(() => next(), settings.enabled ? 900 : 60);
  };

  return (
    <SceneSurface surface={WINE}>
      <DamaskPattern opacity={0.1} scale={52} />
      <BrassFrame delay={0.3} />
      <FoilShine delay={0.9} />

      <SceneBody>
        <SceneLabel delay={0.4}>RSVP</SceneLabel>

        <h2
          className={cn("mt-7 text-[var(--t-ink)]", DISPLAY)}
          style={displayType(data.rsvp.headline ?? "Will you join us?", "hero", "1.08")}
        >
          <TextReveal delay={0.6}>{data.rsvp.headline ?? "Will you join us?"}</TextReveal>
        </h2>

        {data.rsvp.message && (
          <SceneReveal delay={0.95} className="mt-5">
            <p className="max-w-xs text-fluid-sm leading-relaxed text-[var(--t-ink-soft)]">
              {data.rsvp.message}
            </p>
          </SceneReveal>
        )}

        <div className="mt-10 flex w-full max-w-[17rem] flex-col gap-3">
          {(
            [
              ["attending", "Joyfully accept"],
              ["not-attending", "Regretfully decline"],
            ] as const
          ).map(([value, label], index) => (
            <SceneReveal key={value} delay={1.15 + index * 0.12} direction="up">
              <button
                type="button"
                onClick={() => pick(value)}
                aria-pressed={picked === value}
                className={cn(
                  "tap-target relative w-full overflow-hidden px-6 py-4",
                  "border text-[0.6rem] tracking-[0.3em] uppercase transition-colors duration-500",
                  picked === value
                    ? "border-[var(--t-accent)] text-[var(--t-bg)]"
                    : "border-[var(--t-line)] text-[var(--t-ink-soft)] hover:border-[var(--t-accent)]",
                )}
              >
                <span className="relative z-10">{label}</span>
                <motion.span
                  aria-hidden
                  className="absolute inset-0 origin-left bg-[var(--t-accent)]"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: picked === value ? 1 : 0 }}
                  transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
                />
              </button>
            </SceneReveal>
          ))}
        </div>

        <AnimatePresence>
          {picked && (
            <motion.p
              className="mt-6 text-[0.58rem] tracking-[0.3em] text-[var(--t-accent)] uppercase"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {picked === "attending" ? "Wonderful — a few details" : "We will miss you"}
            </motion.p>
          )}
        </AnimatePresence>
      </SceneBody>
    </SceneSurface>
  );
}

function RsvpFormScene({ data, mode }: { data: WeddingData; mode: TemplateProps["mode"] }) {
  const { choice } = useRsvpChoice();

  return (
    <SceneSurface surface={CREAM} className="min-h-[100svh]">
      <DamaskPattern opacity={0.05} scale={58} />

      <div
        className="relative w-full px-7"
        style={{
          paddingTop: "max(4rem, env(safe-area-inset-top))",
          paddingBottom: "max(5rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto w-full max-w-sm">
          <SceneLabel delay={0.15}>Your response</SceneLabel>

          <SceneReveal delay={0.4} className="mt-7">
            <RsvpForm
              data={data}
              mode={mode}
              variant="ornate"
              initialAttendance={choice ?? "attending"}
              hideAttendance={choice !== null}
            />
          </SceneReveal>
        </div>
      </div>
    </SceneSurface>
  );
}

/* --------------------------------- FAMILY --------------------------------- */

function FamilyScene({ data }: { data: WeddingData }) {
  const families = [data.familyNames.bride, data.familyNames.groom].filter(
    (name): name is string => Boolean(name),
  );

  return (
    <SceneSurface surface={CREAM}>
      <DamaskPattern opacity={0.07} scale={60} />

      <SceneBody>
        <SceneLabel delay={0.3}>With love</SceneLabel>

        <div className="mt-8 space-y-4">
          {families.map((name, index) => (
            <h2
              key={name}
              className={cn("text-[var(--t-ink)]", DISPLAY)}
              style={displayType(name, "title", "1.2")}
            >
              <TextReveal delay={0.55 + index * 0.2}>{name}</TextReveal>
            </h2>
          ))}
        </div>

        <div className="mt-7 w-full max-w-[10rem]">
          <BrassRule delay={0.95} />
        </div>

        {data.gratitudeMessage && (
          <SceneReveal delay={1.15} className="mt-7">
            <p className="max-w-sm text-fluid-sm leading-[1.95] text-[var(--t-ink-soft)]">
              {data.gratitudeMessage}
            </p>
          </SceneReveal>
        )}

        {data.contacts.length > 0 && (
          <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-4">
            {data.contacts.map((contact, index) => (
              <SceneReveal key={contact.id} delay={1.3 + index * 0.1}>
                <p className="text-fluid-xs text-[var(--t-ink)]">{contact.name}</p>
                {contact.role && (
                  <p className="mt-0.5 text-[0.55rem] tracking-[0.24em] text-[var(--t-ink-muted)] uppercase">
                    {contact.role}
                  </p>
                )}
                <div className="mt-1.5 flex justify-center gap-3">
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                      className="tap-target inline-grid place-items-center px-1 text-[0.62rem] text-[var(--t-accent)] underline underline-offset-4"
                    >
                      Call
                    </a>
                  )}
                  {contact.whatsapp && (
                    <a
                      href={`https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tap-target inline-grid place-items-center px-1 text-[0.62rem] text-[var(--t-accent)] underline underline-offset-4"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </SceneReveal>
            ))}
          </div>
        )}
      </SceneBody>
    </SceneSurface>
  );
}

/* ---------------------------------- VERSE --------------------------------- */

function VerseScene({ data }: { data: WeddingData }) {
  const { islamic } = data;

  return (
    <SceneSurface surface={WINE}>
      <DamaskPattern opacity={0.09} scale={52} />
      <BrassFrame delay={0.3} />

      <SceneBody>
        {islamic.verseArabic && (
          <SceneReveal delay={0.4} durationScale={1.8}>
            <p lang="ar" dir="rtl" className="text-fluid-xl leading-[2.1] text-[var(--t-accent-soft)]">
              {islamic.verseArabic}
            </p>
          </SceneReveal>
        )}

        {islamic.verseTranslation && (
          <SceneReveal delay={0.8} className="mt-7">
            <p className={cn("max-w-sm text-fluid-base leading-relaxed text-[var(--t-ink-soft)] italic", DISPLAY)}>
              &ldquo;{islamic.verseTranslation}&rdquo;
            </p>
          </SceneReveal>
        )}

        {islamic.verseReference && (
          <SceneReveal delay={1.05} className="mt-5">
            <p className="text-[0.58rem] tracking-[0.32em] text-[var(--t-accent)] uppercase">
              {islamic.verseReference}
            </p>
          </SceneReveal>
        )}

        {islamic.duaText && (
          <>
            <div className="mt-8 w-full max-w-[10rem]">
              <BrassRule delay={1.2} />
            </div>
            <SceneReveal delay={1.4} className="mt-5">
              <p className="text-fluid-xs text-[var(--t-ink-muted)] italic">{islamic.duaText}</p>
            </SceneReveal>
          </>
        )}
      </SceneBody>
    </SceneSurface>
  );
}

/* --------------------------------- CLOSING -------------------------------- */

function ClosingScene({ data }: { data: WeddingData }) {
  const names = coupleNames(data);
  const date = effectiveDate(data);
  const time = formatTime(effectiveTime(data));
  const settings = useMotionSettings();
  const { active } = useScene();
  const nameType = displayTypeForSet([names.firstShort, names.secondShort], "poster");

  return (
    <SceneSurface surface={DEEP_WINE}>
      <DamaskPattern opacity={0.12} scale={48} />
      <BrassFrame delay={1.6} />
      <FoilShine delay={2.4} />

      {/* The house lights go down. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: active && settings.enabled ? 0.32 : 0 }}
        transition={{ duration: 3.8, ease: "easeInOut" }}
      />

      <SceneBody>
        <SceneLabel delay={0.3}>Barakallahu lakuma</SceneLabel>

        <h2 className={cn("mt-9 text-[var(--t-ink)]", DISPLAY)}>
          <span style={nameType} className="block">
            <TextReveal delay={0.6}>{names.firstShort}</TextReveal>
          </span>
          <motion.span
            aria-hidden
            className="my-1 block text-[var(--t-accent)]"
            style={{ fontSize: "clamp(1.4rem, 6vw, 2.25rem)", lineHeight: 1 }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
            transition={{ duration: 1, delay: 0.95, ease: [0.22, 1, 0.36, 1] }}
          >
            &amp;
          </motion.span>
          <span style={nameType} className="block">
            <TextReveal delay={1.15}>{names.secondShort}</TextReveal>
          </span>
        </h2>

        <div className="mt-8 w-full max-w-[12rem]">
          <BrassRule delay={1.5} />
        </div>

        {date && (
          <SceneReveal delay={1.7} className="mt-6">
            <p className="text-[0.62rem] tracking-[0.32em] text-[var(--t-ink-soft)] uppercase">
              {[formatWeekday(date), formatLongDate(date), time].filter(Boolean).join(" · ")}
            </p>
          </SceneReveal>
        )}

        {data.closingMessage && (
          <SceneReveal delay={2} className="mt-6">
            <p className="max-w-sm text-fluid-sm leading-[1.95] text-[var(--t-ink-soft)]">
              {data.closingMessage}
            </p>
          </SceneReveal>
        )}
      </SceneBody>
    </SceneSurface>
  );
}
