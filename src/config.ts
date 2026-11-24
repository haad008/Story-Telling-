/**
 * Central configuration for the story.
 *
 * Change scene lengths, transition length or video size here. Every scene and
 * the root composition read from this file, so the total duration always stays
 * in sync.
 */

export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
} as const;

/** Length of each crossfade between scenes, in frames. */
export const TRANSITION_FRAMES = 30;

/**
 * Scene lengths in frames (30 frames = 1 second).
 * Transitions overlap neighbouring scenes, so the total video length is
 * sum(scenes) - TRANSITION_FRAMES * (number of scenes - 1).
 */
export const SCENE_FRAMES = {
  opening: 330,
  journey: 360,
  ending: 270,
} as const;

export const TOTAL_FRAMES =
  Object.values(SCENE_FRAMES).reduce((a, b) => a + b, 0) -
  TRANSITION_FRAMES * (Object.keys(SCENE_FRAMES).length - 1);

/** Y position (in px) where the character's feet touch the ground. */
export const GROUND_Y = 880;

export const FONT_SERIF =
  "'Cormorant Garamond', 'Playfair Display', Georgia, 'Times New Roman', serif";
