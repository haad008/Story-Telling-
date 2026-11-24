import React from "react";
import { AbsoluteFill } from "remotion";
import type { Palette } from "../lib/palettes";
import { Sky } from "./Sky";
import { Mountains } from "./Mountains";
import { TreeLayer } from "./TreeLayer";
import { Fog, LightRays } from "./Atmosphere";
import { Ground } from "./Ground";

export type ForestWorldProps = {
  palette: Palette;
  /** Horizontal camera position in world px. Each layer scrolls by cameraX * depth. */
  cameraX: number;
  sunX: number;
  sunY: number;
  stars?: number;
  /** 0..1 strength of the god rays. */
  rays?: number;
  /** 0..1 overall fog density. */
  fog?: number;
  /** Seed for tree placement - change it to get a different forest. */
  seed?: string;
  /** Things standing on the ground plane (character, props). Drawn above the ground. */
  children?: React.ReactNode;
  /** Particles drawn in front of everything (fireflies, leaves). */
  particles?: React.ReactNode;
  /** Draw the dark, blurred foreground trees that pass close to the lens. */
  foreground?: boolean;
};

/**
 * The complete layered forest, back to front:
 * sky → sun → mountains → 3 tree layers with fog between them → light rays →
 * ground → children → foreground trees → low ground fog → particles.
 *
 * Each layer has a parallax `depth`, which is what gives the 2D scene its sense of space.
 */
export const ForestWorld: React.FC<ForestWorldProps> = ({
  palette,
  cameraX,
  sunX,
  sunY,
  stars = 0,
  rays = 0.5,
  fog = 1,
  seed = "forest",
  children,
  particles,
  foreground = true,
}) => {
  const lightSide: 1 | -1 = sunX >= 960 ? 1 : -1;

  return (
    <AbsoluteFill>
      <Sky palette={palette} sunX={sunX} sunY={sunY} stars={stars} />

      <Mountains seed={`${seed}-m1`} color={palette.mountains[0]} cameraX={cameraX} depth={0.04} baseY={720} height={260} />
      <Fog color={palette.fog} cameraX={cameraX} depth={0.06} y={640} height={300} opacity={0.7 * fog} seed={`${seed}-f0`} />
      <Mountains seed={`${seed}-m2`} color={palette.mountains[1]} cameraX={cameraX} depth={0.09} baseY={760} height={180} />

      <TreeLayer
        seed={`${seed}-t1`}
        cameraX={cameraX}
        depth={0.2}
        color={palette.trees[0]}
        baseY={760}
        scale={0.45}
        spacing={70}
        pineRatio={0.8}
      />
      <Fog color={palette.fog} cameraX={cameraX} depth={0.25} y={730} height={240} opacity={0.8 * fog} seed={`${seed}-f1`} />
      <TreeLayer
        seed={`${seed}-t2`}
        cameraX={cameraX}
        depth={0.4}
        color={palette.trees[1]}
        baseY={800}
        scale={0.7}
        spacing={110}
        highlight={palette.treeHighlight}
        highlightOpacity={0.15}
        lightSide={lightSide}
      />
      <Fog color={palette.fog} cameraX={cameraX} depth={0.45} y={790} height={220} opacity={0.6 * fog} seed={`${seed}-f2`} />

      {rays > 0 && (
        <LightRays originX={sunX} originY={sunY} color={palette.sunGlow} intensity={rays} angle={sunX > 960 ? 28 : -28} />
      )}

      <TreeLayer
        seed={`${seed}-t3`}
        cameraX={cameraX}
        depth={0.7}
        color={palette.trees[2]}
        baseY={846}
        scale={1.05}
        spacing={230}
        highlight={palette.treeHighlight}
        highlightOpacity={0.3}
        lightSide={lightSide}
        pineRatio={0.5}
      />

      <Ground palette={palette} cameraX={cameraX} />

      {children}

      {foreground && (
        <TreeLayer
          seed={`${seed}-fg`}
          cameraX={cameraX}
          depth={1.7}
          color={palette.foreground}
          baseY={1200}
          scale={2.3}
          spacing={1360}
          pineRatio={1}
          blur={7}
        />
      )}

      <Fog color={palette.fog} cameraX={cameraX} depth={1.2} y={1010} height={200} opacity={0.45 * fog} drift={0.8} seed={`${seed}-f3`} />

      {particles}
    </AbsoluteFill>
  );
};
