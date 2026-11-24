import { random } from "remotion";

/** Positive modulo, useful for wrapping endlessly scrolling layers. */
export const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Deterministic random number in [min, max) - same output on every render. */
export const rand = (seed: string | number, min = 0, max = 1) =>
  min + random(seed) * (max - min);

/** Smooth 0..1..0 pulse. */
export const pulse = (t: number, speed = 1, offset = 0) =>
  0.5 + 0.5 * Math.sin(t * speed + offset);
