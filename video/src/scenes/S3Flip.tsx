import { AbsoluteFill, spring, useVideoConfig } from "remotion";
import { computeSiteLayout, rectCenter } from "@byright/lib/scene/layout";
import { Effects } from "../three/Effects";
import { SiteModel } from "../three/SiteModel";
import { Stage } from "../three/Stage";
import { DEMO } from "../three/site";
import { DRIFT, GLIDE, breathe, track } from "../three/camera";
import { enter, range, SILK, useSpring, useSceneFrame } from "../ui/anim";
import { Chip, Eyebrow, Glass, Headline, Scrim, VerdictCard } from "../ui/kit";
import { S2_END_ORBIT, VIOLATION_POS } from "./S2Violation";

/**
 * Scene 3 — "The flip" (0:17–0:26).
 * The app's three flips for this state (findFlips, verified against the engine), applied one at a time:
 * setbacks pull back to 4 ft (ADU slides out of the buffers), height trims 17.5 → 16 ft (roof settles onto the
 * 16 ft guarantee plane), one parking space appears. Only with all three does the engine return By-Right
 * Likely, so the verdict rolls from red to green last, with a green edge bloom.
 */
export function S3Flip() {
  const f = useSceneFrame();
  const { fps } = useVideoConfig();

  const back = spring({ frame: f - 50, fps, config: { damping: 24, stiffness: 70, mass: 1.1 } });
  const side = VIOLATION_POS.side + (DEMO.aduSideOffset - VIOLATION_POS.side) * back;
  const rear = VIOLATION_POS.rear + (DEMO.aduRearOffset - VIOLATION_POS.rear) * back;
  const trim = spring({ frame: f - 118, fps, config: { damping: 18, stiffness: 90 } });
  const height = 17.5 - 1.5 * trim;
  const flip = range(f, [150, 168], [0, 1]);
  const greenPulse = flip > 0 ? range(f, [150, 162, 230], [0, 1, 0.25]) : 0;
  const redFade = range(f, [50, 80], [0.8, 0]);

  const layout = computeSiteLayout({ ...DEMO, aduSideOffset: side, aduRearOffset: rear, aduHeight: height });
  const c = rectCenter(layout.adu);

  const orbit = breathe(
    track(f, [
      { f: -8, v: S2_END_ORBIT },
      { f: 120, v: { az: 38, el: 20, r: 150, tx: -30, ty: 20, tz: -40, fov: 30 }, ease: GLIDE },
      { f: 278, v: { az: 48, el: 18, r: 136, tx: -30, ty: 20, tz: -40, fov: 30 }, ease: DRIFT },
    ]),
    f,
  );

  const park = range(f, [138, 160], [0, 1]);

  return (
    <AbsoluteFill>
      <Stage orbit={orbit}>
        <SiteModel
          adu={{ side, rear, height, glow: redFade, edge: flip > 0.5 ? "#1baf7a" : "#ef4444", edgeGlow: flip > 0 ? greenPulse : redFade * 0.4 }}
          envelope={range(f, [56, 90], [0, 1])}
          parking={park}
        />
        <Effects focus={[c.x, 9, c.z]} range={42} bokeh={3.6} bloom={1.0} />
      </Stage>

      <Scrim side="left" />
      <AbsoluteFill className="justify-start p-16">
        <Eyebrow at={10}>By-Right Flip</Eyebrow>
        <Headline at={14} text="The smallest fixes," className="mt-3 text-[60px] leading-[1.04]" />
        <Headline at={28} text="each re-checked." className="text-[60px] leading-[1.04] text-brand-600" />

        {/* The app's flip rows (labels verbatim from findFlips), each toggled in sync with its 3D change */}
        <div className="mt-8 flex flex-col gap-3">
          <FlipRow appear={40} on={50} label="Pull back setbacks" change="Rear & side → 4 ft" />
          <FlipRow appear={46} on={114} label="Trim height to the state floor" change="17.5 ft → 16 ft" />
          <FlipRow appear={52} on={136} label="Add one parking space" change="0 → 1 space" />
        </div>
      </AbsoluteFill>

      <AbsoluteFill className="items-end justify-start p-14">
        <VerdictCard at={-8} from="discretionary" to="byright" flip={flip}>
          {flip < 0.5 ? (
            <Chip at={-8} tone="glass">Setbacks fail · height &amp; parking unknown</Chip>
          ) : (
            <Chip at={152} tone="glass">Every blocking condition passes</Chip>
          )}
        </VerdictCard>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function FlipRow({ appear, on, label, change }: { appear: number; on: number; label: string; change: string }) {
  const p = useSpring(appear);
  const t = useSpring(on, SILK);
  return (
    <Glass className="flex w-[470px] items-center gap-5 px-5 py-4" style={enter(p, 20)}>
      <div className="relative h-7 w-12 shrink-0 rounded-full" style={{ background: t > 0.5 ? "#3b6cf6" : "#d6d5cf" }}>
        <div className="absolute top-1 size-5 rounded-full bg-white shadow" style={{ left: 4 + t * 20 }} />
      </div>
      <div>
        <p className="text-[19px] font-semibold text-ink">{label}</p>
        <p className="mt-0.5 font-mono text-[15px] text-ink-2 tabular">{change}</p>
      </div>
    </Glass>
  );
}
