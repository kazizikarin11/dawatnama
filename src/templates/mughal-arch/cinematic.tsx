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
import type { ImageAsset, RsvpAttendance, WeddingData } from "@/lib/wedding/types";
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
import { ArchClip, ArchColonnade, DrawnArch, JaliScreen } from "./decor";
import { MUGHAL, MUGHAL_ALT } from "./theme";

/**
 * TEMPLATE 04 — MUGHAL ARCH, cinematic edition
 *
 * Contemporary South Asian Islamic architecture, staged scene by scene. The
 * governing idea is that the arch is the *structure* of every scene rather than a
 * decoration placed on top of one: photographs appear as arch-shaped openings cut
 * into a sandstone wall, and the outline of each arch inks itself as the guest
 * arrives.
 *
 * Motion language: measured and architectural. Arches draw, openings rise inside
 * their frames, jali geometry holds the background, and a colonnade of small
 * arches marks the transitions. Nothing floats or drifts — everything is built.
 */

/* ------------------------------------------------------------------ */
/* Surfaces — sandstone, shaded stone, and the cool courtyard          */
/* ------------------------------------------------------------------ */

/** The default sandstone ground. */
const STONE_SURFACE: CSSProperties = {} as CSSProperties;

/** A shaded, deeper stone for the scenes that need weight. */
const SHADE_SURFACE: CSSProperties = {
  "--t-bg": "#2f2a21",
  "--t-bg-alt": "#3b3529",
  "--t-surface": "#463f31",
  "--t-ink": "#f2ecdd",
  "--t-ink-soft": "#d6cdb8",
  "--t-ink-muted": "#a29981",
  "--t-line": "rgba(242, 236, 221, 0.2)",
} as CSSProperties;

/** A cooler courtyard ground, for rhythm between two warm scenes. */
const COURTYARD_SURFACE: CSSProperties = {
  "--t-bg": "#e9e5d6",
  "--t-bg-alt": "#dbd6c3",
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

export default function MughalArchCinematic({ data, sections, mode }: TemplateProps) {
  const tokens = data.appearance.backgroundVariant === "alt" ? MUGHAL_ALT : MUGHAL;

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

/** Roman capitals between two rules — cut, not written. */
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
        "flex items-center justify-center gap-3 font-[family-name:var(--font-architectural)] text-[var(--t-accent)]",
        className,
      )}
    >
      <SceneReveal delay={delay} direction="none">
        <span className="block h-px w-8 bg-current opacity-55" />
      </SceneReveal>
      <TrackingReveal
        delay={delay + 0.08}
        className="text-[0.6rem] uppercase"
        from="0.52em"
        to="0.34em"
      >
        {children}
      </TrackingReveal>
      <SceneReveal delay={delay} direction="none">
        <span className="block h-px w-8 bg-current opacity-55" />
      </SceneReveal>
    </div>
  );
}

/**
 * The signature device: a photograph as an arch-shaped opening cut into the wall,
 * with the arch outline inked around it and the image rising inside the opening.
 */
function ArchOpening({
  image,
  className,
  delay = 0,
  variant = "tall",
  sizes = "80vw",
  priority,
  children,
}: {
  image: ImageAsset | null;
  className?: string;
  delay?: number;
  variant?: "tall" | "wide";
  sizes?: string;
  priority?: boolean;
  /** Optional content laid inside the opening, such as a caption. */
  children?: ReactNode;
}) {
  if (!image) return null;

  return (
    <div className={cn("relative", className)}>
      {/* The opening itself, clipped to the arch profile. */}
      <ArchClip variant={variant} className="h-full w-full overflow-hidden">
        <ImageReveal
          image={image}
          className="h-full w-full"
          sizes={sizes}
          priority={priority}
          delay={delay}
          from="bottom"
        />
      </ArchClip>

      {/* The outline inks itself around the opening a beat later. */}
      <DrawnArch
        className="absolute inset-0"
        variant={variant}
        delay={delay + 0.35}
        double
      />

      {children}
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

/* ================================================================== */
/* 01 — COVER: the portal is built                                     */
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
    <SceneSurface surface={COURTYARD_SURFACE}>
      {/* Layer 1 — the wall, and a hint of the courtyard beyond it */}
      {data.heroImage && (
        <div aria-hidden className="absolute inset-0">
          <SmartImage
            image={data.heroImage}
            priority
            sizes="100vw"
            className="scale-110 opacity-[0.14]"
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_2%,var(--t-bg)_72%)]" />
        </div>
      )}

      <JaliScreen opacity={0.1} scale={46} />
      <CoverCanvas template="mughal-arch" />

      {/* Layer 2 — the great arch draws itself around the whole composition */}
      <div className="pointer-events-none absolute inset-x-4 inset-y-8">
        <DrawnArch variant="tall" delay={0.5} double />
      </div>

      <SceneBody>
        {data.islamic.bismillahArabic && (
          <motion.p
            lang="ar"
            dir="rtl"
            className="text-fluid-base text-[var(--t-accent)]"
            initial={{ opacity: 0, y: settings.enabled ? 10 : 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.9, delay: 1.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {data.islamic.bismillahArabic}
          </motion.p>
        )}

        <motion.p
          className="mt-8 font-[family-name:var(--font-architectural)] text-[0.62rem] tracking-[0.42em] text-[var(--t-ink-muted)] uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.3, delay: 2.4 }}
        >
          {data.familyInvitationWording ? "Together with their families" : "The wedding of"}
        </motion.p>

        {/* Names cut into the stone — characters rise, tracking settles. */}
        <h1 className="mt-6 font-[family-name:var(--font-architectural)] text-[var(--t-ink)]">
          <span className="block" style={nameType}>
            <SplitTextReveal text={names.firstShort || "Bride"} delay={2.8} />
          </span>
          <span className="sr-only"> and </span>
          <motion.span
            aria-hidden
            className="my-1.5 flex items-center justify-center gap-3 text-[var(--t-accent)]"
            initial={{ opacity: 0, scaleX: settings.enabled ? 0.4 : 1 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 1.2, delay: 3.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="h-px w-8 bg-current opacity-50" />
            <span
              className="font-[family-name:var(--font-architectural)]"
              style={{ fontSize: "clamp(1.25rem, 5.5vw, 2rem)", lineHeight: 1 }}
            >
              &amp;
            </span>
            <span className="h-px w-8 bg-current opacity-50" />
          </motion.span>
          <span className="block" style={nameType}>
            <SplitTextReveal text={names.secondShort || "Groom"} delay={3.9} />
          </span>
        </h1>

        {parts && (
          <motion.div
            className="mt-9 flex items-center gap-3.5 font-[family-name:var(--font-architectural)] text-[var(--t-ink-soft)]"
            initial={{ opacity: 0, y: settings.enabled ? 12 : 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 4.6 }}
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
            transition={{ duration: 1, delay: 4.9 }}
          >
            {data.hijriDate}
          </motion.p>
        )}

        {/* A colonnade plinth beneath the type, built left to right. */}
        <motion.div
          className="mt-8 w-full max-w-[13rem]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 5.1 }}
        >
          <ArchColonnade count={7} delay={5.2} className="h-6" />
        </motion.div>

        <motion.div
          className="mt-9"
          initial={{ opacity: 0, y: settings.enabled ? 14 : 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 5.5 }}
        >
          <button
            type="button"
            data-cover-action
            onClick={open}
            disabled={mode === "thumbnail"}
            className="tap-target group relative overflow-hidden px-9 py-4"
          >
            <span className="relative z-10 font-[family-name:var(--font-architectural)] text-[0.62rem] tracking-[0.4em] text-[var(--t-accent)] uppercase transition-colors duration-500 group-hover:text-[var(--t-surface)]">
              Enter
            </span>
            <span aria-hidden className="absolute inset-0 border border-[var(--t-accent)]" />
            <span
              aria-hidden
              className="absolute inset-0 border border-[var(--t-accent)]"
              style={
                settings.enabled
                  ? { animation: "dawat-breathe 3.8s ease-in-out infinite" }
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
    <SceneSurface surface={STONE_SURFACE}>
      <JaliScreen opacity={0.07} scale={54} />

      <SceneBody>
        <div className="pointer-events-none absolute inset-x-8 top-10 h-24">
          <DrawnArch variant="wide" delay={0.3} double={false} />
        </div>

        {islamic.bismillahArabic && (
          <SceneReveal delay={0.35} durationScale={1.6}>
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
          <ArchColonnade count={5} delay={0.8} className="h-5" />
        </div>

        {data.familyInvitationWording && (
          <h2 className="font-[family-name:var(--font-architectural)] text-[var(--t-ink)]">
            <TextReveal delay={0.9} className="text-fluid-lg leading-snug">
              {data.familyInvitationWording}
            </TextReveal>
          </h2>
        )}

        {data.invitationMessage && (
          <SceneReveal delay={1.2} className="mt-7">
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
/* 03 — THE COUPLE: portraits as arch openings                         */
/* ================================================================== */

function PartyScene({ data, party }: { data: WeddingData; party: "bride" | "groom" }) {
  const person = data.couple[party];
  const nameType = displayType(person.name, "title", "1.1");

  return (
    <SceneSurface surface={STONE_SURFACE}>
      <JaliScreen opacity={0.08} scale={50} />

      <SceneBody className="justify-start" style={{ paddingBottom: DOCK_CLEAR }}>
        <SceneLabel delay={0.3}>{party === "bride" ? "The bride" : "The groom"}</SceneLabel>

        {/* The portrait is an opening in the wall, not a full-bleed photograph. */}
        <ArchOpening
          image={person.photo}
          className="mt-7 aspect-[3/4] w-[74%]"
          sizes="74vw"
          delay={0.5}
        />

        <ParallaxLayer depth={14} className="w-full">
          <h2
            className="mt-7 font-[family-name:var(--font-architectural)] text-[var(--t-ink)]"
            style={nameType}
          >
            <TextReveal delay={1.1}>{person.name}</TextReveal>
          </h2>

          {person.parents && (
            <SceneReveal delay={1.35} className="mt-3">
              <p className="font-[family-name:var(--font-architectural)] text-[0.62rem] tracking-[0.28em] text-[var(--t-accent)] uppercase">
                {person.parents}
              </p>
            </SceneReveal>
          )}

          {person.description && (
            <SceneReveal delay={1.5} className="mt-4">
              <p className="mx-auto max-w-xs text-fluid-sm leading-[1.9] text-[var(--t-ink-soft)]">
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
  const nameType = displayTypeForSet([bride.name, groom.name], "title", "1.1");

  return (
    <SceneSurface surface={STONE_SURFACE}>
      <JaliScreen opacity={0.08} scale={50} />

      <SceneBody>
        <SceneLabel delay={0.3}>The couple</SceneLabel>

        {photo && (
          <ArchOpening
            image={photo}
            className="mt-7 aspect-[4/5] w-[74%]"
            sizes="74vw"
            delay={0.5}
          />
        )}

        <div className="mt-7 space-y-3">
          {parties.map((person, index) => (
            <h2
              key={index}
              className="font-[family-name:var(--font-architectural)] text-[var(--t-ink)]"
              style={nameType}
            >
              <TextReveal delay={1.1 + index * 0.22}>{person.name}</TextReveal>
            </h2>
          ))}
        </div>

        {data.couple.shortDescription && (
          <SceneReveal delay={1.6} className="mt-6">
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
/* 04 — COUNTDOWN: numerals set in niches                              */
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
    <SceneSurface surface={SHADE_SURFACE}>
      <JaliScreen opacity={0.12} scale={44} />

      <SceneBody>
        <SceneLabel delay={0.2}>
          {countdown?.isPast ? "Alhamdulillah" : "Counting down"}
        </SceneLabel>

        {countdown?.isPast ? (
          <>
            <h2
              className="mt-10 font-[family-name:var(--font-architectural)] text-[var(--t-accent-soft)]"
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
          /* Each unit sits in its own niche, and the niches are built in turn. */
          <div className="mt-10 grid w-full max-w-[18rem] grid-cols-2 gap-4">
            {cells.map((cell, index) => (
              <SceneReveal
                key={cell.label}
                delay={0.4 + index * 0.14}
                direction="up"
                className="relative flex flex-col items-center justify-center px-2 pt-6 pb-4"
              >
                <span aria-hidden className="pointer-events-none absolute inset-0">
                  <DrawnArch
                    variant="wide"
                    delay={0.5 + index * 0.14}
                    double={false}
                    className="h-full w-full opacity-60"
                  />
                </span>

                <RollingNumber
                  value={cell.value}
                  digits={cell.digits}
                  className="font-[family-name:var(--font-architectural)] text-[var(--t-accent-soft)]"
                  digitClassName="text-[clamp(2.1rem,13vw,3rem)] leading-[1]"
                />
                <span className="mt-2 font-[family-name:var(--font-architectural)] text-[0.52rem] tracking-[0.3em] text-[var(--t-ink-muted)] uppercase">
                  {cell.label}
                </span>
              </SceneReveal>
            ))}
          </div>
        )}

        {date && (
          <SceneReveal delay={1.2} className="mt-10">
            <p className="font-[family-name:var(--font-architectural)] text-[0.62rem] tracking-[0.3em] text-[var(--t-ink-soft)] uppercase">
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
    <SceneSurface surface={COURTYARD_SURFACE}>
      <JaliScreen opacity={0.08} scale={58} />

      <SceneBody>
        <SceneLabel delay={0.2}>The days ahead</SceneLabel>

        <h2
          className="mt-8 font-[family-name:var(--font-architectural)] text-[var(--t-ink)]"
          style={displayType("The Celebration", "hero", "1.02")}
        >
          <TextReveal delay={0.5}>The</TextReveal>
          <TextReveal delay={0.68}>Celebration</TextReveal>
        </h2>

        {/* A colonnade, one arch per gathering. */}
        <div className="mt-10 w-full max-w-[15rem]">
          <ArchColonnade count={Math.min(Math.max(count, 3), 9)} delay={0.95} className="h-8" />
        </div>

        <SceneReveal delay={1.2} className="mt-8">
          <p className="font-[family-name:var(--font-architectural)] text-[0.62rem] tracking-[0.3em] text-[var(--t-accent)] uppercase">
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

  // Alternate stone and shade so consecutive events read as different rooms.
  const surface = ordinal % 2 === 0 ? STONE_SURFACE : SHADE_SURFACE;

  return (
    <SceneSurface surface={surface}>
      <JaliScreen opacity={0.09} scale={48} />

      <SceneBody className="justify-start" style={{ paddingBottom: DOCK_CLEAR }}>
        {parts && (
          <SceneReveal delay={0.3} className="flex items-center justify-center gap-3">
            <span className="font-[family-name:var(--font-architectural)] text-[0.58rem] tracking-[0.3em] text-[var(--t-accent)] uppercase">
              {parts.weekday}
            </span>
            <span aria-hidden className="h-3 w-px bg-[var(--t-line)]" />
            <span className="font-[family-name:var(--font-architectural)] text-[0.58rem] tracking-[0.3em] text-[var(--t-accent)] uppercase">
              {parts.day} {parts.monthShort} {parts.year}
            </span>
          </SceneReveal>
        )}

        <h2
          className="mt-4 font-[family-name:var(--font-architectural)] text-[var(--t-ink)]"
          style={titleType}
        >
          <TextReveal delay={0.48}>{event.name}</TextReveal>
        </h2>

        {event.subtitle && (
          <SceneReveal delay={0.7} className="mt-2">
            <p className="text-fluid-xs text-[var(--t-accent-soft)] italic">{event.subtitle}</p>
          </SceneReveal>
        )}

        {/* The event's photograph, framed as a wide opening. */}
        {event.image && (
          <ArchOpening
            image={event.image}
            className="mt-6 aspect-[4/3] w-[82%]"
            sizes="82vw"
            variant="wide"
            delay={0.85}
          />
        )}

        <ParallaxLayer depth={12} className="w-full">
          {time && (
            <SceneReveal delay={1.25} className="mt-6">
              <p className="font-[family-name:var(--font-architectural)] text-fluid-lg text-[var(--t-ink)]">
                {time}
              </p>
            </SceneReveal>
          )}

          {event.venue && (
            <SceneReveal delay={1.4} className="mt-3">
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
              <SceneReveal delay={1.55} direction="none">
                <span className="border border-[var(--t-line)] px-3.5 py-2 font-[family-name:var(--font-architectural)] text-[0.55rem] tracking-[0.26em] text-[var(--t-ink-soft)] uppercase">
                  {event.dressCode}
                </span>
              </SceneReveal>
            )}

            {directions && (
              <SceneReveal delay={1.65} direction="none">
                <a
                  href={directions}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap-target inline-grid place-items-center border border-[var(--t-accent)] px-5 font-[family-name:var(--font-architectural)] text-[0.55rem] tracking-[0.26em] text-[var(--t-accent)] uppercase transition-colors duration-300 hover:bg-[color-mix(in_oklab,var(--t-accent)_16%,transparent)]"
                >
                  Get directions
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
    <SceneSurface surface={SHADE_SURFACE}>
      <JaliScreen opacity={0.1} scale={46} />

      <SceneBody className="justify-start" style={{ paddingBottom: DOCK_CLEAR }}>
        <SceneLabel delay={0.3}>Where to find us</SceneLabel>

        {venue.image && (
          <ArchOpening
            image={venue.image}
            className="mt-7 aspect-[4/3] w-[84%]"
            sizes="84vw"
            variant="wide"
            delay={0.5}
          />
        )}

        <ParallaxLayer depth={12} className="w-full">
          <h2
            className="mt-7 font-[family-name:var(--font-architectural)] text-[var(--t-ink)]"
            style={displayType(venue.name, "title", "1.1")}
          >
            <TextReveal delay={1}>{venue.name}</TextReveal>
          </h2>

          {venue.address && (
            <SceneReveal delay={1.2} className="mt-3">
              <p className="mx-auto max-w-[17rem] text-fluid-sm leading-relaxed text-[var(--t-ink-soft)]">
                {venue.address}
              </p>
            </SceneReveal>
          )}

          {venue.note && (
            <SceneReveal delay={1.3} className="mt-2">
              <p className="text-fluid-xs text-[var(--t-ink-muted)] italic">{venue.note}</p>
            </SceneReveal>
          )}

          {directions && (
            <SceneReveal delay={1.45} className="mt-7">
              <a
                href={directions}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target inline-flex items-center gap-2.5 border border-[var(--t-accent)] px-7 py-3.5 font-[family-name:var(--font-architectural)] text-[0.58rem] tracking-[0.28em] text-[var(--t-accent)] uppercase transition-colors duration-300 hover:bg-[color-mix(in_oklab,var(--t-accent)_16%,transparent)]"
              >
                <motion.svg
                  viewBox="0 0 24 24"
                  className="size-3.5"
                  fill="none"
                  aria-hidden
                  initial={{ y: -6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.9, delay: 1.75, ease: [0.22, 1, 0.36, 1] }}
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
    <SceneSurface surface={STONE_SURFACE}>
      <JaliScreen opacity={0.07} scale={52} />

      <SceneBody className="justify-start">
        {milestone.date && (
          <h3
            className="mt-6 font-[family-name:var(--font-architectural)] text-[var(--t-accent)]"
            style={displayType(milestone.date, "hero", "1")}
          >
            <TextReveal delay={0.25}>{milestone.date}</TextReveal>
          </h3>
        )}

        <h2
          className="mt-3 font-[family-name:var(--font-architectural)] text-[var(--t-ink)]"
          style={displayType(milestone.title, "title", "1.15")}
        >
          <TextReveal delay={0.5}>{milestone.title}</TextReveal>
        </h2>

        {milestone.image && (
          <ArchOpening
            image={milestone.image}
            className="mt-7 aspect-[4/5] w-[74%]"
            sizes="74vw"
            delay={0.75}
          />
        )}

        {milestone.description && (
          <SceneReveal delay={1.3} className="mt-6">
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
/* GALLERY — a colonnade of openings, swiped sideways                   */
/* ================================================================== */

function GalleryScene({ data }: { data: WeddingData }) {
  const { active } = useScene();

  return (
    <SceneSurface surface={SHADE_SURFACE}>
      <JaliScreen opacity={0.1} scale={44} />

      <div className="absolute inset-x-0 top-0 z-20 pt-12">
        <SceneLabel delay={0.2}>Moments</SceneLabel>
      </div>

      {/* Each photograph is its own arch opening in a colonnade. */}
      <div
        className="snap-rail h-full w-full items-center"
        style={{ touchAction: "pan-x pan-y" }}
        aria-label="Photographs, swipe sideways"
      >
        {data.gallery.map((image, index) => (
          <figure
            key={image.id}
            className="relative flex h-full w-[80vw] shrink-0 snap-center flex-col items-center justify-center px-2 sm:w-[62vw]"
          >
            <motion.div
              className="relative aspect-[3/4] w-full"
              initial={{ opacity: 0, y: 24 }}
              animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{
                duration: 1.1,
                delay: 0.25 + index * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <ArchClip className="h-full w-full overflow-hidden">
                <SmartImage image={image} sizes="80vw" className="h-full w-full" />
              </ArchClip>
              <DrawnArch
                className="absolute inset-0"
                delay={0.5 + index * 0.08}
                double={false}
              />
            </motion.div>

            {image.caption && (
              <figcaption className="mt-5 text-center">
                <span className="font-[family-name:var(--font-architectural)] text-[0.58rem] tracking-[0.28em] text-[var(--t-ink-soft)] uppercase">
                  {image.caption}
                </span>
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      <p
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 text-center font-[family-name:var(--font-architectural)] text-[0.55rem] tracking-[0.28em] text-[var(--t-ink-muted)] uppercase"
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
    <SceneSurface surface={COURTYARD_SURFACE}>
      <JaliScreen opacity={0.09} scale={50} />

      <SceneBody>
        <div className="pointer-events-none absolute inset-x-8 top-12 h-20">
          <DrawnArch variant="wide" delay={0.25} double={false} />
        </div>

        <SceneLabel delay={0.3}>RSVP</SceneLabel>

        <h2
          className="mt-8 font-[family-name:var(--font-architectural)] text-[var(--t-ink)]"
          style={displayType(data.rsvp.headline ?? "Will you join us?", "hero", "1.08")}
        >
          <TextReveal delay={0.5}>{data.rsvp.headline ?? "Will you join us?"}</TextReveal>
        </h2>

        {data.rsvp.message && (
          <SceneReveal delay={0.85} className="mt-6">
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
            <SceneReveal key={value} delay={1.05 + index * 0.12} direction="up">
              <button
                type="button"
                onClick={() => pick(value)}
                aria-pressed={picked === value}
                className={cn(
                  "tap-target relative w-full overflow-hidden px-6 py-4",
                  "border font-[family-name:var(--font-architectural)] text-[0.6rem] tracking-[0.28em] uppercase transition-colors duration-500",
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
              className="mt-7 font-[family-name:var(--font-architectural)] text-[0.58rem] tracking-[0.28em] text-[var(--t-accent)] uppercase"
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
    <SceneSurface surface={STONE_SURFACE} className="min-h-[100svh]">
      <JaliScreen opacity={0.06} scale={54} />

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
              variant="architectural"
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
    <SceneSurface surface={COURTYARD_SURFACE}>
      <JaliScreen opacity={0.08} scale={56} />

      <SceneBody>
        <SceneLabel delay={0.3}>With love</SceneLabel>

        <div className="mt-9 space-y-4">
          {families.map((name, index) => (
            <h2
              key={name}
              className="font-[family-name:var(--font-architectural)] text-[var(--t-ink)]"
              style={displayType(name, "title", "1.2")}
            >
              <TextReveal delay={0.55 + index * 0.2}>{name}</TextReveal>
            </h2>
          ))}
        </div>

        <div className="mt-8 w-full max-w-[11rem]">
          <ArchColonnade count={5} delay={1} className="h-5" />
        </div>

        {data.gratitudeMessage && (
          <SceneReveal delay={1.15} className="mt-8">
            <p className="max-w-sm text-fluid-sm leading-[1.95] text-[var(--t-ink-soft)]">
              {data.gratitudeMessage}
            </p>
          </SceneReveal>
        )}

        {data.contacts.length > 0 && (
          <div className="mt-9 flex flex-wrap justify-center gap-x-8 gap-y-4">
            {data.contacts.map((contact, index) => (
              <SceneReveal key={contact.id} delay={1.35 + index * 0.1}>
                <p className="text-fluid-xs text-[var(--t-ink)]">{contact.name}</p>
                {contact.role && (
                  <p className="mt-0.5 font-[family-name:var(--font-architectural)] text-[0.55rem] tracking-[0.24em] text-[var(--t-ink-muted)] uppercase">
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
    <SceneSurface surface={SHADE_SURFACE}>
      <JaliScreen opacity={0.11} scale={46} />

      <SceneBody>
        <div className="pointer-events-none absolute inset-x-7 inset-y-12 opacity-70">
          <DrawnArch variant="tall" delay={0.2} double={false} />
        </div>

        {islamic.verseArabic && (
          <SceneReveal delay={0.4} durationScale={1.8}>
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
          <SceneReveal delay={0.75} className="mt-8">
            <p className="max-w-sm font-[family-name:var(--font-architectural)] text-fluid-base leading-relaxed text-[var(--t-ink-soft)]">
              &ldquo;{islamic.verseTranslation}&rdquo;
            </p>
          </SceneReveal>
        )}

        {islamic.verseReference && (
          <SceneReveal delay={1} className="mt-6">
            <p className="font-[family-name:var(--font-architectural)] text-[0.58rem] tracking-[0.3em] text-[var(--t-accent)] uppercase">
              {islamic.verseReference}
            </p>
          </SceneReveal>
        )}

        {islamic.duaText && (
          <>
            <div className="mt-9 w-full max-w-[9rem]">
              <ArchColonnade count={5} delay={1.15} className="h-5" />
            </div>
            <SceneReveal delay={1.35} className="mt-6">
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
/* CLOSING — the last arch                                             */
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
    <SceneSurface surface={SHADE_SURFACE}>
      <JaliScreen opacity={0.13} scale={42} />

      {/* The final arch closes around the names. */}
      <div className="pointer-events-none absolute inset-x-5 inset-y-10">
        <DrawnArch variant="tall" delay={1.6} double />
      </div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: active && settings.enabled ? 0.26 : 0 }}
        transition={{ duration: 3.6, ease: "easeInOut" }}
      />

      <SceneBody>
        <SceneLabel delay={0.25}>Barakallahu lakuma</SceneLabel>

        <h2 className="mt-10 font-[family-name:var(--font-architectural)] text-[var(--t-ink)]">
          <span style={closingNameType} className="block">
            <TextReveal delay={0.6}>{names.firstShort}</TextReveal>
          </span>
          <motion.span
            aria-hidden
            className="my-1.5 flex items-center justify-center gap-3 text-[var(--t-accent)]"
            initial={{ opacity: 0, scaleX: 0.4 }}
            animate={active ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0.4 }}
            transition={{ duration: 1.1, delay: 0.95, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="h-px w-7 bg-current opacity-50" />
            <span style={{ fontSize: "clamp(1.2rem, 5vw, 1.85rem)", lineHeight: 1 }}>
              &amp;
            </span>
            <span className="h-px w-7 bg-current opacity-50" />
          </motion.span>
          <span style={closingNameType} className="block">
            <TextReveal delay={1.15}>{names.secondShort}</TextReveal>
          </span>
        </h2>

        <div className="mt-9 w-full max-w-[12rem]">
          <ArchColonnade count={7} delay={1.5} className="h-6" />
        </div>

        {date && (
          <SceneReveal delay={1.75} className="mt-7">
            <p className="font-[family-name:var(--font-architectural)] text-[0.62rem] tracking-[0.32em] text-[var(--t-ink-soft)] uppercase">
              {[formatWeekday(date), formatLongDate(date), time].filter(Boolean).join(" · ")}
            </p>
          </SceneReveal>
        )}

        {data.closingMessage && (
          <SceneReveal delay={2} className="mt-7">
            <p className="max-w-sm text-fluid-sm leading-[1.95] text-[var(--t-ink-soft)]">
              {data.closingMessage}
            </p>
          </SceneReveal>
        )}
      </SceneBody>
    </SceneSurface>
  );
}
