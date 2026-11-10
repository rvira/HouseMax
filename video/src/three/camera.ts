import { Easing, interpolate } from "remotion";

/**
 * Cinematic camera math. Everything is a pure function of the frame number (Remotion renders frames out of
 * order and in parallel), so no useFrame, no clocks, no state.
 *
 * The camera is described in orbit space around a target, which is how a crane/jib operator thinks:
 *   az = pan around the subject, el = crane up/down, r = dolly in/out, t* = where the lens points.
 * Interpolating orbit parameters (not XYZ) gives arcs instead of straight-line cuts through the scene.
 */

export interface Orbit {
  az: number; // degrees, 0 = looking from the street (+Z) toward the rear
  el: number; // degrees above the horizon
  r: number; // distance to target (ft)
  tx: number;
  ty: number;
  tz: number;
  fov?: number;
}

/** Slow-in, long luxurious settle (Apple-style "glide"). */
export const GLIDE = Easing.bezier(0.45, 0, 0.12, 1);
/** Symmetric ease for moves that start and end at rest. */
export const SMOOTH = Easing.bezier(0.65, 0, 0.35, 1);
/** Gentle drift for long holds. */
export const DRIFT = Easing.bezier(0.33, 0, 0.67, 1);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface Key {
  f: number;
  v: Orbit;
  /** Easing used to travel FROM the previous key TO this one. */
  ease?: (t: number) => number;
}

/** Piecewise camera track: holds before the first key and after the last. */
export function track(frame: number, keys: Key[]): Orbit {
  if (frame <= keys[0].f) return keys[0].v;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (frame <= b.f) {
      const t = interpolate(frame, [a.f, b.f], [0, 1], { easing: b.ease ?? GLIDE, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return {
        az: lerp(a.v.az, b.v.az, t),
        el: lerp(a.v.el, b.v.el, t),
        r: lerp(a.v.r, b.v.r, t),
        tx: lerp(a.v.tx, b.v.tx, t),
        ty: lerp(a.v.ty, b.v.ty, t),
        tz: lerp(a.v.tz, b.v.tz, t),
        fov: lerp(a.v.fov ?? 32, b.v.fov ?? 32, t),
      };
    }
  }
  return keys[keys.length - 1].v;
}

/**
 * Deterministic "operator breath": two incommensurate sines, a fraction of a degree. Keeps long holds alive
 * without reading as shake.
 */
export function breathe(o: Orbit, frame: number, amount = 1): Orbit {
  return {
    ...o,
    az: o.az + Math.sin(frame / 47) * 0.35 * amount,
    el: o.el + Math.sin(frame / 61 + 1.3) * 0.2 * amount,
  };
}

export function orbitToPosition(o: Orbit): [number, number, number] {
  const az = (o.az * Math.PI) / 180;
  const el = (o.el * Math.PI) / 180;
  return [o.tx + o.r * Math.cos(el) * Math.sin(az), o.ty + o.r * Math.sin(el), o.tz + o.r * Math.cos(el) * Math.cos(az)];
}
