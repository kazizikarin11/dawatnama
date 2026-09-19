"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils/cn";
import type { RenderMode } from "@/templates/contract";
import { useMotionSettings } from "@/components/motion/motion-settings";
import { useMusic } from "./music";

/**
 * The opening sequence, shared by all five templates.
 *
 * Templates supply their own cover artwork and their own "open" button; this
 * provider owns the mechanics that must behave identically everywhere:
 * scroll locking, the reveal hand-off, focus movement, and asking the music
 * player to start from inside the guest's tap (the only moment browsers allow
 * audio to begin).
 */

export type Stage = "cover" | "revealing" | "open";

interface StageContextValue {
  stage: Stage;
  /** True once the guest has opened the invitation. */
  opened: boolean;
  mode: RenderMode;
  open: () => void;
  /** Returns to the cover — used by the editor's "replay opening" control. */
  reset: () => void;
}

const StageContext = createContext<StageContextValue | null>(null);

export function useStage(): StageContextValue {
  const context = useContext(StageContext);
  if (!context) {
    throw new Error("useStage must be used inside an InvitationStageProvider");
  }
  return context;
}

export function InvitationStageProvider({
  mode,
  children,
}: {
  mode: RenderMode;
  children: ReactNode;
}) {
  // Thumbnails have no interaction, so they render the opened state directly.
  const [stage, setStage] = useState<Stage>(mode === "thumbnail" ? "open" : "cover");
  const music = useMusic();
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = useCallback(() => {
    setStage((current) => (current === "cover" ? "revealing" : current));
    // Called synchronously inside the tap handler so autoplay policies are met.
    music.requestStart();
  }, [music]);

  const reset = useCallback(() => {
    setStage("cover");
    music.pause();
  }, [music]);

  useEffect(() => {
    if (stage !== "revealing") return;
    revealTimer.current = setTimeout(() => setStage("open"), 1100);
    return () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
    };
  }, [stage]);

  // Lock page scrolling behind the cover, and restore it exactly as it was.
  useEffect(() => {
    if (mode !== "live") return;
    if (stage !== "cover") return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousTouch = body.style.touchAction;
    body.style.overflow = "hidden";
    body.style.touchAction = "none";

    return () => {
      body.style.overflow = previousOverflow;
      body.style.touchAction = previousTouch;
    };
  }, [mode, stage]);

  const value = useMemo<StageContextValue>(
    () => ({ stage, opened: stage !== "cover", mode, open, reset }),
    [stage, mode, open, reset],
  );

  return <StageContext.Provider value={value}>{children}</StageContext.Provider>;
}

/**
 * Full-bleed cover layer. Handles its own exit animation, traps initial focus on
 * the open button, and keeps the invitation behind it out of the a11y tree.
 */
export function CoverLayer({
  children,
  className,
  exit = "veil",
}: {
  children: ReactNode;
  className?: string;
  /** How the cover leaves. Templates pick what suits their motion language. */
  exit?: "veil" | "rise" | "iris" | "dissolve";
}) {
  const { stage, mode } = useStage();
  const settings = useMotionSettings();
  const ref = useRef<HTMLDivElement>(null);

  // Move focus into the cover so the keyboard path starts at "open".
  useEffect(() => {
    if (stage !== "cover" || mode === "thumbnail") return;
    const button = ref.current?.querySelector<HTMLElement>("[data-cover-action]");
    button?.focus({ preventScroll: true });
  }, [stage, mode]);

  const exitVariants = {
    veil: { opacity: 0, clipPath: "inset(0% 0% 100% 0%)" },
    rise: { opacity: 0, y: "-100%" },
    iris: { opacity: 0, scale: 1.12, filter: "blur(10px)" },
    dissolve: { opacity: 0, scale: 1.02 },
  } as const;

  return (
    <AnimatePresence>
      {stage === "cover" && (
        <motion.div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label="Invitation cover"
          className={cn(
            mode === "live" ? "fixed" : "absolute",
            "inset-0 z-50 flex flex-col overflow-hidden",
            className,
          )}
          initial={false}
          exit={settings.enabled ? exitVariants[exit] : { opacity: 0 }}
          transition={{
            duration: settings.enabled ? 1.05 : 0.001,
            ease: [0.65, 0, 0.35, 1],
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Wraps the invitation body. Stays mounted behind the cover so images and fonts
 * are already warm when the guest taps open, but is hidden from assistive tech
 * and from tab order until then.
 */
export function StageBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { stage, opened } = useStage();
  const settings = useMotionSettings();
  const ref = useRef<HTMLDivElement>(null);
  const movedFocus = useRef(false);

  useEffect(() => {
    if (!opened || movedFocus.current) return;
    movedFocus.current = true;
    // Give the cover time to clear, then hand focus to the invitation itself.
    const timer = setTimeout(() => {
      ref.current?.focus({ preventScroll: true });
    }, 400);
    return () => clearTimeout(timer);
  }, [opened]);

  return (
    <motion.div
      ref={ref}
      tabIndex={-1}
      aria-hidden={!opened}
      inert={!opened ? true : undefined}
      className={cn("outline-none", className)}
      initial={false}
      animate={{
        opacity: stage === "cover" ? 0 : 1,
        scale: stage === "cover" && settings.enabled ? 1.03 : 1,
      }}
      transition={{
        duration: settings.enabled ? 1.2 : 0.001,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
