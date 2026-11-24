import React from "react";
import { AbsoluteFill } from "remotion";
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";

type GlowDissolveProps = {
  /** How bright the frame blooms at the midpoint of the transition. */
  bloom?: number;
  /** Maximum blur in px at the midpoint. */
  blur?: number;
};

/**
 * A dreamy dissolve: the outgoing scene blooms and softens while the incoming
 * scene fades in from a soft glow. Use it like any @remotion/transitions presentation:
 *   <TransitionSeries.Transition presentation={glowDissolve()} timing={...} />
 */
const GlowDissolve: React.FC<TransitionPresentationComponentProps<GlowDissolveProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const bloom = passedProps.bloom ?? 0.5;
  const maxBlur = passedProps.blur ?? 6;
  const entering = presentationDirection === "entering";
  // Strength peaks for the outgoing scene at the end, for the incoming at the start.
  const strength = entering ? 1 - presentationProgress : presentationProgress;

  return (
    <AbsoluteFill
      style={{
        opacity: entering ? presentationProgress : 1,
        filter: `brightness(${1 + bloom * strength}) blur(${maxBlur * strength}px) saturate(${1 + 0.2 * strength})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const glowDissolve = (
  props: GlowDissolveProps = {}
): TransitionPresentation<GlowDissolveProps> => ({
  component: GlowDissolve,
  props,
});
