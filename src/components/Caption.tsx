import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { FONT_SERIF } from "../config";

type CaptionProps = {
  text: string;
  /** Frame (relative to the scene) the caption starts fading in. */
  from: number;
  /** Frame the caption is fully gone. */
  to: number;
  fadeFrames?: number;
  size?: number;
  /** Small line shown above the main text, e.g. "Chapter I". */
  kicker?: string;
  align?: "center" | "bottom";
  color?: string;
};

/**
 * Cinematic title/caption: fades in with a soft blur and widening letter
 * spacing, then fades out.
 */
export const Caption: React.FC<CaptionProps> = ({
  text,
  from,
  to,
  fadeFrames = 25,
  size = 92,
  kicker,
  align = "center",
  color = "#fff7ea",
}) => {
  const frame = useCurrentFrame();
  if (frame < from || frame > to) return null;

  const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
  const fadeIn = interpolate(frame, [from, from + fadeFrames], [0, 1], { extrapolateRight: "clamp", easing: ease });
  const fadeOut = interpolate(frame, [to - fadeFrames, to], [1, 0], { extrapolateLeft: "clamp", easing: ease });
  const opacity = Math.min(fadeIn, fadeOut);
  const spacing = interpolate(frame, [from, to], [0.12, 0.2]);
  const blur = (1 - opacity) * 8;
  const rise = (1 - fadeIn) * 16;

  return (
    <AbsoluteFill
      style={{
        justifyContent: align === "center" ? "center" : "flex-end",
        alignItems: "center",
        paddingBottom: align === "bottom" ? 170 : 0,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          textAlign: "center",
          opacity,
          filter: `blur(${blur}px)`,
          transform: `translateY(${rise}px)`,
          color,
          fontFamily: FONT_SERIF,
          textShadow: "0 2px 30px rgba(0,0,0,0.55), 0 0 60px rgba(255,200,140,0.25)",
        }}
      >
        {kicker && (
          <div
            style={{
              fontSize: size * 0.28,
              letterSpacing: "0.5em",
              textTransform: "uppercase",
              opacity: 0.8,
              marginBottom: size * 0.25,
            }}
          >
            {kicker}
          </div>
        )}
        <div style={{ fontSize: size, letterSpacing: `${spacing}em`, fontWeight: 400, lineHeight: 1.15 }}>{text}</div>
      </div>
    </AbsoluteFill>
  );
};
