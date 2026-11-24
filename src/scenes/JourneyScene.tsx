import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ForestWorld } from "../components/ForestWorld";
import { Character } from "../components/Character";
import { Camera } from "../components/Camera";
import { Caption } from "../components/Caption";
import { FallingLeaves, Fireflies } from "../components/Atmosphere";
import { CinematicOverlay } from "../components/CinematicOverlay";
import { GOLDEN_FOREST } from "../lib/palettes";
import { distanceAt, tween } from "../lib/motion";
import { GROUND_Y } from "../config";

/**
 * MIDDLE - The deep forest.
 * Golden light pours through the canopy. The camera tracks alongside the
 * traveller with a slow push-in; they pause to look up at the light shafts,
 * then carry on deeper into the wood.
 */
export const JourneyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const palette = GOLDEN_FOREST;

  // --- Character speed over time: walk, slow down to look up, walk on -------
  const speed = (f: number) =>
    f < 200 ? 5 : f < 300 ? tween(f, [200, 235], [5, 1.2]) + tween(f, [260, 300], [0, 3.8]) : 5;
  const walked = distanceAt(frame, speed);
  const stride = speed(frame) / 5;
  const lookUp = tween(frame, [210, 245], [0, 0.7]) - tween(frame, [270, 300], [0, 0.7]);

  // --- Camera: tracks the traveller, who drifts from left-of-centre to centre --
  const charScreenX = tween(frame, [0, 360], [700, 900]);
  const cameraX = 400 + walked - charScreenX;
  const zoom = tween(frame, [0, 230], [1.02, 1.16]) - tween(frame, [270, 360], [0, 0.1]);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Camera zoom={zoom} focusX={charScreenX} focusY={GROUND_Y - 160} handheld={0.5}>
        <ForestWorld
          palette={palette}
          cameraX={cameraX}
          sunX={1450}
          sunY={120}
          rays={0.75}
          fog={0.9}
          seed="deep"
          particles={
            <>
              <Fireflies count={45} color="#fff1b8" cameraX={cameraX} depth={0.9} minY={200} maxY={900} opacity={0.55} seed="dust" />
              <FallingLeaves count={16} colors={["#d9a441", "#c77b30", "#e8c35a", "#9fb04a"]} cameraX={cameraX} />
            </>
          }
        >
          <Character
            x={charScreenX}
            y={GROUND_Y}
            scale={1}
            distance={walked}
            stride={stride}
            lookUp={Math.max(0, lookUp)}
            lanternGlow={0.45}
            rimLight={palette.rimLight}
            lightSide={1}
            shadowSkew={-25}
          />
        </ForestWorld>
      </Camera>

      <Caption text="Through the old wood, the light followed." from={70} to={200} size={54} align="bottom" />

      <CinematicOverlay grade={palette.grade} gradeOpacity={palette.gradeOpacity} vignette={0.5} letterbox={70} />
    </AbsoluteFill>
  );
};
