import { createContext, useContext, type CSSProperties } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig, type SpringConfig } from "remotion";

/**
 * Scenes are mounted XFADE/2 frames before their cut so they can dissolve in. `lead` is that offset;
 * useSceneFrame() returns frames relative to the cut point, so choreography reads "frame 0 = the cut".
 */
export const SceneLead = createContext(0);
export const useSceneFrame = () => useCurrentFrame() - useContext(SceneLead);

/** Critically damped: no bounce, long soft settle. The house style for UI. */
export const SILK: Partial<SpringConfig> = { damping: 200, mass: 0.9 };
/** A touch of life for physical objects (houses rising, logo). */
export const LIVELY: Partial<SpringConfig> = { damping: 14, stiffness: 120, mass: 0.8 };

export function useSpring(at: number, config: Partial<SpringConfig> = SILK, durationInFrames?: number) {
  const f = useSceneFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - at, fps, config, durationInFrames });
}

/** Fade + slide up + de-blur: the standard entrance. */
export function enter(p: number, distance = 22): CSSProperties {
  return {
    opacity: p,
    transform: `translate3d(0, ${(1 - p) * distance}px, 0)`,
    filter: p < 0.999 ? `blur(${(1 - p) * 6}px)` : undefined,
  };
}

/** Clamped interpolate shorthand (any number of stops). */
export const range = (f: number, input: readonly number[], output: readonly number[], easing?: (t: number) => number) =>
  interpolate(f, input, output, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
