import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ForestWorld } from "../components/ForestWorld";
import { Character } from "../components/Character";
import { Camera } from "../components/Camera";
import { Caption } from "../components/Caption";
import { Fireflies } from "../components/Atmosphere";
import { CinematicOverlay } from "../components/CinematicOverlay";
import { DAWN } from "../lib/palettes";
import { distanceAt, tween } from "../lib/motion";
import { GROUND_Y } from "../config";

/**
 * OPENING - Dawn.
 * The camera starts tilted up at a waking sky, then cranes down and settles on
 * the forest path while the title appears. The traveller walks in from the left
 * and the camera begins to follow.
 */
export const OpeningScene: React.FC = () => {
  const frame = useCurrentFrame();
  const palette = DAWN;

  // --- Character: enters at frame 100, walks at 5 px/frame ------------------
  const walkStart = 100;
  const speed = (f: number) => (f < walkStart ? 0 : tween(f, [walkStart, walkStart + 15], [4.2, 5]));
  const walked = distanceAt(frame, speed);
  const charWorldX = -180 + walked;

  // --- Camera ---------------------------------------------------------------
  // Slow drift, then follows the traveller once they pass the middle of the frame.
  // The quadratic ramp eases the camera into the follow with no sudden jolt.
  const follow = Math.max(0, charWorldX - 700);
  const ramp = 500;
  const followOffset = follow < ramp ? (follow * follow) / (2 * ramp) : follow - ramp / 2;
  const cameraX = frame * 0.6 + followOffset;
  const charScreenX = charWorldX - cameraX;
  const zoom = tween(frame, [0, 210], [1.35, 1.04]);
  const panY = tween(frame, [0, 200], [-220, 0]); // start tilted up at the sky

  // --- Light: the sun rises during the shot ---------------------------------
  const sunY = tween(frame, [0, 330], [660, 500]);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Camera zoom={zoom} focusX={960} focusY={420} panY={panY} handheld={0.6}>
        <ForestWorld
          palette={palette}
          cameraX={cameraX}
          sunX={1380}
          sunY={sunY}
          stars={tween(frame, [0, 200], [0.9, 0.1])}
          rays={tween(frame, [60, 260], [0.1, 0.45])}
          fog={1.1}
          seed="dawn"
          particles={<Fireflies count={22} color="#ffd9a8" cameraX={cameraX} opacity={0.6} seed="dawn-motes" />}
        >
          {frame >= walkStart - 1 && (
            <Character
              x={charScreenX}
              y={GROUND_Y}
              scale={1}
              distance={walked}
              stride={tween(frame, [walkStart, walkStart + 12], [0.4, 1])}
              lanternGlow={0.85}
              rimLight={palette.rimLight}
              lightSide={1}
              shadowSkew={-35}
            />
          )}
        </ForestWorld>
      </Camera>

      <Caption kicker="A short tale" text="The Lantern Path" from={35} to={175} size={110} />

      <CinematicOverlay grade={palette.grade} gradeOpacity={palette.gradeOpacity} vignette={0.6} letterbox={tween(frame, [0, 60], [140, 70])} />
    </AbsoluteFill>
  );
};
