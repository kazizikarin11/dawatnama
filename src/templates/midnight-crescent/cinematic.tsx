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
  ParallaxLayer,
  RollingNumber,
  SceneReveal,
  SplitTextReveal,
  TextReveal,
  TrackingReveal,
} from "@/components/scene/motion";
import { CoverCanvas } from "@/components/webgl/cover-canvas";
import type { TemplateProps } from "@/templates/contract";
import { accentFor, tokensToStyle } from "@/templates/tokens";
import { Crescent, GoldMotes, LightBloom, Starfield } from "./decor";
import { MIDNIGHT } from "./theme";

/**
 * TEMPLATE 03 — MIDNIGHT CRESCENT, cinematic edition
 *
 * A luxury night wedding film. The whole sequence takes place after dark, so the
 * motion language is atmospheric rather than ornamental: a crescent that rises
 * into frame, a starfield that breathes, gold motes drifting upward, and light
 * that blooms behind the type instead of lines that draw themselves.
 *
 * The palette moves between near-black night and a lifted "dawn" navy, so the
 * film has a dark-to-light rhythm across the deck rather than one flat darkness.
 * Photography is treated with a heavy vignette and a slow cinematic push-in.
 */

/* ------------------------------------------------------------------ */
/* Surfaces — night, deep night, and the lift toward dawn              */
/* ------------------------------------------------------------------ */

/** The default night ground. */
const NIGHT_SURFACE: CSSProperties = {} as CSSProperties;

/** The deepest black, for the most dramatic beats. */
const DEEP_NIGHT_SURFACE: CSSProperties = {
  "--t-bg": "#03060e",
  "--t-bg-alt": "#070b17",
} as CSSProperties;

/** A lifted navy that reads as the hour before dawn. */
const DAWN_SURFACE: CSSProperties = {
  "--t-bg": "#101a32",
  "--t-bg-alt": "#16223c",
  "--t-ink": "#f6efdd",
  "--t-ink-soft": "#d6cebd",
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

export default function MidnightCrescentCinematic({
  data,
  sections,
  mode,
}: TemplateProps) {
  // Midnight ships a single palette; the alt variant only lifts the ground.
  const tokens = useMemo(
    () =>
      data.appearance.backgroundVariant === "alt"
        ? { ...MIDNIGHT, bg: "#0b1224", bgAlt: "#101a32" }
        : MIDNIGHT,
    [data.appearance.backgroundVariant],
  );

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

/** Wide-tracked cinematic label, flanked by a pair of faint rules. */
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
    <div
      className={cn(
        "flex items-center justify-center gap-3.5 text-[var(--t-accent)]",
        className,
      )}
    >
      <SceneReveal delay={delay} direction="none">
        <span className="block h-px w-8 bg-gradient-to-r from-transparent to-current opacity-70" />
      </SceneReveal>
      <TrackingReveal
        delay={delay + 0.08}
        className="text-[0.6rem] uppercase"
        from="0.6em"
        to="0.42em"
      >
        {children}
      </TrackingReveal>
      <SceneReveal delay={delay} direction="none">
        <span className="block h-px w-8 bg-gradient-to-l from-transparent to-current opacity-70" />
      </SceneReveal>
    </div>
  );
}

/** A hairline that glows outward from the centre. */
function GlowRule({ delay = 0, width = "9rem" }: { delay?: number; width?: string }) {
  const settings = useMotionSettings();
  const { active } = useScene();

  return (
    <div className="flex justify-center" style={{ width: "100%" }}>
      <motion.span
        aria-hidden
        className="block h-px bg-[var(--t-accent)]"
        style={{
          width,
          boxShadow: "0 0 12px 1px color-mix(in oklab, var(--t-accent) 45%, transparent)",
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={active ? { scaleX: 1, opacity: 0.85 } : { scaleX: 0, opacity: 0 }}
        transition={{
          duration: settings.enabled ? 1.5 : 0,
          delay,
          ease: [0.22, 1, 0.36, 1],
        }}
      />
    </div>
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

/** Bottom clearance so a centred CTA never sits under the floating dock. */
const DOCK_CLEAR = "max(6.5rem, calc(env(safe-area-inset-bottom) + 5rem))";

/** The heavy cinematic vignette used over every photograph. */
function Vignette({ strength = 0.62 }: { strength?: number }) {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-[color-mix(in_oklab,var(--t-bg)_50%,transparent)] to-[color-mix(in_oklab,var(--t-bg)_30%,transparent)]" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(75% 60% at 50% 45%, transparent 30%, var(--t-bg) 100%)",
          opacity: strength,
        }}
      />
    </>
  );
}

/* ================================================================== */
/* 01 — COVER: the crescent rises                                      */
/* ================================================================== */

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
    <SceneSurface surface={DEEP_NIGHT_SURFACE}>
      {/* Layer 1 — the night sky */}
      {data.heroImage && (
        <div aria-hidden className="absolute inset-0">
          <SmartImage
            image={data.heroImage}
            priority
            sizes="100vw"
            className="scale-110 opacity-[0.18]"
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_2%,var(--t-bg)_72%)]" />
        </div>
      )}

      <Starfield count={40} />
      <CoverCanvas template="midnight-crescent" />
      <GoldMotes count={14} />

      {/* Layer 2 — the crescent emerges above the type and light blooms behind it.
          It is pinned near the top and the reading column starts below it; at
          `top-[14%]` with a 132px moon the Bismillah collided with the crescent. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[7%] flex justify-center"
        initial={{ opacity: 0, y: settings.enabled ? 34 : 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 2.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Crescent size={118} delay={0.6} />
      </motion.div>

      <LightBloom intensity={0.42} />

      <SceneBody style={{ paddingTop: "max(11rem, calc(env(safe-area-inset-top) + 10rem))" }}>
        {data.islamic.bismillahArabic && (
          <motion.p
            lang="ar"
            dir="rtl"
            className="text-fluid-base text-[var(--t-accent-soft)]"
            initial={{ opacity: 0, filter: "blur(8px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 2.2, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {data.islamic.bismillahArabic}
          </motion.p>
        )}

        <motion.p
          className="mt-8 text-[0.62rem] tracking-[0.45em] text-[var(--t-accent)] uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, delay: 2.2 }}
        >
          {data.familyInvitationWording ? "Together with their families" : "The wedding of"}
        </motion.p>

        {/* Names emerge out of the dark: blurred, dim, then sharp and glowing. */}
        <h1 className="mt-6 font-[family-name:var(--font-display)] font-light text-[var(--t-ink)]">
          <span className="block" style={nameType}>
            <SplitTextReveal text={names.firstShort || "Bride"} delay={2.6} />
          </span>
          <span className="sr-only"> and </span>
          <motion.span
            aria-hidden
            className="my-1 block font-[family-name:var(--font-display)] text-[var(--t-accent)]"
            style={{
              fontSize: "clamp(1.5rem, 7vw, 2.5rem)",
              lineHeight: 1,
              textShadow: "0 0 18px color-mix(in oklab, var(--t-accent) 55%, transparent)",
            }}
            initial={{ opacity: 0, scale: settings.enabled ? 0.7 : 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, delay: 3.4, ease: [0.22, 1, 0.36, 1] }}
          >
            &amp;
          </motion.span>
          <span className="block" style={nameType}>
            <SplitTextReveal text={names.secondShort || "Groom"} delay={3.7} />
          </span>
        </h1>

        <div className="mt-9">
          <GlowRule delay={4.4} width="7rem" />
        </div>

        {parts && (
          <motion.div
            className="mt-7 flex items-center gap-3.5 text-[var(--t-ink-soft)]"
            initial={{ opacity: 0, y: settings.enabled ? 12 : 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.3, delay: 4.6 }}
          >
            <span className="text-[0.66rem] tracking-[0.32em] uppercase">{parts.weekday}</span>
            <span aria-hidden className="h-3 w-px bg-[var(--t-line)]" />
            <span className="text-[0.66rem] tracking-[0.32em] uppercase">
              {parts.day} {parts.monthName} {parts.year}
            </span>
          </motion.div>
        )}

        {data.hijriDate && (
          <motion.p
            className="mt-2 text-[0.58rem] tracking-[0.3em] text-[var(--t-ink-muted)] uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 4.9 }}
          >
            {data.hijriDate}
          </motion.p>
        )}

        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: settings.enabled ? 14 : 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 5.2 }}
        >
          <button
            type="button"
            data-cover-action
            onClick={open}
            disabled={mode === "thumbnail"}
            className="tap-target group relative overflow-hidden px-9 py-4"
          >
            <span className="relative z-10 text-[0.62rem] tracking-[0.42em] text-[var(--t-accent)] uppercase">
              Open invitation
            </span>
            <span
              aria-hidden
              className="absolute inset-0 border border-[var(--t-accent)]"
              style={{
                boxShadow:
                  "0 0 22px -4px color-mix(in oklab, var(--t-accent) 60%, transparent)",
              }}
            />
            {/* A slow glow pulse rather than a blink. */}
            <span
              aria-hidden
              className="absolute inset-0 border border-[var(--t-accent-soft)]"
              style={
                settings.enabled
                  ? { animation: "dawat-breathe 4s ease-in-out infinite" }
                  : undefined
              }
            />
            <span
              aria-hidden
              className="absolute inset-0 origin-bottom scale-y-0 bg-[color-mix(in_oklab,var(--t-accent)_22%,transparent)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100"
            />
          </button>
        </motion.div>
      </SceneBody>
    </SceneSurface>
  );
}

/* ================================================================== */
/* 02 — THE INVITATION: the lift toward dawn                           */
/* ================================================================== */

function InvitationScene({ data }: { data: WeddingData }) {
  const { islamic } = data;

  return (
    <SceneSurface surface={DAWN_SURFACE}>
      <Starfield count={22} />
      <LightBloom intensity={0.3} />
      <GoldSweep delay={0.5} duration={2.4} />

      <SceneBody>
        {islamic.bismillahArabic && (
          <SceneReveal delay={0.25} durationScale={1.7}>
            <p
              lang="ar"
              dir="rtl"
              className="text-fluid-xl leading-[1.9] text-[var(--t-accent-soft)]"
            >
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

        <div className="my-9">
          <GlowRule delay={0.7} />
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

function PartyScene({ data, party }: { data: WeddingData; party: "bride" | "groom" }) {
  const person = data.couple[party];
  const nameType = displayType(person.name, "hero", "1.05");

  return (
    <SceneSurface surface={DEEP_NIGHT_SURFACE}>
      {/* A slow cinematic push-in rather than a slide. */}
      <ImageReveal
        image={person.photo}
        className="absolute inset-0"
        sizes="100vw"
        from="bottom"
        drift
        overlay={<Vignette strength={0.7} />}
      />

      <Starfield count={18} />
      <GoldMotes count={10} />

      <div className="relative mt-auto px-7 text-center" style={{ paddingBottom: DOCK_CLEAR }}>
        <ParallaxLayer depth={28}>
          <SceneLabel delay={0.5}>{party === "bride" ? "The bride" : "The groom"}</SceneLabel>

          <h2
            className="mt-6 font-[family-name:var(--font-display)] font-light text-[var(--t-ink)]"
            style={{
              ...nameType,
              textShadow: "0 0 30px color-mix(in oklab, var(--t-bg) 70%, transparent)",
            }}
          >
            <TextReveal delay={0.7}>{person.name}</TextReveal>
          </h2>

          {person.parents && (
            <SceneReveal delay={1} className="mt-4">
              <p className="text-[0.62rem] tracking-[0.3em] text-[var(--t-accent)] uppercase">
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
    <SceneSurface surface={DEEP_NIGHT_SURFACE}>
      {photo && (
        <ImageReveal
          image={photo}
          className="absolute inset-0"
          sizes="100vw"
          drift
          overlay={<Vignette strength={0.75} />}
        />
      )}
      <Starfield count={24} />
      <LightBloom intensity={0.34} />

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
/* 04 — COUNTDOWN: glowing numerals                                    */
/* ================================================================== */

function CountdownScene({ data }: { data: WeddingData }) {
  const date = effectiveDate(data);
  const countdown = useCountdown(toTimestamp(date, effectiveTime(data)));

  const cells = [
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
    <SceneSurface surface={NIGHT_SURFACE}>
      <Starfield count={32} />
      <GoldMotes count={16} />
      <LightBloom intensity={0.38} />

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
          /* Two glowing pairs, so the numerals read like a title card. */
          <div className="mt-10 grid w-full max-w-[18rem] grid-cols-2 gap-x-6 gap-y-8">
            {cells.map((cell, index) => (
              <SceneReveal
                key={cell.label}
                delay={0.4 + index * 0.13}
                direction="up"
                className="flex flex-col items-center"
              >
                {/* The glow lives on the wrapper so the rolling strip stays clean. */}
                <span
                  style={{
                    textShadow:
                      "0 0 26px color-mix(in oklab, var(--t-accent) 50%, transparent)",
                  }}
                >
                  <RollingNumber
                    value={cell.value}
                    digits={cell.digits}
                    className="font-[family-name:var(--font-display)] font-light text-[var(--t-accent-soft)]"
                    digitClassName="text-[clamp(2.6rem,17vw,3.75rem)] leading-[1]"
                  />
                </span>
                <span className="mt-2.5 text-[0.55rem] tracking-[0.36em] text-[var(--t-ink-muted)] uppercase">
                  {cell.label}
                </span>
              </SceneReveal>
            ))}
          </div>
        )}

        {date && (
          <SceneReveal delay={1.1} className="mt-11">
            <p className="text-[0.62rem] tracking-[0.34em] text-[var(--t-ink-soft)] uppercase">
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
    <SceneSurface surface={DAWN_SURFACE}>
      <Starfield count={20} />
      <LightBloom intensity={0.36} />
      <GoldSweep delay={0.4} duration={2.6} />

      <SceneBody>
        <SceneLabel delay={0.2}>The nights ahead</SceneLabel>

        <h2
          className="mt-8 font-[family-name:var(--font-display)] font-light text-[var(--t-ink)]"
          style={displayType("The Celebration", "hero", "1.02")}
        >
          <TextReveal delay={0.5}>The</TextReveal>
          <TextReveal delay={0.68}>Celebration</TextReveal>
        </h2>

        <div className="mt-9">
          <GlowRule delay={0.95} />
        </div>

        <SceneReveal delay={1.1} className="mt-8">
          <p className="text-[0.62rem] tracking-[0.34em] text-[var(--t-accent)] uppercase">
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

  // Alternate the push direction so consecutive events do not feel identical.
  const from = ordinal % 2 === 0 ? "bottom" : "top";

  return (
    <SceneSurface surface={DEEP_NIGHT_SURFACE}>
      {event.image ? (
        <ImageReveal
          image={event.image}
          className="absolute inset-0"
          sizes="100vw"
          from={from}
          drift
          overlay={<Vignette strength={0.66} />}
        />
      ) : (
        <>
          <Starfield count={26} />
          <GoldMotes count={12} />
          <LightBloom intensity={0.32} />
        </>
      )}

      <div
        className="relative flex h-full flex-col justify-end px-7 text-center"
        style={{ paddingBottom: DOCK_CLEAR }}
      >
        <ParallaxLayer depth={24}>
          {parts && (
            <SceneReveal delay={0.45} className="flex items-center justify-center gap-3">
              <span className="text-[0.58rem] tracking-[0.32em] text-[var(--t-accent)] uppercase">
                {parts.weekday}
              </span>
              <span aria-hidden className="h-3 w-px bg-[var(--t-line)]" />
              <span className="text-[0.58rem] tracking-[0.32em] text-[var(--t-accent)] uppercase">
                {parts.day} {parts.monthShort} {parts.year}
              </span>
            </SceneReveal>
          )}

          <h2
            className="mt-5 font-[family-name:var(--font-display)] font-light text-[var(--t-ink)]"
            style={{
              ...titleType,
              textShadow: "0 0 30px color-mix(in oklab, var(--t-bg) 65%, transparent)",
            }}
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

          <div className="mt-6">
            <GlowRule delay={1} width="7rem" />
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
                <span className="border border-[var(--t-line)] px-3.5 py-2 text-[0.55rem] tracking-[0.28em] text-[var(--t-ink-soft)] uppercase">
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
                  className="tap-target inline-grid place-items-center border border-[var(--t-accent)] px-5 text-[0.55rem] tracking-[0.28em] text-[var(--t-accent)] uppercase transition-colors duration-300 hover:bg-[color-mix(in_oklab,var(--t-accent)_18%,transparent)]"
                  style={{
                    boxShadow:
                      "0 0 18px -6px color-mix(in oklab, var(--t-accent) 55%, transparent)",
                  }}
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
    <SceneSurface surface={DEEP_NIGHT_SURFACE}>
      {venue.image ? (
        <ImageReveal
          image={venue.image}
          className="absolute inset-0"
          sizes="100vw"
          drift
          overlay={<Vignette strength={0.6} />}
        />
      ) : (
        <>
          <Starfield count={24} />
          <LightBloom intensity={0.3} />
        </>
      )}

      <SceneBody className="justify-end" style={{ paddingBottom: DOCK_CLEAR }}>
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
                className="tap-target inline-flex items-center gap-2.5 border border-[var(--t-accent)] px-7 py-3.5 text-[0.58rem] tracking-[0.32em] text-[var(--t-accent)] uppercase transition-colors duration-300 hover:bg-[color-mix(in_oklab,var(--t-accent)_18%,transparent)]"
                style={{
                  boxShadow:
                    "0 0 20px -6px color-mix(in oklab, var(--t-accent) 55%, transparent)",
                }}
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
    <SceneSurface surface={NIGHT_SURFACE}>
      <Starfield count={18} />

      <SceneBody className="justify-start">
        {milestone.date && (
          <h3
            className="mt-6 font-[family-name:var(--font-display)] font-light text-[var(--t-accent)]"
            style={{
              ...displayType(milestone.date, "hero", "1"),
              textShadow: "0 0 24px color-mix(in oklab, var(--t-accent) 40%, transparent)",
            }}
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
            drift
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
    <SceneSurface surface={DEEP_NIGHT_SURFACE}>
      <Starfield count={16} />

      <div className="absolute inset-x-0 top-0 z-20 pt-12">
        <SceneLabel delay={0.2}>Moments</SceneLabel>
      </div>

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
              initial={{ opacity: 0, scale: 1.08 }}
              animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.08 }}
              transition={{
                duration: 1.4,
                delay: 0.25 + index * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <SmartImage image={image} sizes="86vw" className="opacity-90" />
              <Vignette strength={0.5} />
            </motion.div>

            {image.caption && (
              <figcaption
                className="absolute inset-x-0 bottom-0 px-7 text-center"
                style={{ paddingBottom: "max(4.5rem, env(safe-area-inset-bottom))" }}
              >
                <span className="text-[0.58rem] tracking-[0.32em] text-[var(--t-ink-soft)] uppercase">
                  {image.caption}
                </span>
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      <p
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 text-center text-[0.55rem] tracking-[0.32em] text-[var(--t-ink-muted)] uppercase"
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
    window.setTimeout(() => next(), settings.enabled ? 900 : 60);
  };

  return (
    <SceneSurface surface={NIGHT_SURFACE}>
      <Starfield count={30} />
      <GoldMotes count={12} />
      <LightBloom intensity={0.4} />

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
                  "border text-[0.6rem] tracking-[0.32em] uppercase transition-colors duration-500",
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
              className="mt-7 text-[0.58rem] tracking-[0.32em] text-[var(--t-accent)] uppercase"
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
    <SceneSurface surface={DAWN_SURFACE} className="min-h-[100svh]">
      <Starfield count={14} />

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

/* ================================================================== */
/* FAMILY                                                              */
/* ================================================================== */

function FamilyScene({ data }: { data: WeddingData }) {
  const families = [data.familyNames.bride, data.familyNames.groom].filter(
    (name): name is string => Boolean(name),
  );

  return (
    <SceneSurface surface={DAWN_SURFACE}>
      <Starfield count={20} />
      <LightBloom intensity={0.28} />

      <SceneBody>
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
                  <p className="mt-0.5 text-[0.55rem] tracking-[0.26em] text-[var(--t-ink-muted)] uppercase">
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
    <SceneSurface surface={NIGHT_SURFACE}>
      <Starfield count={28} />
      <LightBloom intensity={0.34} />

      <SceneBody>
        {islamic.verseArabic && (
          <SceneReveal delay={0.3} durationScale={1.8}>
            <p
              lang="ar"
              dir="rtl"
              className="text-fluid-xl leading-[2.1] text-[var(--t-accent-soft)]"
            >
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
            <p className="text-[0.58rem] tracking-[0.34em] text-[var(--t-accent)] uppercase">
              {islamic.verseReference}
            </p>
          </SceneReveal>
        )}

        {islamic.duaText && (
          <>
            <div className="mt-10">
              <GlowRule delay={1.1} width="8rem" />
            </div>
            <SceneReveal delay={1.3} className="mt-7">
              <p className="text-fluid-xs text-[var(--t-ink-muted)] italic">
                {islamic.duaText}
              </p>
            </SceneReveal>
          </>
        )}
      </SceneBody>
    </SceneSurface>
  );
}

/* ================================================================== */
/* CLOSING — the crescent sets                                         */
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
    <SceneSurface surface={DEEP_NIGHT_SURFACE}>
      <Starfield count={52} />
      <GoldMotes count={18} />

      {/* The crescent settles low in frame as the film ends. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[8%] flex justify-center"
        initial={{ opacity: 0, y: settings.enabled ? -26 : 0 }}
        animate={active ? { opacity: 0.5, y: 0 } : { opacity: 0, y: -26 }}
        transition={{ duration: 3, delay: 1.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Crescent size={108} delay={1.8} />
      </motion.div>

      <LightBloom intensity={0.3} />

      {/* A final slow fade toward black. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: active && settings.enabled ? 0.34 : 0 }}
        transition={{ duration: 4, ease: "easeInOut" }}
      />

      <SceneBody>
        <SceneLabel delay={0.25}>Barakallahu lakuma</SceneLabel>

        <h2 className="mt-10 font-[family-name:var(--font-display)] font-light text-[var(--t-ink)]">
          <span style={closingNameType} className="block">
            <TextReveal delay={0.6}>{names.firstShort}</TextReveal>
          </span>
          <motion.span
            aria-hidden
            className="my-1 block text-[var(--t-accent)]"
            style={{
              fontSize: "clamp(1.4rem, 6vw, 2.25rem)",
              lineHeight: 1,
              textShadow: "0 0 20px color-mix(in oklab, var(--t-accent) 55%, transparent)",
            }}
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

        <div className="mt-10">
          <GlowRule delay={1.5} width="10rem" />
        </div>

        {date && (
          <SceneReveal delay={1.7} className="mt-8">
            <p className="text-[0.62rem] tracking-[0.36em] text-[var(--t-ink-soft)] uppercase">
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
