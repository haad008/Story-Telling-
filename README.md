# Story-Telling-

Story telling with Elef: 2D cinematic animated stories, built with [Remotion](https://www.remotion.dev) and React.

## The Lantern Path (v1)

A 30-second illustrated short (1920×1080, 30 fps, no audio). A small hooded traveller carries a lantern through a forest:

| Scene | Time | What happens |
|---|---|---|
| **Opening**: Dawn | 0–10s | Fade in from black. The camera starts on a starry sky and cranes down to the forest while the title *The Lantern Path* appears. The traveller walks in, and the camera starts following. |
| **Middle**: The deep forest | 9–21s | Golden god rays, drifting fog, dust motes and falling leaves. The camera tracks the traveller and slowly pushes in. They stop to look up at the light, then walk on. |
| **Ending**: Twilight clearing | 20–30s | The traveller reaches an ancient tree and stops. They raise the lantern and the tree lights up. Sparks rise, the camera pulls back, and the film fades out on *The End*. |

Scenes are joined with smooth transitions: a custom glow dissolve, then a crossfade.

Everything is drawn in code with SVG and CSS. It uses no image files, fonts to download, paid APIs, music or voiceover.

## Requirements

- [Node.js](https://nodejs.org) 18 or newer (20+ recommended)
- About 1 GB of free disk space

The first preview or render downloads a headless Chrome automatically. It's free and handled by Remotion.

## Setup

```bash
npm install
```

## Preview (Remotion Studio)

```bash
npm run dev
```

Open the URL it prints (usually http://localhost:3000). In the left sidebar:

- **ForestStory** is the full 30-second film.
- **Scenes → Opening / Journey / Ending** are each scene on its own, for faster editing.

Press space to play. Scrub the timeline to inspect any frame. Code changes reload instantly.

## Export the MP4

```bash
npm run render
```

This writes **`out/forest-story.mp4`** (H.264, 1920×1080, 30 fps, 900 frames).

Other useful commands:

```bash
npm run render:preview      # half-resolution (960×540) draft, about 4× faster
npm run still               # export a single PNG frame (frame 450) to out/still.png
npx remotion render Ending out/ending.mp4   # render just one scene
npx remotion render ForestStory out/story.mp4 --concurrency=8   # use more CPU cores
npm run typecheck           # check the TypeScript for errors
```

Rendering time depends on your CPU: about 3–10 minutes for the full film on a typical laptop. Raise `--concurrency` to render faster on machines with more cores.

> **No internet / blocked downloads?** If Remotion can't download its browser, point it at an installed Chrome or Chromium:
> `npx remotion render ForestStory out/forest-story.mp4 --browser-executable="/path/to/chrome"`

## Project structure

```
src/
├── index.ts                  Remotion entry point (registerRoot)
├── Root.tsx                  Registers the compositions (full film + individual scenes)
├── Story.tsx                 Joins the scenes with transitions (TransitionSeries)
├── config.ts                 Video size, fps, scene lengths, transition length
├── scenes/
│   ├── OpeningScene.tsx      Dawn: title, crane-down, traveller enters
│   ├── JourneyScene.tsx      Deep forest: tracking shot, god rays, pause and look up
│   └── EndingScene.tsx       Twilight: heart tree awakens, pull-back, The End
├── components/
│   ├── ForestWorld.tsx       The full layered parallax forest (reused by every scene)
│   ├── Sky.tsx               Gradient sky, stars, sun and glow
│   ├── Mountains.tsx         Distant ridge lines
│   ├── TreeLayer.tsx         Endlessly scrolling row of trees at a parallax depth
│   ├── Tree.tsx              Pine and oak illustrations with rim lighting
│   ├── Ground.tsx            Forest floor, path, grass and stones
│   ├── Atmosphere.tsx        Fog, LightRays (god rays), Fireflies, FallingLeaves
│   ├── Character.tsx         The traveller, with a procedural walk cycle
│   ├── HeartTree.tsx         The glowing tree in the finale
│   ├── Camera.tsx            Zoom, tilt and hand-held drift
│   ├── Caption.tsx           Cinematic titles and subtitles
│   └── CinematicOverlay.tsx  Colour grade, vignette, film grain, letterbox, fades
├── transitions/
│   └── glowDissolve.tsx      Custom "bloom" dissolve transition
└── lib/
    ├── palettes.ts           Lighting/colour setups: DAWN, GOLDEN_FOREST, TWILIGHT
    ├── motion.ts             tween() and distanceAt() animation helpers
    └── math.ts               Deterministic random numbers and wrapping
```

## How it works

- **Parallax camera.** Each scene computes a `cameraX` value for each frame. Every world layer moves by `cameraX × depth`: mountains at 0.04, far trees at 0.2, the ground at 1 and foreground trees at 1.7. This is what gives the flat drawings their depth. `Camera` adds zoom, tilt and a subtle hand-held drift on top.
- **Walk cycle.** `Character` takes a `distance` walked, and the legs, arms, body bob, cloak, scarf and lantern swing all follow from it. If you stop increasing the distance, the character stops walking with planted feet. `distanceAt()` turns a speed-over-time curve into a distance.
- **Lighting.** Each palette in `lib/palettes.ts` defines the colours for sky, fog, every tree layer, the highlights on the sunny side of trees, the character's rim light and the colour grade. Swap a scene's palette to change its time of day.
- **Determinism.** All randomness uses Remotion's seeded `random()`, so every render is identical.

## Editing and extending

- **Change timing:** edit `SCENE_FRAMES` and `TRANSITION_FRAMES` in `src/config.ts`. The total length updates automatically.
- **Change text:** edit the `<Caption>` lines in each scene.
- **Change the mood:** pick a different palette in a scene, or add a new one in `lib/palettes.ts`.
- **A different forest:** change the `seed` prop on `<ForestWorld>`, or the density, scale and depth values in `ForestWorld.tsx`.
- **Recolour the traveller:** edit `COLORS` at the top of `components/Character.tsx`.
- **Add a scene:**
  1. Copy `src/scenes/JourneyScene.tsx` to a new file, such as `RiverScene.tsx`, and change it.
  2. Add its length to `SCENE_FRAMES` in `config.ts`.
  3. In `Story.tsx`, add a `<TransitionSeries.Transition>` and a `<TransitionSeries.Sequence>` containing it.
  4. Optionally, register it in `Root.tsx` so you can preview it on its own.
- **New transition:** use any presentation from `@remotion/transitions` (`fade`, `slide`, `wipe`, `flip`, `clockWipe`), or copy `transitions/glowDissolve.tsx`.

## License note

Remotion is free for individuals and companies with up to 3 employees. Larger companies need a [company license](https://www.remotion.dev/license).
