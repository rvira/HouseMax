import * as THREE from "three";

/**
 * Shared GPU resources. This module is only imported by the lazily loaded Canvas chunk, so it never runs on the server.
 *
 * Draw-call strategy: every box in the scene reuses ONE unit BoxGeometry (base at y=0) and is sized with `scale`,
 * so moving a slider is a matrix update — no geometry rebuild, no new buffers. Materials are singletons too, so
 * three.js compiles each shader program once, and Leva mutates them in place (no React re-render).
 */

export const PALETTE = {
  background: "#e4e1d8",
  ground: "#d3cfc2",
  lot: "#f3f2ec",
  street: "#aeaba2",
  sidewalk: "#e2dfd6",
  house: "#fbfaf7",
  roof: "#cfc6b4",
  adu: "#ffffff",
  glazing: "#9cc3e6",
  setback: "#ef4444",
  ghost: "#3b6cf6",
  canopy: "#9db59a",
  trunk: "#8a7a66",
  edge: "#5b5a55",
} as const;

export const VERDICT_COLORS = {
  BY_RIGHT_LIKELY: "#1baf7a",
  CANT_TELL_YET: "#eda100",
  DISCRETIONARY_LIKELY: "#d03b3b",
} as const;

/** Unit box with its base on y=0, so `scale.y` is the building height. */
export const unitBox = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
/** Unit plane lying flat on XZ. */
export const unitPlane = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

/** Unit gable roof: 1 wide (X), 1 tall (Y), 1 deep (Z), ridge along Z. */
export const unitGable = (() => {
  const s = new THREE.Shape();
  s.moveTo(-0.5, 0);
  s.lineTo(0.5, 0);
  s.lineTo(0, 1);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false });
  g.translate(0, 0, -0.5);
  return g;
})();

export const treeTrunk = new THREE.CylinderGeometry(0.35, 0.5, 1, 6).translate(0, 0.5, 0);
export const treeCanopy = new THREE.IcosahedronGeometry(1, 0);

const std = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, ...extra });

export const materials = {
  ground: std(PALETTE.ground),
  lot: std(PALETTE.lot),
  street: std(PALETTE.street, { roughness: 1 }),
  sidewalk: std(PALETTE.sidewalk),
  house: std(PALETTE.house, { roughness: 0.75 }),
  roof: std(PALETTE.roof, { roughness: 0.85 }),
  neighbor: std(PALETTE.house, { transparent: true, opacity: 0.55 }),
  /** Emissive is driven per-frame for the violation pulse (picked up by Bloom when intensity > 1). */
  adu: std(PALETTE.adu, { roughness: 0.6, emissive: new THREE.Color(PALETTE.setback), emissiveIntensity: 0 }),
  glazing: std(PALETTE.glazing, { roughness: 0.15, metalness: 0.1 }),
  ghost: std(PALETTE.ghost, { transparent: true, opacity: 0.18, depthWrite: false }),
  setbackIdle: new THREE.MeshBasicMaterial({ color: PALETTE.setback, transparent: true, opacity: 0.18, depthWrite: false }),
  setbackStrong: new THREE.MeshBasicMaterial({ color: PALETTE.setback, transparent: true, opacity: 0.24, depthWrite: false }),
  setbackHit: new THREE.MeshBasicMaterial({ color: PALETTE.setback, transparent: true, opacity: 0.5, depthWrite: false }),
  envelope: new THREE.MeshBasicMaterial({ color: "#3b6cf6", transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide }),
  canopy: std(PALETTE.canopy, { flatShading: true }),
  trunk: std(PALETTE.trunk),
};
