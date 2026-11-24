import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { mod, rand } from "../lib/math";

type MountainsProps = {
  color: string;
  /** Camera position in world pixels. */
  cameraX: number;
  /** Parallax factor: 0 = fixed to the sky, 1 = moves with the ground. */
  depth: number;
  baseY: number;
  height: number;
  seed: string;
};

const PERIOD = 2400;

/** Seamlessly repeating mountain ridge that scrolls with parallax. */
export const Mountains: React.FC<MountainsProps> = ({
  color,
  cameraX,
  depth,
  baseY,
  height,
  seed,
}) => {
  // Build one ridge PERIOD wide whose first and last point match, so tiling is seamless.
  const ridge = useMemo(() => {
    const steps = 24;
    const pts: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * PERIOD;
      const k = i % steps;
      const y =
        baseY -
        height *
          (0.45 +
            0.35 * Math.sin((k / steps) * Math.PI * 4 + rand(seed, 0, 6)) +
            0.2 * rand(`${seed}-${k}`, -1, 1));
      pts.push([x, y]);
    }
    let d = `M 0 1080 L ${pts[0][0]} ${pts[0][1]}`;
    // Smooth curve: each point is a control point, curve passes through midpoints.
    for (let i = 1; i < pts.length - 1; i++) {
      const [x, y] = pts[i];
      const [nx, ny] = pts[i + 1];
      d += ` Q ${x} ${y} ${(x + nx) / 2} ${(y + ny) / 2}`;
    }
    const last = pts[pts.length - 1];
    d += ` L ${last[0]} ${last[1]} L ${PERIOD} 1080 Z`;
    return d;
  }, [baseY, height, seed]);

  const offset = -mod(cameraX * depth, PERIOD);

  return (
    <AbsoluteFill>
      <svg
        width={PERIOD * 2}
        height={1080}
        style={{ position: "absolute", left: offset }}
      >
        <path d={ridge} fill={color} />
        <path d={ridge} fill={color} transform={`translate(${PERIOD} 0)`} />
      </svg>
    </AbsoluteFill>
  );
};
