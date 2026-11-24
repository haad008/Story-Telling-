import { Easing, interpolate } from "remotion";

/** Cinematic ease used for most camera moves. */
export const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);

/** interpolate() with clamping and an ease - the most common call in scenes. */
export const tween = (
  frame: number,
  input: [number, number],
  output: [number, number],
  easing: (t: number) => number = easeInOut
) =>
  interpolate(frame, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/**
 * Distance travelled by `frame`, given a speed (px per frame) that can change
 * over time. Lets you describe walking as "speed over time" (slow down, stop,
 * start again) and get a position that is always smooth.
 */
export const distanceAt = (frame: number, speedAt: (f: number) => number) => {
  let d = 0;
  for (let f = 0; f < Math.floor(frame); f++) d += speedAt(f);
  return d + speedAt(Math.floor(frame)) * (frame - Math.floor(frame));
};
