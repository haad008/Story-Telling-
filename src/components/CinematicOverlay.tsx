import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

type CinematicOverlayProps = {
  /** Colour grade wash. */
  grade: string;
  gradeOpacity: number;
  /** Vignette darkness, 0..1. */
  vignette?: number;
  /** Letterbox bar height in px (cinemascope look). */
  letterbox?: number;
  grain?: number;
};

/**
 * Finishing pass applied on top of every scene: colour grade, vignette,
 * film grain and letterbox bars. These sit outside the camera, so they never zoom.
 */
export const CinematicOverlay: React.FC<CinematicOverlayProps> = ({
  grade,
  gradeOpacity,
  vignette = 0.55,
  letterbox = 0,
  grain = 0.06,
}) => {
  const frame = useCurrentFrame();
  // Shift the grain pattern every 2 frames so it reads as film, not a static texture.
  const grainSeed = Math.floor(frame / 2) % 12;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: grade, opacity: gradeOpacity, mixBlendMode: "soft-light" }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,${vignette}) 100%)`,
        }}
      />
      {grain > 0 && (
        <svg width="100%" height="100%" style={{ position: "absolute", opacity: grain, mixBlendMode: "overlay" }}>
          <filter id={`grain-${grainSeed}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={grainSeed} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#grain-${grainSeed})`} />
        </svg>
      )}
      {letterbox > 0 && (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: letterbox, background: "#000" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: letterbox, background: "#000" }} />
        </>
      )}
    </AbsoluteFill>
  );
};

/** Fade from/to black at the very start or end of the film. */
export const FadeFromBlack: React.FC<{ from: number; to: number; reverse?: boolean }> = ({
  from,
  to,
  reverse = false,
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = reverse ? t : 1 - t;
  return <AbsoluteFill style={{ background: "#000", opacity }} />;
};
