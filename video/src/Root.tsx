import { Composition, Folder } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { Promo, type PromoProps } from "./Promo";
import { DURATION, FPS, HEIGHT, WIDTH } from "./timeline";

loadFont("normal", { weights: ["400", "500", "600", "700", "900"], subsets: ["latin"] });

const defaults: PromoProps = { music: null, voiceover: true };

/** Promo — the 60 s film, 1280×720 @ 30 fps (1800 frames). Poster: `npm run still` (frame 690, the verdict flip). */
export function RemotionRoot() {
  return (
    <Folder name="Byright">
      <Composition id="Promo" component={Promo} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={defaults} />
    </Folder>
  );
}
