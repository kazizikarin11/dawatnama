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
import { MINIMAL, MINIMAL_ALT } from "./theme";

/**
 * TEMPLATE 05 — MINIMAL SIGNATURE, cinematic edition
 *
 * A luxury fashion house invitation. This template carries no ornament at all:
 * restraint is the design. What does the work instead is typography at scale,
 * asymmetry, and negative space — names run nearly edge to edge, compositions sit
 * left-aligned against a wide empty margin, and a hairline rule is the only
 * divider in the entire deck.
 *
 * Motion language: purely typographic. Characters rise behind masks, tracking
 * closes, images are revealed by a hard-edged mask sliding away, and the page
 * inverts between warm white and near-black between scenes so the sequence has a
 * stark editorial rhythm. Nothing drifts, sparkles, or glows.
 */

/* ------------------------------------------------------------------ */
/* Surfaces — the page inverts for rhythm                              */
/* ------------------------------------------------------------------ */

/** Warm white page, near-black type. */
const LIGHT_SURFACE: CSSProperties = {
  "--t-bg": "#f7f5f1",
  "--t-bg-alt": "#efece5",
  "--t-surface": "#fffefc",
  "--t-ink": "#171614",
  "--t-ink-soft": "#403d38",
  "--t-ink-muted": "#7d776d",
  "--t-line": "rgba(23, 22, 20, 0.16)",
} as CSSProperties;

/** Near-black page, warm white type. The same design at a different weight. */
const DARK_SURFACE: CSSProperties = {
  "--t-bg": "#141311",
  "--t-bg-alt": "#1c1a17",
  "--t-surface": "#201e1a",
  "--t-ink": "#f4f1ec",
  "--t-ink-soft": "#cfc9bf",
  "--t-ink-muted": "#938d82",
  "--t-line": "rgba(244, 241, 236, 0.18)",
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

export default function MinimalSignatureCinematic({
  data,
  sections,
  mode,
}: TemplateProps) {
  const inverted = data.appearance.backgroundVariant === "alt";
  const tokens = inverted ? MINIMAL_ALT : MINIMAL;

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
      className="relative isolate w-full overflow-hidden font-[family-name:var(--font-sans)]"
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
              <SceneRouter node={node} data={data} mode={mode} inverted={inverted} />
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
  inverted,
}: {
  node: SceneNode;
  data: WeddingData;
  mode: TemplateProps["mode"];
  inverted: boolean;
}) {
  switch (node.kind) {
    case "cover":
      return <CoverScene data={data} mode={mode} inverted={inverted} />;
    case "invitation":
      return <InvitationScene data={data} inverted={inverted} />;
    case "party":
      return <PartyScene data={data} party={node.party ?? "bride"} />;
    case "couple":
      return <CoupleScene data={data} />;
    case "countdown":
      return <CountdownScene data={data} inverted={inverted} />;
    case "events-intro":
      return <EventsIntroScene data={data} inverted={inverted} />;
    case "event":
      return node.event ? (
        <EventScene event={node.event} ordinal={node.ordinal ?? 0} inverted={inverted} />
      ) : null;
    case "venue":
      return node.venue ? <VenueScene venue={node.venue} /> : null;
    case "story":
      return node.milestone ? (
        <StoryScene milestone={node.milestone} inverted={inverted} />
      ) : null;
    case "gallery":
      return <GalleryScene data={data} />;
    case "rsvp-intro":
      return <RsvpIntroScene data={data} inverted={inverted} />;
    case "rsvp-form":
      return <RsvpFormScene data={data} mode={mode} inverted={inverted} />;
    case "family":
      return <FamilyScene data={data} inverted={inverted} />;
    case "verse":
      return <VerseScene data={data} inverted={inverted} />;
    case "closing":
      return <ClosingScene data={data} inverted={inverted} />;
    default:
      return null;
  }
}

/**
 * Picks the page weight for a scene. The deck alternates, and when the author has
 * chosen the inverted palette the whole sequence flips with it.
 */
function page(inverted: boolean, dark: boolean): CSSProperties {
  const wantsDark = inverted ? !dark : dark;
  return wantsDark ? DARK_SURFACE : LIGHT_SURFACE;
}

/* ================================================================== */
/* Shared furniture — a numeral, a rule, and nothing else              */
/* ================================================================== */

/**
 * The only recurring device in the template: the scene's index as a two-digit
 * numeral, a long hairline rule, and a tracked label. Left-aligned, always.
 */
function SceneMarker({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { index } = useScene();
  const numeral = String(index + 1).padStart(2, "0");

  return (
    <div className={cn("flex w-full items-center gap-4", className)}>
      <SceneReveal delay={delay} direction="none">
        <span className="block font-[family-name:var(--font-fashion)] text-[0.72rem] text-[var(--t-accent)]">
          {numeral}
        </span>
      </SceneReveal>

      <TrackingReveal
        delay={delay + 0.06}
        className="text-[0.58rem] text-[var(--t-ink-muted)] uppercase"
        from="0.46em"
        to="0.28em"
      >
        {children}
      </TrackingReveal>

      {/* The rule runs out to the margin — the composition is never boxed. */}
      <SceneReveal delay={delay + 0.12} direction="none" className="flex-1">
        <span className="block h-px w-full bg-[var(--t-line)]" />
      </SceneReveal>
    </div>
  );
}

/** A single hairline rule. The template's only divider. */
function Rule({ delay = 0, className }: { delay?: number; className?: string }) {
  const { active } = useScene();
  const settings = useMotionSettings();

  return (
    <motion.span
      aria-hidden
      className={cn("block h-px w-full origin-left bg-[var(--t-line)]", className)}
      initial={{ scaleX: 0 }}
      animate={active ? { scaleX: 1 } : { scaleX: 0 }}
      transition={{
        duration: settings.enabled ? 1.3 : 0,
        delay,
        ease: [0.65, 0, 0.35, 1],
      }}
    />
  );
}

/**
 * The template's composition: content pinned left against a generous right
 * margin, with safe-area aware padding. Scenes may also centre when the content
 * is genuinely symmetrical, such as the closing.
 */
function SceneBody({
  children,
  className,
  align = "left",
  justify = "center",
  style,
}: {
  children: ReactNode;
  className?: string;
  align?: "left" | "center";
  justify?: "center" | "start" | "end";
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col px-7",
        align === "left" ? "items-start text-left" : "items-center text-center",
        justify === "center"
          ? "justify-center"
          : justify === "start"
            ? "justify-start"
            : "justify-end",
        className,
      )}
      style={{
        paddingTop: "max(2.75rem, env(safe-area-inset-top))",
        paddingBottom: "max(3.5rem, env(safe-area-inset-bottom))",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Bottom clearance so a CTA never sits under the floating dock. */
const DOCK_CLEAR = "max(6.5rem, calc(env(safe-area-inset-bottom) + 5rem))";

/* ================================================================== */
/* 01 — COVER: type at scale, nothing else                             */
/* ================================================================== */

function CoverScene({
  data,
  mode,
  inverted,
}: {
  data: WeddingData;
  mode: TemplateProps["mode"];
  inverted: boolean;
}) {
  const openDeck = useOpenInvitation();
  const stage = useStage();
  const settings = useMotionSettings();
  const names = coupleNames(data);
  const parts = formatDateParts(effectiveDate(data));

  const open = useCallback(() => {
    stage.open();
    openDeck();
  }, [stage, openDeck]);

  // Both names share one size so the pair reads as one mark.
  const nameType = displayTypeForSet([names.firstShort, names.secondShort], "poster", "0.92");

  return (
    <SceneSurface surface={page(inverted, true)}>
      {/* The only image on the cover is a whisper behind the type. */}
      {data.heroImage && (
        <div aria-hidden className="absolute inset-0">
          <SmartImage
            image={data.heroImage}
            priority
            sizes="100vw"
            className="scale-105 opacity-[0.1]"
          />
        </div>
      )}

      <CoverCanvas template="minimal-signature" />

      {/* A tracked line at the very top, hard against the margin. */}
      <motion.div
        className="absolute inset-x-7 z-10 flex items-center justify-between"
        style={{ top: "max(2.75rem, env(safe-area-inset-top))" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.4 }}
      >
        <span className="text-[0.55rem] tracking-[0.4em] text-[var(--t-ink-muted)] uppercase">
          {data.familyInvitationWording ? "With their families" : "The wedding of"}
        </span>
        {parts && (
          <span className="text-[0.55rem] tracking-[0.3em] text-[var(--t-accent)] uppercase">
            {parts.day}.{String(parts.monthName).slice(0, 3)}.{parts.year}
          </span>
        )}
      </motion.div>

      {/**
       * Centred rather than pinned to the bottom. Bottom-aligning this much type
       * left the top half of the screen as dead black space, which read as broken
       * rather than as restraint.
       */}
      <SceneBody align="left" justify="center">
        {data.islamic.bismillahArabic && (
          <motion.p
            lang="ar"
            dir="rtl"
            className="mb-9 text-fluid-sm text-[var(--t-accent)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 0.9 }}
          >
            {data.islamic.bismillahArabic}
          </motion.p>
        )}

        {/* The names, set nearly edge to edge. This is the whole design. */}
        <h1 className="w-full font-[family-name:var(--font-fashion)] text-[var(--t-ink)]">
          <span className="block" style={nameType}>
            {/* The character row is centred by default; this template sets it left. */}
            <SplitTextReveal
              text={names.firstShort || "Bride"}
              delay={1.5}
              className="[&>span[aria-hidden]]:justify-start"
            />
          </span>
          <span className="sr-only"> and </span>

          {/* Champagne, and large enough to actually read as an ampersand — at
              1.5rem in Italiana it reduced to an unreadable squiggle. */}
          <motion.span
            aria-hidden
            className="my-1 block font-[family-name:var(--font-fashion)] text-[var(--t-accent)]"
            style={{ fontSize: "clamp(2rem, 9vw, 3rem)", lineHeight: 1 }}
            initial={{ opacity: 0, x: settings.enabled ? -14 : 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.1, delay: 2.5, ease: [0.22, 1, 0.36, 1] }}
          >
            &amp;
          </motion.span>

          <span className="block" style={nameType}>
            <SplitTextReveal
              text={names.secondShort || "Groom"}
              delay={2.8}
              className="[&>span[aria-hidden]]:justify-start"
            />
          </span>
        </h1>

        <motion.div
          className="mt-9 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 3.7 }}
        >
          <Rule delay={3.8} />
        </motion.div>

        <motion.div
          className="mt-7 flex w-full items-end justify-between gap-6"
          initial={{ opacity: 0, y: settings.enabled ? 14 : 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 4.1 }}
        >
          <div>
            {parts && (
              <p className="text-[0.62rem] tracking-[0.3em] text-[var(--t-ink-soft)] uppercase">
                {parts.weekday}
              </p>
            )}
            {data.hijriDate && (
              <p className="mt-1.5 text-[0.55rem] tracking-[0.26em] text-[var(--t-ink-muted)] uppercase">
                {data.hijriDate}
              </p>
            )}
          </div>

          <button
            type="button"
            data-cover-action
            onClick={open}
            disabled={mode === "thumbnail"}
            className="tap-target group relative shrink-0 overflow-hidden"
          >
            <span className="relative z-10 block px-1 pb-2 text-[0.6rem] tracking-[0.34em] text-[var(--t-ink)] uppercase">
              Open
            </span>
            {/* The underline is the button. */}
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-[var(--t-ink)]" />
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-[var(--t-accent)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
              style={
                settings.enabled
                  ? { animation: "dawat-breathe 3.4s ease-in-out infinite" }
                  : undefined
              }
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

function InvitationScene({ data, inverted }: { data: WeddingData; inverted: boolean }) {
  const { islamic } = data;

  return (
    <SceneSurface surface={page(inverted, false)}>
      <SceneBody align="left">
        <SceneMarker delay={0.2}>The invitation</SceneMarker>

        {islamic.bismillahArabic && (
          <SceneReveal delay={0.45} durationScale={1.5} className="mt-12 w-full">
            <p lang="ar" dir="rtl" className="text-fluid-lg leading-[1.9] text-[var(--t-ink)]">
              {islamic.bismillahArabic}
            </p>
          </SceneReveal>
        )}

        {islamic.bismillahTranslation && (
          <SceneReveal delay={0.65} className="mt-4 w-full">
            <p className="max-w-[20rem] text-fluid-xs leading-relaxed text-[var(--t-ink-muted)]">
              {islamic.bismillahTranslation}
            </p>
          </SceneReveal>
        )}

        {data.familyInvitationWording && (
          <h2 className="mt-10 w-full font-[family-name:var(--font-fashion)] text-[var(--t-ink)]">
            <TextReveal delay={0.85} className="text-fluid-xl leading-[1.15]">
              {data.familyInvitationWording}
            </TextReveal>
          </h2>
        )}

        <div className="mt-9 w-full">
          <Rule delay={1.1} />
        </div>

        {data.invitationMessage && (
          <SceneReveal delay={1.25} className="mt-7 w-full">
            <p className="max-w-[22rem] text-fluid-sm leading-[1.95] text-[var(--t-ink-soft)]">
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
/* 03 — THE COUPLE: a full-bleed portrait, name over the margin        */
/* ================================================================== */

function PartyScene({ data, party }: { data: WeddingData; party: "bride" | "groom" }) {
  const person = data.couple[party];
  const nameType = displayType(person.name, "hero", "0.95");

  return (
    <SceneSurface surface={DARK_SURFACE}>
      {/* A hard-edged mask slides away; no vignette, no softening. */}
      <ImageReveal
        image={person.photo}
        className="absolute inset-0"
        sizes="100vw"
        from={party === "bride" ? "left" : "right"}
        overlay={
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-[color-mix(in_oklab,var(--t-bg)_30%,transparent)] to-transparent" />
        }
      />

      <SceneBody align="left" justify="end" style={{ paddingBottom: DOCK_CLEAR }}>
        <ParallaxLayer depth={22} className="w-full">
          <TrackingReveal
            delay={0.5}
            className="text-[0.55rem] text-[var(--t-accent)] uppercase"
            from="0.5em"
            to="0.3em"
          >
            {party === "bride" ? "The bride" : "The groom"}
          </TrackingReveal>

          <h2
            className="mt-5 w-full font-[family-name:var(--font-fashion)] text-[var(--t-ink)]"
            style={nameType}
          >
            <TextReveal delay={0.7}>{person.name}</TextReveal>
          </h2>

          <div className="mt-6 w-full">
            <Rule delay={1} />
          </div>

          {person.parents && (
            <SceneReveal delay={1.15} className="mt-5">
              <p className="text-[0.6rem] tracking-[0.26em] text-[var(--t-ink-muted)] uppercase">
                {person.parents}
              </p>
            </SceneReveal>
          )}

          {person.description && (
            <SceneReveal delay={1.3} className="mt-4">
              <p className="max-w-[20rem] text-fluid-sm leading-[1.9] text-[var(--t-ink-soft)]">
                {person.description}
              </p>
            </SceneReveal>
          )}
        </ParallaxLayer>
      </SceneBody>
    </SceneSurface>
  );
}

/** Fallback when only one or neither portrait exists. */
function CoupleScene({ data }: { data: WeddingData }) {
  const { bride, groom, order } = data.couple;
  const parties = order === "groom-first" ? [groom, bride] : [bride, groom];
  const photo = bride.photo ?? groom.photo;
  const nameType = displayTypeForSet([bride.name, groom.name], "hero", "0.95");

  return (
    <SceneSurface surface={DARK_SURFACE}>
      {photo && (
        <ImageReveal
          image={photo}
          className="absolute inset-0"
          sizes="100vw"
          overlay={<div className="absolute inset-0 bg-[var(--t-bg)]/65" />}
        />
      )}

      <SceneBody align="left">
        <SceneMarker delay={0.25}>The couple</SceneMarker>

        <div className="mt-12 w-full space-y-4">
          {parties.map((person, index) => (
            <h2
              key={index}
              className="font-[family-name:var(--font-fashion)] text-[var(--t-ink)]"
              style={nameType}
            >
              <TextReveal delay={0.6 + index * 0.25}>{person.name}</TextReveal>
            </h2>
          ))}
        </div>

        {data.couple.shortDescription && (
          <>
            <div className="mt-9 w-full">
              <Rule delay={1.15} />
            </div>
            <SceneReveal delay={1.3} className="mt-7 w-full">
              <p className="max-w-[22rem] text-fluid-sm leading-[1.95] text-[var(--t-ink-soft)]">
                {data.couple.shortDescription}
              </p>
            </SceneReveal>
          </>
        )}
      </SceneBody>
    </SceneSurface>
  );
}

/* ================================================================== */
/* 04 — COUNTDOWN: numerals as a stacked list                          */
/* ================================================================== */

function CountdownScene({ data, inverted }: { data: WeddingData; inverted: boolean }) {
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
    <SceneSurface surface={page(inverted, false)}>
      <SceneBody align="left">
        <SceneMarker delay={0.2}>
          {countdown?.isPast ? "Alhamdulillah" : "Counting down"}
        </SceneMarker>

        {countdown?.isPast ? (
          <>
            <h2
              className="mt-12 w-full font-[family-name:var(--font-fashion)] text-[var(--t-ink)]"
              style={displayType(countdown.isToday ? "Today" : "Thank you", "hero", "0.98")}
            >
              <TextReveal delay={0.5}>
                {countdown.isToday ? "Today" : "Thank you"}
              </TextReveal>
            </h2>
            <SceneReveal delay={0.9} className="mt-7">
              <p className="max-w-[20rem] text-fluid-sm text-[var(--t-ink-soft)]">
                {countdown.isToday
                  ? "May Allah bless this day."
                  : "Thank you to everyone who celebrated with us."}
              </p>
            </SceneReveal>
          </>
        ) : (
          /* A ledger, not a dashboard: label left, numeral right, rule between. */
          <div className="mt-10 w-full">
            {cells.map((cell, index) => (
              <SceneReveal
                key={cell.label}
                delay={0.4 + index * 0.13}
                direction="up"
                className="w-full"
              >
                <div className="flex items-baseline justify-between gap-5 py-3">
                  <span className="text-[0.56rem] tracking-[0.34em] text-[var(--t-ink-muted)] uppercase">
                    {cell.label}
                  </span>
                  <RollingNumber
                    value={cell.value}
                    digits={cell.digits}
                    className="font-[family-name:var(--font-fashion)] text-[var(--t-ink)]"
                    digitClassName="text-[clamp(2.25rem,13vw,3.25rem)] leading-[1]"
                  />
                </div>
                <span aria-hidden className="block h-px w-full bg-[var(--t-line)]" />
              </SceneReveal>
            ))}
          </div>
        )}

        {date && (
          <SceneReveal delay={1.1} className="mt-9">
            <p className="text-[0.6rem] tracking-[0.3em] text-[var(--t-accent)] uppercase">
              {formatWeekday(date)} — {formatLongDate(date)}
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

function EventsIntroScene({ data, inverted }: { data: WeddingData; inverted: boolean }) {
  const count = data.events.filter((event) => event.enabled).length;

  return (
    <SceneSurface surface={page(inverted, true)}>
      <SceneBody align="left">
        <SceneMarker delay={0.2}>The programme</SceneMarker>

        <h2 className="mt-14 w-full font-[family-name:var(--font-fashion)] text-[var(--t-ink)]">
          <span className="block" style={displayType("Celebration", "poster", "0.9")}>
            <TextReveal delay={0.5}>The</TextReveal>
          </span>
          <span className="block" style={displayType("Celebration", "poster", "0.9")}>
            <TextReveal delay={0.7}>Celebration</TextReveal>
          </span>
        </h2>

        <div className="mt-10 w-full">
          <Rule delay={1} />
        </div>

        <SceneReveal delay={1.15} className="mt-7">
          <p className="text-[0.6rem] tracking-[0.32em] text-[var(--t-accent)] uppercase">
            {String(count).padStart(2, "0")} {count === 1 ? "gathering" : "gatherings"}
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
  inverted,
}: {
  event: import("@/lib/wedding/types").WeddingEvent;
  ordinal: number;
  inverted: boolean;
}) {
  const parts = formatDateParts(event.date);
  const directions = directionsUrl(event.venue);
  const time = formatTimeRange(event.startTime, event.endTime);
  const titleType = displayType(event.name, "poster", "0.92");

  // With a photograph the scene goes dark and full-bleed; without one it stays a
  // typographic page. Either way the palette alternates as the deck advances.
  const hasImage = Boolean(event.image);
  const surface = hasImage ? DARK_SURFACE : page(inverted, ordinal % 2 === 1);

  return (
    <SceneSurface surface={surface}>
      {event.image && (
        <ImageReveal
          image={event.image}
          className="absolute inset-0"
          sizes="100vw"
          from={ordinal % 2 === 0 ? "bottom" : "top"}
          overlay={
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-[color-mix(in_oklab,var(--t-bg)_45%,transparent)] to-[color-mix(in_oklab,var(--t-bg)_15%,transparent)]" />
          }
        />
      )}

      <SceneBody align="left" justify="end" style={{ paddingBottom: DOCK_CLEAR }}>
        <ParallaxLayer depth={18} className="w-full">
          {parts && (
            <SceneReveal delay={0.4} className="flex items-center gap-3">
              <span className="text-[0.55rem] tracking-[0.3em] text-[var(--t-accent)] uppercase">
                {parts.weekday}
              </span>
              <span aria-hidden className="h-px w-5 bg-[var(--t-line)]" />
              <span className="text-[0.55rem] tracking-[0.3em] text-[var(--t-accent)] uppercase">
                {parts.day}.{parts.monthShort}.{parts.year}
              </span>
            </SceneReveal>
          )}

          <h2
            className="mt-4 w-full font-[family-name:var(--font-fashion)] text-[var(--t-ink)]"
            style={titleType}
          >
            <TextReveal delay={0.58}>{event.name}</TextReveal>
          </h2>

          {event.subtitle && (
            <SceneReveal delay={0.82} className="mt-2.5">
              <p className="text-fluid-xs text-[var(--t-ink-muted)]">{event.subtitle}</p>
            </SceneReveal>
          )}

          <div className="mt-7 w-full">
            <Rule delay={1} />
          </div>

          {/* Time and place set as a two-column ledger. */}
          <div className="mt-6 flex w-full items-start justify-between gap-6">
            {time && (
              <SceneReveal delay={1.15}>
                <p className="text-[0.55rem] tracking-[0.3em] text-[var(--t-ink-muted)] uppercase">
                  Time
                </p>
                <p className="mt-2 font-[family-name:var(--font-fashion)] text-fluid-lg text-[var(--t-ink)]">
                  {time}
                </p>
              </SceneReveal>
            )}

            {event.venue && (
              <SceneReveal delay={1.28} className="max-w-[11rem] text-right">
                <p className="text-[0.55rem] tracking-[0.3em] text-[var(--t-ink-muted)] uppercase">
                  Place
                </p>
                <p className="mt-2 text-fluid-sm text-[var(--t-ink)]">{event.venue.name}</p>
                {event.venue.address && (
                  <p className="mt-1 text-fluid-xs leading-relaxed text-[var(--t-ink-muted)]">
                    {event.venue.address}
                  </p>
                )}
              </SceneReveal>
            )}
          </div>

          <div className="mt-7 flex w-full flex-wrap items-center gap-x-7 gap-y-3">
            {event.dressCode && (
              <SceneReveal delay={1.45} direction="none">
                <span className="text-[0.55rem] tracking-[0.26em] text-[var(--t-ink-soft)] uppercase">
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
                  className="tap-target group relative inline-grid place-items-center"
                >
                  <span className="block px-0.5 pb-1.5 text-[0.55rem] tracking-[0.28em] text-[var(--t-accent)] uppercase">
                    Get directions
                  </span>
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-px bg-[var(--t-accent)] opacity-60 transition-opacity duration-300 group-hover:opacity-100"
                  />
                </a>
              </SceneReveal>
            )}
          </div>
        </ParallaxLayer>
      </SceneBody>
    </SceneSurface>
  );
}

/* ================================================================== */
/* VENUE                                                               */
/* ================================================================== */

function VenueScene({ venue }: { venue: import("@/lib/wedding/types").Venue }) {
  const directions = directionsUrl(venue);

  return (
    <SceneSurface surface={DARK_SURFACE}>
      {venue.image && (
        <ImageReveal
          image={venue.image}
          className="absolute inset-0"
          sizes="100vw"
          overlay={
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-[color-mix(in_oklab,var(--t-bg)_40%,transparent)] to-transparent" />
          }
        />
      )}

      <SceneBody align="left" justify="end" style={{ paddingBottom: DOCK_CLEAR }}>
        <ParallaxLayer depth={16} className="w-full">
          <TrackingReveal
            delay={0.4}
            className="text-[0.55rem] text-[var(--t-accent)] uppercase"
            from="0.5em"
            to="0.3em"
          >
            The venue
          </TrackingReveal>

          <h2
            className="mt-5 w-full font-[family-name:var(--font-fashion)] text-[var(--t-ink)]"
            style={displayType(venue.name, "hero", "0.98")}
          >
            <TextReveal delay={0.6}>{venue.name}</TextReveal>
          </h2>

          <div className="mt-6 w-full">
            <Rule delay={0.9} />
          </div>

          {venue.address && (
            <SceneReveal delay={1.05} className="mt-5">
              <p className="max-w-[20rem] text-fluid-sm leading-relaxed text-[var(--t-ink-soft)]">
                {venue.address}
              </p>
            </SceneReveal>
          )}

          {venue.note && (
            <SceneReveal delay={1.15} className="mt-2">
              <p className="text-fluid-xs text-[var(--t-ink-muted)]">{venue.note}</p>
            </SceneReveal>
          )}

          {directions && (
            <SceneReveal delay={1.3} className="mt-7">
              <a
                href={directions}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target group relative inline-grid place-items-center"
              >
                <span className="block px-0.5 pb-2 text-[0.58rem] tracking-[0.3em] text-[var(--t-ink)] uppercase">
                  Get directions
                </span>
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-[var(--t-ink)]" />
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-[var(--t-accent)] transition-transform duration-500 group-hover:scale-x-100"
                />
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
  inverted,
}: {
  milestone: import("@/lib/wedding/types").StoryMilestone;
  inverted: boolean;
}) {
  return (
    <SceneSurface surface={page(inverted, false)}>
      <SceneBody align="left" justify="start">
        <SceneMarker delay={0.2}>The story</SceneMarker>

        {milestone.date && (
          <h3
            className="mt-10 w-full font-[family-name:var(--font-fashion)] text-[var(--t-accent)]"
            style={displayType(milestone.date, "poster", "0.9")}
          >
            <TextReveal delay={0.4}>{milestone.date}</TextReveal>
          </h3>
        )}

        <h2
          className="mt-2 w-full font-[family-name:var(--font-fashion)] text-[var(--t-ink)]"
          style={displayType(milestone.title, "title", "1.05")}
        >
          <TextReveal delay={0.6}>{milestone.title}</TextReveal>
        </h2>

        {milestone.image && (
          <ImageReveal
            image={milestone.image}
            className="mt-7 aspect-[3/2] w-full"
            sizes="86vw"
            delay={0.8}
            from="left"
          />
        )}

        {milestone.description && (
          <SceneReveal delay={1.2} className="mt-6 w-full">
            <p className="max-w-[22rem] text-fluid-sm leading-[1.9] text-[var(--t-ink-soft)]">
              {milestone.description}
            </p>
          </SceneReveal>
        )}
      </SceneBody>
    </SceneSurface>
  );
}

/* ================================================================== */
/* GALLERY — full-bleed frames, swiped sideways                         */
/* ================================================================== */

function GalleryScene({ data }: { data: WeddingData }) {
  const { active } = useScene();

  return (
    <SceneSurface surface={DARK_SURFACE}>
      <div
        className="absolute inset-x-7 z-20"
        style={{ top: "max(2.75rem, env(safe-area-inset-top))" }}
      >
        <SceneMarker delay={0.2}>Photographs</SceneMarker>
      </div>

      <div
        className="snap-rail h-full w-full"
        style={{ touchAction: "pan-x pan-y" }}
        aria-label="Photographs, swipe sideways"
      >
        {data.gallery.map((image, index) => (
          <figure
            key={image.id}
            className="relative h-full w-[88vw] shrink-0 snap-center sm:w-[64vw]"
          >
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0, clipPath: "inset(0% 0% 100% 0%)" }}
              animate={
                active
                  ? { opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }
                  : { opacity: 0, clipPath: "inset(0% 0% 100% 0%)" }
              }
              transition={{
                duration: 1.2,
                delay: 0.25 + index * 0.09,
                ease: [0.65, 0, 0.35, 1],
              }}
            >
              <SmartImage image={image} sizes="88vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-transparent to-transparent" />
            </motion.div>

            <figcaption
              className="absolute inset-x-6 bottom-0"
              style={{ paddingBottom: "max(4.5rem, env(safe-area-inset-bottom))" }}
            >
              <span className="text-[0.55rem] tracking-[0.3em] text-[var(--t-accent)] uppercase">
                {String(index + 1).padStart(2, "0")}
              </span>
              {image.caption && (
                <span className="mt-1.5 block text-[0.58rem] tracking-[0.24em] text-[var(--t-ink-soft)] uppercase">
                  {image.caption}
                </span>
              )}
            </figcaption>
          </figure>
        ))}
      </div>

      <p
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 text-center text-[0.55rem] tracking-[0.3em] text-[var(--t-ink-muted)] uppercase"
        style={{ paddingBottom: "max(1.75rem, env(safe-area-inset-bottom))" }}
      >
        Swipe · {String(data.gallery.length).padStart(2, "0")}
      </p>
    </SceneSurface>
  );
}

/* ================================================================== */
/* RSVP — the question, then the form                                  */
/* ================================================================== */

function RsvpIntroScene({ data, inverted }: { data: WeddingData; inverted: boolean }) {
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
    <SceneSurface surface={page(inverted, true)}>
      <SceneBody align="left">
        <SceneMarker delay={0.2}>RSVP</SceneMarker>

        <h2
          className="mt-14 w-full font-[family-name:var(--font-fashion)] text-[var(--t-ink)]"
          style={displayType(data.rsvp.headline ?? "Will you join us?", "poster", "0.92")}
        >
          <TextReveal delay={0.45}>{data.rsvp.headline ?? "Will you join us?"}</TextReveal>
        </h2>

        {data.rsvp.message && (
          <SceneReveal delay={0.8} className="mt-7 w-full">
            <p className="max-w-[20rem] text-fluid-sm leading-relaxed text-[var(--t-ink-soft)]">
              {data.rsvp.message}
            </p>
          </SceneReveal>
        )}

        <div className="mt-10 w-full">
          <Rule delay={1} />
        </div>

        {/* Two answers as underlined type, not buttons in boxes. */}
        <div className="mt-8 flex w-full flex-col gap-6">
          {(
            [
              ["attending", "Joyfully accept"],
              ["not-attending", "Regretfully decline"],
            ] as const
          ).map(([value, label], index) => (
            <SceneReveal key={value} delay={1.1 + index * 0.12} direction="up">
              <button
                type="button"
                onClick={() => pick(value)}
                aria-pressed={picked === value}
                className="tap-target group relative block w-full text-left"
              >
                <span
                  className={cn(
                    "block pb-2.5 font-[family-name:var(--font-fashion)] text-fluid-lg transition-colors duration-500",
                    picked === value ? "text-[var(--t-accent)]" : "text-[var(--t-ink)]",
                  )}
                >
                  {label}
                </span>
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-[var(--t-line)]" />
                {/* The rule fills in champagne as the answer is chosen. */}
                <motion.span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-px origin-left bg-[var(--t-accent)]"
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
              className="mt-8 text-[0.58rem] tracking-[0.3em] text-[var(--t-ink-muted)] uppercase"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
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

function RsvpFormScene({
  data,
  mode,
  inverted,
}: {
  data: WeddingData;
  mode: TemplateProps["mode"];
  inverted: boolean;
}) {
  const { choice } = useContext(RsvpChoiceContext);

  return (
    <SceneSurface surface={page(inverted, false)} className="min-h-[100svh]">
      <div
        className="relative w-full px-7"
        style={{
          paddingTop: "max(4rem, env(safe-area-inset-top))",
          paddingBottom: "max(5rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto w-full max-w-sm">
          <SceneMarker delay={0.15}>Your response</SceneMarker>

          <SceneReveal delay={0.4} className="mt-9">
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

/* ================================================================== */
/* FAMILY                                                              */
/* ================================================================== */

function FamilyScene({ data, inverted }: { data: WeddingData; inverted: boolean }) {
  const families = [data.familyNames.bride, data.familyNames.groom].filter(
    (name): name is string => Boolean(name),
  );

  return (
    <SceneSurface surface={page(inverted, false)}>
      <SceneBody align="left">
        <SceneMarker delay={0.2}>With love</SceneMarker>

        <div className="mt-12 w-full space-y-3">
          {families.map((name, index) => (
            <h2
              key={name}
              className="font-[family-name:var(--font-fashion)] text-[var(--t-ink)]"
              style={displayType(name, "hero", "1.02")}
            >
              <TextReveal delay={0.5 + index * 0.2}>{name}</TextReveal>
            </h2>
          ))}
        </div>

        <div className="mt-9 w-full">
          <Rule delay={1} />
        </div>

        {data.gratitudeMessage && (
          <SceneReveal delay={1.15} className="mt-7 w-full">
            <p className="max-w-[22rem] text-fluid-sm leading-[1.95] text-[var(--t-ink-soft)]">
              {data.gratitudeMessage}
            </p>
          </SceneReveal>
        )}

        {data.contacts.length > 0 && (
          <div className="mt-9 flex w-full flex-wrap gap-x-10 gap-y-5">
            {data.contacts.map((contact, index) => (
              <SceneReveal key={contact.id} delay={1.3 + index * 0.1}>
                <p className="text-fluid-xs text-[var(--t-ink)]">{contact.name}</p>
                {contact.role && (
                  <p className="mt-0.5 text-[0.55rem] tracking-[0.24em] text-[var(--t-ink-muted)] uppercase">
                    {contact.role}
                  </p>
                )}
                <div className="mt-1.5 flex gap-4">
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                      className="tap-target inline-grid place-items-center text-[0.6rem] text-[var(--t-accent)] underline underline-offset-4"
                    >
                      Call
                    </a>
                  )}
                  {contact.whatsapp && (
                    <a
                      href={`https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tap-target inline-grid place-items-center text-[0.6rem] text-[var(--t-accent)] underline underline-offset-4"
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

function VerseScene({ data, inverted }: { data: WeddingData; inverted: boolean }) {
  const { islamic } = data;

  return (
    <SceneSurface surface={page(inverted, true)}>
      <SceneBody align="left">
        <SceneMarker delay={0.2}>Ayah</SceneMarker>

        {islamic.verseArabic && (
          <SceneReveal delay={0.45} durationScale={1.7} className="mt-12 w-full">
            <p lang="ar" dir="rtl" className="text-fluid-lg leading-[2] text-[var(--t-ink)]">
              {islamic.verseArabic}
            </p>
          </SceneReveal>
        )}

        {islamic.verseTranslation && (
          <SceneReveal delay={0.8} className="mt-8 w-full">
            <p className="max-w-[22rem] font-[family-name:var(--font-fashion)] text-fluid-base leading-relaxed text-[var(--t-ink-soft)]">
              {islamic.verseTranslation}
            </p>
          </SceneReveal>
        )}

        {islamic.verseReference && (
          <SceneReveal delay={1.05} className="mt-6">
            <p className="text-[0.56rem] tracking-[0.3em] text-[var(--t-accent)] uppercase">
              {islamic.verseReference}
            </p>
          </SceneReveal>
        )}

        {islamic.duaText && (
          <>
            <div className="mt-9 w-full">
              <Rule delay={1.2} />
            </div>
            <SceneReveal delay={1.35} className="mt-6 w-full">
              <p className="max-w-[20rem] text-fluid-xs text-[var(--t-ink-muted)]">
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
/* CLOSING — the signature                                             */
/* ================================================================== */

function ClosingScene({ data, inverted }: { data: WeddingData; inverted: boolean }) {
  const names = coupleNames(data);
  const date = effectiveDate(data);
  const time = formatTime(effectiveTime(data));
  const settings = useMotionSettings();
  const { active } = useScene();
  const closingNameType = displayTypeForSet(
    [names.firstShort, names.secondShort],
    "poster",
    "0.9",
  );

  return (
    <SceneSurface surface={page(inverted, true)}>
      {/* The page settles a shade deeper as the sequence ends. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: active && settings.enabled ? 0.2 : 0 }}
        transition={{ duration: 3.4, ease: "easeInOut" }}
      />

      <SceneBody align="left" justify="end">
        <TrackingReveal
          delay={0.25}
          className="text-[0.55rem] text-[var(--t-accent)] uppercase"
          from="0.5em"
          to="0.3em"
        >
          Barakallahu lakuma
        </TrackingReveal>

        <h2 className="mt-9 w-full font-[family-name:var(--font-fashion)] text-[var(--t-ink)]">
          <span style={closingNameType} className="block">
            <TextReveal delay={0.55}>{names.firstShort}</TextReveal>
          </span>
          <motion.span
            aria-hidden
            className="my-1.5 block text-[var(--t-accent)]"
            style={{ fontSize: "clamp(1rem, 4.5vw, 1.5rem)", lineHeight: 1 }}
            initial={{ opacity: 0, x: settings.enabled ? -12 : 0 }}
            animate={active ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
            transition={{ duration: 1, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            &amp;
          </motion.span>
          <span style={closingNameType} className="block">
            <TextReveal delay={1.1}>{names.secondShort}</TextReveal>
          </span>
        </h2>

        <div className="mt-9 w-full">
          <Rule delay={1.45} />
        </div>

        {date && (
          <SceneReveal delay={1.65} className="mt-7">
            <p className="text-[0.6rem] tracking-[0.32em] text-[var(--t-ink-soft)] uppercase">
              {[formatWeekday(date), formatLongDate(date), time].filter(Boolean).join(" — ")}
            </p>
          </SceneReveal>
        )}

        {data.closingMessage && (
          <SceneReveal delay={1.9} className="mt-6 w-full">
            <p className="max-w-[22rem] text-fluid-sm leading-[1.95] text-[var(--t-ink-soft)]">
              {data.closingMessage}
            </p>
          </SceneReveal>
        )}
      </SceneBody>
    </SceneSurface>
  );
}
