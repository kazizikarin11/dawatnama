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
import { BrassWipe, ChevronBand, DecoFan, DecoFrame, DecoGrid } from "./decor";
import { DECO, DECO_ALT } from "./theme";

/**
 * TEMPLATE 09 — DECO NOIR
 *
 * Art deco at full confidence. The rule for this template is that nothing curves
 * and nothing dissolves: forms step, edges wipe, and symmetry is absolute. Fans
 * open from the centre outward rather than sweeping left to right, chevron bands
 * run edge to edge instead of tapering, and a single brass edge crosses the frame
 * to mark a transition.
 *
 * Motion here is noticeably faster than in the other dark templates — deco is
 * about precision and confidence, not atmosphere, so hesitation would read wrong.
 */

const NOIR: CSSProperties = {} as CSSProperties;

const JET: CSSProperties = {
  "--t-bg": "#050506",
  "--t-bg-alt": "#0F0F11",
} as CSSProperties;

/** The pearl inverse, used for the reading scenes: black type on bone. */
const PEARL: CSSProperties = {
  "--t-bg": "#F4F0E8",
  "--t-bg-alt": "#E8E2D6",
  "--t-surface": "#FBF8F2",
  "--t-ink": "#141416",
  "--t-ink-soft": "#3B3B3E",
  "--t-ink-muted": "#7B7873",
  "--t-line": "rgba(20, 20, 22, 0.22)",
} as CSSProperties;

export default function DecoNoirCinematic(props: TemplateProps) {
  const tokens = props.data.appearance.backgroundVariant === "alt" ? DECO_ALT : DECO;

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

const DISPLAY = "font-[family-name:var(--font-fashion)]";

/** Stepped brackets either side of a wide-tracked label. */
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
        <span className="block h-2 w-2 border-t border-l border-current" />
      </SceneReveal>
      <TrackingReveal delay={delay + 0.06} className="text-[0.58rem] uppercase" from="0.56em" to="0.38em">
        {children}
      </TrackingReveal>
      <SceneReveal delay={delay} direction="none">
        <span className="block h-2 w-2 border-t border-r border-current" />
      </SceneReveal>
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

  const nameType = displayTypeForSet([names.firstShort, names.secondShort], "poster", "0.95");

  return (
    <SceneSurface surface={JET}>
      {data.heroImage && (
        <div aria-hidden className="absolute inset-0">
          <SmartImage image={data.heroImage} priority sizes="100vw" className="scale-105 opacity-[0.14]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_44%,transparent_3%,var(--t-bg)_74%)]" />
        </div>
      )}

      <DecoGrid opacity={0.11} scale={42} />
      <CoverCanvas template="deco-noir" />

      {/* The stepped frame, and a sunburst opening above the type. */}
      <div className="pointer-events-none absolute inset-x-5 inset-y-8">
        <DecoFrame delay={0.4} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-[13%] flex justify-center">
        <DecoFan delay={1.2} rays={11} size={190} />
      </div>

      <SceneBody style={{ paddingTop: "max(11rem, calc(env(safe-area-inset-top) + 10rem))" }}>
        {data.islamic.bismillahArabic && (
          <motion.p
            lang="ar"
            dir="rtl"
            className="text-fluid-base text-[var(--t-accent-soft)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 1.9 }}
          >
            {data.islamic.bismillahArabic}
          </motion.p>
        )}

        <motion.p
          className="mt-6 text-[0.6rem] tracking-[0.48em] text-[var(--t-accent)] uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.3 }}
        >
          {data.familyInvitationWording ? "Together with their families" : "The wedding of"}
        </motion.p>

        <h1 className={cn("mt-5 text-[var(--t-ink)]", DISPLAY)}>
          <span className="block" style={nameType}>
            <SplitTextReveal text={names.firstShort || "Bride"} delay={2.6} durationScale={1} />
          </span>
          <span className="sr-only"> and </span>
          {/* A stepped brass diamond instead of an ampersand — deco does not script. */}
          <motion.span
            aria-hidden
            className="my-2 flex items-center justify-center gap-2.5 text-[var(--t-accent)]"
            initial={{ opacity: 0, scaleX: settings.enabled ? 0.3 : 1 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.8, delay: 3.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="block h-px w-8 bg-current" />
            <span className="block size-2.5 rotate-45 border border-current" />
            <span className="block size-1.5 rotate-45 bg-current" />
            <span className="block size-2.5 rotate-45 border border-current" />
            <span className="block h-px w-8 bg-current" />
          </motion.span>
          <span className="block" style={nameType}>
            <SplitTextReveal text={names.secondShort || "Groom"} delay={3.45} durationScale={1} />
          </span>
        </h1>

        <motion.div
          className="mt-7 w-full max-w-[13rem]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 4 }}
        >
          <ChevronBand delay={4.05} />
        </motion.div>

        {parts && (
          <motion.div
            className="mt-5 flex items-center gap-3.5 text-[var(--t-ink-soft)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 4.3 }}
          >
            <span className="text-[0.64rem] tracking-[0.34em] uppercase">{parts.weekday}</span>
            <span aria-hidden className="h-3 w-px bg-[var(--t-line)]" />
            <span className="text-[0.64rem] tracking-[0.34em] uppercase">
              {parts.day} {parts.monthName} {parts.year}
            </span>
          </motion.div>
        )}

        {data.hijriDate && (
          <motion.p
            className="mt-2 text-[0.56rem] tracking-[0.32em] text-[var(--t-ink-muted)] uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 4.5 }}
          >
            {data.hijriDate}
          </motion.p>
        )}

        <motion.div
          className="mt-9"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 4.8 }}
        >
          <button
            type="button"
            data-cover-action
            onClick={open}
            disabled={mode === "thumbnail"}
            className="tap-target group relative overflow-hidden px-10 py-4"
          >
            <span className="relative z-10 text-[0.6rem] tracking-[0.44em] text-[var(--t-accent)] uppercase transition-colors duration-300 group-hover:text-[var(--t-bg)]">
              Open
            </span>
            {/* Stepped corners rather than a plain rectangle. */}
            <span aria-hidden className="absolute inset-0 border border-[var(--t-accent)]" />
            <span aria-hidden className="absolute -top-1 left-1/2 h-2 w-8 -translate-x-1/2 border-t border-[var(--t-accent)]" />
            <span aria-hidden className="absolute -bottom-1 left-1/2 h-2 w-8 -translate-x-1/2 border-b border-[var(--t-accent)]" />
            <span
              aria-hidden
              className="absolute inset-0 origin-center scale-y-0 bg-[var(--t-accent)] transition-transform duration-300 ease-out group-hover:scale-y-100"
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
    <SceneSurface surface={PEARL}>
      <DecoGrid opacity={0.09} scale={48} />
      <BrassWipe delay={0.2} />

      <SceneBody>
        <div className="pointer-events-none absolute inset-x-6 inset-y-10">
          <DecoFrame delay={0.5} />
        </div>

        {islamic.bismillahArabic && (
          <SceneReveal delay={0.5} durationScale={1.3}>
            <p lang="ar" dir="rtl" className="text-fluid-xl leading-[1.9] text-[var(--t-ink)]">
              {islamic.bismillahArabic}
            </p>
          </SceneReveal>
        )}

        {islamic.bismillahTranslation && (
          <SceneReveal delay={0.7} className="mt-5">
            <p className="max-w-xs text-fluid-xs leading-relaxed text-[var(--t-ink-muted)]">
              {islamic.bismillahTranslation}
            </p>
          </SceneReveal>
        )}

        <div className="my-8 w-full max-w-[11rem]">
          <ChevronBand delay={0.9} />
        </div>

        {data.familyInvitationWording && (
          <h2 className={cn("text-[var(--t-ink)]", DISPLAY)}>
            <TextReveal delay={1} durationScale={1} className="text-fluid-lg leading-snug">
              {data.familyInvitationWording}
            </TextReveal>
          </h2>
        )}

        {data.invitationMessage && (
          <SceneReveal delay={1.2} className="mt-6">
            <p className="max-w-sm text-fluid-sm leading-[1.9] text-[var(--t-ink-soft)]">
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
    <SceneSurface surface={JET}>
      <ImageReveal
        image={person.photo}
        className="absolute inset-0"
        sizes="100vw"
        from={party === "bride" ? "left" : "right"}
        overlay={
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-[color-mix(in_oklab,var(--t-bg)_48%,transparent)] to-[color-mix(in_oklab,var(--t-bg)_22%,transparent)]" />
        }
      />
      <BrassWipe delay={0.3} />

      <div className="relative mt-auto px-7 text-center" style={{ paddingBottom: DOCK_CLEAR }}>
        <ParallaxLayer depth={18}>
          <SceneLabel delay={0.5}>{party === "bride" ? "The bride" : "The groom"}</SceneLabel>

          <h2
            className={cn("mt-5 text-[var(--t-ink)]", DISPLAY)}
            style={displayType(person.name, "hero", "0.98")}
          >
            <TextReveal delay={0.7} durationScale={1}>
              {person.name}
            </TextReveal>
          </h2>

          <div className="mx-auto mt-4 w-full max-w-[9rem]">
            <ChevronBand delay={0.95} />
          </div>

          {person.parents && (
            <SceneReveal delay={1.1} className="mt-4">
              <p className="text-[0.6rem] tracking-[0.3em] text-[var(--t-accent)] uppercase">
                {person.parents}
              </p>
            </SceneReveal>
          )}

          {person.description && (
            <SceneReveal delay={1.25} className="mt-4">
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
  const nameType = displayTypeForSet([bride.name, groom.name], "hero", "0.98");

  return (
    <SceneSurface surface={JET}>
      {photo && (
        <ImageReveal
          image={photo}
          className="absolute inset-0"
          sizes="100vw"
          overlay={<div className="absolute inset-0 bg-[var(--t-bg)]/72" />}
        />
      )}
      <DecoGrid opacity={0.1} scale={44} />

      <SceneBody>
        <SceneLabel delay={0.3}>The couple</SceneLabel>

        <div className="mt-8 space-y-4">
          {parties.map((person, index) => (
            <h2 key={index} className={cn("text-[var(--t-ink)]", DISPLAY)} style={nameType}>
              <TextReveal delay={0.55 + index * 0.2} durationScale={1}>
                {person.name}
              </TextReveal>
            </h2>
          ))}
        </div>

        {data.couple.shortDescription && (
          <SceneReveal delay={1.1} className="mt-8">
            <p className="max-w-sm text-fluid-sm leading-[1.9] text-[var(--t-ink-soft)]">
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
    <SceneSurface surface={NOIR}>
      <DecoGrid opacity={0.12} scale={40} />
      <BrassWipe delay={0.2} />

      <SceneBody>
        <SceneLabel delay={0.3}>{countdown?.isPast ? "Alhamdulillah" : "Counting down"}</SceneLabel>

        {countdown?.isPast ? (
          <>
            <h2
              className={cn("mt-10 text-[var(--t-accent-soft)]", DISPLAY)}
              style={displayType(countdown.isToday ? "Today" : "Thank you", "hero")}
            >
              <TextReveal delay={0.5} durationScale={1}>
                {countdown.isToday ? "Today is the day" : "Thank you"}
              </TextReveal>
            </h2>
            <SceneReveal delay={0.85} className="mt-6">
              <p className="max-w-xs text-fluid-sm text-[var(--t-ink-soft)]">
                {countdown.isToday
                  ? "May Allah bless this day."
                  : "Thank you to everyone who celebrated with us."}
              </p>
            </SceneReveal>
          </>
        ) : (
          /* Four stepped brass plates, drawn as a symmetrical block. */
          <div className="mt-9 grid w-full max-w-[18rem] grid-cols-2 gap-3">
            {cells.map((cell, index) => (
              <SceneReveal
                key={cell.label}
                delay={0.45 + index * 0.1}
                direction="none"
                className="relative flex flex-col items-center px-3 py-4"
              >
                <span aria-hidden className="absolute inset-0 border border-[var(--t-line)]" />
                <span aria-hidden className="absolute -top-px left-1/2 h-1.5 w-6 -translate-x-1/2 border-t border-[var(--t-accent)]" />
                <RollingNumber
                  value={cell.value}
                  digits={cell.digits}
                  className={cn("text-[var(--t-accent-soft)]", DISPLAY)}
                  digitClassName="text-[clamp(2.1rem,13vw,3rem)] leading-[1]"
                />
                <span className="mt-2 text-[0.52rem] tracking-[0.34em] text-[var(--t-ink-muted)] uppercase">
                  {cell.label}
                </span>
              </SceneReveal>
            ))}
          </div>
        )}

        {date && (
          <SceneReveal delay={1.05} className="mt-9">
            <p className="text-[0.6rem] tracking-[0.34em] text-[var(--t-ink-soft)] uppercase">
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
    <SceneSurface surface={PEARL}>
      <DecoGrid opacity={0.1} scale={46} />
      <BrassWipe delay={0.2} />

      <SceneBody>
        <DecoFan delay={0.4} rays={9} size={150} className="mb-6" />

        <SceneLabel delay={0.8}>The programme</SceneLabel>

        <h2
          className={cn("mt-6 text-[var(--t-ink)]", DISPLAY)}
          style={displayType("The Celebration", "hero", "0.98")}
        >
          <TextReveal delay={1} durationScale={1}>
            The
          </TextReveal>
          <TextReveal delay={1.14} durationScale={1}>
            Celebration
          </TextReveal>
        </h2>

        <div className="mt-7 w-full max-w-[11rem]">
          <ChevronBand delay={1.4} />
        </div>

        <SceneReveal delay={1.55} className="mt-6">
          <p className="text-[0.6rem] tracking-[0.34em] text-[var(--t-accent)] uppercase">
            {String(count).padStart(2, "0")} {count === 1 ? "gathering" : "gatherings"}
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
    <SceneSurface surface={ordinal % 2 === 0 ? JET : NOIR}>
      {event.image ? (
        <ImageReveal
          image={event.image}
          className="absolute inset-0"
          sizes="100vw"
          from={ordinal % 2 === 0 ? "bottom" : "top"}
          overlay={
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-[color-mix(in_oklab,var(--t-bg)_52%,transparent)] to-[color-mix(in_oklab,var(--t-bg)_28%,transparent)]" />
          }
        />
      ) : (
        <>
          <DecoGrid opacity={0.13} scale={40} />
          <div className="pointer-events-none absolute inset-x-0 top-[14%] flex justify-center">
            <DecoFan delay={0.4} rays={9} size={160} />
          </div>
        </>
      )}

      <BrassWipe delay={0.25} />

      <div
        className="relative flex h-full flex-col justify-end px-7 text-center"
        style={{ paddingBottom: DOCK_CLEAR }}
      >
        <ParallaxLayer depth={16}>
          {parts && (
            <SceneReveal delay={0.45} className="flex items-center justify-center gap-3">
              <span className="text-[0.56rem] tracking-[0.34em] text-[var(--t-accent)] uppercase">
                {parts.weekday}
              </span>
              <span aria-hidden className="h-3 w-px bg-[var(--t-line)]" />
              <span className="text-[0.56rem] tracking-[0.34em] text-[var(--t-accent)] uppercase">
                {parts.day} {parts.monthShort} {parts.year}
              </span>
            </SceneReveal>
          )}

          <h2
            className={cn("mt-4 text-[var(--t-ink)]", DISPLAY)}
            style={displayType(event.name, "hero", "0.98")}
          >
            <TextReveal delay={0.6} durationScale={1}>
              {event.name}
            </TextReveal>
          </h2>

          {event.subtitle && (
            <SceneReveal delay={0.8} className="mt-2">
              <p className="text-fluid-xs text-[var(--t-ink-muted)]">{event.subtitle}</p>
            </SceneReveal>
          )}

          <div className="mx-auto mt-5 w-full max-w-[9rem]">
            <ChevronBand delay={0.95} />
          </div>

          {time && (
            <SceneReveal delay={1.1} className="mt-4">
              <p className={cn("text-fluid-lg text-[var(--t-ink)]", DISPLAY)}>{time}</p>
            </SceneReveal>
          )}

          {event.venue && (
            <SceneReveal delay={1.25} className="mt-3">
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
              <SceneReveal delay={1.4} direction="none">
                <span className="border border-[var(--t-line)] px-3.5 py-2 text-[0.54rem] tracking-[0.3em] text-[var(--t-ink-soft)] uppercase">
                  {event.dressCode}
                </span>
              </SceneReveal>
            )}
            {directions && (
              <SceneReveal delay={1.5} direction="none">
                <a
                  href={directions}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap-target inline-grid place-items-center border border-[var(--t-accent)] px-5 text-[0.54rem] tracking-[0.3em] text-[var(--t-accent)] uppercase transition-colors duration-300 hover:bg-[var(--t-accent)] hover:text-[var(--t-bg)]"
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
    <SceneSurface surface={JET}>
      {venue.image ? (
        <ImageReveal
          image={venue.image}
          className="absolute inset-0"
          sizes="100vw"
          overlay={
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-[color-mix(in_oklab,var(--t-bg)_44%,transparent)] to-transparent" />
          }
        />
      ) : (
        <DecoGrid opacity={0.12} scale={42} />
      )}
      <BrassWipe delay={0.25} />

      <SceneBody className="justify-end" style={{ paddingBottom: DOCK_CLEAR }}>
        <ParallaxLayer depth={14}>
          <SceneLabel delay={0.4}>The venue</SceneLabel>

          <h2
            className={cn("mt-5 text-[var(--t-ink)]", DISPLAY)}
            style={displayType(venue.name, "hero", "0.98")}
          >
            <TextReveal delay={0.6} durationScale={1}>
              {venue.name}
            </TextReveal>
          </h2>

          <div className="mx-auto mt-4 w-full max-w-[9rem]">
            <ChevronBand delay={0.85} />
          </div>

          {venue.address && (
            <SceneReveal delay={1} className="mt-4">
              <p className="mx-auto max-w-[17rem] text-fluid-sm leading-relaxed text-[var(--t-ink-soft)]">
                {venue.address}
              </p>
            </SceneReveal>
          )}

          {venue.note && (
            <SceneReveal delay={1.1} className="mt-2">
              <p className="text-fluid-xs text-[var(--t-ink-muted)]">{venue.note}</p>
            </SceneReveal>
          )}

          {directions && (
            <SceneReveal delay={1.25} className="mt-7">
              <a
                href={directions}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target inline-flex items-center gap-2.5 border border-[var(--t-accent)] px-7 py-3.5 text-[0.56rem] tracking-[0.34em] text-[var(--t-accent)] uppercase transition-colors duration-300 hover:bg-[var(--t-accent)] hover:text-[var(--t-bg)]"
              >
                <motion.svg
                  viewBox="0 0 24 24"
                  className="size-3.5"
                  fill="none"
                  aria-hidden
                  initial={{ y: -6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.7, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
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
    <SceneSurface surface={PEARL}>
      <DecoGrid opacity={0.09} scale={46} />
      <BrassWipe delay={0.2} />

      <SceneBody className="justify-start">
        {milestone.date && (
          <h3
            className={cn("mt-5 text-[var(--t-accent)]", DISPLAY)}
            style={displayType(milestone.date, "hero", "0.96")}
          >
            <TextReveal delay={0.35} durationScale={1}>
              {milestone.date}
            </TextReveal>
          </h3>
        )}

        <h2
          className={cn("mt-2 text-[var(--t-ink)]", DISPLAY)}
          style={displayType(milestone.title, "title", "1.1")}
        >
          <TextReveal delay={0.55} durationScale={1}>
            {milestone.title}
          </TextReveal>
        </h2>

        {milestone.image && (
          <div className="relative mt-7 w-[78%]">
            <ImageReveal
              image={milestone.image}
              className="aspect-[4/5] w-full"
              sizes="78vw"
              delay={0.75}
              from="bottom"
            />
            <span aria-hidden className="absolute inset-0 border border-[var(--t-accent)] opacity-60" />
          </div>
        )}

        {milestone.description && (
          <SceneReveal delay={1.15} className="mt-6">
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
    <SceneSurface surface={JET}>
      <div className="absolute inset-x-0 top-0 z-20 pt-12">
        <SceneLabel delay={0.2}>Photographs</SceneLabel>
      </div>

      <div
        className="snap-rail h-full w-full"
        style={{ touchAction: "pan-x pan-y" }}
        aria-label="Photographs, swipe sideways"
      >
        {data.gallery.map((image, index) => (
          <figure key={image.id} className="relative h-full w-[86vw] shrink-0 snap-center sm:w-[70vw]">
            {/* A hard-edged vertical wipe, never a crossfade. */}
            <motion.div
              className="absolute inset-0"
              initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
              animate={
                active
                  ? { clipPath: "inset(0% 0% 0% 0%)" }
                  : { clipPath: "inset(0% 0% 100% 0%)" }
              }
              transition={{ duration: 0.85, delay: 0.2 + index * 0.07, ease: [0.65, 0, 0.35, 1] }}
            >
              <SmartImage image={image} sizes="86vw" className="opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-transparent to-transparent" />
            </motion.div>

            <figcaption
              className="absolute inset-x-6 bottom-0"
              style={{ paddingBottom: "max(4.5rem, env(safe-area-inset-bottom))" }}
            >
              <span className="text-[0.54rem] tracking-[0.36em] text-[var(--t-accent)] uppercase">
                {String(index + 1).padStart(2, "0")}
              </span>
              {image.caption && (
                <span className="mt-1.5 block text-[0.56rem] tracking-[0.26em] text-[var(--t-ink-soft)] uppercase">
                  {image.caption}
                </span>
              )}
            </figcaption>
          </figure>
        ))}
      </div>

      <p
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 text-center text-[0.54rem] tracking-[0.34em] text-[var(--t-ink-muted)] uppercase"
        style={{ paddingBottom: "max(1.75rem, env(safe-area-inset-bottom))" }}
      >
        Swipe · {String(data.gallery.length).padStart(2, "0")}
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
    window.setTimeout(() => next(), settings.enabled ? 800 : 60);
  };

  return (
    <SceneSurface surface={NOIR}>
      <DecoGrid opacity={0.12} scale={42} />
      <BrassWipe delay={0.2} />

      <SceneBody>
        <DecoFan delay={0.35} rays={7} size={130} className="mb-5" />

        <SceneLabel delay={0.7}>RSVP</SceneLabel>

        <h2
          className={cn("mt-6 text-[var(--t-ink)]", DISPLAY)}
          style={displayType(data.rsvp.headline ?? "Will you join us?", "hero", "1")}
        >
          <TextReveal delay={0.9} durationScale={1}>
            {data.rsvp.headline ?? "Will you join us?"}
          </TextReveal>
        </h2>

        {data.rsvp.message && (
          <SceneReveal delay={1.15} className="mt-5">
            <p className="max-w-xs text-fluid-sm leading-relaxed text-[var(--t-ink-soft)]">
              {data.rsvp.message}
            </p>
          </SceneReveal>
        )}

        <div className="mt-9 flex w-full max-w-[17rem] flex-col gap-3">
          {(
            [
              ["attending", "Joyfully accept"],
              ["not-attending", "Regretfully decline"],
            ] as const
          ).map(([value, label], index) => (
            <SceneReveal key={value} delay={1.3 + index * 0.1} direction="none">
              <button
                type="button"
                onClick={() => pick(value)}
                aria-pressed={picked === value}
                className={cn(
                  "tap-target relative w-full overflow-hidden px-6 py-4",
                  "border text-[0.58rem] tracking-[0.34em] uppercase transition-colors duration-300",
                  picked === value
                    ? "border-[var(--t-accent)] text-[var(--t-bg)]"
                    : "border-[var(--t-line)] text-[var(--t-ink-soft)] hover:border-[var(--t-accent)]",
                )}
              >
                <span className="relative z-10">{label}</span>
                {/* Fills from the centre out, matching the fans. */}
                <motion.span
                  aria-hidden
                  className="absolute inset-0 origin-center bg-[var(--t-accent)]"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: picked === value ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
                />
              </button>
            </SceneReveal>
          ))}
        </div>

        <AnimatePresence>
          {picked && (
            <motion.p
              className="mt-6 text-[0.56rem] tracking-[0.34em] text-[var(--t-accent)] uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {picked === "attending" ? "A few details" : "We will miss you"}
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
    <SceneSurface surface={PEARL} className="min-h-[100svh]">
      <DecoGrid opacity={0.08} scale={48} />

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
              variant="cinematic"
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
    <SceneSurface surface={PEARL}>
      <DecoGrid opacity={0.09} scale={46} />

      <SceneBody>
        <SceneLabel delay={0.3}>With love</SceneLabel>

        <div className="mt-8 space-y-4">
          {families.map((name, index) => (
            <h2
              key={name}
              className={cn("text-[var(--t-ink)]", DISPLAY)}
              style={displayType(name, "title", "1.12")}
            >
              <TextReveal delay={0.5 + index * 0.18} durationScale={1}>
                {name}
              </TextReveal>
            </h2>
          ))}
        </div>

        <div className="mt-7 w-full max-w-[10rem]">
          <ChevronBand delay={0.9} />
        </div>

        {data.gratitudeMessage && (
          <SceneReveal delay={1.1} className="mt-7">
            <p className="max-w-sm text-fluid-sm leading-[1.9] text-[var(--t-ink-soft)]">
              {data.gratitudeMessage}
            </p>
          </SceneReveal>
        )}

        {data.contacts.length > 0 && (
          <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-4">
            {data.contacts.map((contact, index) => (
              <SceneReveal key={contact.id} delay={1.25 + index * 0.1}>
                <p className="text-fluid-xs text-[var(--t-ink)]">{contact.name}</p>
                {contact.role && (
                  <p className="mt-0.5 text-[0.54rem] tracking-[0.28em] text-[var(--t-ink-muted)] uppercase">
                    {contact.role}
                  </p>
                )}
                <div className="mt-1.5 flex justify-center gap-3">
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                      className="tap-target inline-grid place-items-center px-1 text-[0.6rem] text-[var(--t-accent)] underline underline-offset-4"
                    >
                      Call
                    </a>
                  )}
                  {contact.whatsapp && (
                    <a
                      href={`https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tap-target inline-grid place-items-center px-1 text-[0.6rem] text-[var(--t-accent)] underline underline-offset-4"
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
    <SceneSurface surface={NOIR}>
      <DecoGrid opacity={0.11} scale={42} />
      <div className="pointer-events-none absolute inset-x-6 inset-y-10">
        <DecoFrame delay={0.3} />
      </div>

      <SceneBody>
        {islamic.verseArabic && (
          <SceneReveal delay={0.5} durationScale={1.4}>
            <p lang="ar" dir="rtl" className="text-fluid-xl leading-[2.1] text-[var(--t-accent-soft)]">
              {islamic.verseArabic}
            </p>
          </SceneReveal>
        )}

        {islamic.verseTranslation && (
          <SceneReveal delay={0.8} className="mt-7">
            <p className={cn("max-w-sm text-fluid-base leading-relaxed text-[var(--t-ink-soft)]", DISPLAY)}>
              &ldquo;{islamic.verseTranslation}&rdquo;
            </p>
          </SceneReveal>
        )}

        {islamic.verseReference && (
          <SceneReveal delay={1.05} className="mt-5">
            <p className="text-[0.56rem] tracking-[0.34em] text-[var(--t-accent)] uppercase">
              {islamic.verseReference}
            </p>
          </SceneReveal>
        )}

        {islamic.duaText && (
          <>
            <div className="mt-8 w-full max-w-[10rem]">
              <ChevronBand delay={1.2} />
            </div>
            <SceneReveal delay={1.4} className="mt-5">
              <p className="text-fluid-xs text-[var(--t-ink-muted)]">{islamic.duaText}</p>
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
  const nameType = displayTypeForSet([names.firstShort, names.secondShort], "poster", "0.95");

  return (
    <SceneSurface surface={JET}>
      <DecoGrid opacity={0.13} scale={40} />

      <div className="pointer-events-none absolute inset-x-5 inset-y-8">
        <DecoFrame delay={1.5} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-[10%] flex justify-center">
        <DecoFan delay={1.8} rays={13} size={210} />
      </div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: active && settings.enabled ? 0.28 : 0 }}
        transition={{ duration: 3.2, ease: "easeInOut" }}
      />

      <SceneBody style={{ paddingTop: "max(11rem, calc(env(safe-area-inset-top) + 10rem))" }}>
        <SceneLabel delay={0.3}>Barakallahu lakuma</SceneLabel>

        <h2 className={cn("mt-7 text-[var(--t-ink)]", DISPLAY)}>
          <span style={nameType} className="block">
            <TextReveal delay={0.6} durationScale={1}>
              {names.firstShort}
            </TextReveal>
          </span>
          <motion.span
            aria-hidden
            className="my-2 flex items-center justify-center gap-2.5 text-[var(--t-accent)]"
            initial={{ opacity: 0, scaleX: 0.3 }}
            animate={active ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0.3 }}
            transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="block h-px w-7 bg-current" />
            <span className="block size-2 rotate-45 border border-current" />
            <span className="block h-px w-7 bg-current" />
          </motion.span>
          <span style={nameType} className="block">
            <TextReveal delay={1.05} durationScale={1}>
              {names.secondShort}
            </TextReveal>
          </span>
        </h2>

        <div className="mt-7 w-full max-w-[12rem]">
          <ChevronBand delay={1.35} />
        </div>

        {date && (
          <SceneReveal delay={1.55} className="mt-6">
            <p className="text-[0.6rem] tracking-[0.36em] text-[var(--t-ink-soft)] uppercase">
              {[formatWeekday(date), formatLongDate(date), time].filter(Boolean).join(" · ")}
            </p>
          </SceneReveal>
        )}

        {data.closingMessage && (
          <SceneReveal delay={1.8} className="mt-6">
            <p className="max-w-sm text-fluid-sm leading-[1.9] text-[var(--t-ink-soft)]">
              {data.closingMessage}
            </p>
          </SceneReveal>
        )}
      </SceneBody>
    </SceneSurface>
  );
}
