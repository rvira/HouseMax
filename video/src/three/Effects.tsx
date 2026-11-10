import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Bloom, BrightnessContrast, DepthOfField, EffectComposer, HueSaturation, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { useCurrentFrame, useDelayRender, useRemotionEnvironment } from "remotion";
import { ToneMappingMode } from "postprocessing";

/**
 * Lens + grade.
 *  DepthOfField — autofocus on a world-space point (`focus`), so the subject stays sharp while the camera
 *                 moves; `range` is the in-focus depth band in feet, `bokeh` the blur size.
 *  Bloom        — threshold 1.0: only HDR emissives bloom (red violation glow, green verdict edges).
 *  ACES tone mapping, a light contrast/saturation grade, vignette, SMAA.
 * All props are plain numbers from the scene's frame math → deterministic.
 */
export function Effects({
  focus,
  range = 60,
  bokeh = 2,
  bloom = 0.8,
  vignette = 0.42,
}: {
  focus: [number, number, number];
  range?: number;
  bokeh?: number;
  bloom?: number;
  vignette?: number;
}) {
  return (
    <EffectComposer multisampling={0} stencilBuffer={false}>
      <DepthOfField target={focus} worldFocusRange={range} bokehScale={bokeh} />
      <Bloom mipmapBlur intensity={bloom} luminanceThreshold={1} luminanceSmoothing={0.15} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      {/* Light grade. Order matters: saturate BEFORE contrast. In half-float buffers the contrast curve pushes
          near-black pixels below 0, and HueSaturation on negative RGB blows them out to white (the night sky
          at the top of Scene 1 rendered pure white). Contrast last, no negative brightness offset. */}
      <HueSaturation saturation={0.1} />
      <BrightnessContrast brightness={0} contrast={0.14} />
      <Vignette offset={0.3} darkness={vignette} />
      <SMAA />
    </EffectComposer>
  );
}

/**
 * Render-mode fix for @react-three/postprocessing under Remotion.
 * EffectComposer builds its composer in an effect and stores it with setState, so it only exists after a
 * second React commit — yet its useFrame is registered at priority 1 from the start, which tells R3F to skip
 * its own gl.render. ThreeCanvas advances exactly once per frame, so on a freshly mounted canvas nobody draws
 * and the frame is captured transparent (every still came out blank).
 * On mount, hold the frame with delayRender and keep advancing for a few ticks until the composer and its
 * effect passes have committed and drawn; after that ThreeCanvas's per-frame advance is sufficient.
 * Mount AFTER <Effects> so this runs last.
 */
export function SettleFrame({ ticks = 4 }: { ticks?: number }) {
  const advance = useThree((s) => s.advance);
  const frame = useCurrentFrame();
  const { isRendering } = useRemotionEnvironment();
  const { delayRender, continueRender } = useDelayRender();
  const settled = useRef(false);
  useEffect(() => {
    if (!isRendering || settled.current) return;
    const handle = delayRender("Settling <EffectComposer> on first frame");
    let n = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      advance(performance.now());
      if (++n < ticks) timer = setTimeout(tick, 16);
      else {
        settled.current = true;
        continueRender(handle);
      }
    };
    timer = setTimeout(tick, 0);
    return () => {
      clearTimeout(timer);
      continueRender(handle);
    };
  }, [frame, advance, isRendering, delayRender, continueRender, ticks]);
  return null;
}
