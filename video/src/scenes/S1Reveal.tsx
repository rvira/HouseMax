import { AbsoluteFill, interpolateColors, spring, useVideoConfig } from "remotion";
import { Effects } from "../three/Effects";
import { SiteModel } from "../three/SiteModel";
import { Stage, STUDIO_BG } from "../three/Stage";
import { ADU_FOCUS, DEMO } from "../three/site";
import { DRIFT, GLIDE, SMOOTH, breathe, track } from "../three/camera";
import { LIVELY, range, useSceneFrame } from "../ui/anim";
import { Eyebrow, Headline } from "../ui/kit";

/**
 * Scene 1 — "Lights up" (0:00–0:08, 240 frames).
 *
 *   0–70    Night → studio: key light and background ramp up together.
 *   8–120   The site assembles: lot pad rises, lot line + setback buffers draw on, the house springs up,
 *           neighbours and street trees pop in on a stagger.
 *   100–150 The ADU drops in on a damped spring. Spring overshoot past the ground is converted into a
 *           squash (so it lands with weight instead of sinking), and a blue edge "ping" blooms on contact.
 *   0–240   One continuous crane move: low and wide from the street, arcing up and around to a
 *           three-quarter view of the backyard, then a slow drift (plus a sub-degree "operator breath").
 *   Lens    DoF autofocus racks from the house to the ADU as it lands; bokeh opens as the camera settles.
 *   150+    Headline.
 */
export function S1Reveal() {
  const f = useSceneFrame();
  const { fps } = useVideoConfig();

  // ── Light ────────────────────────────────────────────────────────────────────────────────────────────
  const light = range(f, [0, 70], [0.04, 1], SMOOTH);
  const background = interpolateColors(range(f, [0, 70], [0, 1], SMOOTH), [0, 1], ["#0b0f1a", STUDIO_BG]);

  // ── Assembly ─────────────────────────────────────────────────────────────────────────────────────────
  const build = {
    pad: spring({ frame: f - 8, fps, config: { damping: 200 }, durationInFrames: 40 }),
    lines: range(f, [30, 70], [0, 1], SMOOTH),
    house: spring({ frame: f - 34, fps, config: LIVELY }),
    neighbors: range(f, [46, 92], [0, 1], SMOOTH),
    trees: range(f, [50, 125], [0, 1]),
  };

  // ── ADU drop: underdamped spring 0 → 1 (overshoots ~1.15) ────────────────────────────────────────────
  const drop = spring({ frame: f - 100, fps, config: { damping: 9, stiffness: 110, mass: 1 } });
  const lift = 80 * Math.max(0, 1 - drop); // above ground until first contact
  const squash = Math.min(1, Math.max(0, drop - 1) * 5); // overshoot → squash on landing
  const landed = f >= 100 && drop >= 0.98;
  const ping = landed ? range(f, [112, 118, 150], [0, 1, 0]) : 0;

  // ── Camera: crane from the street to a ¾ backyard view ───────────────────────────────────────────────
  const orbit = breathe(
    track(f, [
      { f: 0, v: { az: -52, el: 5, r: 340, tx: 0, ty: 4, tz: 12, fov: 27 } },
      { f: 150, v: { az: 30, el: 30, r: 250, tx: -22, ty: 4, tz: -14, fov: 30 }, ease: GLIDE },
      { f: 248, v: { az: 37, el: 30, r: 222, tx: ADU_FOCUS[0] - 18, ty: 6, tz: ADU_FOCUS[2] + 14, fov: 30 }, ease: DRIFT },
    ]),
    f,
    range(f, [120, 200], [0, 1]),
  );

  // ── Lens: rack focus house → ADU as it lands; open the aperture as we settle ─────────────────────────
  const rack = range(f, [95, 135], [0, 1], SMOOTH);
  const focus: [number, number, number] = [
    0 + (ADU_FOCUS[0] - 0) * rack,
    8 + (ADU_FOCUS[1] - 8) * rack,
    20 + (ADU_FOCUS[2] - 20) * rack,
  ];
  const bokeh = range(f, [0, 60, 170], [5, 2, 3.2]);

  return (
    <AbsoluteFill>
      <Stage orbit={orbit} light={light} background={background}>
        <SiteModel
          build={build}
          adu={{
            side: DEMO.aduSideOffset,
            rear: DEMO.aduRearOffset,
            height: DEMO.aduHeight,
            lift: f < 100 ? 200 : lift, // parked off-screen until its cue
            squash,
            edge: "#3b6cf6",
            edgeGlow: ping,
          }}
        />
        <Effects focus={focus} range={70} bokeh={bokeh} bloom={0.9} vignette={range(f, [0, 70], [0.75, 0.42])} />
      </Stage>

      {/* 2D overlay — plain DOM over the canvas */}
      <AbsoluteFill className="justify-end p-16 pb-20">
        <div className="max-w-[760px]">
          <Eyebrow at={146}>California ADU law · Gov. Code § 66317</Eyebrow>
          <Headline at={152} text="No hearing required." className="mt-3 text-[76px] leading-[1.02]" />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
