import React from "react";

export type TreeKind = "pine" | "oak";

type TreeProps = {
  kind: TreeKind;
  x: number;
  y: number;
  scale: number;
  color: string;
  highlight?: string;
  /** 0..1 strength of the sunlit edge. */
  highlightOpacity?: number;
  /** +1 = light from the right, -1 = light from the left. */
  lightSide?: 1 | -1;
  /** Sway angle in degrees (wind). */
  sway?: number;
};

/**
 * A stylised illustrated tree drawn with SVG.
 * The tree's base sits at (x, y); it is drawn ~420 units tall at scale 1.
 */
export const Tree: React.FC<TreeProps> = ({
  kind,
  x,
  y,
  scale,
  color,
  highlight,
  highlightOpacity = 0,
  lightSide = 1,
  sway = 0,
}) => {
  const s = lightSide;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g transform={`rotate(${sway})`}>
        {kind === "pine" ? (
          <>
            <rect x={-9} y={-90} width={18} height={92} fill={color} />
            {[0, 1, 2, 3].map((i) => {
              const tierW = 120 - i * 24;
              const tierBottom = -60 - i * 78;
              const tierTop = tierBottom - 150;
              return (
                <g key={i}>
                  <path
                    d={`M ${-tierW} ${tierBottom} Q 0 ${tierBottom - 18} ${tierW} ${tierBottom} L 0 ${tierTop} Z`}
                    fill={color}
                  />
                  {highlight && highlightOpacity > 0 && (
                    <path
                      d={`M 0 ${tierTop} L ${s * tierW} ${tierBottom} Q ${s * tierW * 0.6} ${tierBottom - 8} ${s * tierW * 0.25} ${tierBottom - 6} Z`}
                      fill={highlight}
                      opacity={highlightOpacity}
                    />
                  )}
                </g>
              );
            })}
          </>
        ) : (
          <>
            <path
              d="M -16 2 C -12 -60 -10 -120 -22 -190 L 22 -190 C 10 -120 12 -60 16 2 Z"
              fill={color}
            />
            <path d="M -4 -150 C -30 -180 -60 -200 -80 -215" stroke={color} strokeWidth={10} fill="none" />
            <path d="M 4 -165 C 30 -190 60 -205 85 -230" stroke={color} strokeWidth={10} fill="none" />
            {(() => {
              const blobs = [
                [-80, -240, 80],
                [80, -250, 85],
                [0, -300, 110],
                [-60, -350, 80],
                [60, -360, 85],
                [0, -420, 70],
              ];
              return (
                <>
                  {/* Lit rim: highlight blobs, then the canopy drawn slightly offset
                      away from the light, leaving a crescent of light on the sun side. */}
                  {highlight && highlightOpacity > 0 &&
                    blobs.map(([cx, cy, r], i) => (
                      <circle key={`h${i}`} cx={cx} cy={cy} r={r} fill={highlight} opacity={Math.min(1, highlightOpacity * 2.2)} />
                    ))}
                  {blobs.map(([cx, cy, r], i) => (
                    <circle
                      key={i}
                      cx={highlight && highlightOpacity > 0 ? cx - s * r * 0.12 : cx}
                      cy={highlight && highlightOpacity > 0 ? cy + r * 0.08 : cy}
                      r={r}
                      fill={color}
                    />
                  ))}
                </>
              );
            })()}
          </>
        )}
      </g>
    </g>
  );
};
