// Entry point for Remotion. Do not rename: the CLI looks for src/index.ts.
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
