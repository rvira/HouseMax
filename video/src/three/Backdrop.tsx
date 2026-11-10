import { Effects } from "./Effects";
import { SiteModel } from "./SiteModel";
import { Stage } from "./Stage";
import { DEMO } from "./site";
import { DRIFT, track } from "./camera";

/**
 * The finished (compliant, 16 ft, green) site as an out-of-focus backdrop for UI-led scenes: a slow orbit with
 * the focus pulled far behind the subject, so it reads as soft shapes and light — continuity, not content.
 */
export function Backdrop({ frame, from, to, focusFar = 260 }: { frame: number; from: number; to: number; focusFar?: number }) {
  const orbit = track(frame, [
    { f: -10, v: { az: from, el: 24, r: 150, tx: -6, ty: 6, tz: -30, fov: 30 } },
    { f: 290, v: { az: to, el: 26, r: 135, tx: -6, ty: 6, tz: -30, fov: 30 }, ease: DRIFT },
  ]);
  return (
    <Stage orbit={orbit}>
      <SiteModel adu={{ side: DEMO.aduSideOffset, rear: DEMO.aduRearOffset, height: 16, edge: "#1baf7a", edgeGlow: 0.35 }} parking={1} />
      <Effects focus={[0, 0, -focusFar]} range={20} bokeh={7} bloom={0.6} vignette={0.3} />
    </Stage>
  );
}
