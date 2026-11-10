import type { ComponentType } from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { FPS, SCENES, XFADE, type SceneId } from "./timeline";
import { SceneLead } from "./ui/anim";
import manifest from "./vo-manifest.json";
import { S1Reveal } from "./scenes/S1Reveal";
import { S2Violation } from "./scenes/S2Violation";
import { S3Flip } from "./scenes/S3Flip";
import { S4ConflictRadar } from "./scenes/S4ConflictRadar";
import { S5Clocks } from "./scenes/S5Clocks";
import { S6Packet } from "./scenes/S6Packet";
import { S7Outro } from "./scenes/S7Outro";
import "./styles.css";

const COMPONENTS: Record<SceneId, ComponentType> = {
  reveal: S1Reveal,
  violation: S2Violation,
  flip: S3Flip,
  radar: S4ConflictRadar,
  clocks: S5Clocks,
  packet: S6Packet,
  outro: S7Outro,
};

type VoLine = { file: string; seconds: number };
const VO = manifest.lines as Partial<Record<SceneId, VoLine>>;

export type PromoProps = {
  /** Optional music bed in public/ (e.g. "music.mp3"). Ducked automatically under the voiceover. */
  music: string | null;
  /** Voiceover on/off (for silent cuts / re-timing). */
  voiceover: boolean;
};

/** Fades the incoming scene over the outgoing one during the XFADE overlap. */
function Dissolve({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  const f = useCurrentFrame();
  const opacity = enabled ? interpolate(f, [0, XFADE], [0, 1], { extrapolateRight: "clamp" }) : 1;
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
}

/** Voiceover windows in absolute frames, for ducking the music bed. */
const VO_WINDOWS = SCENES.flatMap((s) => {
  const line = VO[s.id];
  if (!line) return [];
  const start = s.from + s.vo.at;
  return [[start, start + Math.ceil(line.seconds * FPS)] as const];
});

function musicVolume(f: number) {
  const base = interpolate(f, [0, 30, 1740, 1800], [0, 0.32, 0.32, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // Smooth 10-frame duck to 35% under each VO line.
  const duck = VO_WINDOWS.reduce((m, [a, b]) => {
    const d = interpolate(f, [a - 10, a, b, b + 14], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return Math.max(m, d);
  }, 0);
  return base * (1 - 0.65 * duck);
}

/**
 * Orchestrator. Every scene is a <Sequence> placed by the timeline; scenes after the first mount XFADE/2
 * early and dissolve in over the previous one. Voiceover lines are separate absolute <Sequence>s so audio
 * timing never depends on visual overlaps.
 */
export function Promo({ music, voiceover }: PromoProps) {
  return (
    <AbsoluteFill className="bg-navy font-sans antialiased">
      {SCENES.map((s, i) => {
        const lead = i === 0 ? 0 : XFADE / 2;
        const tail = i === SCENES.length - 1 ? 0 : XFADE / 2;
        const Scene = COMPONENTS[s.id];
        return (
          <Sequence key={s.id} name={`Scene · ${s.id}`} from={s.from - lead} durationInFrames={s.to - s.from + lead + tail}>
            <SceneLead.Provider value={lead}>
              <Dissolve enabled={i > 0}>
                <Scene />
              </Dissolve>
            </SceneLead.Provider>
          </Sequence>
        );
      })}

      {voiceover &&
        SCENES.map((s) => {
          const line = VO[s.id];
          if (!line) return null;
          return (
            <Sequence key={`vo-${s.id}`} name={`VO · ${s.id}`} from={s.from + s.vo.at} durationInFrames={Math.ceil(line.seconds * FPS) + 4} layout="none">
              <Audio src={staticFile(line.file)} volume={1} />
            </Sequence>
          );
        })}

      {music && <Audio src={staticFile(music)} volume={musicVolume} />}
    </AbsoluteFill>
  );
}
