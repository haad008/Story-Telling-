/**
 * Colour palettes ("lighting setups") for each time of day.
 *
 * A scene picks one palette and every layer of the forest (sky, mountains,
 * trees, fog, ground, rim light on the character) reads its colours from it.
 * To create a new mood, copy a palette and tweak the colours.
 */

export type Palette = {
  /** Sky gradient, top to horizon. */
  sky: [string, string, string];
  sun: string;
  sunGlow: string;
  /** Far and near mountain silhouettes. */
  mountains: [string, string];
  /** Tree layers from farthest (hazy) to nearest (saturated/dark). */
  trees: [string, string, string, string];
  /** Colour used for the lit side of trees. */
  treeHighlight: string;
  fog: string;
  ground: [string, string];
  path: string;
  grass: string;
  /** Edge light on the character, coming from the sun side. */
  rimLight: string;
  /** Colour wash laid over the final frame (colour grading). */
  grade: string;
  gradeOpacity: number;
  /** Very near, out-of-focus foreground silhouettes. */
  foreground: string;
};

export const DAWN: Palette = {
  sky: ["#1d2547", "#8a5a83", "#f6b48a"],
  sun: "#ffe2b0",
  sunGlow: "rgba(255, 182, 120, 0.55)",
  mountains: ["#7d6c93", "#5c5279"],
  trees: ["#6f6a8f", "#4f5378", "#323a5a", "#1c2238"],
  treeHighlight: "#f3a27a",
  fog: "rgba(246, 205, 190, 0.55)",
  ground: ["#2a2b45", "#141628"],
  path: "#5b4e66",
  grass: "#22263f",
  rimLight: "rgba(255, 190, 140, 0.95)",
  grade: "#ff9a6b",
  gradeOpacity: 0.08,
  foreground: "#0b0d1a",
};

export const GOLDEN_FOREST: Palette = {
  sky: ["#6fa6a1", "#cfe0b0", "#ffe9b0"],
  sun: "#fff4cf",
  sunGlow: "rgba(255, 228, 150, 0.6)",
  mountains: ["#9cb8a0", "#7da08a"],
  trees: ["#7fa08a", "#4f7a66", "#2d5546", "#173228"],
  treeHighlight: "#e9d27a",
  fog: "rgba(232, 240, 205, 0.5)",
  ground: ["#3c5a33", "#1b2c1a"],
  path: "#8a7550",
  grass: "#2a4626",
  rimLight: "rgba(255, 236, 170, 0.95)",
  grade: "#ffd27a",
  gradeOpacity: 0.07,
  foreground: "#0c1a10",
};

export const TWILIGHT: Palette = {
  sky: ["#120f2e", "#4a2a63", "#d0688a"],
  sun: "#ffc9a0",
  sunGlow: "rgba(255, 120, 140, 0.45)",
  mountains: ["#4a3463", "#352650"],
  trees: ["#3d3160", "#2a2550", "#1b1a3c", "#0f0f26"],
  treeHighlight: "#ff9fb0",
  fog: "rgba(190, 150, 220, 0.45)",
  ground: ["#1d1a3a", "#0b0a1c"],
  path: "#3c3260",
  grass: "#17163a",
  rimLight: "rgba(255, 200, 150, 0.95)",
  grade: "#7a4cff",
  gradeOpacity: 0.07,
  foreground: "#05050f",
};
