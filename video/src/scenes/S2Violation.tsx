import { AbsoluteFill, spring, useVideoConfig } from "remotion";
import { computeSiteLayout, rectCenter } from "@byright/lib/scene/layout";
import { Effects } from "../three/Effects";
import { SiteModel } from "../three/SiteModel";
import { Stage } from "../three/Stage";
import { ADU_FOCUS, DEMO } from "../three/site";
import { DRIFT, GLIDE, breathe, track } from "../three/camera";
import { range, useSceneFrame } from "../ui/anim";
import { Chip, Eyebrow, Headline, Scrim, VerdictCard } from "../ui/kit";

/** Where S2 leaves the ADU (3 ft into both buffers) — S3 starts from here. */
export const VIOLATION_POS = { side: 1, rear: 1 };
export const S2_END_ORBIT = { az: -34, el: 32, r: 150, tx: -26, ty: 6, tz: -30, fov: 30 };

/**
 * Scene 2 — "One setback off" (0:08–0:17).
 * The ADU glides 3 ft into the rear and side buffers. The shared layout check (lib/scene/layout.ts, the same
 * code the app runs) flags both zones, which flood red; the ADU pulses with an HDR emissive that blooms.
 * The verdict card shows what the app's engine returns for 1 ft setbacks: Discretionary Likely.
 */
export function S2Violation() {
  const f = useSceneFrame();
  const { fps } = useVideoConfig();

  const slide = spring({ frame: f - 34, fps, config: { damping: 22, stiffness: 60, mass: 1.2 } });
  const side = DEMO.aduSideOffset + (VIOLATION_POS.side - DEMO.aduSideOffset) * slide;
  const rear = DEMO.aduRearOffset + (VIOLATION_POS.rear - DEMO.aduRearOffset) * slide;
  const layout = computeSiteLayout({ ...DEMO, aduSideOffset: side, aduRearOffset: rear });
  const violating = layout.violations.length > 0;
  const glow = violating ? range(f, [58, 80], [0, 1]) * (0.55 + 0.45 * Math.sin((f - 58) / 4.2)) : 0;
  const c = rectCenter(layout.adu);

  const orbit = breathe(
    track(f, [
      { f: -8, v: { az: 37, el: 30, r: 222, tx: ADU_FOCUS[0] - 18, ty: 6, tz: ADU_FOCUS[2] + 14, fov: 30 } },
      { f: 150, v: { az: -26, el: 31, r: 165, tx: -26, ty: 6, tz: -28, fov: 30 }, ease: GLIDE },
      { f: 278, v: S2_END_ORBIT, ease: DRIFT },
    ]),
    f,
  );

  return (
    <AbsoluteFill>
      <Stage orbit={orbit}>
        <SiteModel adu={{ side, rear, height: DEMO.aduHeight, glow, edge: violating ? "#ef4444" : "#eda100", edgeGlow: glow * 0.6 }} />
        <Effects focus={[c.x, DEMO.aduHeight / 2, c.z]} range={46} bokeh={3.4} bloom={1.1} />
      </Stage>

      <Scrim side="left" />
      <AbsoluteFill className="justify-start p-16">
        <Eyebrow at={22}>Spatial check</Eyebrow>
        <Headline at={26} text="One setback off." className="mt-3 text-[64px] leading-[1.04]" />
        <Headline at={140} text="Hearing likely." className="text-[64px] leading-[1.04] text-critical" />
      </AbsoluteFill>

      <AbsoluteFill className="items-end justify-start p-14">
        <VerdictCard at={92} from="discretionary">
          <Chip at={112} tone="glass">Side &amp; rear setbacks: fail · 1 ft</Chip>
          <Chip at={124} tone="glass">Height: unknown</Chip>
          <Chip at={132} tone="glass">Parking: unknown</Chip>
        </VerdictCard>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
