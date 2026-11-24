import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { mod, rand } from "../lib/math";
import { Tree, TreeKind } from "./Tree";

type TreeLayerProps = {
  /** Unique seed - different seeds produce different forests. */
  seed: string;
  cameraX: number;
  /** Parallax factor. Small = far away, 1 = ground plane, >1 = foreground. */
  depth: number;
  color: string;
  baseY: number;
  /** Average tree scale on this layer. */
  scale: number;
  /** Average horizontal distance between trees. */
  spacing: number;
  highlight?: string;
  highlightOpacity?: number;
  lightSide?: 1 | -1;
  /** Mix of tree types: 0 = all oaks, 1 = all pines. */
  pineRatio?: number;
  blur?: number;
  opacity?: number;
};

const MARGIN = 400;
const PERIOD = 1920 + MARGIN * 2;

/**
 * An endlessly scrolling row of trees. Trees are positioned in a repeating
 * strip PERIOD pixels wide, so the forest never runs out as the camera moves.
 */
export const TreeLayer: React.FC<TreeLayerProps> = ({
  seed,
  cameraX,
  depth,
  color,
  baseY,
  scale,
  spacing,
  highlight,
  highlightOpacity = 0,
  lightSide = 1,
  pineRatio = 0.6,
  blur = 0,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();

  const trees = useMemo(() => {
    const count = Math.round(PERIOD / spacing);
    return new Array(count).fill(0).map((_, i) => ({
      x: (i / count) * PERIOD + rand(`${seed}-x-${i}`, -spacing * 0.35, spacing * 0.35),
      y: baseY + rand(`${seed}-y-${i}`, -12, 18) * scale,
      scale: scale * rand(`${seed}-s-${i}`, 0.75, 1.25),
      kind: (rand(`${seed}-k-${i}`) < pineRatio ? "pine" : "oak") as TreeKind,
      phase: rand(`${seed}-p-${i}`, 0, Math.PI * 2),
    }));
  }, [seed, spacing, baseY, scale, pineRatio]);

  // Draw smaller (farther) trees first for a natural overlap.
  const sorted = useMemo(() => [...trees].sort((a, b) => a.scale - b.scale), [trees]);

  return (
    <AbsoluteFill style={{ filter: blur ? `blur(${blur}px)` : undefined, opacity }}>
      <svg width={1920} height={1080} style={{ overflow: "visible" }}>
        {sorted.map((t, i) => {
          const screenX = mod(t.x - cameraX * depth, PERIOD) - MARGIN;
          const sway = Math.sin(frame * 0.035 + t.phase) * 1.2 * Math.min(depth, 1);
          return (
            <Tree
              key={i}
              kind={t.kind}
              x={screenX}
              y={t.y}
              scale={t.scale}
              color={color}
              highlight={highlight}
              highlightOpacity={highlightOpacity}
              lightSide={lightSide}
              sway={sway}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
