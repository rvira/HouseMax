import { AbsoluteFill } from "remotion";
import { Effects } from "../three/Effects";
import { SiteModel } from "../three/SiteModel";
import { Stage } from "../three/Stage";
import { ADU_FOCUS, DEMO } from "../three/site";
import { GLIDE, track } from "../three/camera";
import { enter, range, useSceneFrame, useSpring } from "../ui/anim";
import { LogoMark } from "../ui/kit";

/**
 * Scene 7 — Outro (0:52–1:00).
 * A rising pull-back to an aerial of the finished, compliant site (green edges), then the frame dissolves to
 * navy for the logo lock-up, timed to the voiceover's "By-right." Ends on the prototype disclaimer.
 */
export function S7Outro() {
  const f = useSceneFrame();
  const orbit = track(f, [
    { f: -8, v: { az: 70, el: 20, r: 120, tx: ADU_FOCUS[0], ty: 8, tz: ADU_FOCUS[2], fov: 30 } },
    { f: 130, v: { az: 18, el: 58, r: 360, tx: 0, ty: 0, tz: -10, fov: 30 }, ease: GLIDE },
  ]);
  const night = range(f, [78, 112], [0, 1]);
  const word = useSpring(112);
  const tag = useSpring(138);
  const fine = useSpring(168);
  const outFade = range(f, [228, 240], [0, 1]);

  return (
    <AbsoluteFill className="bg-navy">
      {night < 1 && (
        <Stage orbit={orbit}>
          <SiteModel adu={{ side: DEMO.aduSideOffset, rear: DEMO.aduRearOffset, height: 16, edge: "#1baf7a", edgeGlow: range(f, [0, 40, 100], [0.3, 0.9, 0.6]) }} parking={1} />
          <Effects focus={[ADU_FOCUS[0], 8, ADU_FOCUS[2]]} range={140} bokeh={range(f, [0, 120], [3, 1.2])} bloom={1} />
        </Stage>
      )}

      <AbsoluteFill className="bg-navy" style={{ opacity: night }} />

      <AbsoluteFill className="items-center justify-center text-center">
        <LogoMark at={100} size={104} />
        <p style={enter(word, 18)} className="mt-7 text-[88px] font-semibold leading-none tracking-[-0.035em] text-white">
          Byright
        </p>
        <p style={enter(tag, 14)} className="mt-5 text-[28px] font-medium text-white/75">
          Know if it’s by-right. Prove it with the statute.
        </p>
      </AbsoluteFill>
      <AbsoluteFill className="items-center justify-end pb-12">
        <p style={enter(fine, 8)} className="text-[15px] tracking-wide text-white/45">
          Prototype · Not legal advice · Final determination rests with city staff
        </p>
      </AbsoluteFill>
      <AbsoluteFill className="bg-navy" style={{ opacity: outFade }} />
    </AbsoluteFill>
  );
}
