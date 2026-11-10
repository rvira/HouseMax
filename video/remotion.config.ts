/**
 * Remotion CLI/Studio configuration. (Applies to `remotion studio` and `remotion render`.)
 */
import path from "node:path";
import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

const root = process.cwd();

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setCodec("h264");
Config.setCrf(16);
Config.setPixelFormat("yuv420p");
// Real GPU for WebGL in headless Chrome (macOS). Use "swangle" on a GPU-less CI box.
Config.setChromiumOpenGlRenderer("angle");
Config.setOverwriteOutput(true);
// First load of the 3D bundle can exceed the 28 s default on a cold headless browser.
Config.setDelayRenderTimeoutInMilliseconds(120000);

Config.overrideWebpackConfig((current) => {
  const withTailwind = enableTailwind(current);
  return {
    ...withTailwind,
    resolve: {
      ...withTailwind.resolve,
      alias: {
        ...(withTailwind.resolve?.alias ?? {}),
        // Shared scene code lives in the app; the video imports it so both stay identical.
        "@byright": path.join(root, "../frontend"),
        // Exact-match alias: frontend files importing "three" bind to THIS package's copy (one three instance).
        three$: path.join(root, "node_modules/three/build/three.module.js"),
      },
    },
  };
});
