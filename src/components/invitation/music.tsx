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
import { cn } from "@/lib/utils/cn";
import type { MusicConfig } from "@/lib/wedding/types";

/**
 * Background music.
 *
 * No autoplay is ever assumed. `requestStart()` is called synchronously from
 * inside the guest's tap on "open invitation", which is the one moment browsers
 * permit audio to begin. If the browser still refuses, the state becomes
 * `blocked` and the toggle simply waits for a deliberate tap.
 */

export type MusicState = "idle" | "playing" | "paused" | "blocked" | "unavailable";

interface MusicContextValue {
  available: boolean;
  state: MusicState;
  isPlaying: boolean;
  title: string | null;
  credit: string | null;
  requestStart: () => void;
  toggle: () => void;
  pause: () => void;
}

const NOOP: MusicContextValue = {
  available: false,
  state: "unavailable",
  isPlaying: false,
  title: null,
  credit: null,
  requestStart: () => {},
  toggle: () => {},
  pause: () => {},
};

const MusicContext = createContext<MusicContextValue>(NOOP);

export function useMusic(): MusicContextValue {
  return useContext(MusicContext);
}

export function MusicProvider({
  config,
  enabled = true,
  children,
}: {
  config: MusicConfig;
  /** Thumbnails and previews can mount the provider without ever playing. */
  enabled?: boolean;
  children: ReactNode;
}) {
  const available = enabled && config.enabled && Boolean(config.url);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<MusicState>(available ? "idle" : "unavailable");

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const attempt = audio.play();
    if (attempt && typeof attempt.then === "function") {
      attempt.then(() => setState("playing")).catch(() => setState("blocked"));
    } else {
      setState("playing");
    }
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState((current) => (current === "playing" ? "paused" : current));
  }, []);

  const requestStart = useCallback(() => {
    if (!available) return;
    play();
  }, [available, play]);

  const toggle = useCallback(() => {
    if (!available) return;
    if (state === "playing") {
      pause();
      return;
    }
    play();
  }, [available, state, play, pause]);

  // Pause when the tab is hidden; resume only if we were already playing.
  useEffect(() => {
    if (!available) return;

    const onVisibility = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.hidden) {
        audio.pause();
      } else if (state === "playing") {
        void audio.play().catch(() => setState("blocked"));
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [available, state]);

  const value = useMemo<MusicContextValue>(
    () =>
      available
        ? {
            available,
            state,
            isPlaying: state === "playing",
            title: config.title,
            credit: config.credit,
            requestStart,
            toggle,
            pause,
          }
        : NOOP,
    [available, state, config.title, config.credit, requestStart, toggle, pause],
  );

  return (
    <MusicContext.Provider value={value}>
      {available && config.url ? (
        <audio
          ref={audioRef}
          src={config.url}
          loop={config.loop}
          preload="none"
          playsInline
          onEnded={() => !config.loop && setState("paused")}
        />
      ) : null}
      {children}
    </MusicContext.Provider>
  );
}

/**
 * The sound control: deliberately tiny, always reachable, never covering
 * content. Colours come from the active template's `--t-*` tokens.
 */
export function MusicToggle({ className }: { className?: string }) {
  const { available, isPlaying, toggle, title } = useMusic();
  if (!available) return null;

  const label = isPlaying
    ? `Pause music${title ? `: ${title}` : ""}`
    : `Play music${title ? `: ${title}` : ""}`;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={isPlaying}
      title={label}
      className={cn(
        "tap-target pointer-events-auto grid size-11 place-items-center rounded-full",
        "border border-[color-mix(in_oklab,var(--t-accent)_45%,transparent)]",
        "bg-[color-mix(in_oklab,var(--t-bg)_70%,transparent)] text-[var(--t-accent)]",
        "backdrop-blur-md transition-colors duration-300",
        "hover:bg-[color-mix(in_oklab,var(--t-accent)_16%,transparent)]",
        className,
      )}
    >
      {/* Four bars that animate only while playing. */}
      <span className="flex items-end gap-[2px]" aria-hidden>
        {[0, 1, 2, 3].map((bar) => (
          <span
            key={bar}
            className={cn(
              "w-[2px] rounded-full bg-current transition-all duration-500",
              isPlaying ? "animate-drift" : "",
            )}
            style={{
              height: isPlaying ? `${6 + ((bar * 5) % 11)}px` : "4px",
              animationDelay: `${bar * 180}ms`,
              animationDuration: "1.6s",
            }}
          />
        ))}
      </span>
    </button>
  );
}
