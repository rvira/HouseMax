import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import { computeSiteLayout, rectCenter, rectSize, type Rect } from "@byright/lib/scene/layout";
import { PALETTE, materials, treeCanopy, treeTrunk, unitBox, unitGable, unitPlane } from "@byright/components/scene/materials";
import { DEMO } from "./site";

/**
 * The Byright lot, driven entirely by props (no physics, no store) so every frame is reproducible.
 * Geometry + base materials are the app's shared singletons (frontend/components/scene/materials.ts);
 * anything animated per-scene gets a memoised clone so two canvases cross-dissolving never fight over it.
 */

export interface AduState {
  side: number; // ft from left lot line
  rear: number; // ft from rear lot line
  height: number;
  /** Vertical offset for the drop-in (ft above ground). */
  lift?: number;
  /** 0..1 red violation glow (emissive > 1 → blooms). */
  glow?: number;
  /** Edge colour + 0..1 HDR boost (blooms when > 0). */
  edge?: string;
  edgeGlow?: number;
  /** 0..1 squash/stretch scale on landing. */
  squash?: number;
}

export interface SiteBuild {
  /** Each 0..1 — lets the reveal assemble the site piece by piece. */
  pad?: number;
  lines?: number;
  house?: number;
  trees?: number;
  neighbors?: number;
}

const EMISSIVE_RED = new THREE.Color(PALETTE.setback);
const STREET = 30;
const SIDEWALK = 6;

function Pad({ rect, y, material, grow = 1 }: { rect: Rect; y: number; material: THREE.Material; grow?: number }) {
  const c = rectCenter(rect);
  const s = rectSize(rect);
  if (grow <= 0) return null;
  return <mesh geometry={unitPlane} material={material} position={[c.x, y, c.z]} scale={[s.w * grow, 1, s.l * grow]} />;
}

/** Box edges as one LineSegments with a tone-mapping-exempt material (so HDR colour can bloom). */
function Outline({ color, boost }: { color: string; boost: number }) {
  const geom = useMemo(() => new THREE.EdgesGeometry(unitBox, 15), []);
  const mat = useMemo(() => new THREE.LineBasicMaterial({ toneMapped: false, transparent: true }), []);
  mat.color.set(color).multiplyScalar(1 + boost * 3);
  mat.opacity = 0.85;
  return <lineSegments geometry={geom} material={mat} />;
}

export function SiteModel({
  adu,
  build = {},
  envelope = 0,
  transitKnown = false,
  parking = 0,
}: {
  adu: AduState;
  build?: SiteBuild;
  /** 0..1 opacity of the 16/18 ft height-guarantee planes. */
  envelope?: number;
  transitKnown?: boolean;
  /** 0..1 — one off-street parking space (9 × 18 ft pad on the driveway side) rising in. */
  parking?: number;
}) {
  const { pad = 1, lines = 1, house: houseUp = 1, trees = 1, neighbors = 1 } = build;
  const layout = computeSiteLayout({ ...DEMO, aduSideOffset: adu.side, aduRearOffset: adu.rear, aduHeight: adu.height });
  const { lot, zones, zoneHits } = layout;
  const front = lot.maxZ;

  // Per-instance animated materials (cloned once).
  const aduMat = useMemo(() => {
    const m = materials.adu.clone();
    m.emissive = EMISSIVE_RED.clone();
    return m;
  }, []);
  const envMats = useMemo(() => [materials.envelope.clone(), materials.envelope.clone()], []);
  aduMat.emissiveIntensity = (adu.glow ?? 0) * 2.4;
  envMats[0].opacity = 0.16 * envelope;
  envMats[1].opacity = (transitKnown ? 0.16 : 0.07) * envelope;

  const boundary = useMemo<[number, number, number][]>(
    () => [
      [lot.minX, 0.08, lot.minZ],
      [lot.maxX, 0.08, lot.minZ],
      [lot.maxX, 0.08, lot.maxZ],
      [lot.minX, 0.08, lot.maxZ],
      [lot.minX, 0.08, lot.minZ],
    ],
    [lot.minX, lot.maxX, lot.minZ, lot.maxZ],
  );

  // House
  const hc = rectCenter(layout.house);
  const hs = rectSize(layout.house);
  const wallH = Math.max(8, layout.house.height - 7);

  // ADU
  const ac = rectCenter(layout.adu);
  const as = rectSize(layout.adu);
  const squash = adu.squash ?? 0;
  const ah = adu.height * (1 - squash * 0.12);
  const spread = 1 + squash * 0.05;

  return (
    <group>
      {/* Context: ground, sidewalk, street */}
      <mesh geometry={unitPlane} material={materials.ground} position={[0, -0.02, 0]} scale={[1600, 1, 1600]} receiveShadow />
      <mesh geometry={unitPlane} material={materials.sidewalk} position={[0, 0.005, front + SIDEWALK / 2]} scale={[1600, 1, SIDEWALK]} receiveShadow />
      <mesh geometry={unitPlane} material={materials.street} position={[0, 0, front + SIDEWALK + STREET / 2]} scale={[1600, 1, STREET]} receiveShadow />

      {/* Lot pad rises out of the ground */}
      {pad > 0 && (
        <mesh geometry={unitBox} material={materials.lot} position={[0, -0.3 - 0.6 * (1 - pad), 0]} scale={[DEMO.lotWidth, 0.32, DEMO.lotLength]} receiveShadow />
      )}
      {lines > 0 && <Line points={boundary} color={PALETTE.edge} lineWidth={1.4} dashed dashSize={2.5} gapSize={1.5} transparent opacity={lines} />}

      {/* Setback buffers (grow from their lot line) */}
      <Pad rect={zones.left} y={0.04} material={zoneHits.left ? materials.setbackHit : materials.setbackIdle} grow={lines} />
      <Pad rect={zones.right} y={0.04} material={zoneHits.right ? materials.setbackHit : materials.setbackIdle} grow={lines} />
      <Pad rect={zones.rear} y={0.05} material={zoneHits.rear ? materials.setbackHit : materials.setbackIdle} grow={lines} />

      {/* Primary residence rises */}
      {houseUp > 0 && (
        <group position={[hc.x, 0, hc.z]} scale={[1, houseUp, 1]}>
          <mesh geometry={unitBox} material={materials.house} scale={[hs.w, wallH, hs.l]} castShadow receiveShadow />
          <mesh geometry={unitGable} material={materials.roof} position={[0, wallH, 0]} scale={[hs.w + 2, layout.house.height - wallH, hs.l + 2]} castShadow />
          <mesh geometry={unitBox} material={materials.roof} position={[0, 0, hs.l / 2 + 0.05]} scale={[4, 7.5, 0.2]} />
        </group>
      )}

      {/* Neighbouring massing */}
      {[-1, 1].map((side, i) => {
        const up = Math.min(1, Math.max(0, neighbors * 1.4 - i * 0.4));
        return up > 0 ? (
          <mesh
            key={side}
            geometry={unitBox}
            material={materials.neighbor}
            position={[side * (DEMO.lotWidth + 4), 0, front - DEMO.frontSetback - 20]}
            scale={[30, 18 * up, 40]}
            castShadow
            receiveShadow
          />
        ) : null;
      })}

      <Trees grow={trees} />

      {parking > 0 && (
        <mesh geometry={unitBox} material={materials.sidewalk} position={[lot.maxX - 4.5 - 2, 0, front - 10]} scale={[9 * parking, 0.35, 18 * parking]} receiveShadow />
      )}

      {/* The ADU */}
      <group position={[ac.x, adu.lift ?? 0, ac.z]}>
        <group scale={[spread, 1, spread]}>
          <mesh geometry={unitBox} material={aduMat} scale={[as.w, ah, as.l]} castShadow receiveShadow>
            {adu.edge && <Outline color={adu.edge} boost={adu.edgeGlow ?? 0} />}
          </mesh>
          <mesh geometry={unitBox} material={materials.roof} position={[0, ah, 0]} scale={[as.w + 1, 0.6, as.l + 1]} castShadow />
          <mesh geometry={unitBox} material={materials.glazing} position={[0, ah * 0.18, as.l / 2 + 0.06]} scale={[as.w * 0.62, ah * 0.55, 0.12]} />
        </group>
      </group>

      {/* Height guarantees: 16 ft (every city) and 18 ft (near transit) */}
      {envelope > 0 &&
        [16, 18].map((h, i) => (
          <mesh key={h} geometry={unitPlane} material={envMats[i]} position={[ac.x, h, ac.z]} scale={[as.w + 8, 1, as.l + 8]} renderOrder={3} />
        ))}
    </group>
  );
}

/** Street + backyard trees: 2 instanced draw calls, each tree pops in on a stagger as `grow` goes 0→1. */
function Trees({ grow }: { grow: number }) {
  const trunks = useRef<THREE.InstancedMesh>(null);
  const canopies = useRef<THREE.InstancedMesh>(null);
  const placements = useMemo(() => {
    const rand = (i: number) => {
      const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    const out: { x: number; z: number; s: number }[] = [];
    const front = DEMO.lotLength / 2 + 3;
    for (let i = 0; i < 9; i++) out.push({ x: -160 + i * 40 + rand(i) * 8, z: front, s: 0.8 + rand(i + 50) * 0.5 });
    for (let i = 0; i < 5; i++) out.push({ x: -DEMO.lotWidth * 1.4 + i * (DEMO.lotWidth * 0.7) + rand(i + 9) * 6, z: -DEMO.lotLength / 2 - 30 - rand(i + 30) * 12, s: 1 + rand(i + 70) * 0.6 });
    return out;
  }, []);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3() }), []);

  useLayoutEffect(() => {
    const t = trunks.current;
    const c = canopies.current;
    if (!t || !c) return;
    placements.forEach((pl, i) => {
      // Stagger: tree i starts at i/N of the way through `grow`, with a small overshoot (back-out).
      const local = Math.min(1, Math.max(0, grow * 1.6 - (i / placements.length) * 0.6));
      const k = local === 0 ? 0 : 1 + 0.18 * Math.sin(local * Math.PI) * (1 - local) * 4;
      const sc = Math.max(0.0001, local * k * pl.s);
      const h = 9 * sc;
      t.setMatrixAt(i, tmp.m.compose(tmp.p.set(pl.x, 0, pl.z), tmp.q, tmp.s.set(sc * 1.4, Math.max(0.0001, h), sc * 1.4)));
      c.setMatrixAt(i, tmp.m.compose(tmp.p.set(pl.x, h + 4 * sc, pl.z), tmp.q, tmp.s.set(7 * sc, 8 * sc, 7 * sc)));
    });
    t.instanceMatrix.needsUpdate = c.instanceMatrix.needsUpdate = true;
    t.computeBoundingSphere();
    c.computeBoundingSphere();
  });

  return (
    <>
      <instancedMesh ref={trunks} args={[treeTrunk, materials.trunk, placements.length]} castShadow />
      <instancedMesh ref={canopies} args={[treeCanopy, materials.canopy, placements.length]} castShadow receiveShadow />
    </>
  );
}
