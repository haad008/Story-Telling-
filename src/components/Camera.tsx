import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

type CameraProps = {
  /** 1 = no zoom. Values > 1 push in. */
  zoom?: number;
  /** Point (in screen px) the camera zooms toward. */
  focusX?: number;
  focusY?: number;
  /** Extra vertical pan in px (positive = camera tilts down). */
  panY?: number;
  /** Amount of subtle hand-held drift, 0..1. */
  handheld?: number;
  children: React.ReactNode;
};

/**
 * Virtual camera. Horizontal tracking is handled by passing `cameraX` to the
 * world layers (for parallax); this component adds zoom, tilt and drift.
 */
export const Camera: React.FC<CameraProps> = ({
  zoom = 1,
  focusX = 960,
  focusY = 540,
  panY = 0,
  handheld = 0.5,
  children,
}) => {
  const frame = useCurrentFrame();
  const driftX = (Math.sin(frame * 0.021) + Math.sin(frame * 0.013 + 1.3) * 0.6) * 4 * handheld;
  const driftY = (Math.cos(frame * 0.017) + Math.sin(frame * 0.011 + 0.4) * 0.5) * 3 * handheld;
  // Never zoom out below 1, otherwise the edges of the frame would show.
  const z = Math.max(1, zoom) * (1 + 0.006 * handheld);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transformOrigin: `${focusX}px ${focusY}px`,
          transform: `translate(${driftX}px, ${driftY - panY}px) scale(${z})`,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
