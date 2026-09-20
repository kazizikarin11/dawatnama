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
import { DaylightWash, EucalyptusSprig, LeafDrift, LeafRule, LinenWeave } from "./decor";
import { SAGE, SAGE_ALT } from "./theme";

/**
 * TEMPLATE 08 — SAGE LINEN
 *
 * The quiet one, and deliberately so. Every other template in the set is trying to
 * be cinematic; this one is trying to be calm. There is no sweep of light, no
 * particle burst and no dark-to-bright drama — a eucalyptus sprig draws itself in
 * the margin, leaves cross the frame on a twenty-six second cycle, and daylight
 * washes in from the top of each scene.
 *
 * Because it never goes dark, photography carries a much lighter scrim than
 * elsewhere, and the type stays small and well-leaded. Built for a morning nikah.
 */

const LINEN: CSSProperties = {} as CSSProperties;

/** A slightly deeper oat, for rhythm between two pale scenes. */
const OAT: CSSProperties = {
  "--t-bg": "#EAE4D3",
  "--t-bg-alt": "#DCD5C0",
} as CSSProperties;

/** The one dusk-toned surface, used behind full-bleed photography. */
const DUSK: CSSProperties = {
  "--t-bg": "#3B463A",
  "--t-bg-alt": "#4A5746",
  "--t-ink": "#F3F1E6",
  "--t-ink-soft": "#D7D8C9",
  "--t-ink-muted": "#A3A897",
  "--t-accent": "#B6C2AC",
  "--t-accent-soft": "#D8DFCE",
  "--t-line": "rgba(243, 241, 230, 0.22)",
} as CSSProperties;

export default function SageLinenCinematic(props: TemplateProps) {
  const tokens = props.data.appearance.backgroundVariant === "alt" ? SAGE_ALT : SAGE;

  return (
    <TemplateShell
      {...props}
      tokens={tokens}
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

const DISPLAY = "font-[family-name:var(--font-architectural)]";

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
        <span className="block h-px w-8 bg-current opacity-55" />
      </SceneReveal>
      <TrackingReveal
        delay={delay + 0.08}
        className={cn("text-[0.6rem] uppercase", DISPLAY)}
        from="0.48em"
        to="0.3em"
      >
        {children}
      </TrackingReveal>
      <SceneReveal delay={delay} direction="none">
        <span className="block h-px w-8 bg-current opacity-55" />
      </SceneReveal>
    </div>
  );
}

/* ---------------------------------- COVER --------------------------------- */

function CoverScene({ data, mode }: { data: WeddingData; mode: TemplateProps["mode"] }) {
  const openDeck = useOpenInvitation();
  const stage = useStage();
  const names = coupleNames(data);
  const parts = formatDateParts(effectiveDate(data));

  const open = useCallback(() => {
    stage.open();
    openDeck();
  }, [stage, openDeck]);

  const nameType = displayTypeForSet([names.firstShort, names.secondShort], "poster");

  return (
    <SceneSurface surface={LINEN}>
      {data.heroImage && (
        <div aria-hidden className="absolute inset-0">
          <SmartImage image={data.heroImage} priority sizes="100vw" className="scale-105 opacity-[0.12]" />
        </div>
      )}

      <LinenWeave opacity={0.16} />
      <DaylightWash intensity={0.55} />
      <CoverCanvas template="sage-linen" />
      <LeafDrift count={5} />

      {/* Sprigs in the margins, drawn slowly enough to be noticed. */}
      <EucalyptusSprig className="absolute -top-2 left-0 h-52 w-28 opacity-70" delay={2.4} />
      <EucalyptusSprig className="absolute right-0 -bottom-2 h-52 w-28 rotate-180 opacity-70" delay={2.7} />

      <SceneBody>
        {data.islamic.bismillahArabic && (
          <motion.p
            lang="ar"
            dir="rtl"
            className="text-fluid-base text-[var(--t-accent)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2.2, delay: 0.6 }}
          >
            {data.islamic.bismillahArabic}
          </motion.p>
        )}

        <motion.p
          className={cn("mt-8 text-[0.62rem] tracking-[0.4em] text-[var(--t-ink-muted)] uppercase", DISPLAY)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 1.4 }}
        >
          {data.familyInvitationWording ? "Together with their families" : "The wedding of"}
        </motion.p>

        <h1 className={cn("mt-5 text-[var(--t-ink)]", DISPLAY)}>
          <span className="block" style={nameType}>
            <SplitTextReveal text={names.firstShort || "Bride"} delay={1.9} />
          </span>
          <span className="sr-only"> and </span>
          <motion.span
            aria-hidden
            className={cn("my-1.5 block text-[var(--t-accent)]", DISPLAY)}
            style={{ fontSize: "clamp(1.5rem, 7vw, 2.4rem)", lineHeight: 1 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, delay: 2.7 }}
          >
            &amp;
          </motion.span>
          <span className="block" style={nameType}>
            <SplitTextReveal text={names.secondShort || "Groom"} delay={3} />
          </span>
        </h1>

        <motion.div
          className="mt-8 w-full max-w-[12rem]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 3.8 }}
        >
          <LeafRule delay={3.9} />
        </motion.div>

        {parts && (
          <motion.div
            className={cn("mt-5 flex items-center gap-3.5 text-[var(--t-ink-soft)]", DISPLAY)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, delay: 4.1 }}
          >
            <span className="text-[0.66rem] tracking-[0.28em] uppercase">{parts.weekday}</span>
            <span aria-hidden className="h-3 w-px bg-[var(--t-line)]" />
            <span className="text-[0.66rem] tracking-[0.28em] uppercase">
              {parts.day} {parts.monthName} {parts.year}
            </span>
          </motion.div>
        )}

        {data.hijriDate && (
          <motion.p
            className="mt-2 text-[0.58rem] tracking-[0.28em] text-[var(--t-ink-muted)] uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 4.4 }}
          >
            {data.hijriDate}
          </motion.p>
        )}

        <motion.div
          className="mt-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, delay: 4.7 }}
        >
          <button
            type="button"
            data-cover-action
            onClick={open}
            disabled={mode === "thumbnail"}
            className="tap-target group relative overflow-hidden rounded-full px-9 py-4"
          >
            <span
              className={cn(
                "relative z-10 text-[0.6rem] tracking-[0.36em] text-[var(--t-accent)] uppercase transition-colors duration-500 group-hover:text-[var(--t-surface)]",
                DISPLAY,
              )}
            >
              Open invitation
            </span>
            <span aria-hidden className="absolute inset-0 rounded-full border border-[var(--t-accent)]" />
            <span
              aria-hidden
              className="absolute inset-0 origin-center scale-0 rounded-full bg-[var(--t-accent)] transition-transform duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-100"
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
    <SceneSurface surface={LINEN}>
      <LinenWeave opacity={0.14} />
      <DaylightWash intensity={0.4} />
      <EucalyptusSprig className="absolute -top-2 right-0 h-40 w-24 opacity-45" delay={0.4} flip />

      <SceneBody>
        {islamic.bismillahArabic && (
          <SceneReveal delay={0.3} durationScale={1.8}>
            <p lang="ar" dir="rtl" className="text-fluid-xl leading-[1.9] text-[var(--t-ink)]">
              {islamic.bismillahArabic}
            </p>
          </SceneReveal>
        )}

        {islamic.bismillahTranslation && (
          <SceneReveal delay={0.6} className="mt-5">
            <p className="max-w-xs text-fluid-xs leading-relaxed text-[var(--t-ink-muted)]">
              {islamic.bismillahTranslation}
            </p>
          </SceneReveal>
        )}

        <div className="my-9 w-full max-w-[10rem]">
          <LeafRule delay={0.85} />
        </div>

        {data.familyInvitationWording && (
          <h2 className={cn("text-[var(--t-ink)]", DISPLAY)}>
            <TextReveal delay={1} className="text-fluid-lg leading-snug">
              {data.familyInvitationWording}
            </TextReveal>
          </h2>
        )}

        {data.invitationMessage && (
          <SceneReveal delay={1.3} className="mt-7">
            <p className="max-w-sm text-fluid-sm leading-[2] text-[var(--t-ink-soft)]">
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
    <SceneSurface surface={DUSK}>
      {/* A much lighter scrim than the dark templates use — this one keeps daylight. */}
      <ImageReveal
        image={person.photo}
        className="absolute inset-0"
        sizes="100vw"
        from="bottom"
        overlay={
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-[color-mix(in_oklab,var(--t-bg)_34%,transparent)] to-transparent" />
        }
      />
      <LeafDrift count={4} />

      <div className="relative mt-auto px-7 text-center" style={{ paddingBottom: DOCK_CLEAR }}>
        <ParallaxLayer depth={20}>
          <SceneLabel delay={0.5}>{party === "bride" ? "The bride" : "The groom"}</SceneLabel>

          <h2
            className={cn("mt-5 text-[var(--t-ink)]", DISPLAY)}
            style={displayType(person.name, "hero", "1.08")}
          >
            <TextReveal delay={0.7}>{person.name}</TextReveal>
          </h2>

          {person.parents && (
            <SceneReveal delay={1} className="mt-4">
              <p className="text-[0.62rem] tracking-[0.26em] text-[var(--t-accent-soft)] uppercase">
                {person.parents}
              </p>
            </SceneReveal>
          )}

          {person.description && (
            <SceneReveal delay={1.2} className="mt-5">
              <p className="mx-auto max-w-xs text-fluid-sm leading-[1.95] text-[var(--t-ink-soft)]">
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
  const nameType = displayTypeForSet([bride.name, groom.name], "hero", "1.08");

  return (
    <SceneSurface surface={DUSK}>
      {photo && (
        <ImageReveal
          image={photo}
          className="absolute inset-0"
          sizes="100vw"
          overlay={<div className="absolute inset-0 bg-[var(--t-bg)]/62" />}
        />
      )}
      <LeafDrift count={5} />

      <SceneBody>
        <SceneLabel delay={0.3}>The couple</SceneLabel>

        <div className="mt-8 space-y-5">
          {parties.map((person, index) => (
            <h2 key={index} className={cn("text-[var(--t-ink)]", DISPLAY)} style={nameType}>
              <TextReveal delay={0.6 + index * 0.25}>{person.name}</TextReveal>
            </h2>
          ))}
        </div>

        {data.couple.shortDescription && (
          <SceneReveal delay={1.2} className="mt-8">
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
    <SceneSurface surface={OAT}>
      <LinenWeave opacity={0.15} />
      <DaylightWash intensity={0.35} />

      <SceneBody>
        <SceneLabel delay={0.2}>{countdown?.isPast ? "Alhamdulillah" : "Counting down"}</SceneLabel>

        {countdown?.isPast ? (
          <>
            <h2
              className={cn("mt-10 text-[var(--t-accent)]", DISPLAY)}
              style={displayType(countdown.isToday ? "Today" : "Thank you", "hero")}
            >
              <TextReveal delay={0.5}>
                {countdown.isToday ? "Today is the day" : "Thank you"}
              </TextReveal>
            </h2>
            <SceneReveal delay={0.9} className="mt-6">
              <p className="max-w-xs text-fluid-sm text-[var(--t-ink-soft)]">
                {countdown.isToday
                  ? "May Allah bless this day."
                  : "Thank you to everyone who celebrated with us."}
              </p>
            </SceneReveal>
          </>
        ) : (
          /* Widely spaced and unboxed — the calmest arrangement of the four. */
          <div className="mt-10 grid w-full max-w-[18rem] grid-cols-2 gap-x-6 gap-y-9">
            {cells.map((cell, index) => (
              <SceneReveal
                key={cell.label}
                delay={0.4 + index * 0.14}
                direction="up"
                className="flex flex-col items-center"
              >
                <RollingNumber
                  value={cell.value}
                  digits={cell.digits}
                  className={cn("text-[var(--t-ink)]", DISPLAY)}
                  digitClassName="text-[clamp(2.3rem,14vw,3.2rem)] leading-[1]"
                />
                <span
                  className={cn(
                    "mt-2.5 text-[0.54rem] tracking-[0.3em] text-[var(--t-accent)] uppercase",
                    DISPLAY,
                  )}
                >
                  {cell.label}
                </span>
              </SceneReveal>
            ))}
          </div>
        )}

        {date && (
          <SceneReveal delay={1.1} className="mt-11">
            <p className={cn("text-[0.62rem] tracking-[0.3em] text-[var(--t-ink-soft)] uppercase", DISPLAY)}>
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
    <SceneSurface surface={LINEN}>
      <LinenWeave opacity={0.13} />
      <DaylightWash intensity={0.45} />
      <EucalyptusSprig className="absolute -top-2 left-0 h-44 w-24 opacity-45" delay={0.3} />

      <SceneBody>
        <SceneLabel delay={0.3}>The days ahead</SceneLabel>

        <h2
          className={cn("mt-7 text-[var(--t-ink)]", DISPLAY)}
          style={displayType("The Celebration", "hero", "1.04")}
        >
          <TextReveal delay={0.55}>The</TextReveal>
          <TextReveal delay={0.72}>Celebration</TextReveal>
        </h2>

        <div className="mt-8 w-full max-w-[10rem]">
          <LeafRule delay={1} />
        </div>

        <SceneReveal delay={1.2} className="mt-6">
          <p className={cn("text-[0.62rem] tracking-[0.3em] text-[var(--t-accent)] uppercase", DISPLAY)}>
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

  // Alternate between the pale page and the dusk photographic surface.
  const hasImage = Boolean(event.image);

  return (
    <SceneSurface surface={hasImage ? DUSK : ordinal % 2 === 0 ? LINEN : OAT}>
      {event.image ? (
        <ImageReveal
          image={event.image}
          className="absolute inset-0"
          sizes="100vw"
          from={ordinal % 2 === 0 ? "bottom" : "left"}
          overlay={
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-[color-mix(in_oklab,var(--t-bg)_40%,transparent)] to-transparent" />
          }
        />
      ) : (
        <>
          <LinenWeave opacity={0.15} />
          <DaylightWash intensity={0.4} />
          <EucalyptusSprig className="absolute top-6 -left-2 h-44 w-24 opacity-40" delay={0.35} />
        </>
      )}

      <div
        className="relative flex h-full flex-col justify-end px-7 text-center"
        style={{ paddingBottom: DOCK_CLEAR }}
      >
        <ParallaxLayer depth={16}>
          {parts && (
            <SceneReveal delay={0.45} className="flex items-center justify-center gap-3">
              <span className={cn("text-[0.58rem] tracking-[0.28em] text-[var(--t-accent)] uppercase", DISPLAY)}>
                {parts.weekday}
              </span>
              <span aria-hidden className="h-3 w-px bg-[var(--t-line)]" />
              <span className={cn("text-[0.58rem] tracking-[0.28em] text-[var(--t-accent)] uppercase", DISPLAY)}>
                {parts.day} {parts.monthShort} {parts.year}
              </span>
            </SceneReveal>
          )}

          <h2
            className={cn("mt-4 text-[var(--t-ink)]", DISPLAY)}
            style={displayType(event.name, "hero", "1.04")}
          >
            <TextReveal delay={0.62}>{event.name}</TextReveal>
          </h2>

          {event.subtitle && (
            <SceneReveal delay={0.85} className="mt-2">
              <p className="text-fluid-xs text-[var(--t-ink-muted)] italic">{event.subtitle}</p>
            </SceneReveal>
          )}

          <div className="mx-auto mt-5 w-full max-w-[8rem]">
            <LeafRule delay={1} />
          </div>

          {time && (
            <SceneReveal delay={1.15} className="mt-4">
              <p className={cn("text-fluid-lg text-[var(--t-ink)]", DISPLAY)}>{time}</p>
            </SceneReveal>
          )}

          {event.venue && (
            <SceneReveal delay={1.3} className="mt-3">
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
              <SceneReveal delay={1.45} direction="none">
                <span
                  className={cn(
                    "rounded-full border border-[var(--t-line)] px-4 py-2 text-[0.55rem] tracking-[0.24em] text-[var(--t-ink-soft)] uppercase",
                    DISPLAY,
                  )}
                >
                  {event.dressCode}
                </span>
              </SceneReveal>
            )}
            {directions && (
              <SceneReveal delay={1.55} direction="none">
                <a
                  href={directions}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "tap-target inline-grid place-items-center rounded-full border border-[var(--t-accent)] px-5 text-[0.55rem] tracking-[0.24em] text-[var(--t-accent)] uppercase transition-colors duration-300 hover:bg-[color-mix(in_oklab,var(--t-accent)_14%,transparent)]",
                    DISPLAY,
                  )}
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
    <SceneSurface surface={DUSK}>
      {venue.image ? (
        <ImageReveal
          image={venue.image}
          className="absolute inset-0"
          sizes="100vw"
          overlay={
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-[color-mix(in_oklab,var(--t-bg)_38%,transparent)] to-transparent" />
          }
        />
      ) : (
        <LeafDrift count={5} />
      )}

      <SceneBody className="justify-end" style={{ paddingBottom: DOCK_CLEAR }}>
        <ParallaxLayer depth={14}>
          <SceneLabel delay={0.4}>Where to find us</SceneLabel>

          <h2
            className={cn("mt-5 text-[var(--t-ink)]", DISPLAY)}
            style={displayType(venue.name, "hero", "1.08")}
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
                className={cn(
                  "tap-target inline-flex items-center gap-2.5 rounded-full border border-[var(--t-accent)] px-7 py-3.5 text-[0.58rem] tracking-[0.28em] text-[var(--t-accent)] uppercase transition-colors duration-300 hover:bg-[color-mix(in_oklab,var(--t-accent)_14%,transparent)]",
                  DISPLAY,
                )}
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
    <SceneSurface surface={LINEN}>
      <LinenWeave opacity={0.13} />
      <DaylightWash intensity={0.35} />

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
          style={displayType(milestone.title, "title", "1.18")}
        >
          <TextReveal delay={0.5}>{milestone.title}</TextReveal>
        </h2>

        {milestone.image && (
          <ImageReveal
            image={milestone.image}
            className="mt-7 aspect-[4/5] w-[76%] rounded-t-[999px]"
            sizes="76vw"
            delay={0.7}
            from="bottom"
          />
        )}

        {milestone.description && (
          <SceneReveal delay={1.1} className="mt-6">
            <p className="max-w-xs text-fluid-sm leading-[1.95] text-[var(--t-ink-soft)]">
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
    <SceneSurface surface={DUSK}>
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
              initial={{ opacity: 0, scale: 1.05 }}
              animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.05 }}
              transition={{ duration: 1.5, delay: 0.25 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <SmartImage image={image} sizes="86vw" className="opacity-95" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-transparent to-transparent" />
            </motion.div>

            {image.caption && (
              <figcaption
                className="absolute inset-x-0 bottom-0 px-7 text-center"
                style={{ paddingBottom: "max(4.5rem, env(safe-area-inset-bottom))" }}
              >
                <span className={cn("text-[0.58rem] tracking-[0.28em] text-[var(--t-ink-soft)] uppercase", DISPLAY)}>
                  {image.caption}
                </span>
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      <p
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-20 text-center text-[0.55rem] tracking-[0.28em] text-[var(--t-ink-muted)] uppercase",
          DISPLAY,
        )}
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
    <SceneSurface surface={OAT}>
      <LinenWeave opacity={0.14} />
      <DaylightWash intensity={0.4} />
      <LeafDrift count={4} />

      <SceneBody>
        <SceneLabel delay={0.2}>RSVP</SceneLabel>

        <h2
          className={cn("mt-7 text-[var(--t-ink)]", DISPLAY)}
          style={displayType(data.rsvp.headline ?? "Will you join us?", "hero", "1.1")}
        >
          <TextReveal delay={0.45}>{data.rsvp.headline ?? "Will you join us?"}</TextReveal>
        </h2>

        {data.rsvp.message && (
          <SceneReveal delay={0.8} className="mt-5">
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
            <SceneReveal key={value} delay={1 + index * 0.12} direction="up">
              <button
                type="button"
                onClick={() => pick(value)}
                aria-pressed={picked === value}
                className={cn(
                  "tap-target relative w-full overflow-hidden rounded-full px-6 py-4",
                  "border text-[0.6rem] tracking-[0.28em] uppercase transition-colors duration-500",
                  DISPLAY,
                  picked === value
                    ? "border-[var(--t-accent)] text-[var(--t-surface)]"
                    : "border-[var(--t-line)] text-[var(--t-ink-soft)] hover:border-[var(--t-accent)]",
                )}
              >
                <span className="relative z-10">{label}</span>
                <motion.span
                  aria-hidden
                  className="absolute inset-0 origin-left bg-[var(--t-accent)]"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: picked === value ? 1 : 0 }}
                  transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
                />
              </button>
            </SceneReveal>
          ))}
        </div>

        <AnimatePresence>
          {picked && (
            <motion.p
              className={cn("mt-6 text-[0.58rem] tracking-[0.28em] text-[var(--t-accent)] uppercase", DISPLAY)}
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
    <SceneSurface surface={LINEN} className="min-h-[100svh]">
      <LinenWeave opacity={0.12} />

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
              variant="minimal"
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
    <SceneSurface surface={LINEN}>
      <LinenWeave opacity={0.13} />
      <DaylightWash intensity={0.38} />
      <EucalyptusSprig className="absolute -top-2 right-0 h-40 w-24 opacity-40" delay={0.4} flip />

      <SceneBody>
        <SceneLabel delay={0.3}>With love</SceneLabel>

        <div className="mt-8 space-y-4">
          {families.map((name, index) => (
            <h2
              key={name}
              className={cn("text-[var(--t-ink)]", DISPLAY)}
              style={displayType(name, "title", "1.22")}
            >
              <TextReveal delay={0.55 + index * 0.2}>{name}</TextReveal>
            </h2>
          ))}
        </div>

        <div className="mt-7 w-full max-w-[9rem]">
          <LeafRule delay={0.95} />
        </div>

        {data.gratitudeMessage && (
          <SceneReveal delay={1.15} className="mt-7">
            <p className="max-w-sm text-fluid-sm leading-[2] text-[var(--t-ink-soft)]">
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
                  <p className="mt-0.5 text-[0.55rem] tracking-[0.22em] text-[var(--t-ink-muted)] uppercase">
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
    <SceneSurface surface={OAT}>
      <LinenWeave opacity={0.14} />
      <DaylightWash intensity={0.42} />

      <SceneBody>
        {islamic.verseArabic && (
          <SceneReveal delay={0.3} durationScale={1.9}>
            <p lang="ar" dir="rtl" className="text-fluid-xl leading-[2.1] text-[var(--t-ink)]">
              {islamic.verseArabic}
            </p>
          </SceneReveal>
        )}

        {islamic.verseTranslation && (
          <SceneReveal delay={0.75} className="mt-7">
            <p className={cn("max-w-sm text-fluid-base leading-relaxed text-[var(--t-ink-soft)]", DISPLAY)}>
              &ldquo;{islamic.verseTranslation}&rdquo;
            </p>
          </SceneReveal>
        )}

        {islamic.verseReference && (
          <SceneReveal delay={1} className="mt-5">
            <p className={cn("text-[0.58rem] tracking-[0.3em] text-[var(--t-accent)] uppercase", DISPLAY)}>
              {islamic.verseReference}
            </p>
          </SceneReveal>
        )}

        {islamic.duaText && (
          <>
            <div className="mt-8 w-full max-w-[9rem]">
              <LeafRule delay={1.15} />
            </div>
            <SceneReveal delay={1.35} className="mt-5">
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
  const { active } = useScene();
  const settings = useMotionSettings();
  const nameType = displayTypeForSet([names.firstShort, names.secondShort], "poster");

  return (
    <SceneSurface surface={LINEN}>
      <LinenWeave opacity={0.15} />
      <DaylightWash intensity={0.6} />
      <LeafDrift count={7} />
      <EucalyptusSprig className="absolute -top-2 left-0 h-52 w-28 opacity-60" delay={1.5} />
      <EucalyptusSprig className="absolute right-0 -bottom-2 h-52 w-28 rotate-180 opacity-60" delay={1.8} />

      <SceneBody>
        <SceneLabel delay={0.25}>Barakallahu lakuma</SceneLabel>

        <h2 className={cn("mt-9 text-[var(--t-ink)]", DISPLAY)}>
          <span style={nameType} className="block">
            <TextReveal delay={0.6}>{names.firstShort}</TextReveal>
          </span>
          <motion.span
            aria-hidden
            className="my-1.5 block text-[var(--t-accent)]"
            style={{ fontSize: "clamp(1.4rem, 6vw, 2.2rem)", lineHeight: 1 }}
            initial={{ opacity: 0 }}
            animate={active ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.4, delay: settings.enabled ? 0.95 : 0 }}
          >
            &amp;
          </motion.span>
          <span style={nameType} className="block">
            <TextReveal delay={1.15}>{names.secondShort}</TextReveal>
          </span>
        </h2>

        <div className="mt-8 w-full max-w-[11rem]">
          <LeafRule delay={1.5} />
        </div>

        {date && (
          <SceneReveal delay={1.7} className="mt-6">
            <p className={cn("text-[0.62rem] tracking-[0.3em] text-[var(--t-ink-soft)] uppercase", DISPLAY)}>
              {[formatWeekday(date), formatLongDate(date), time].filter(Boolean).join(" · ")}
            </p>
          </SceneReveal>
        )}

        {data.closingMessage && (
          <SceneReveal delay={2} className="mt-6">
            <p className="max-w-sm text-fluid-sm leading-[2] text-[var(--t-ink-soft)]">
              {data.closingMessage}
            </p>
          </SceneReveal>
        )}
      </SceneBody>
    </SceneSurface>
  );
}
