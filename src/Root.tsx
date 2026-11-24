import React from "react";
import { Composition, Folder } from "remotion";
import { Story } from "./Story";
import { OpeningScene } from "./scenes/OpeningScene";
import { JourneyScene } from "./scenes/JourneyScene";
import { EndingScene } from "./scenes/EndingScene";
import { SCENE_FRAMES, TOTAL_FRAMES, VIDEO } from "./config";

/**
 * Registers the compositions shown in Remotion Studio.
 * "ForestStory" is the full 30-second film. The scenes are also registered on
 * their own so you can preview and tweak one scene at a time.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ForestStory"
        component={Story}
        durationInFrames={TOTAL_FRAMES}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Folder name="Scenes">
        <Composition id="Opening" component={OpeningScene} durationInFrames={SCENE_FRAMES.opening} {...VIDEO} />
        <Composition id="Journey" component={JourneyScene} durationInFrames={SCENE_FRAMES.journey} {...VIDEO} />
        <Composition id="Ending" component={EndingScene} durationInFrames={SCENE_FRAMES.ending} {...VIDEO} />
      </Folder>
    </>
  );
};
