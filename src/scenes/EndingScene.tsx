import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ForestWorld } from "../components/ForestWorld";
import { Character } from "../components/Character";
import { Camera } from "../components/Camera";
import { Caption } from "../components/Caption";
import { HeartTree } from "../components/HeartTree";
import { Fireflies } from "../components/Atmosphere";
import { CinematicOverlay, FadeFromBlack } from "../components/CinematicOverlay";
import { TWILIGHT } from "../lib/palettes";
import { distanceAt, tween } from "../lib/motion";
import { GROUND_Y } from "../config";

/**
 * ENDING - Twilight clearing.
 * The traveller reaches an ancient tree, stops and raises the lantern. The tree
 * awakens with light, sparks rise, and the camera slowly pulls back to reveal
 * the scene before fading to black.
 */
export const EndingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const palette = TWILIGHT;

  // --- Character walks in from off-screen (after the dissolve) and stops ----
  const speed = (f: number) => tween(f, [150, 195], [6, 0]);
  const walked = distanceAt(frame, speed);
  const stride = speed(frame) / 5;
  const lookUp = tween(frame, [185, 225], [0, 1]);

  // The camera drifts at 20% of walking speed, so the traveller walks *into* the frame.
  const cameraX = walked * 0.2;
  const charScreenX = -220 + walked * 0.8;

  // --- The heart tree stands in the world at x = 1240 ------------------------
  // (World x = screen x + cameraX. The traveller stops ~420px before the trunk.)
  const treeScreenX = 1240 - cameraX;
  const awaken = tween(frame, [190, 255], [0.25, 1]);

  // --- Camera pulls back as the tree lights up -----------------------------
  const zoom = tween(frame, [0, 140], [1.18, 1.12]) - tween(frame, [150, 290], [0, 0.12]);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Camera zoom={zoom} focusX={(charScreenX + treeScreenX) / 2} focusY={GROUND_Y - 260} handheld={0.4}>
        <ForestWorld
          palette={palette}
          cameraX={cameraX}
          sunX={560}
          sunY={760}
          stars={1}
          rays={0.12}
          fog={1}
          seed="dusk"
          foreground={false}
          particles={
            <>
              <Fireflies count={50} color="#ffe39a" cameraX={cameraX} depth={1} minY={350} maxY={1000} seed="dusk-flies" />
              <Fireflies
                count={40}
                color="#ffc2d8"
                cameraX={cameraX}
                depth={1}
                minY={150}
                maxY={850}
                rise={1.4}
                opacity={awaken}
                seed="sparks"
              />
            </>
          }
        >
          <HeartTree x={treeScreenX} y={GROUND_Y + 10} scale={0.95} glow={awaken} />
          {/* Warm light from the tree spilling over the clearing */}
          <AbsoluteFill
            style={{
              background: `radial-gradient(ellipse at ${treeScreenX}px ${GROUND_Y - 300}px, rgba(255,200,150,${0.35 * awaken}) 0%, rgba(0,0,0,0) 55%)`,
              mixBlendMode: "screen",
            }}
          />
          <Character
            x={charScreenX}
            y={GROUND_Y}
            scale={1}
            distance={walked}
            stride={stride}
            lookUp={lookUp}
            lanternGlow={0.9 + 0.3 * awaken}
            rimLight="rgba(255, 210, 160, 0.95)"
            lightSide={1}
            shadowSkew={20}
          />
        </ForestWorld>
      </Camera>

      <Caption text="Some lights are found only by those who keep walking." from={200} to={262} size={50} align="bottom" />
      <Caption text="The End" from={252} to={330} size={96} fadeFrames={20} />

      <CinematicOverlay grade={palette.grade} gradeOpacity={palette.gradeOpacity} vignette={0.65} letterbox={tween(frame, [170, 290], [70, 120])} />
      <FadeFromBlack from={275} to={300} reverse />
    </AbsoluteFill>
  );
};
