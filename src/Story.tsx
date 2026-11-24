import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { OpeningScene } from "./scenes/OpeningScene";
import { JourneyScene } from "./scenes/JourneyScene";
import { EndingScene } from "./scenes/EndingScene";
import { FadeFromBlack } from "./components/CinematicOverlay";
import { glowDissolve } from "./transitions/glowDissolve";
import { SCENE_FRAMES, TRANSITION_FRAMES } from "./config";

const timing = linearTiming({
  durationInFrames: TRANSITION_FRAMES,
  easing: Easing.bezier(0.45, 0, 0.55, 1),
});

/**
 * The full film: opening → middle → ending, joined with transitions.
 * To add a scene, create it in src/scenes, give it a length in config.ts and
 * add another <TransitionSeries.Sequence> (plus a Transition) here.
 */
export const Story: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.opening}>
          <OpeningScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={glowDissolve({ bloom: 0.6, blur: 8 })} timing={timing} />

        <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.journey}>
          <JourneyScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={timing} />

        <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.ending}>
          <EndingScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Open on black */}
      <FadeFromBlack from={0} to={40} />
    </AbsoluteFill>
  );
};
