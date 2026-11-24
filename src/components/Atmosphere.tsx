import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { mod, rand } from "../lib/math";

/* -------------------------------------------------------------------------- */
/*  Fog                                                                       */
/* -------------------------------------------------------------------------- */

type FogProps = {
  color: string;
  cameraX: number;
  depth: number;
  /** Vertical centre of the fog band. */
  y: number;
  height?: number;
  opacity?: number;
  /** Drift speed in px per frame (wind). */
  drift?: number;
  seed?: string;
};

/** Soft, drifting band of mist. Stack several at different depths for haze. */
export const Fog: React.FC<FogProps> = ({
  color,
  cameraX,
  depth,
  y,
  height = 260,
  opacity = 1,
  drift = 0.4,
  seed = "fog",
}) => {
  const frame = useCurrentFrame();
  const period = 2800;
  const shift = mod(cameraX * depth + frame * drift, period);
  const puffs = new Array(9).fill(0).map((_, i) => ({
    x: (i / 9) * period + rand(`${seed}-${i}`, -120, 120),
    w: rand(`${seed}-w-${i}`, 500, 900),
    h: height * rand(`${seed}-h-${i}`, 0.6, 1.1),
    dy: rand(`${seed}-dy-${i}`, -height * 0.2, height * 0.2),
  }));

  return (
    <AbsoluteFill style={{ opacity, filter: "blur(28px)" }}>
      {[0, 1].map((tile) =>
        puffs.map((p, i) => (
          <div
            key={`${tile}-${i}`}
            style={{
              position: "absolute",
              left: p.x + tile * period - shift - 400,
              top: y - p.h / 2 + p.dy,
              width: p.w,
              height: p.h,
              borderRadius: "50%",
              background: `radial-gradient(ellipse at center, ${color} 0%, rgba(0,0,0,0) 70%)`,
            }}
          />
        ))
      )}
      {/* Even layer of haze so the band never has gaps */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: y - height * 0.35,
          height: height * 0.7,
          background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, ${color} 50%, rgba(0,0,0,0) 100%)`,
          opacity: 0.6,
        }}
      />
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------------------- */
/*  God rays                                                                  */
/* -------------------------------------------------------------------------- */

type LightRaysProps = {
  /** Where the rays originate (usually the sun). */
  originX: number;
  originY: number;
  color: string;
  intensity?: number;
  count?: number;
  /** Centre angle of the fan in degrees (0 = straight down, positive = to the left). */
  angle?: number;
  spread?: number;
};

/** Volumetric light shafts that slowly breathe. Uses screen blending. */
export const LightRays: React.FC<LightRaysProps> = ({
  originX,
  originY,
  color,
  intensity = 0.5,
  count = 7,
  angle = 25,
  spread = 50,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", filter: "blur(14px)" }}>
      {new Array(count).fill(0).map((_, i) => {
        const a = angle - spread / 2 + (spread * i) / Math.max(1, count - 1) + rand(`ray-a-${i}`, -4, 4);
        const width = rand(`ray-w-${i}`, 50, 160);
        const flicker = 0.55 + 0.45 * Math.sin(frame * 0.03 + rand(`ray-p-${i}`, 0, 6.28));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: originX - width / 2,
              top: originY,
              width,
              height: 2200,
              transformOrigin: "50% 0%",
              transform: `rotate(${a}deg)`,
              background: `linear-gradient(180deg, ${color} 0%, rgba(0,0,0,0) 75%)`,
              opacity: intensity * flicker,
              clipPath: "polygon(45% 0, 55% 0, 100% 100%, 0 100%)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------------------- */
/*  Fireflies / floating light motes                                          */
/* -------------------------------------------------------------------------- */

type FirefliesProps = {
  count?: number;
  color?: string;
  cameraX?: number;
  depth?: number;
  /** Vertical range the motes float in. */
  minY?: number;
  maxY?: number;
  /** Upward drift per frame (e.g. magic sparks rising). */
  rise?: number;
  opacity?: number;
  seed?: string;
};

export const Fireflies: React.FC<FirefliesProps> = ({
  count = 40,
  color = "#ffe9a3",
  cameraX = 0,
  depth = 0.8,
  minY = 300,
  maxY = 950,
  rise = 0,
  opacity = 1,
  seed = "fly",
}) => {
  const frame = useCurrentFrame();
  const period = 2400;
  return (
    <AbsoluteFill style={{ opacity }}>
      {new Array(count).fill(0).map((_, i) => {
        const baseX = rand(`${seed}-x-${i}`, 0, period);
        const range = maxY - minY;
        const baseY = rand(`${seed}-y-${i}`, 0, range);
        const sp = rand(`${seed}-sp-${i}`, 0.01, 0.03);
        const ph = rand(`${seed}-ph-${i}`, 0, 6.28);
        const x = mod(baseX - cameraX * depth + Math.sin(frame * sp + ph) * 40, period) - 240;
        const y = minY + mod(baseY - frame * rise + Math.cos(frame * sp * 1.3 + ph) * 25, range);
        const size = rand(`${seed}-r-${i}`, 3, 7);
        const glow = 0.3 + 0.7 * Math.max(0, Math.sin(frame * sp * 4 + ph));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: color,
              opacity: glow,
              boxShadow: `0 0 ${size * 3}px ${size * 1.5}px ${color}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------------------- */
/*  Falling leaves                                                            */
/* -------------------------------------------------------------------------- */

type LeavesProps = {
  count?: number;
  colors: string[];
  cameraX?: number;
  depth?: number;
  seed?: string;
};

export const FallingLeaves: React.FC<LeavesProps> = ({
  count = 18,
  colors,
  cameraX = 0,
  depth = 1.1,
  seed = "leaf",
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {new Array(count).fill(0).map((_, i) => {
        const speed = rand(`${seed}-v-${i}`, 1.2, 2.6);
        const startY = rand(`${seed}-y-${i}`, 0, 1300);
        const y = mod(startY + frame * speed, 1300) - 150;
        const sway = Math.sin(frame * 0.05 + i) * 60;
        const x = mod(rand(`${seed}-x-${i}`, 0, 2400) - cameraX * depth + sway - frame * 0.6, 2400) - 240;
        const rot = frame * rand(`${seed}-r-${i}`, -4, 4) + i * 40;
        const size = rand(`${seed}-s-${i}`, 12, 24);
        const flip = Math.cos(frame * 0.08 + i);
        return (
          <svg
            key={i}
            width={size * 2}
            height={size * 2}
            viewBox="-20 -20 40 40"
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `rotate(${rot}deg) scaleX(${flip})`,
            }}
          >
            <path
              d="M 0 -16 C 12 -8 12 8 0 16 C -12 8 -12 -8 0 -16 Z"
              fill={colors[i % colors.length]}
            />
            <path d="M 0 -14 L 0 16" stroke="rgba(0,0,0,0.25)" strokeWidth={1.2} />
          </svg>
        );
      })}
    </AbsoluteFill>
  );
};
