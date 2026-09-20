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
import { cn } from "@/lib/utils/cn";
import { buildScenePlan, type SceneNode } from "@/lib/wedding/scene-plan";
import type { RsvpAttendance, WeddingData } from "@/lib/wedding/types";
import { InvitationDock } from "@/components/invitation/dock";
import { Scene, SceneDeck, SceneProgress } from "@/components/scene/scene-deck";
import type { TemplateProps } from "./contract";
import { accentFor, tokensToStyle, type TemplateTokens } from "./tokens";

/**
 * Shared scaffolding for cinematic templates.
 *
 * Every template stages the same narrative — the plan comes from the wedding data
 * — so the deck, the progress rail, the floating dock and the RSVP hand-off are
 * identical in all of them. Only the surfaces, ornament, typography and motion
 * differ. Keeping the frame here means a new template is a set of scene
 * components rather than another copy of the same 120 lines of plumbing.
 */

/* ------------------------------------------------------------------ */
/* RSVP choice, carried from the question scene to the form scene       */
/* ------------------------------------------------------------------ */

const RsvpChoiceContext = createContext<{
  choice: RsvpAttendance | null;
  choose: (value: RsvpAttendance) => void;
}>({ choice: null, choose: () => {} });

export function useRsvpChoice() {
  return useContext(RsvpChoiceContext);
}

/* ------------------------------------------------------------------ */
/* Shell                                                              */
/* ------------------------------------------------------------------ */

export function TemplateShell({
  data,
  sections,
  mode,
  tokens,
  /** Extra classes on the root, for template-level texture such as grain. */
  className,
  /** Supplies the scene component for each planned node. */
  render,
}: TemplateProps & {
  tokens: TemplateTokens;
  className?: string;
  render: (node: SceneNode) => ReactNode;
}) {
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
      className={cn(
        "relative isolate w-full overflow-hidden font-[family-name:var(--font-sans)]",
        className,
      )}
    >
      <RsvpChoiceContext.Provider value={rsvpValue}>
        <SceneDeck mode={mode}>
          {plan.map((node) => (
            <Scene
              key={node.id}
              id={node.id}
              label={node.label}
              // The RSVP form is the one scene allowed to exceed the viewport.
              fill={node.kind !== "rsvp-form"}
            >
              {render(node)}
            </Scene>
          ))}

          <SceneProgress labels={markers} />
        </SceneDeck>
      </RsvpChoiceContext.Provider>

      <InvitationDock data={data} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Surfaces and layout                                               */
/* ------------------------------------------------------------------ */

/**
 * One scene's ground. `surface` overrides the template's CSS custom properties,
 * which is how a template's palette can evolve across the deck without any scene
 * hard-coding a colour.
 */
export function SceneSurface({
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

/** Safe-area aware content column, centred or pinned as the scene needs. */
export function SceneBody({
  children,
  className,
  align = "center",
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
        paddingTop: "max(2.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(3.5rem, env(safe-area-inset-bottom))",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Bottom clearance for scenes whose content is bottom-aligned, so a call to
 * action is never hidden under the floating music and share controls.
 */
export const DOCK_CLEAR = "max(6.5rem, calc(env(safe-area-inset-bottom) + 5rem))";

/** Convenience: the enabled-event count, used by the celebration title cards. */
export function enabledEventCount(data: WeddingData): number {
  return data.events.filter((event) => event.enabled).length;
}
