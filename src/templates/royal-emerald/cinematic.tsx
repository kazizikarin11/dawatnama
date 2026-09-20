"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
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
import { buildScenePlan, type SceneNode } from "@/lib/wedding/scene-plan";
import { effectiveDate, effectiveTime } from "@/lib/wedding/sections";
import { displayType, displayTypeForSet } from "@/lib/wedding/typography";
import type { RsvpAttendance, WeddingData } from "@/lib/wedding/types";
import { SmartImage } from "@/components/media/smart-image";
import { useMotionSettings } from "@/components/motion/motion-settings";
import { InvitationDock } from "@/components/invitation/dock";
import { RsvpForm } from "@/components/invitation/rsvp-form";
import { useStage } from "@/components/invitation/stage";
import { useCountdown } from "@/components/invitation/use-countdown";
import {
  Scene,
  SceneDeck,
  SceneProgress,
  ScrollCue,
  useOpenInvitation,
  useScene,
  useSceneNavigation,
} from "@/components/scene/scene-deck";
import {
  GoldSweep,
  ImageReveal,
  OrnamentReveal,
  ParallaxLayer,
  ParticleField,
  RollingNumber,
  SceneReveal,
  SplitTextReveal,
  TextReveal,
  TrackingReveal,
} from "@/components/scene/motion";
import { CoverCanvas } from "@/components/webgl/cover-canvas";
import { ArchOutline } from "@/components/ornament/arch";
import type { TemplateProps } from "@/templates/contract";
import { accentFor, tokensToStyle } from "@/templates/tokens";
import { GoldDivider, LatticePattern } from "./ornaments";
import { ROYAL_EMERALD, ROYAL_EMERALD_ALT } from "./theme";

/**
 * TEMPLATE 01 — ROYAL EMERALD, cinematic edition
 *
 * The invitation is staged as a sequence of full-screen scenes rather than a long
 * page. Each scene is one idea, arrives with its own choreography, and hands over
 * to the next through a snap. The scene list is built from the wedding data, so
 * three events produce three event screens and six produce six.
 *
 * Motion language for this template: gold linework that inks itself in, arches
 * that open, a single sweep of light per scene, and slow ornamental drift. The
 * palette breathes between deep emerald and warm ivory so the sequence has
 * rhythm instead of one flat colour throughout.
 */

/* ------------------------------------------------------------------ */
/* Surfaces — the palette evolves across the film                      */
/* ------------------------------------------------------------------ */

/** Warm ivory ground with emerald ink, used for the reading scenes. */
const IVORY_SURFACE: CSSProperties = {
  "--t-bg": "#f6f0e2",
  "--t-bg-alt": "#ece2cd",
  "--t-surface": "#fffdf7",
  "--t-ink": "#0a2a22",
  "--t-ink-soft": "#2b4c41",
  "--t-ink-muted": "#6d7f76",
  "--t-line": "rgba(10, 42, 34, 0.2)",
  "--t-overlay": "rgba(10, 42, 34, 0.25)",
} as CSSProperties;

/** Near-black emerald for the most dramatic beats. */
const DEEP_SURFACE: CSSProperties = {
  "--t-bg": "#051a15",
  "--t-bg-alt": "#08241d",
} as CSSProperties;

function SceneSurface({
  children,
  surface,
  className,
}: {
  children: ReactNode;
  surface?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      style={surface}
      className={cn(
        "relative flex h-full w-full flex-col bg-[var(--t-bg)] text-[var(--t-ink)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* RSVP choice, shared between the question scene and the form scene    */
/* ------------------------------------------------------------------ */

const RsvpChoiceContext = createContext<{
  choice: RsvpAttendance | null;
  choose: (value: RsvpAttendance) => void;
}>({ choice: null, choose: () => {} });

/* ------------------------------------------------------------------ */
/* Template                                                            */
/* ------------------------------------------------------------------ */

export default function RoyalEmeraldCinematic({ data, sections, mode }: TemplateProps) {
  const tokens =
    data.appearance.backgroundVariant === "alt" ? ROYAL_EMERALD_ALT : ROYAL_EMERALD;

  const plan = useMemo(() => buildScenePlan(data, sections), [data, sections]);
  const markers = useMemo(
    () => Object.fromEntries(plan.map((scene) => [scene.id, scene.marker])),
    [plan],
  );

  const [choice, setChoice] = useState<RsvpAttendance | null>(null);
  const choose = useCallback((value: RsvpAttendance) => setChoice(value), []);
  const rsvpValue = useMemo(() => ({ choice, choose }), [choice, choose]);

  return (
    <div
      style={tokensToStyle(tokens, accentFor(data, true))}
      className="surface-grain relative isolate w-full overflow-hidden font-[family-name:var(--font-sans)]"
    >
      <RsvpChoiceContext.Provider value={rsvpValue}>
        <SceneDeck mode={mode}>
          {plan.map((node) => (
            <Scene
              key={node.id}
              id={node.id}
              label={node.label}
              fill={node.kind !== "rsvp-form"}
            >
              <SceneRouter node={node} data={data} mode={mode} />
            </Scene>
          ))}

          <SceneProgress labels={markers} />
        </SceneDeck>
      </RsvpChoiceContext.Provider>

      <InvitationDock data={data} />
    </div>
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
      return node.event ? (
        <EventScene event={node.event} ordinal={node.ordinal ?? 0} />
      ) : null;
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

/* ================================================================== */
/* Shared furniture                                                    */
/* ================================================================== */

/** The small tracked label that titles most scenes. */
function SceneLabel({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      <SceneReveal delay={delay} direction="none">
        <span className="block h-px w-7 bg-[var(--t-accent)] opacity-60" />
      </SceneReveal>
      <TrackingReveal
        delay={delay + 0.08}
        className="text-[0.6rem] text-[var(--t-accent)] uppercase"
        from="0.55em"
        to="0.34em"
      >
        {children}
      </TrackingReveal>
      <SceneReveal delay={delay} direction="none">
        <span className="block h-px w-7 bg-[var(--t-accent)] opacity-60" />
      </SceneReveal>
    </div>
  );
}

/** Thin gold arc that inks itself across the top of a scene. */
function ArcOrnament({ delay = 0, className }: { delay?: number; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 40"
      preserveAspectRatio="none"
      className={cn("pointer-events-none text-[var(--t-accent)]", className)}
    >
      <OrnamentReveal
        d="M4 36 C 4 14 48 4 100 4 C 152 4 196 14 196 36"
        delay={delay}
        strokeWidth={0.8}
        opacity={0.75}
      />
    </svg>
  );
}

/** Centres scene content with safe-area aware padding. */
function SceneBody({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col items-center justify-center px-7 text-center",
        className,
      )}
      style={{
        paddingTop: "max(2.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(3.5rem, env(safe-area-inset-bottom))",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ================================================================== */
/* 01 — COVER                                                          */
/* ================================================================== */

function CoverScene({ data, mode }: { data: WeddingData; mode: TemplateProps["mode"] }) {
  const openDeck = useOpenInvitation();
  const stage = useStage();
  const settings = useMotionSettings();
  const names = coupleNames(data);
  const parts = formatDateParts(effectiveDate(data));

  const open = useCallback(() => {
    // Music must start inside the tap, and the dock reveals with the stage.
    stage.open();
    openDeck();
  }, [stage, openDeck]);

  // Both names share one size so the pair reads as a single composition.
  const nameType = displayTypeForSet([names.firstShort, names.secondShort], "poster");

  return (
    <SceneSurface surface={DEEP_SURFACE}>
      {/* Layer 1 — the room */}
      {data.heroImage && (
        <div aria-hidden className="absolute inset-0">
          <SmartImage
            image={data.heroImage}
            priority
            sizes="100vw"
            className="scale-110 opacity-[0.22]"
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,transparent_4%,var(--t-bg)_72%)]" />
        </div>
      )}

      {/* Layer 2 — geometry and light */}
      <LatticePattern opacity={0.13} scale={74} />
      <CoverCanvas template="royal-emerald" />
      <ParticleField count={10} size={2.5} />

      {/* Layer 3 — the invitation itself */}
      <SceneBody>
        {/* The arch inks itself around the whole composition. */}
        <div className="pointer-events-none absolute inset-x-5 inset-y-10 text-[var(--t-accent)] opacity-70">
          <ArchOutline shape="pointed" delay={2.9} double />
        </div>

        {data.islamic.bismillahArabic && (
          <motion.p
            lang="ar"
            dir="rtl"
            className="text-fluid-lg text-[var(--t-accent-soft)]"
            initial={{ opacity: 0, scale: settings.enabled ? 0.94 : 1, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 2.1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {data.islamic.bismillahArabic}
          </motion.p>
        )}

        <motion.div
          className="mt-7 w-full max-w-[13rem]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          <GoldDivider delay={1.6} width="100%" />
        </motion.div>

        <motion.p
          className="mt-8 text-[0.62rem] tracking-[0.42em] text-[var(--t-accent)] uppercase"
          initial={{ opacity: 0, y: settings.enabled ? 10 : 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.9 }}
        >
          {data.familyInvitationWording
            ? "Together with their families"
            : "The wedding of"}
        </motion.p>

        {/* The names: characters rise, blurred to sharp, one after the other.
            Size steps down automatically as the name gets longer. */}
        <h1 className="mt-6 font-[family-name:var(--font-display)] font-light text-[var(--t-ink)]">
          <span className="block" style={nameType}>
            <SplitTextReveal text={names.firstShort || "Bride"} delay={2.2} />
          </span>
          <span className="sr-only"> and </span>
          <motion.span
            aria-hidden
            className="my-1 block font-[family-name:var(--font-display)] text-[var(--t-accent)]"
            style={{ fontSize: "clamp(1.5rem, 7vw, 2.5rem)", lineHeight: 1 }}
            initial={{ opacity: 0, scale: settings.enabled ? 0.6 : 1, rotate: -12 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.1, delay: 3.05, ease: [0.22, 1, 0.36, 1] }}
          >
            &amp;
          </motion.span>
          <span className="block" style={nameType}>
            <SplitTextReveal text={names.secondShort || "Groom"} delay={3.35} />
          </span>
        </h1>

        {parts && (
          <motion.div
            className="mt-9 flex items-center gap-3.5 text-[var(--t-ink-soft)]"
            initial={{ opacity: 0, y: settings.enabled ? 14 : 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.3, delay: 4.2 }}
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
            transition={{ duration: 1, delay: 4.5 }}
          >
            {data.hijriDate}
          </motion.p>
        )}

        <motion.div
          className="mt-11"
          initial={{ opacity: 0, y: settings.enabled ? 16 : 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 4.9 }}
        >
          <button
            type="button"
            data-cover-action
            onClick={open}
            disabled={mode === "thumbnail"}
            className="tap-target group relative overflow-hidden px-9 py-4"
          >
            <span className="relative z-10 text-[0.62rem] tracking-[0.4em] text-[var(--t-accent)] uppercase">
              Open invitation
            </span>
            <span aria-hidden className="absolute inset-0 border border-[var(--t-accent)]" />
            {/* A slow breath rather than a blinking animation. */}
            <span
              aria-hidden
              className="absolute inset-0 border border-[var(--t-accent)]"
              style={
                settings.enabled
                  ? { animation: "dawat-breathe 3.6s ease-in-out infinite" }
                  : undefined
              }
            />
            <span
              aria-hidden
              className="absolute inset-0 origin-bottom scale-y-0 bg-[var(--t-accent)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100"
            />
          </button>
        </motion.div>
      </SceneBody>
    </SceneSurface>
  );
}

/* ================================================================== */
/* 02 — THE INVITATION                                                 */
/* ================================================================== */

function InvitationScene({ data }: { data: WeddingData }) {
  const { islamic } = data;

  return (
    <SceneSurface surface={IVORY_SURFACE}>
      <LatticePattern opacity={0.05} scale={58} />
      <GoldSweep delay={0.5} />

      <SceneBody>
        <ArcOrnament delay={0.2} className="absolute inset-x-10 top-12 h-10" />

        {islamic.bismillahArabic && (
          <SceneReveal delay={0.25} durationScale={1.6}>
            <p lang="ar" dir="rtl" className="text-fluid-xl leading-[1.9] text-[var(--t-ink)]">
              {islamic.bismillahArabic}
            </p>
          </SceneReveal>
        )}

        {islamic.bismillahTranslation && (
          <SceneReveal delay={0.5} className="mt-5">
            <p className="max-w-xs text-fluid-xs leading-relaxed text-[var(--t-ink-muted)]">
              {islamic.bismillahTranslation}
            </p>
          </SceneReveal>
        )}

        <div className="my-9 w-full max-w-[9rem]">
          <GoldDivider delay={0.7} width="100%" />
        </div>

        {data.familyInvitationWording && (
          <h2 className="font-[family-name:var(--font-display)] font-light text-[var(--t-ink)]">
            <TextReveal delay={0.8} className="text-fluid-lg leading-snug">
              {data.familyInvitationWording}
            </TextReveal>
          </h2>
        )}

        {data.invitationMessage && (
          <SceneReveal delay={1.1} className="mt-7">
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

/* ================================================================== */
/* 03 — THE COUPLE                                                     */
/* ================================================================== */

/** One person, one screen: full-bleed portrait with the name over it. */
function PartyScene({ data, party }: { data: WeddingData; party: "bride" | "groom" }) {
  const person = data.couple[party];
  const nameType = displayType(person.name, "hero", "1.05");

  return (
    <SceneSurface surface={DEEP_SURFACE}>
      <ImageReveal
        image={person.photo}
        className="absolute inset-0"
        sizes="100vw"
        from="bottom"
        overlay={
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-[color-mix(in_oklab,var(--t-bg)_40%,transparent)] to-[color-mix(in_oklab,var(--t-bg)_25%,transparent)]" />
        }
      />

      <ParticleField count={8} size={2} />

      <div
        className="relative mt-auto px-7 text-center"
        style={{ paddingBottom: "max(4.5rem, env(safe-area-inset-bottom))" }}
      >
        <ParallaxLayer depth={26}>
          <SceneLabel delay={0.5}>{party === "bride" ? "The bride" : "The groom"}</SceneLabel>

          <h2
            className="mt-6 font-[family-name:var(--font-display)] font-light text-[var(--t-ink)]"
            style={nameType}
          >
            <TextReveal delay={0.7}>{person.name}</TextReveal>
          </h2>

          {person.parents && (
            <SceneReveal delay={1} className="mt-4">
              <p className="text-[0.62rem] tracking-[0.28em] text-[var(--t-accent)] uppercase">
                {person.parents}
              </p>
            </SceneReveal>
          )}

          {person.description && (
            <SceneReveal delay={1.2} className="mt-5">
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

/** Fallback when only one or neither portrait exists. */
function CoupleScene({ data }: { data: WeddingData }) {
  const { bride, groom, order } = data.couple;
  const parties = order === "groom-first" ? [groom, bride] : [bride, groom];
  const photo = bride.photo ?? groom.photo;
  const nameType = displayTypeForSet([bride.name, groom.name], "hero", "1.05");

  return (
    <SceneSurface surface={DEEP_SURFACE}>
      {photo && (
        <ImageReveal
          image={photo}
          className="absolute inset-0"
          sizes="100vw"
          overlay={<div className="absolute inset-0 bg-[var(--t-bg)]/70" />}
        />
      )}
      <LatticePattern opacity={0.08} scale={70} />

      <SceneBody>
        <SceneLabel delay={0.3}>The couple</SceneLabel>

        <div className="mt-9 space-y-6">
          {parties.map((person, index) => (
            <h2
              key={index}
              className="font-[family-name:var(--font-display)] font-light text-[var(--t-ink)]"
              style={nameType}
            >
              <TextReveal delay={0.6 + index * 0.25}>{person.name}</TextReveal>
            </h2>
          ))}
        </div>

        {data.couple.shortDescription && (
          <SceneReveal delay={1.2} className="mt-9">
            <p className="max-w-sm text-fluid-sm leading-[1.95] text-[var(--t-ink-soft)]">
              {data.couple.shortDescription}
            </p>
          </SceneReveal>
        )}
      </SceneBody>
    </SceneSurface>
  );
}

/* ================================================================== */
/* 04 — COUNTDOWN                                                      */
/* ================================================================== */

function CountdownScene({ data }: { data: WeddingData }) {
  const date = effectiveDate(data);
  const countdown = useCountdown(toTimestamp(date, effectiveTime(data)));

  const cells = [
    // Days only pads to three when the wedding really is that far away.
    {
      value: countdown?.days ?? null,
      label: "Days",
      digits: (countdown?.days ?? 0) >= 100 ? 3 : 2,
    },
    { value: countdown?.hours ?? null, label: "Hours", digits: 2 },
    { value: countdown?.minutes ?? null, label: "Minutes", digits: 2 },
    { value: countdown?.seconds ?? null, label: "Seconds", digits: 2 },
  ];

  return (
    <SceneSurface surface={DEEP_SURFACE}>
      <LatticePattern opacity={0.1} scale={64} />
      <ParticleField count={12} size={2.5} />
      <GoldSweep delay={0.6} duration={2.2} />

      <SceneBody>
        <SceneLabel delay={0.2}>
          {countdown?.isPast ? "Alhamdulillah" : "Counting down"}
        </SceneLabel>

        {countdown?.isPast ? (
          <>
            <h2
              className="mt-10 font-[family-name:var(--font-display)] font-light text-[var(--t-accent-soft)]"
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
          /* A stacked column, not a dashboard row: each unit gets its own line. */
          <div className="mt-10 w-full max-w-[16rem] space-y-5">
            {cells.map((cell, index) => (
              <SceneReveal
                key={cell.label}
                delay={0.4 + index * 0.14}
                direction="up"
                className="flex items-baseline justify-between gap-4 border-b border-[var(--t-line)] pb-3"
              >
                <RollingNumber
                  value={cell.value}
                  digits={cell.digits}
                  className="font-[family-name:var(--font-display)] font-light text-[var(--t-accent-soft)]"
                  digitClassName="text-[clamp(2.5rem,15vw,4rem)] leading-[1]"
                />
                <span className="text-[0.58rem] tracking-[0.34em] text-[var(--t-ink-muted)] uppercase">
                  {cell.label}
                </span>
              </SceneReveal>
            ))}
          </div>
        )}

        {date && (
          <SceneReveal delay={1.1} className="mt-10">
            <p className="text-[0.62rem] tracking-[0.32em] text-[var(--t-ink-soft)] uppercase">
              {formatWeekday(date)} · {formatLongDate(date)}
            </p>
          </SceneReveal>
        )}
      </SceneBody>
    </SceneSurface>
  );
}

/* ================================================================== */
/* 05 — CELEBRATION TITLE CARD                                         */
/* ================================================================== */

function EventsIntroScene({ data }: { data: WeddingData }) {
  const count = data.events.filter((event) => event.enabled).length;

  return (
    <SceneSurface surface={IVORY_SURFACE}>
      <LatticePattern opacity={0.06} scale={80} />
      <GoldSweep delay={0.4} duration={2.4} />

      <SceneBody>
        <SceneLabel delay={0.2}>The days ahead</SceneLabel>

        <h2
          className="mt-8 font-[family-name:var(--font-display)] font-light text-[var(--t-ink)]"
          style={displayType("The Celebration", "hero", "1.02")}
        >
          <TextReveal delay={0.5}>The</TextReveal>
          <TextReveal delay={0.68}>Celebration</TextReveal>
        </h2>

        <div className="mt-9 w-full max-w-[9rem]">
          <GoldDivider delay={0.95} width="100%" />
        </div>

        <SceneReveal delay={1.1} className="mt-8">
          <p className="text-[0.62rem] tracking-[0.32em] text-[var(--t-accent)] uppercase">
            {count} {count === 1 ? "gathering" : "gatherings"}
          </p>
        </SceneReveal>
      </SceneBody>
    </SceneSurface>
  );
}

/* ================================================================== */
/* 06+ — ONE SCENE PER EVENT                                           */
/* ================================================================== */

function EventScene({
  event,
  ordinal,
}: {
  event: import("@/lib/wedding/types").WeddingEvent;
  ordinal: number;
}) {
  const parts = formatDateParts(event.date);
  const directions = directionsUrl(event.venue);
  const time = formatTimeRange(event.startTime, event.endTime);
  const titleType = displayType(event.name, "hero", "1.02");

  // Alternate which side the frame opens from so consecutive events differ.
  const from = ordinal % 2 === 0 ? "bottom" : "right";

  return (
    <SceneSurface surface={DEEP_SURFACE}>
      {event.image ? (
        <ImageReveal
          image={event.image}
          className="absolute inset-0"
          sizes="100vw"
          from={from}
          overlay={
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-[color-mix(in_oklab,var(--t-bg)_55%,transparent)] to-[color-mix(in_oklab,var(--t-bg)_35%,transparent)]" />
          }
        />
      ) : (
        <>
          <LatticePattern opacity={0.12} scale={68} />
          <ParticleField count={8} />
        </>
      )}

      <div
        className="relative flex h-full flex-col justify-end px-7 text-center"
        style={{ paddingBottom: "max(6.5rem, calc(env(safe-area-inset-bottom) + 5rem))" }}
      >
        <ParallaxLayer depth={22}>
          {parts && (
            <SceneReveal delay={0.45} className="flex items-center justify-center gap-3">
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
            className="mt-5 font-[family-name:var(--font-display)] font-light text-[var(--t-ink)]"
            style={titleType}
          >
            <TextReveal delay={0.62}>{event.name}</TextReveal>
          </h2>

          {event.subtitle && (
            <SceneReveal delay={0.85} className="mt-2.5">
              <p className="text-fluid-xs text-[var(--t-accent-soft)] italic">
                {event.subtitle}
              </p>
            </SceneReveal>
          )}

          <div className="mx-auto mt-6 w-full max-w-[8rem]">
            <GoldDivider delay={1} width="100%" />
          </div>

          {time && (
            <SceneReveal delay={1.15} className="mt-6">
              <p className="font-[family-name:var(--font-display)] text-fluid-lg text-[var(--t-ink)]">
                {time}
              </p>
            </SceneReveal>
          )}

          {event.venue && (
            <SceneReveal delay={1.3} className="mt-4">
              <p className="text-fluid-sm text-[var(--t-ink)]">{event.venue.name}</p>
              {event.venue.address && (
                <p className="mx-auto mt-1 max-w-[17rem] text-fluid-xs leading-relaxed text-[var(--t-ink-muted)]">
                  {event.venue.address}
                </p>
              )}
            </SceneReveal>
          )}

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {event.dressCode && (
              <SceneReveal delay={1.45} direction="none">
                <span className="border border-[var(--t-line)] px-3.5 py-2 text-[0.55rem] tracking-[0.26em] text-[var(--t-ink-soft)] uppercase">
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
                  className="tap-target inline-grid place-items-center border border-[var(--t-accent)] px-5 text-[0.55rem] tracking-[0.26em] text-[var(--t-accent)] uppercase transition-colors duration-300 hover:bg-[color-mix(in_oklab,var(--t-accent)_16%,transparent)]"
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

/* ================================================================== */
/* VENUE                                                               */
/* ================================================================== */

function VenueScene({ venue }: { venue: import("@/lib/wedding/types").Venue }) {
  const directions = directionsUrl(venue);

  return (
    <SceneSurface surface={DEEP_SURFACE}>
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
        <LatticePattern opacity={0.12} scale={64} />
      )}

      <SceneBody
        className="justify-end"
        style={{ paddingBottom: "max(6.5rem, calc(env(safe-area-inset-bottom) + 5rem))" }}
      >
        <ParallaxLayer depth={18}>
          <SceneLabel delay={0.4}>Where to find us</SceneLabel>

          <h2
            className="mt-6 font-[family-name:var(--font-display)] font-light text-[var(--t-ink)]"
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
            <SceneReveal delay={1.2} className="mt-8">
              <a
                href={directions}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target inline-flex items-center gap-2.5 border border-[var(--t-accent)] px-7 py-3.5 text-[0.58rem] tracking-[0.3em] text-[var(--t-accent)] uppercase transition-colors duration-300 hover:bg-[color-mix(in_oklab,var(--t-accent)_16%,transparent)]"
              >
                {/* A location mark that settles into place. */}
                <motion.svg
                  viewBox="0 0 24 24"
                  className="size-3.5"
                  fill="none"
                  aria-hidden
                  initial={{ y: -6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.9, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <path
                    d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
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

/* ================================================================== */
/* STORY                                                               */
/* ================================================================== */

function StoryScene({
  milestone,
}: {
  milestone: import("@/lib/wedding/types").StoryMilestone;
}) {
  return (
    <SceneSurface surface={IVORY_SURFACE}>
      <SceneBody className="justify-start">
        {milestone.date && (
          <h3
            className="mt-6 font-[family-name:var(--font-display)] font-light text-[var(--t-accent)]"
            style={displayType(milestone.date, "hero", "1")}
          >
            <TextReveal delay={0.25}>{milestone.date}</TextReveal>
          </h3>
        )}

        <h2
          className="mt-3 font-[family-name:var(--font-display)] font-light text-[var(--t-ink)]"
          style={displayType(milestone.title, "title", "1.15")}
        >
          <TextReveal delay={0.5}>{milestone.title}</TextReveal>
        </h2>

        {milestone.image && (
          <ImageReveal
            image={milestone.image}
            className="mt-8 aspect-[4/5] w-[78%]"
            sizes="78vw"
            delay={0.7}
            from="bottom"
          />
        )}

        {milestone.description && (
          <SceneReveal delay={1.1} className="mt-7">
            <p className="max-w-xs text-fluid-sm leading-[1.9] text-[var(--t-ink-soft)]">
              {milestone.description}
            </p>
          </SceneReveal>
        )}
      </SceneBody>
    </SceneSurface>
  );
}

/* ================================================================== */
/* GALLERY — full-screen swipeable frames                              */
/* ================================================================== */

function GalleryScene({ data }: { data: WeddingData }) {
  const { active } = useScene();

  return (
    <SceneSurface surface={DEEP_SURFACE}>
      <div className="absolute inset-x-0 top-0 z-20 pt-12">
        <SceneLabel delay={0.2}>Moments</SceneLabel>
      </div>

      {/* A horizontal rail inside the vertical deck: swipe sideways through the
          photographs, keep scrolling down to leave. */}
      <div
        className="snap-rail h-full w-full"
        style={{ touchAction: "pan-x pan-y" }}
        aria-label="Photographs, swipe sideways"
      >
        {data.gallery.map((image, index) => (
          <figure
            key={image.id}
            className="relative h-full w-[86vw] shrink-0 snap-center sm:w-[70vw]"
          >
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.06 }}
              animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.06 }}
              transition={{ duration: 1.2, delay: 0.25 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <SmartImage image={image} sizes="86vw" className="opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-transparent to-[color-mix(in_oklab,var(--t-bg)_45%,transparent)]" />
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

/* ================================================================== */
/* RSVP — the question, then the form                                  */
/* ================================================================== */

function RsvpIntroScene({ data }: { data: WeddingData }) {
  const { choose } = useContext(RsvpChoiceContext);
  const { next } = useSceneNavigation();
  const settings = useMotionSettings();
  const [picked, setPicked] = useState<RsvpAttendance | null>(null);

  const pick = (value: RsvpAttendance) => {
    setPicked(value);
    choose(value);
    // Let the choice animate before moving to the form.
    window.setTimeout(() => next(), settings.enabled ? 900 : 60);
  };

  return (
    <SceneSurface surface={DEEP_SURFACE}>
      <LatticePattern opacity={0.1} scale={60} />
      <ParticleField count={10} />
      <GoldSweep delay={0.5} />

      <SceneBody>
        <SceneLabel delay={0.2}>RSVP</SceneLabel>

        <h2
          className="mt-8 font-[family-name:var(--font-display)] font-light text-[var(--t-ink)]"
          style={displayType(data.rsvp.headline ?? "Will you join us?", "hero", "1.08")}
        >
          <TextReveal delay={0.45}>{data.rsvp.headline ?? "Will you join us?"}</TextReveal>
        </h2>

        {data.rsvp.message && (
          <SceneReveal delay={0.8} className="mt-6">
            <p className="max-w-xs text-fluid-sm leading-relaxed text-[var(--t-ink-soft)]">
              {data.rsvp.message}
            </p>
          </SceneReveal>
        )}

        <div className="mt-11 flex w-full max-w-[17rem] flex-col gap-3">
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
                  "tap-target relative w-full overflow-hidden px-6 py-4",
                  "border text-[0.6rem] tracking-[0.3em] uppercase transition-colors duration-500",
                  picked === value
                    ? "border-[var(--t-accent)] text-[var(--t-bg)]"
                    : "border-[var(--t-line)] text-[var(--t-ink-soft)] hover:border-[var(--t-accent)]",
                )}
              >
                <span className="relative z-10">{label}</span>
                {/* The chosen answer fills with gold before the form arrives. */}
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
              className="mt-7 text-[0.58rem] tracking-[0.3em] text-[var(--t-accent)] uppercase"
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

function RsvpFormScene({
  data,
  mode,
}: {
  data: WeddingData;
  mode: TemplateProps["mode"];
}) {
  const { choice } = useContext(RsvpChoiceContext);

  return (
    <SceneSurface surface={IVORY_SURFACE} className="min-h-[100svh]">
      <LatticePattern opacity={0.04} scale={54} />

      <div
        className="relative w-full px-7"
        style={{
          paddingTop: "max(4rem, env(safe-area-inset-top))",
          paddingBottom: "max(5rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto w-full max-w-sm">
          <SceneLabel delay={0.15}>Your response</SceneLabel>

          <SceneReveal delay={0.4} className="mt-8">
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

/* ================================================================== */
/* FAMILY                                                              */
/* ================================================================== */

function FamilyScene({ data }: { data: WeddingData }) {
  const families = [data.familyNames.bride, data.familyNames.groom].filter(
    (name): name is string => Boolean(name),
  );

  return (
    <SceneSurface surface={IVORY_SURFACE}>
      <LatticePattern opacity={0.05} scale={72} />

      <SceneBody>
        <ArcOrnament delay={0.2} className="absolute inset-x-12 top-14 h-9" />

        <SceneLabel delay={0.3}>With love</SceneLabel>

        <div className="mt-9 space-y-5">
          {families.map((name, index) => (
            <h2
              key={name}
              className="font-[family-name:var(--font-display)] font-light text-[var(--t-ink)]"
              style={displayType(name, "title", "1.2")}
            >
              <TextReveal delay={0.55 + index * 0.2}>{name}</TextReveal>
            </h2>
          ))}
        </div>

        {data.gratitudeMessage && (
          <SceneReveal delay={1.1} className="mt-9">
            <p className="max-w-sm text-fluid-sm leading-[1.95] text-[var(--t-ink-soft)]">
              {data.gratitudeMessage}
            </p>
          </SceneReveal>
        )}

        {data.contacts.length > 0 && (
          <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-4">
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

/* ================================================================== */
/* VERSE                                                               */
/* ================================================================== */

function VerseScene({ data }: { data: WeddingData }) {
  const { islamic } = data;

  return (
    <SceneSurface surface={DEEP_SURFACE}>
      <LatticePattern opacity={0.09} scale={56} />
      <ParticleField count={9} />

      <SceneBody>
        {islamic.verseArabic && (
          <SceneReveal delay={0.3} durationScale={1.8}>
            <p lang="ar" dir="rtl" className="text-fluid-xl leading-[2.1] text-[var(--t-accent-soft)]">
              {islamic.verseArabic}
            </p>
          </SceneReveal>
        )}

        {islamic.verseTranslation && (
          <SceneReveal delay={0.7} className="mt-8">
            <p className="max-w-sm font-[family-name:var(--font-display)] text-fluid-base leading-relaxed text-[var(--t-ink-soft)] italic">
              &ldquo;{islamic.verseTranslation}&rdquo;
            </p>
          </SceneReveal>
        )}

        {islamic.verseReference && (
          <SceneReveal delay={0.95} className="mt-6">
            <p className="text-[0.58rem] tracking-[0.32em] text-[var(--t-accent)] uppercase">
              {islamic.verseReference}
            </p>
          </SceneReveal>
        )}

        {islamic.duaText && (
          <>
            <div className="mt-10 w-full max-w-[8rem]">
              <GoldDivider delay={1.1} width="100%" />
            </div>
            <SceneReveal delay={1.3} className="mt-7">
              <p className="text-fluid-xs text-[var(--t-ink-muted)] italic">{islamic.duaText}</p>
            </SceneReveal>
          </>
        )}
      </SceneBody>
    </SceneSurface>
  );
}

/* ================================================================== */
/* CLOSING — the end of the film                                       */
/* ================================================================== */

function ClosingScene({ data }: { data: WeddingData }) {
  const names = coupleNames(data);
  const date = effectiveDate(data);
  const time = formatTime(effectiveTime(data));
  const settings = useMotionSettings();
  const { active } = useScene();
  const closingNameType = displayTypeForSet(
    [names.firstShort, names.secondShort],
    "poster",
  );

  return (
    <SceneSurface surface={DEEP_SURFACE}>
      <LatticePattern opacity={0.12} scale={70} />
      <ParticleField count={14} size={2.5} />

      {/* The screen darkens toward the very end. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: active && settings.enabled ? 0.28 : 0 }}
        transition={{ duration: 3.5, ease: "easeInOut" }}
      />

      <SceneBody>
        <div className="pointer-events-none absolute inset-x-6 inset-y-12 text-[var(--t-accent)] opacity-60">
          <ArchOutline shape="pointed" delay={1.8} double={false} />
        </div>

        <SceneLabel delay={0.25}>Barakallahu lakuma</SceneLabel>

        <h2 className="mt-10 font-[family-name:var(--font-display)] font-light text-[var(--t-ink)]">
          <span style={closingNameType} className="block">
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
          <span style={closingNameType} className="block">
            <TextReveal delay={1.15}>{names.secondShort}</TextReveal>
          </span>
        </h2>

        <div className="mt-10 w-full max-w-[10rem]">
          <GoldDivider delay={1.5} width="100%" />
        </div>

        {date && (
          <SceneReveal delay={1.7} className="mt-8">
            <p className="text-[0.62rem] tracking-[0.34em] text-[var(--t-ink-soft)] uppercase">
              {[formatWeekday(date), formatLongDate(date), time].filter(Boolean).join(" · ")}
            </p>
          </SceneReveal>
        )}

        {data.closingMessage && (
          <SceneReveal delay={2} className="mt-8">
            <p className="max-w-sm text-fluid-sm leading-[1.95] text-[var(--t-ink-soft)]">
              {data.closingMessage}
            </p>
          </SceneReveal>
        )}
      </SceneBody>
    </SceneSurface>
  );
}
