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
import { BotanicalStem, Petals, ScriptAccent } from "./decor";
import { IVORY_ROSE, IVORY_ROSE_ALT } from "./theme";

/**
 * TEMPLATE 02 — IVORY & ROSE, cinematic edition
 *
 * A romantic fashion editorial staged scene by scene. Where Royal Emerald is
 * dark and ceremonial, this template lives in warm paper light: soft image masks
 * that slide open, botanical linework that draws itself in the margin, drifting
 * petals, slow photographic zooms, and crossfades rather than hard cuts. The
 * palette stays warm throughout — ivory grounds, dusty rose accents — and only
 * dips into a deeper blush for the most photographic beats.
 *
 * Motion language: soft, unhurried, editorial. Names arrive with a light
 * character reveal; a single handwritten word is the signature flourish.
 */

/* ------------------------------------------------------------------ */
/* Surfaces — the palette stays warm, lifting for photographic beats   */
/* ------------------------------------------------------------------ */

/** The default warm paper ground for reading scenes. */
const PAPER_SURFACE: CSSProperties = {} as CSSProperties;

/** A blush-shadowed ground behind full-bleed photography. */
const BLUSH_SURFACE: CSSProperties = {
  "--t-bg": "#efd9d2",
  "--t-bg-alt": "#e7cabf",
  "--t-ink": "#3a2e2a",
  "--t-ink-soft": "#5b4a44",
  "--t-ink-muted": "#8d7a73",
} as CSSProperties;

/** A soft sandy alt-ground so consecutive light scenes still have rhythm. */
const SAND_SURFACE: CSSProperties = {
  "--t-bg": "#f4ebe1",
  "--t-bg-alt": "#ece0d2",
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

export default function IvoryRoseCinematic({ data, sections, mode }: TemplateProps) {
  const tokens =
    data.appearance.backgroundVariant === "alt" ? IVORY_ROSE_ALT : IVORY_ROSE;

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

/** Editorial section label: a rule, a numeral in italic, small caps. */
function SceneLabel({
  children,
  index,
  delay = 0,
  className,
}: {
  children: ReactNode;
  index?: string;
  delay?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-center gap-3.5 text-[var(--t-accent)]", className)}>
      {index && (
        <SceneReveal delay={delay} direction="none">
          <span className="font-[family-name:var(--font-editorial)] text-fluid-sm italic">
            {index}
          </span>
        </SceneReveal>
      )}
      <SceneReveal delay={delay} direction="none">
        <span className="block h-px w-9 bg-current opacity-50" />
      </SceneReveal>
      <TrackingReveal
        delay={delay + 0.08}
        className="text-[0.6rem] uppercase"
        from="0.5em"
        to="0.32em"
      >
        {children}
      </TrackingReveal>
      <SceneReveal delay={delay} direction="none">
        <span className="block h-px w-9 bg-current opacity-50" />
      </SceneReveal>
    </div>
  );
}

/** A thin rose rule with a small centred diamond. */
function RoseRule({ delay = 0, width = "9rem" }: { delay?: number; width?: string }) {
  return (
    <SceneReveal delay={delay} direction="none" className="flex justify-center">
      <span
        className="flex items-center gap-3 text-[var(--t-accent)]"
        style={{ width }}
      >
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-current opacity-50" />
        <span className="size-1.5 rotate-45 bg-current opacity-70" />
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-current opacity-50" />
      </span>
    </SceneReveal>
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
        "relative flex h-full flex-col items-center justify-center px-8 text-center",
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
    stage.open();
    openDeck();
  }, [stage, openDeck]);

  const nameType = displayTypeForSet([names.firstShort, names.secondShort], "poster");

  return (
    <SceneSurface surface={SAND_SURFACE}>
      {/* Layer 1 — a soft photographic wash */}
      {data.heroImage && (
        <div aria-hidden className="absolute inset-0">
          <SmartImage
            image={data.heroImage}
            priority
            sizes="100vw"
            className="scale-110 opacity-[0.16]"
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_2%,var(--t-bg)_70%)]" />
        </div>
      )}

      <CoverCanvas template="ivory-rose" />
      <Petals count={7} />

      {/* Layer 2 — botanical stems draw down the margins */}
      <BotanicalStem className="absolute -top-4 left-1 h-44 w-24 opacity-60" delay={2.6} />
      <BotanicalStem
        className="absolute right-1 -bottom-4 h-44 w-24 rotate-180 opacity-60"
        delay={2.9}
      />

      <SceneBody>
        {data.islamic.bismillahArabic && (
          <motion.p
            lang="ar"
            dir="rtl"
            className="text-fluid-base text-[var(--t-accent)]"
            initial={{ opacity: 0, y: settings.enabled ? 8 : 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {data.islamic.bismillahArabic}
          </motion.p>
        )}

        <motion.p
          className="mt-8 text-[0.62rem] tracking-[0.4em] text-[var(--t-ink-muted)] uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, delay: 1.4 }}
        >
          {data.familyInvitationWording ? "Together with their families" : "The wedding of"}
        </motion.p>

        {/* Names — a light editorial character reveal with a script ampersand. */}
        <h1 className="mt-6 font-[family-name:var(--font-editorial)] font-light text-[var(--t-ink)]">
          <span className="block" style={nameType}>
            <SplitTextReveal text={names.firstShort || "Bride"} delay={1.9} />
          </span>
          <span className="sr-only"> and </span>
          <motion.span
            aria-hidden
            className="my-0.5 block font-[family-name:var(--font-script)] text-[var(--t-accent)]"
            style={{ fontSize: "clamp(2.4rem, 12vw, 4rem)", lineHeight: 1 }}
            initial={{ opacity: 0, scale: settings.enabled ? 0.7 : 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.3, delay: 2.7, ease: [0.22, 1, 0.36, 1] }}
          >
            &amp;
          </motion.span>
          <span className="block" style={nameType}>
            <SplitTextReveal text={names.secondShort || "Groom"} delay={3} />
          </span>
        </h1>

        <div className="mt-8">
          <RoseRule delay={3.8} width="7rem" />
        </div>

        {parts && (
          <motion.div
            className="mt-7 flex items-center gap-3.5 text-[var(--t-ink-soft)]"
            initial={{ opacity: 0, y: settings.enabled ? 12 : 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 4 }}
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
            transition={{ duration: 1, delay: 4.3 }}
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
            className="tap-target group relative overflow-hidden rounded-full px-9 py-4"
          >
            <span className="relative z-10 text-[0.6rem] tracking-[0.38em] text-[var(--t-accent)] uppercase transition-colors duration-500 group-hover:text-[var(--t-surface)]">
              Open invitation
            </span>
            <span aria-hidden className="absolute inset-0 rounded-full border border-[var(--t-accent)]" />
            <span
              aria-hidden
              className="absolute inset-0 scale-x-0 rounded-full bg-[var(--t-accent)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
              style={{ transformOrigin: "left" }}
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
    <SceneSurface surface={PAPER_SURFACE}>
      <BotanicalStem className="absolute -top-4 right-2 h-36 w-20 rotate-12 opacity-40" delay={0.4} />

      <SceneBody>
        {islamic.bismillahArabic && (
          <SceneReveal delay={0.25} durationScale={1.6}>
            <p lang="ar" dir="rtl" className="text-fluid-xl leading-[1.9] text-[var(--t-ink)]">
              {islamic.bismillahArabic}
            </p>
          </SceneReveal>
        )}

        {islamic.bismillahTranslation && (
          <SceneReveal delay={0.5} className="mt-5">
            <p className="max-w-xs text-fluid-xs leading-relaxed text-[var(--t-ink-muted)] italic">
              {islamic.bismillahTranslation}
            </p>
          </SceneReveal>
        )}

        <div className="my-9">
          <RoseRule delay={0.7} />
        </div>

        {data.familyInvitationWording && (
          <h2 className="font-[family-name:var(--font-editorial)] font-light text-[var(--t-ink)]">
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
    <SceneSurface surface={BLUSH_SURFACE}>
      <ImageReveal
        image={person.photo}
        className="absolute inset-0"
        sizes="100vw"
        from={party === "bride" ? "left" : "right"}
        overlay={
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-[color-mix(in_oklab,var(--t-bg)_35%,transparent)] to-transparent" />
        }
      />

      <Petals count={5} />

      <div
        className="relative mt-auto px-8 text-center"
        style={{ paddingBottom: DOCK_CLEAR }}
      >
        <ParallaxLayer depth={24}>
          <SceneLabel delay={0.5}>{party === "bride" ? "The bride" : "The groom"}</SceneLabel>

          <h2
            className="mt-6 font-[family-name:var(--font-editorial)] font-light text-[var(--t-ink)]"
            style={nameType}
          >
            <TextReveal delay={0.7}>{person.name}</TextReveal>
          </h2>

          {person.parents && (
            <SceneReveal delay={1} className="mt-4">
              <p className="text-[0.62rem] tracking-[0.26em] text-[var(--t-accent)] uppercase">
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
    <SceneSurface surface={BLUSH_SURFACE}>
      {photo && (
        <ImageReveal
          image={photo}
          className="absolute inset-0"
          sizes="100vw"
          overlay={<div className="absolute inset-0 bg-[var(--t-bg)]/60" />}
        />
      )}
      <Petals count={6} />

      <SceneBody>
        <SceneLabel delay={0.3}>The couple</SceneLabel>

        <div className="mt-9 space-y-5">
          {parties.map((person, index) => (
            <h2
              key={index}
              className="font-[family-name:var(--font-editorial)] font-light text-[var(--t-ink)]"
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
    { value: countdown?.days ?? null, label: "Days", digits: (countdown?.days ?? 0) >= 100 ? 3 : 2 },
    { value: countdown?.hours ?? null, label: "Hours", digits: 2 },
    { value: countdown?.minutes ?? null, label: "Minutes", digits: 2 },
    { value: countdown?.seconds ?? null, label: "Seconds", digits: 2 },
  ];

  return (
    <SceneSurface surface={SAND_SURFACE}>
      <BotanicalStem className="absolute top-6 -left-3 h-40 w-20 opacity-30" delay={0.4} />
      <BotanicalStem className="absolute -right-3 bottom-6 h-40 w-20 rotate-180 opacity-30" delay={0.6} />

      <SceneBody>
        <SceneLabel delay={0.2}>{countdown?.isPast ? "Alhamdulillah" : "Counting down"}</SceneLabel>

        {countdown?.isPast ? (
          <>
            <h2
              className="mt-10 font-[family-name:var(--font-editorial)] font-light text-[var(--t-accent)]"
              style={displayType(countdown.isToday ? "Today" : "Thank you", "hero")}
            >
              <TextReveal delay={0.5}>{countdown.isToday ? "Today is the day" : "Thank you"}</TextReveal>
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
          <div className="mt-10 grid w-full max-w-[17rem] grid-cols-2 gap-x-8 gap-y-7">
            {cells.map((cell, index) => (
              <SceneReveal
                key={cell.label}
                delay={0.4 + index * 0.12}
                direction="up"
                className="flex flex-col items-center"
              >
                <RollingNumber
                  value={cell.value}
                  digits={cell.digits}
                  className="font-[family-name:var(--font-editorial)] font-light text-[var(--t-ink)]"
                  digitClassName="text-[clamp(2.5rem,16vw,3.5rem)] leading-[1]"
                />
                <span className="mt-2 text-[0.55rem] tracking-[0.32em] text-[var(--t-accent)] uppercase">
                  {cell.label}
                </span>
              </SceneReveal>
            ))}
          </div>
        )}

        {date && (
          <SceneReveal delay={1.1} className="mt-11">
            <p className="text-[0.62rem] tracking-[0.3em] text-[var(--t-ink-soft)] uppercase">
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
    <SceneSurface surface={PAPER_SURFACE}>
      <SceneBody>
        <SceneLabel delay={0.2}>The days ahead</SceneLabel>

        <h2 className="mt-8 font-[family-name:var(--font-editorial)] font-light text-[var(--t-ink)]">
          <span style={displayType("Celebration", "hero", "1.02")} className="block">
            <TextReveal delay={0.5}>The</TextReveal>
          </span>
          <ScriptAccent className="mt-1 block text-[clamp(2.6rem,15vw,4.5rem)] leading-[0.9]">
            <TextReveal delay={0.68}>Celebration</TextReveal>
          </ScriptAccent>
        </h2>

        <div className="mt-9">
          <RoseRule delay={0.95} />
        </div>

        <SceneReveal delay={1.1} className="mt-8">
          <p className="text-[0.62rem] tracking-[0.3em] text-[var(--t-accent)] uppercase">
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
  const from = ordinal % 2 === 0 ? "left" : "right";

  return (
    <SceneSurface surface={BLUSH_SURFACE}>
      {event.image ? (
        <ImageReveal
          image={event.image}
          className="absolute inset-0"
          sizes="100vw"
          from={from}
          overlay={
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-[color-mix(in_oklab,var(--t-bg)_45%,transparent)] to-[color-mix(in_oklab,var(--t-bg)_20%,transparent)]" />
          }
        />
      ) : (
        <>
          <BotanicalStem className="absolute top-8 -left-3 h-44 w-24 opacity-40" delay={0.3} />
          <Petals count={5} />
        </>
      )}

      <div
        className="relative flex h-full flex-col justify-end px-8 text-center"
        style={{ paddingBottom: DOCK_CLEAR }}
      >
        <ParallaxLayer depth={20}>
          {parts && (
            <SceneReveal delay={0.45} className="flex items-center justify-center gap-3">
              <span className="text-[0.58rem] tracking-[0.28em] text-[var(--t-accent)] uppercase">
                {parts.weekday}
              </span>
              <span aria-hidden className="h-3 w-px bg-[var(--t-line)]" />
              <span className="text-[0.58rem] tracking-[0.28em] text-[var(--t-accent)] uppercase">
                {parts.day} {parts.monthShort} {parts.year}
              </span>
            </SceneReveal>
          )}

          <h2
            className="mt-5 font-[family-name:var(--font-editorial)] font-light text-[var(--t-ink)]"
            style={titleType}
          >
            <TextReveal delay={0.62}>{event.name}</TextReveal>
          </h2>

          {event.subtitle && (
            <SceneReveal delay={0.85} className="mt-2.5">
              <ScriptAccent className="text-fluid-base">{event.subtitle}</ScriptAccent>
            </SceneReveal>
          )}

          <div className="mt-6">
            <RoseRule delay={1} width="7rem" />
          </div>

          {time && (
            <SceneReveal delay={1.15} className="mt-6">
              <p className="font-[family-name:var(--font-editorial)] text-fluid-lg text-[var(--t-ink)]">
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
                <span className="rounded-full border border-[var(--t-line)] px-4 py-2 text-[0.55rem] tracking-[0.24em] text-[var(--t-ink-soft)] uppercase">
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
                  className="tap-target inline-grid place-items-center rounded-full border border-[var(--t-accent)] px-5 text-[0.55rem] tracking-[0.24em] text-[var(--t-accent)] uppercase transition-colors duration-300 hover:bg-[color-mix(in_oklab,var(--t-accent)_16%,transparent)]"
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
    <SceneSurface surface={BLUSH_SURFACE}>
      {venue.image ? (
        <ImageReveal
          image={venue.image}
          className="absolute inset-0"
          sizes="100vw"
          overlay={
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-[color-mix(in_oklab,var(--t-bg)_40%,transparent)] to-transparent" />
          }
        />
      ) : (
        <BotanicalStem className="absolute top-8 -left-3 h-44 w-24 opacity-40" delay={0.3} />
      )}

      <SceneBody className="justify-end" style={{ paddingBottom: DOCK_CLEAR }}>
        <ParallaxLayer depth={16}>
          <SceneLabel delay={0.4}>Where to find us</SceneLabel>

          <h2
            className="mt-6 font-[family-name:var(--font-editorial)] font-light text-[var(--t-ink)]"
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
                className="tap-target inline-flex items-center gap-2.5 rounded-full border border-[var(--t-accent)] px-7 py-3.5 text-[0.58rem] tracking-[0.28em] text-[var(--t-accent)] uppercase transition-colors duration-300 hover:bg-[color-mix(in_oklab,var(--t-accent)_16%,transparent)]"
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
    <SceneSurface surface={PAPER_SURFACE}>
      <SceneBody className="justify-start">
        {milestone.date && (
          <h3
            className="mt-6 font-[family-name:var(--font-script)] text-[var(--t-accent)]"
            style={{ fontSize: "clamp(2.4rem, 14vw, 4rem)", lineHeight: 1 }}
          >
            <TextReveal delay={0.25}>{milestone.date}</TextReveal>
          </h3>
        )}

        <h2
          className="mt-3 font-[family-name:var(--font-editorial)] font-light text-[var(--t-ink)]"
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
    <SceneSurface surface={BLUSH_SURFACE}>
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
              initial={{ opacity: 0, scale: 1.06 }}
              animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.06 }}
              transition={{ duration: 1.3, delay: 0.25 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <SmartImage image={image} sizes="86vw" className="opacity-95" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-transparent to-[color-mix(in_oklab,var(--t-bg)_35%,transparent)]" />
            </motion.div>

            {image.caption && (
              <figcaption
                className="absolute inset-x-0 bottom-0 px-7 text-center"
                style={{ paddingBottom: "max(4.5rem, env(safe-area-inset-bottom))" }}
              >
                <ScriptAccent className="text-fluid-base">{image.caption}</ScriptAccent>
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      <p
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 text-center text-[0.55rem] tracking-[0.28em] text-[var(--t-ink-muted)] uppercase"
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
    <SceneSurface surface={SAND_SURFACE}>
      <BotanicalStem className="absolute top-6 -left-3 h-40 w-20 opacity-35" delay={0.4} />
      <Petals count={6} />

      <SceneBody>
        <SceneLabel delay={0.2}>RSVP</SceneLabel>

        <h2 className="mt-8 font-[family-name:var(--font-editorial)] font-light text-[var(--t-ink)]">
          <span style={displayType(data.rsvp.headline ?? "Will you join us?", "hero", "1.08")} className="block">
            <TextReveal delay={0.45}>{data.rsvp.headline ?? "Will you join us?"}</TextReveal>
          </span>
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
                  "tap-target relative w-full overflow-hidden rounded-full px-6 py-4",
                  "border text-[0.6rem] tracking-[0.28em] uppercase transition-colors duration-500",
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
                  transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
                />
              </button>
            </SceneReveal>
          ))}
        </div>

        <AnimatePresence>
          {picked && (
            <motion.p
              className="mt-7 text-[0.58rem] tracking-[0.28em] text-[var(--t-accent)] uppercase"
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
    <SceneSurface surface={PAPER_SURFACE} className="min-h-[100svh]">
      <div
        className="relative w-full px-8"
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
              variant="editorial"
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
    <SceneSurface surface={PAPER_SURFACE}>
      <BotanicalStem className="absolute -top-4 right-2 h-36 w-20 rotate-12 opacity-35" delay={0.4} />

      <SceneBody>
        <SceneLabel delay={0.3}>With love</SceneLabel>

        <div className="mt-9 space-y-4">
          {families.map((name, index) => (
            <h2
              key={name}
              className="font-[family-name:var(--font-editorial)] font-light text-[var(--t-ink)]"
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

/* ================================================================== */
/* VERSE                                                               */
/* ================================================================== */

function VerseScene({ data }: { data: WeddingData }) {
  const { islamic } = data;

  return (
    <SceneSurface surface={SAND_SURFACE}>
      <SceneBody>
        {islamic.verseArabic && (
          <SceneReveal delay={0.3} durationScale={1.8}>
            <p lang="ar" dir="rtl" className="text-fluid-xl leading-[2.1] text-[var(--t-ink)]">
              {islamic.verseArabic}
            </p>
          </SceneReveal>
        )}

        {islamic.verseTranslation && (
          <SceneReveal delay={0.7} className="mt-8">
            <p className="max-w-sm font-[family-name:var(--font-editorial)] text-fluid-base leading-relaxed text-[var(--t-ink-soft)] italic">
              &ldquo;{islamic.verseTranslation}&rdquo;
            </p>
          </SceneReveal>
        )}

        {islamic.verseReference && (
          <SceneReveal delay={0.95} className="mt-6">
            <p className="text-[0.58rem] tracking-[0.3em] text-[var(--t-accent)] uppercase">
              {islamic.verseReference}
            </p>
          </SceneReveal>
        )}

        {islamic.duaText && (
          <>
            <div className="mt-10">
              <RoseRule delay={1.1} width="8rem" />
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
/* CLOSING                                                             */
/* ================================================================== */

function ClosingScene({ data }: { data: WeddingData }) {
  const names = coupleNames(data);
  const date = effectiveDate(data);
  const time = formatTime(effectiveTime(data));
  const { active } = useScene();
  const settings = useMotionSettings();
  const closingNameType = displayTypeForSet([names.firstShort, names.secondShort], "poster");

  return (
    <SceneSurface surface={SAND_SURFACE}>
      <Petals count={9} />
      <BotanicalStem className="absolute -top-4 left-1 h-44 w-24 opacity-45" delay={1.6} />
      <BotanicalStem className="absolute right-1 -bottom-4 h-44 w-24 rotate-180 opacity-45" delay={1.9} />

      <SceneBody>
        <SceneLabel delay={0.25}>Barakallahu lakuma</SceneLabel>

        <h1 className="mt-10 font-[family-name:var(--font-editorial)] font-light text-[var(--t-ink)]">
          <span style={closingNameType} className="block">
            <TextReveal delay={0.6}>{names.firstShort}</TextReveal>
          </span>
          <motion.span
            aria-hidden
            className="my-0.5 block font-[family-name:var(--font-script)] text-[var(--t-accent)]"
            style={{ fontSize: "clamp(2.2rem, 11vw, 3.5rem)", lineHeight: 1 }}
            initial={{ opacity: 0, scale: settings.enabled ? 0.7 : 1 }}
            animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
            transition={{ duration: 1.1, delay: 0.95, ease: [0.22, 1, 0.36, 1] }}
          >
            &amp;
          </motion.span>
          <span style={closingNameType} className="block">
            <TextReveal delay={1.15}>{names.secondShort}</TextReveal>
          </span>
        </h1>

        <div className="mt-9">
          <RoseRule delay={1.5} width="10rem" />
        </div>

        {date && (
          <SceneReveal delay={1.7} className="mt-8">
            <p className="text-[0.62rem] tracking-[0.3em] text-[var(--t-ink-soft)] uppercase">
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
