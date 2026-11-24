import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { Palette } from "../lib/palettes";
import { rand } from "../lib/math";

type SkyProps = {
  palette: Palette;
  /** Sun position in screen pixels. */
  sunX: number;
  sunY: number;
  sunRadius?: number;
  /** 0..1 - how many stars are visible (for dawn/dusk). */
  stars?: number;
};

/** Gradient sky, twinkling stars and a glowing sun. */
export const Sky: React.FC<SkyProps> = ({
  palette,
  sunX,
  sunY,
  sunRadius = 70,
  stars = 0,
}) => {
  const frame = useCurrentFrame();
  const [top, mid, horizon] = palette.sky;

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${top} 0%, ${mid} 48%, ${horizon} 78%)`,
        }}
      />

      {stars > 0 && (
        <svg width="100%" height="100%" style={{ position: "absolute" }}>
          {new Array(120).fill(0).map((_, i) => {
            const x = rand(`star-x-${i}`, 0, 1920);
            const y = rand(`star-y-${i}`, 0, 520);
            const r = rand(`star-r-${i}`, 0.6, 2);
            const twinkle =
              0.55 + 0.45 * Math.sin(frame * 0.08 + rand(`star-t-${i}`, 0, 6.28));
            // Fewer stars near the horizon.
            const heightFade = 1 - y / 560;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={r}
                fill="#fff6e8"
                opacity={stars * twinkle * heightFade}
              />
            );
          })}
        </svg>
      )}

      {/* Large atmospheric glow around the sun */}
      <div
        style={{
          position: "absolute",
          left: sunX - 900,
          top: sunY - 900,
          width: 1800,
          height: 1800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${palette.sunGlow} 0%, rgba(0,0,0,0) 60%)`,
        }}
      />
      {/* Sun disc */}
      <div
        style={{
          position: "absolute",
          left: sunX - sunRadius,
          top: sunY - sunRadius,
          width: sunRadius * 2,
          height: sunRadius * 2,
          borderRadius: "50%",
          background: palette.sun,
          boxShadow: `0 0 60px 30px ${palette.sunGlow}, 0 0 160px 80px ${palette.sunGlow}`,
        }}
      />
    </AbsoluteFill>
  );
};
