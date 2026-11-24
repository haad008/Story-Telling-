import React from "react";
import { useCurrentFrame } from "remotion";
import { rand } from "../lib/math";

type HeartTreeProps = {
  /** Screen position of the trunk base. */
  x: number;
  y: number;
  scale?: number;
  /** 0..1 how brightly the tree glows (animate this to "awaken" it). */
  glow?: number;
};

/** The ancient glowing tree the traveller finds at the end of the path. */
export const HeartTree: React.FC<HeartTreeProps> = ({ x, y, scale = 1, glow = 1 }) => {
  const frame = useCurrentFrame();
  const leaves = new Array(90).fill(0).map((_, i) => {
    const a = rand(`ht-a-${i}`, 0, Math.PI * 2);
    const r = Math.sqrt(rand(`ht-r-${i}`)) * 1;
    return {
      cx: Math.cos(a) * r * 360,
      cy: -630 + Math.sin(a) * r * 170,
      r: rand(`ht-s-${i}`, 3, 8),
      ph: rand(`ht-p-${i}`, 0, 6.28),
    };
  });

  return (
    <div
      style={{
        position: "absolute",
        left: x - 500 * scale,
        top: y - 900 * scale,
        width: 1000 * scale,
        height: 940 * scale,
      }}
    >
      {/* Big soft aura */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 80 * scale,
          width: 1000 * scale,
          height: 800 * scale,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at 50% 45%, rgba(255,214,140,${0.55 * glow}) 0%, rgba(255,140,180,${0.25 * glow}) 35%, rgba(0,0,0,0) 70%)`,
          mixBlendMode: "screen",
        }}
      />
      <svg viewBox="-500 -900 1000 940" width={1000 * scale} height={940 * scale} style={{ position: "absolute", overflow: "visible" }}>
        <defs>
          <radialGradient id="ht-leaf">
            <stop offset="0%" stopColor="#fffbe6" />
            <stop offset="50%" stopColor="#ffd37a" />
            <stop offset="100%" stopColor="#ff9fb8" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="ht-bark" x1="0" x2="1">
            <stop offset="0%" stopColor="#120e22" />
            <stop offset="60%" stopColor="#2a2040" />
            <stop offset="100%" stopColor="#4a3256" />
          </linearGradient>
        </defs>
        {/* Roots and trunk */}
        <path
          d="M -150 30 C -90 0 -60 -40 -55 -140 C -50 -260 -80 -360 -40 -470 L 40 -470 C 80 -360 50 -260 55 -140 C 60 -40 90 0 160 30 Z"
          fill="url(#ht-bark)"
        />
        {/* Branches */}
        {[
          "M -30 -440 C -120 -500 -220 -520 -300 -600",
          "M 30 -440 C 120 -500 230 -510 320 -590",
          "M 0 -460 C -20 -560 -10 -640 20 -720",
          "M -40 -500 C -140 -600 -150 -660 -200 -720",
          "M 40 -500 C 140 -600 170 -650 220 -710",
        ].map((d, i) => (
          <path key={i} d={d} stroke="#21193a" strokeWidth={26 - i * 3} strokeLinecap="round" fill="none" />
        ))}
        {/* Canopy silhouette */}
        {[
          [-250, -540, 120],
          [250, -540, 120],
          [-140, -620, 150],
          [140, -620, 150],
          [0, -690, 150],
          [-300, -620, 90],
          [300, -630, 90],
          [0, -560, 170],
          [-90, -760, 100],
          [100, -760, 100],
        ].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="#1d1638" />
        ))}
        {/* Glowing leaves / blossoms */}
        {leaves.map((l, i) => {
          const twinkle = 0.5 + 0.5 * Math.sin(frame * 0.07 + l.ph);
          return (
            <circle
              key={i}
              cx={l.cx}
              cy={l.cy}
              r={l.r * (2.2 + twinkle)}
              fill="url(#ht-leaf)"
              opacity={glow * (0.45 + 0.55 * twinkle)}
            />
          );
        })}
        {/* Glowing heart in the trunk */}
        <ellipse cx={0} cy={-300} rx={26 + 4 * Math.sin(frame * 0.1)} ry={40} fill="url(#ht-leaf)" opacity={glow} />
      </svg>
    </div>
  );
};
