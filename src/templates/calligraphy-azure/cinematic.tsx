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
import { GoldLeaf, InkBleed, InkFlourish, ManuscriptFrame, Swash } from "./decor";
import { AZURE, AZURE_ALT } from "./theme";

/**
 * TEMPLATE 10 — CALLIGRAPHY AZURE
 *
 * The only template where the writing is the subject. Its rule is that nothing
 * simply appears: every mark is inscribed. Swashes draw as a pen would move,
 * ink bleeds outward into the page, and gold leaf catches on the margin of an
 * illuminated manuscript.
 *
 * The Arabic is set in Amiri at a genuinely large size and given room to breathe,
 * because in this design it is the composition rather than a blessing placed above
 * it. The abstract flourishes are deliberately *not* letterforms, so scripture is
 * never reduced to decoration.
 */

const LAPIS: CSSProperties = {} as CSSProperties;

const DEEP_LAPIS: CSSProperties = {
  "--t-bg": "#081428",
  "--t-bg-alt": "#0E2246",
} as CSSProperties;

/** The paper surface: lapis ink written on a warm page. */
const PAGE: CSSProperties = {
  "--t-bg": "#F6F4EC",
  "--t-bg-alt": "#E9E6DA",
  "--t-surface": "#FCFBF5",
  "--t-ink": "#0E1F3C",
  "--t-ink-soft": "#2E4165",
  "--t-ink-muted": "#6F7C92",
  "--t-line": "rgba(14, 31, 60, 0.22)",
} as CSSProperties;

export default function CalligraphyAzureCinematic(props: TemplateProps) {
  const tokens = props.data.appearance.backgroundVariant === "alt" ? AZURE_ALT : AZURE;

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

const DISPLAY = "font-[family-name:var(--font-display)] font-light";
const ARABIC = "font-[family-name:var(--font-arabic)]";

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
        <span className="block size-1 rounded-full bg-current" />
      </SceneReveal>
      <TrackingReveal delay={delay + 0.08} className="text-[0.6rem] uppercase" from="0.5em" to="0.32em">
        {children}
      </TrackingReveal>
      <SceneReveal delay={delay} direction="none">
        <span className="block size-1 rounded-full bg-current" />
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

  const nameType = displayTypeForSet([names.firstShort, names.secondShort], "poster");

  return (
    <SceneSurface surface={DEEP_LAPIS}>
      {data.heroImage && (
        <div aria-hidden className="absolute inset-0">
          <SmartImage image={data.heroImage} priority sizes="100vw" className="scale-110 opacity-[0.14]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,transparent_3%,var(--t-bg)_74%)]" />
        </div>
      )}

      <CoverCanvas template="calligraphy-azure" />
      <GoldLeaf count={14} />
      <InkBleed delay={0.4} />

      {/**
       * The flourish is written in the empty lower corner, inside the ruled
       * margin. Placed top-right it drew a loose spiral straight through the
       * Bismillah and out past the frame.
       */}
      <InkFlourish
        className="absolute bottom-10 -left-8 h-56 w-56 opacity-35"
        delay={0.8}
      />

      {/* The ruled margin of an illuminated page. */}
      <div className="pointer-events-none absolute inset-x-4 inset-y-7">
        <ManuscriptFrame delay={0.5} />
      </div>

      <SceneBody>
        {/* Here the Bismillah is the hero, not a caption. */}
        {data.islamic.bismillahArabic && (
          <motion.p
            lang="ar"
            dir="rtl"
            className={cn("text-[var(--t-accent-soft)]", ARABIC)}
            style={{ fontSize: "clamp(1.5rem, 8vw, 2.5rem)", lineHeight: 1.9 }}
            initial={{ opacity: 0, filter: "blur(7px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 2.6, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            {data.islamic.bismillahArabic}
          </motion.p>
        )}

        <motion.div
          className="mt-4 w-full max-w-[14rem]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.9 }}
        >
          <Swash delay={2} />
        </motion.div>

        <motion.p
          className="mt-5 text-[0.62rem] tracking-[0.4em] text-[var(--t-accent)] uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.3, delay: 2.5 }}
        >
          {data.familyInvitationWording ? "Together with their families" : "The wedding of"}
        </motion.p>

        <h1 className={cn("mt-4 text-[var(--t-ink)]", DISPLAY)}>
          <span className="block" style={nameType}>
            <SplitTextReveal text={names.firstShort || "Bride"} delay={2.9} />
          </span>
          <span className="sr-only"> and </span>
          <motion.span
            aria-hidden
            className={cn("my-1 block text-[var(--t-accent)]", DISPLAY)}
            style={{ fontSize: "clamp(1.5rem, 7vw, 2.4rem)", lineHeight: 1 }}
            initial={{ opacity: 0, scale: settings.enabled ? 0.7 : 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 3.65, ease: [0.22, 1, 0.36, 1] }}
          >
            &amp;
          </motion.span>
          <span className="block" style={nameType}>
            <SplitTextReveal text={names.secondShort || "Groom"} delay={3.95} />
          </span>
        </h1>

        {parts && (
          <motion.div
            className="mt-7 flex items-center gap-3.5 text-[var(--t-ink-soft)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
            className="mt-2 text-[0.58rem] tracking-[0.3em] text-[var(--t-accent)] uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 4.8 }}
          >
            {data.hijriDate}
          </motion.p>
        )}

        <motion.div
          className="mt-9"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 5.1 }}
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
            <span aria-hidden className="absolute inset-0 rounded-sm border border-[var(--t-accent)]" />
            <span
              aria-hidden
              className="absolute inset-0 rounded-sm border border-[var(--t-accent-soft)]"
              style={settings.enabled ? { animation: "dawat-breathe 3.8s ease-in-out infinite" } : undefined}
            />
            <span
              aria-hidden
              className="absolute inset-0 origin-right scale-x-0 rounded-sm bg-[color-mix(in_oklab,var(--t-accent)_20%,transparent)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
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
    <SceneSurface surface={PAGE}>
      <div className="pointer-events-none absolute inset-x-5 inset-y-8">
        <ManuscriptFrame delay={0.3} />
      </div>
      <InkFlourish className="absolute -bottom-8 -left-10 h-64 w-64 opacity-30" delay={0.7} />

      <SceneBody>
        {islamic.bismillahTranslation && (
          <SceneReveal delay={0.55} className="mt-2">
            <p className="max-w-xs text-fluid-xs leading-relaxed text-[var(--t-ink-muted)]">
              {islamic.bismillahTranslation}
            </p>
          </SceneReveal>
        )}

        <div className="my-7 w-full max-w-[12rem]">
          <Swash delay={0.8} mirrored />
        </div>

        {data.familyInvitationWording && (
          <h2 className={cn("text-[var(--t-ink)]", DISPLAY)}>
            <TextReveal delay={1} className="text-fluid-lg leading-snug">
              {data.familyInvitationWording}
            </TextReveal>
          </h2>
        )}

        {data.invitationMessage && (
          <SceneReveal delay={1.3} className="mt-6">
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
    <SceneSurface surface={DEEP_LAPIS}>
      <ImageReveal
        image={person.photo}
        className="absolute inset-0"
        sizes="100vw"
        from="bottom"
        overlay={
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-[color-mix(in_oklab,var(--t-bg)_50%,transparent)] to-[color-mix(in_oklab,var(--t-bg)_24%,transparent)]" />
        }
      />
      <GoldLeaf count={9} />

      <div className="relative mt-auto px-7 text-center" style={{ paddingBottom: DOCK_CLEAR }}>
        <ParallaxLayer depth={22}>
          <SceneLabel delay={0.5}>{party === "bride" ? "The bride" : "The groom"}</SceneLabel>

          <h2
            className={cn("mt-5 text-[var(--t-ink)]", DISPLAY)}
            style={displayType(person.name, "hero", "1.05")}
          >
            <TextReveal delay={0.7}>{person.name}</TextReveal>
          </h2>

          <div className="mx-auto mt-3 w-full max-w-[10rem]">
            <Swash delay={0.95} />
          </div>

          {person.parents && (
            <SceneReveal delay={1.15} className="mt-3">
              <p className="text-[0.62rem] tracking-[0.28em] text-[var(--t-accent)] uppercase">
                {person.parents}
              </p>
            </SceneReveal>
          )}

          {person.description && (
            <SceneReveal delay={1.3} className="mt-4">
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
    <SceneSurface surface={DEEP_LAPIS}>
      {photo && (
        <ImageReveal
          image={photo}
          className="absolute inset-0"
          sizes="100vw"
          overlay={<div className="absolute inset-0 bg-[var(--t-bg)]/70" />}
        />
      )}
      <GoldLeaf count={11} />

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
    <SceneSurface surface={LAPIS}>
      <GoldLeaf count={13} />
      <InkBleed delay={0.5} />

      <SceneBody>
        <SceneLabel delay={0.2}>{countdown?.isPast ? "Alhamdulillah" : "Counting down"}</SceneLabel>

        {countdown?.isPast ? (
          <>
            <h2
              className={cn("mt-10 text-[var(--t-accent-soft)]", DISPLAY)}
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
          /* Numerals written on ruled lines, as in a manuscript. */
          <div className="mt-9 w-full max-w-[17rem] space-y-3">
            {cells.map((cell, index) => (
              <SceneReveal key={cell.label} delay={0.4 + index * 0.13} direction="up">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[0.56rem] tracking-[0.32em] text-[var(--t-accent)] uppercase">
                    {cell.label}
                  </span>
                  <RollingNumber
                    value={cell.value}
                    digits={cell.digits}
                    className={cn("text-[var(--t-ink)]", DISPLAY)}
                    digitClassName="text-[clamp(2.3rem,14vw,3.3rem)] leading-[1]"
                  />
                </div>
                <span aria-hidden className="mt-1 block h-px w-full bg-[var(--t-line)]" />
              </SceneReveal>
            ))}
          </div>
        )}

        {date && (
          <SceneReveal delay={1.1} className="mt-8">
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
    <SceneSurface surface={PAGE}>
      <div className="pointer-events-none absolute inset-x-5 inset-y-8">
        <ManuscriptFrame delay={0.3} />
      </div>
      <InkFlourish className="absolute -top-8 -right-12 h-64 w-64 opacity-30" delay={0.6} />

      <SceneBody>
        <SceneLabel delay={0.4}>The days ahead</SceneLabel>

        <h2
          className={cn("mt-6 text-[var(--t-ink)]", DISPLAY)}
          style={displayType("The Celebration", "hero", "1.02")}
        >
          <TextReveal delay={0.65}>The</TextReveal>
          <TextReveal delay={0.82}>Celebration</TextReveal>
        </h2>

        <div className="mt-7 w-full max-w-[12rem]">
          <Swash delay={1.05} />
        </div>

        <SceneReveal delay={1.3} className="mt-5">
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
    <SceneSurface surface={DEEP_LAPIS}>
      {event.image ? (
        <ImageReveal
          image={event.image}
          className="absolute inset-0"
          sizes="100vw"
          from={ordinal % 2 === 0 ? "bottom" : "right"}
          overlay={
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-[color-mix(in_oklab,var(--t-bg)_54%,transparent)] to-[color-mix(in_oklab,var(--t-bg)_28%,transparent)]" />
          }
        />
      ) : (
        <>
          <GoldLeaf count={11} />
          <InkFlourish className="absolute top-[8%] -right-10 h-60 w-60 opacity-40" delay={0.4} />
        </>
      )}

      <div
        className="relative flex h-full flex-col justify-end px-7 text-center"
        style={{ paddingBottom: DOCK_CLEAR }}
      >
        <ParallaxLayer depth={20}>
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
            className={cn("mt-4 text-[var(--t-ink)]", DISPLAY)}
            style={displayType(event.name, "hero", "1.02")}
          >
            <TextReveal delay={0.62}>{event.name}</TextReveal>
          </h2>

          {event.subtitle && (
            <SceneReveal delay={0.85} className="mt-2">
              <p className="text-fluid-xs text-[var(--t-accent-soft)] italic">{event.subtitle}</p>
            </SceneReveal>
          )}

          <div className="mx-auto mt-4 w-full max-w-[10rem]">
            <Swash delay={1} />
          </div>

          {time && (
            <SceneReveal delay={1.2} className="mt-3">
              <p className={cn("text-fluid-lg text-[var(--t-ink)]", DISPLAY)}>{time}</p>
            </SceneReveal>
          )}

          {event.venue && (
            <SceneReveal delay={1.35} className="mt-3">
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
              <SceneReveal delay={1.5} direction="none">
                <span className="rounded-sm border border-[var(--t-line)] px-3.5 py-2 text-[0.55rem] tracking-[0.26em] text-[var(--t-ink-soft)] uppercase">
                  {event.dressCode}
                </span>
              </SceneReveal>
            )}
            {directions && (
              <SceneReveal delay={1.6} direction="none">
                <a
                  href={directions}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap-target inline-grid place-items-center rounded-sm border border-[var(--t-accent)] px-5 text-[0.55rem] tracking-[0.26em] text-[var(--t-accent)] uppercase transition-colors duration-300 hover:bg-[color-mix(in_oklab,var(--t-accent)_16%,transparent)]"
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
    <SceneSurface surface={DEEP_LAPIS}>
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
        <GoldLeaf count={10} />
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

          <div className="mx-auto mt-3 w-full max-w-[10rem]">
            <Swash delay={0.85} mirrored />
          </div>

          {venue.address && (
            <SceneReveal delay={1} className="mt-3">
              <p className="mx-auto max-w-[17rem] text-fluid-sm leading-relaxed text-[var(--t-ink-soft)]">
                {venue.address}
              </p>
            </SceneReveal>
          )}

          {venue.note && (
            <SceneReveal delay={1.1} className="mt-2">
              <p className="text-fluid-xs text-[var(--t-ink-muted)] italic">{venue.note}</p>
            </SceneReveal>
          )}

          {directions && (
            <SceneReveal delay={1.25} className="mt-7">
              <a
                href={directions}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target inline-flex items-center gap-2.5 rounded-sm border border-[var(--t-accent)] px-7 py-3.5 text-[0.58rem] tracking-[0.3em] text-[var(--t-accent)] uppercase transition-colors duration-300 hover:bg-[color-mix(in_oklab,var(--t-accent)_16%,transparent)]"
              >
                <motion.svg
                  viewBox="0 0 24 24"
                  className="size-3.5"
                  fill="none"
                  aria-hidden
                  initial={{ y: -6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.9, delay: 1.55, ease: [0.22, 1, 0.36, 1] }}
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
    <SceneSurface surface={PAGE}>
      <div className="pointer-events-none absolute inset-x-5 inset-y-8">
        <ManuscriptFrame delay={0.25} />
      </div>

      <SceneBody className="justify-start">
        {milestone.date && (
          <h3
            className={cn("mt-6 text-[var(--t-accent)]", DISPLAY)}
            style={displayType(milestone.date, "hero", "1")}
          >
            <TextReveal delay={0.35}>{milestone.date}</TextReveal>
          </h3>
        )}

        <h2
          className={cn("mt-2 text-[var(--t-ink)]", DISPLAY)}
          style={displayType(milestone.title, "title", "1.15")}
        >
          <TextReveal delay={0.55}>{milestone.title}</TextReveal>
        </h2>

        {milestone.image && (
          <ImageReveal
            image={milestone.image}
            className="mt-6 aspect-[4/5] w-[74%]"
            sizes="74vw"
            delay={0.75}
            from="bottom"
          />
        )}

        {milestone.description && (
          <SceneReveal delay={1.15} className="mt-5">
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
    <SceneSurface surface={DEEP_LAPIS}>
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
              transition={{ duration: 1.3, delay: 0.25 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <SmartImage image={image} sizes="86vw" className="opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-bg)] via-transparent to-[color-mix(in_oklab,var(--t-bg)_38%,transparent)]" />
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
    <SceneSurface surface={LAPIS}>
      <GoldLeaf count={12} />
      <InkBleed delay={0.5} />

      <SceneBody>
        <SceneLabel delay={0.2}>RSVP</SceneLabel>

        <h2
          className={cn("mt-7 text-[var(--t-ink)]", DISPLAY)}
          style={displayType(data.rsvp.headline ?? "Will you join us?", "hero", "1.08")}
        >
          <TextReveal delay={0.45}>{data.rsvp.headline ?? "Will you join us?"}</TextReveal>
        </h2>

        <div className="mt-4 w-full max-w-[12rem]">
          <Swash delay={0.7} />
        </div>

        {data.rsvp.message && (
          <SceneReveal delay={0.95} className="mt-4">
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
            <SceneReveal key={value} delay={1.15 + index * 0.12} direction="up">
              <button
                type="button"
                onClick={() => pick(value)}
                aria-pressed={picked === value}
                className={cn(
                  "tap-target relative w-full overflow-hidden rounded-sm px-6 py-4",
                  "border text-[0.6rem] tracking-[0.3em] uppercase transition-colors duration-500",
                  picked === value
                    ? "border-[var(--t-accent)] text-[var(--t-bg)]"
                    : "border-[var(--t-line)] text-[var(--t-ink-soft)] hover:border-[var(--t-accent)]",
                )}
              >
                <span className="relative z-10">{label}</span>
                {/* Fills right to left, the direction the script is written. */}
                <motion.span
                  aria-hidden
                  className="absolute inset-0 origin-right bg-[var(--t-accent)]"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: picked === value ? 1 : 0 }}
                  transition={{ duration: 0.75, ease: [0.65, 0, 0.35, 1] }}
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
    <SceneSurface surface={PAGE} className="min-h-[100svh]">
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

/* --------------------------------- FAMILY --------------------------------- */

function FamilyScene({ data }: { data: WeddingData }) {
  const families = [data.familyNames.bride, data.familyNames.groom].filter(
    (name): name is string => Boolean(name),
  );

  return (
    <SceneSurface surface={PAGE}>
      <div className="pointer-events-none absolute inset-x-5 inset-y-8">
        <ManuscriptFrame delay={0.25} />
      </div>

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

        <div className="mt-6 w-full max-w-[11rem]">
          <Swash delay={0.95} />
        </div>

        {data.gratitudeMessage && (
          <SceneReveal delay={1.2} className="mt-6">
            <p className="max-w-sm text-fluid-sm leading-[1.95] text-[var(--t-ink-soft)]">
              {data.gratitudeMessage}
            </p>
          </SceneReveal>
        )}

        {data.contacts.length > 0 && (
          <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-4">
            {data.contacts.map((contact, index) => (
              <SceneReveal key={contact.id} delay={1.35 + index * 0.1}>
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

/** The template's centrepiece: the ayah, set large and given the whole screen. */
function VerseScene({ data }: { data: WeddingData }) {
  const { islamic } = data;

  return (
    <SceneSurface surface={DEEP_LAPIS}>
      <GoldLeaf count={16} />
      <InkBleed delay={0.3} />
      <div className="pointer-events-none absolute inset-x-4 inset-y-7">
        <ManuscriptFrame delay={0.4} />
      </div>

      <SceneBody>
        {islamic.verseArabic && (
          <SceneReveal delay={0.6} durationScale={2}>
            <p
              lang="ar"
              dir="rtl"
              className={cn("text-[var(--t-accent-soft)]", ARABIC)}
              style={{ fontSize: "clamp(1.4rem, 7.5vw, 2.3rem)", lineHeight: 2.1 }}
            >
              {islamic.verseArabic}
            </p>
          </SceneReveal>
        )}

        <div className="mt-6 w-full max-w-[13rem]">
          <Swash delay={1.2} />
        </div>

        {islamic.verseTranslation && (
          <SceneReveal delay={1.5} className="mt-6">
            <p className={cn("max-w-sm text-fluid-base leading-relaxed text-[var(--t-ink-soft)] italic", DISPLAY)}>
              &ldquo;{islamic.verseTranslation}&rdquo;
            </p>
          </SceneReveal>
        )}

        {islamic.verseReference && (
          <SceneReveal delay={1.75} className="mt-5">
            <p className="text-[0.58rem] tracking-[0.32em] text-[var(--t-accent)] uppercase">
              {islamic.verseReference}
            </p>
          </SceneReveal>
        )}

        {islamic.duaText && (
          <SceneReveal delay={1.95} className="mt-6">
            <p className="text-fluid-xs text-[var(--t-ink-muted)] italic">{islamic.duaText}</p>
          </SceneReveal>
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
    <SceneSurface surface={DEEP_LAPIS}>
      <GoldLeaf count={18} />
      <InkBleed delay={1.4} />
      <InkFlourish className="absolute -bottom-10 -left-12 h-72 w-72 opacity-40" delay={1.8} />

      <div className="pointer-events-none absolute inset-x-4 inset-y-7">
        <ManuscriptFrame delay={1.6} />
      </div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: active && settings.enabled ? 0.3 : 0 }}
        transition={{ duration: 3.6, ease: "easeInOut" }}
      />

      <SceneBody>
        <SceneLabel delay={0.25}>Barakallahu lakuma</SceneLabel>

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

        <div className="mt-7 w-full max-w-[13rem]">
          <Swash delay={1.5} />
        </div>

        {date && (
          <SceneReveal delay={1.75} className="mt-5">
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
