import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { Palette } from "../lib/palettes";
import { mod, rand } from "../lib/math";
import { GROUND_Y } from "../config";

type GroundProps = {
  palette: Palette;
  cameraX: number;
};

const PERIOD = 2400;

/** The forest floor: gradient soil, a winding path, grass tufts and stones. */
export const Ground: React.FC<GroundProps> = ({ palette, cameraX }) => {
  const frame = useCurrentFrame();
  const top = GROUND_Y - 60;
  // Unique gradient ids per palette: two scenes overlap during a transition.
  const id = palette.sky[0].replace("#", "");

  const tufts = new Array(46).fill(0).map((_, i) => ({
    x: rand(`tuft-x-${i}`, 0, PERIOD),
    y: rand(`tuft-y-${i}`, top - 4, 1080),
    s: rand(`tuft-s-${i}`, 0.6, 1.4),
    p: rand(`tuft-p-${i}`, 0, 6.28),
  }));
  const stones = new Array(10).fill(0).map((_, i) => ({
    x: rand(`stone-x-${i}`, 0, PERIOD),
    y: rand(`stone-y-${i}`, GROUND_Y + 20, 1060),
    w: rand(`stone-w-${i}`, 14, 34),
  }));

  return (
    <AbsoluteFill>
      <svg width={1920} height={1080}>
        <defs>
          <linearGradient id={`ground-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.ground[0]} />
            <stop offset="100%" stopColor={palette.ground[1]} />
          </linearGradient>
          <linearGradient id={`path-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.path} stopOpacity={0.4} />
            <stop offset="50%" stopColor={palette.path} stopOpacity={0.9} />
            <stop offset="100%" stopColor={palette.path} stopOpacity={0.5} />
          </linearGradient>
        </defs>
        <path
          d={`M 0 ${top + 10} Q 480 ${top - 12} 960 ${top + 4} T 1920 ${top} L 1920 1080 L 0 1080 Z`}
          fill={`url(#ground-grad-${id})`}
        />
        {/* The walking path */}
        <path
          d={`M 0 ${GROUND_Y - 18} C 600 ${GROUND_Y - 30} 1300 ${GROUND_Y - 8} 1920 ${GROUND_Y - 22} L 1920 ${GROUND_Y + 34} C 1300 ${GROUND_Y + 48} 600 ${GROUND_Y + 26} 0 ${GROUND_Y + 38} Z`}
          fill={`url(#path-grad-${id})`}
        />
        {stones.map((st, i) => {
          const x = mod(st.x - cameraX, PERIOD) - 240;
          return (
            <ellipse key={`s${i}`} cx={x} cy={st.y} rx={st.w} ry={st.w * 0.45} fill={palette.ground[1]} opacity={0.8} />
          );
        })}
        {tufts.map((t, i) => {
          const x = mod(t.x - cameraX, PERIOD) - 240;
          const bend = Math.sin(frame * 0.06 + t.p) * 4;
          return (
            <g key={i} transform={`translate(${x} ${t.y}) scale(${t.s})`}>
              {[-10, -4, 2, 8].map((dx, j) => (
                <path
                  key={j}
                  d={`M ${dx} 0 Q ${dx + bend} -18 ${dx * 1.8 + bend * 2} ${-30 - j * 4}`}
                  stroke={palette.grass}
                  strokeWidth={3}
                  strokeLinecap="round"
                  fill="none"
                />
              ))}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
