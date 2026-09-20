"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";
import type { RenderMode } from "@/templates/contract";

/**
 * The scene engine.
 *
 * The invitation is a vertical deck of full-height scenes that the browser snaps
 * between — native CSS scroll-snap, not hijacked scrolling. The wheel, a finger,
 * the keyboard, the scrollbar and browser history all keep working; JavaScript is
 * used only to know which scene is active and how far through it we are, so that
 * motion can be choreographed rather than fired on page load.
 *
 *   SceneDeck   owns the scroll container, the active index and the lock
 *   Scene       registers itself and publishes its own lifecycle state
 *   useScene    lets any descendant animate against that state
 */

export type SceneState = "idle" | "entering" | "active" | "exiting";

interface DeckContextValue {
  register: (id: string, element: HTMLElement) => () => void;
  setActive: (id: string, ratio: number) => void;
  activeId: string | null;
  /** Ordered ids, as registered in DOM order. */
  order: string[];
  scrollTo: (id: string) => void;
  next: () => void;
  /** Scrolling is blocked until the guest opens the invitation. */
  locked: boolean;
  unlock: () => void;
  mode: RenderMode;
  scrollRoot: React.RefObject<HTMLDivElement | null>;
}

const DeckContext = createContext<DeckContextValue | null>(null);

function useDeck(): DeckContextValue {
  const context = useContext(DeckContext);
  if (!context) throw new Error("Scene components must be used inside a SceneDeck");
  return context;
}

/* ------------------------------------------------------------------ */
/* Deck                                                                */
/* ------------------------------------------------------------------ */

export function SceneDeck({
  children,
  className,
  mode,
  /** Start locked so the cover cannot be scrolled past before opening. */
  startLocked = true,
  onOpen,
}: {
  children: ReactNode;
  className?: string;
  mode: RenderMode;
  startLocked?: boolean;
  onOpen?: () => void;
}) {
  const scrollRoot = useRef<HTMLDivElement>(null);
  const elements = useRef(new Map<string, HTMLElement>());
  const ratios = useRef(new Map<string, number>());

  const [order, setOrder] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [locked, setLocked] = useState(mode === "thumbnail" ? false : startLocked);

  const register = useCallback((id: string, element: HTMLElement) => {
    elements.current.set(id, element);

    // Keep the order in DOM order so the progress rail and `next()` are correct.
    setOrder((current) => {
      if (current.includes(id)) return current;
      const known = [...current, id];
      const container = element.closest("[data-scene-deck]");
      if (!container) return known;
      const inDom = Array.from(container.querySelectorAll<HTMLElement>("[data-scene-id]"))
        .map((node) => node.dataset.sceneId)
        .filter((value): value is string => Boolean(value));
      return inDom.filter((value) => known.includes(value));
    });

    return () => {
      elements.current.delete(id);
      ratios.current.delete(id);
      setOrder((current) => current.filter((value) => value !== id));
    };
  }, []);

  /** Whichever scene covers the most of the viewport wins. */
  const setActive = useCallback((id: string, ratio: number) => {
    ratios.current.set(id, ratio);

    let bestId: string | null = null;
    let bestRatio = 0;
    for (const [sceneId, value] of ratios.current) {
      if (value > bestRatio) {
        bestRatio = value;
        bestId = sceneId;
      }
    }

    if (bestId && bestRatio > 0.35) {
      setActiveId((current) => (current === bestId ? current : bestId));
    }
  }, []);

  const scrollTo = useCallback((id: string) => {
    const element = elements.current.get(id);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const next = useCallback(() => {
    const index = activeId ? order.indexOf(activeId) : -1;
    const target = order[index + 1];
    if (target) scrollTo(target);
  }, [activeId, order, scrollTo]);

  const unlock = useCallback(() => {
    setLocked(false);
    onOpen?.();
  }, [onOpen]);

  const value = useMemo<DeckContextValue>(
    () => ({
      register,
      setActive,
      activeId,
      order,
      scrollTo,
      next,
      locked,
      unlock,
      mode,
      scrollRoot,
    }),
    [register, setActive, activeId, order, scrollTo, next, locked, unlock, mode],
  );

  return (
    <DeckContext.Provider value={value}>
      <div
        ref={scrollRoot}
        data-scene-deck=""
        tabIndex={-1}
        className={cn(
          // The deck is its own scroll container, which keeps snapping reliable
          // and behaves identically inside the editor's device frame.
          "relative h-[100svh] w-full outline-none",
          locked
            ? "overflow-hidden"
            : "snap-y snap-mandatory overflow-y-scroll overscroll-y-contain",
          "no-scrollbar",
          className,
        )}
        style={{ scrollBehavior: "smooth" }}
      >
        {children}
      </div>
    </DeckContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

interface SceneContextValue {
  state: SceneState;
  active: boolean;
  /** True once the scene has been active at least once. */
  seen: boolean;
  /** 0 when entering from below, 0.5 centred, 1 when leaving upward. */
  progress: number;
  index: number;
}

const SceneContext = createContext<SceneContextValue>({
  state: "idle",
  active: false,
  seen: false,
  progress: 0.5,
  index: 0,
});

export function useScene(): SceneContextValue {
  return useContext(SceneContext);
}

export function Scene({
  id,
  label,
  children,
  className,
  /** Scenes may exceed one viewport when content genuinely needs it. */
  fill = true,
}: {
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
  fill?: boolean;
}) {
  const deck = useDeck();
  const ref = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0.5);
  /**
   * Visibility and "has been arrived at" travel together in one state value, both
   * written from the observer callback, so there is no derived state to sync.
   */
  const [visibility, setVisibility] = useState({ ratio: 0, seen: false });
  const { ratio, seen } = visibility;

  const active = deck.activeId === id;
  const index = deck.order.indexOf(id);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return deck.register(id, element);
  }, [deck, id]);

  // Visibility drives which scene is active.
  useEffect(() => {
    const element = ref.current;
    const root = deck.scrollRoot.current;
    if (!element || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const next = entry.intersectionRatio;
          setVisibility((current) =>
            current.ratio === next && (current.seen || next <= 0.5)
              ? current
              : { ratio: next, seen: current.seen || next > 0.5 },
          );
          deck.setActive(id, next);
        }
      },
      {
        root,
        threshold: [0, 0.15, 0.35, 0.55, 0.75, 0.95, 1],
      },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [deck, id]);

  // Scroll-linked progress, only while the scene is on screen, and only through
  // rAF so parallax never fights the compositor.
  useEffect(() => {
    const element = ref.current;
    const root = deck.scrollRoot.current;
    if (!element || !root || ratio <= 0) return;

    let frame = 0;
    const measure = () => {
      const rootRect = root.getBoundingClientRect();
      const rect = element.getBoundingClientRect();
      const span = rootRect.height + rect.height;
      const travelled = rootRect.bottom - rect.top;
      setProgress(Math.min(1, Math.max(0, travelled / span)));
      frame = requestAnimationFrame(measure);
    };

    frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [deck, ratio]);

  const state: SceneState = active
    ? "active"
    : ratio > 0.1
      ? seen
        ? "exiting"
        : "entering"
      : "idle";

  const value = useMemo<SceneContextValue>(
    () => ({ state, active, seen, progress, index }),
    [state, active, seen, progress, index],
  );

  return (
    <SceneContext.Provider value={value}>
      <section
        ref={ref}
        id={id}
        data-scene-id={id}
        data-scene-state={state}
        aria-label={label}
        className={cn(
          "relative w-full snap-start overflow-hidden",
          // `snap-stop: always` is what makes this feel scene-by-scene rather
          // than a flick that skips three screens at once.
          "[scroll-snap-stop:always]",
          fill ? "h-[100svh]" : "min-h-[100svh]",
          className,
        )}
      >
        {children}
      </section>
    </SceneContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Controls                                                           */
/* ------------------------------------------------------------------ */

/** Unlocks the deck and moves to the second scene. Used by the cover's CTA. */
export function useOpenInvitation() {
  const deck = useDeck();

  return useCallback(() => {
    deck.unlock();
    // Let the lock lift and the layout settle before scrolling.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const target = deck.order[1];
        if (target) deck.scrollTo(target);
      });
    });
  }, [deck]);
}

export function useSceneNavigation() {
  const deck = useDeck();
  return {
    next: deck.next,
    scrollTo: deck.scrollTo,
    activeId: deck.activeId,
    order: deck.order,
    locked: deck.locked,
  };
}

/**
 * The progress rail: a column of tiny marks, one per scene. Deliberately not a
 * navbar — it tells the guest where they are and nothing else.
 */
export function SceneProgress({
  className,
  labels,
}: {
  className?: string;
  /** Optional map of scene id to marker text. */
  labels?: Record<string, string>;
}) {
  const deck = useDeck();
  const railId = useId();

  if (deck.locked || deck.order.length < 2 || deck.mode === "thumbnail") return null;

  const activeIndex = deck.activeId ? deck.order.indexOf(deck.activeId) : 0;

  return (
    <nav
      aria-label="Invitation progress"
      className={cn(
        "pointer-events-none absolute top-1/2 right-2.5 z-30 -translate-y-1/2",
        "flex flex-col items-center gap-2",
        className,
      )}
    >
      {deck.order.map((id, index) => {
        const isActive = index === activeIndex;
        return (
          <button
            key={`${railId}-${id}`}
            type="button"
            aria-label={`Go to scene ${labels?.[id] ?? index + 1}`}
            aria-current={isActive ? "true" : undefined}
            onClick={() => deck.scrollTo(id)}
            className={cn(
              "pointer-events-auto relative grid h-4 w-4 place-items-center",
              "transition-opacity duration-500",
              isActive ? "opacity-100" : "opacity-45 hover:opacity-80",
            )}
          >
            <span
              className={cn(
                "block rounded-full bg-[var(--t-accent)] transition-all duration-500",
                isActive ? "h-3.5 w-[3px]" : "h-[3px] w-[3px]",
              )}
            />
          </button>
        );
      })}
    </nav>
  );
}

/** A small, animated hint that there is more below. Hides after the first move. */
export function ScrollCue({
  label = "Scroll",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const deck = useDeck();
  const { active } = useScene();
  const isFirstScene = deck.activeId === deck.order[1];

  if (deck.locked) return null;

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-2",
        "transition-opacity duration-700",
        active && isFirstScene ? "opacity-70" : "opacity-0",
        className,
      )}
    >
      <span className="text-[0.55rem] tracking-[0.34em] text-[var(--t-ink-muted)] uppercase">
        {label}
      </span>
      <span className="relative block h-8 w-px overflow-hidden bg-[color-mix(in_oklab,var(--t-accent)_30%,transparent)]">
        <span
          className="absolute inset-x-0 top-0 h-3 bg-[var(--t-accent)]"
          style={{ animation: "dawat-cue 2.2s cubic-bezier(0.65,0,0.35,1) infinite" }}
        />
      </span>
    </div>
  );
}
