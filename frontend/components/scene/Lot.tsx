"use client";

import { useMemo } from "react";
import type * as THREE from "three";
import { Html, Line } from "@react-three/drei";
import { useSceneStore, useSiteLayout } from "@/lib/scene/store";
import { rectCenter, rectSize, type Rect } from "@/lib/scene/layout";
import { VIEWS } from "@/lib/scene/views";
import { PALETTE, materials, unitBox, unitPlane } from "./materials";

const SIDEWALK = 6;
const STREET = 30;

/** A flat rect on the ground, sized via scale on the shared unit plane (no geometry per rect). */
function Pad({ rect, y, material }: { rect: Rect; y: number; material: THREE.Material }) {
  const c = rectCenter(rect);
  const s = rectSize(rect);
  return <mesh geometry={unitPlane} material={material} position={[c.x, y, c.z]} scale={[s.w, 1, s.l]} receiveShadow />;
}

function Tag({ position, tone = "neutral", children }: { position: [number, number, number]; tone?: "neutral" | "setback"; children: React.ReactNode }) {
  return (
    <Html position={position} center zIndexRange={[20, 0]} className="pointer-events-none select-none">
      <span
        className={
          tone === "setback"
            ? "whitespace-nowrap rounded-full border border-critical/25 bg-[#fef2f2]/90 px-2 py-0.5 text-[10.5px] font-semibold text-[#a32626] shadow-sm tabular"
            : "whitespace-nowrap rounded-full border border-black/10 bg-white/85 px-2 py-0.5 text-[10.5px] font-semibold text-ink-2 shadow-sm tabular"
        }
      >
        {children}
      </span>
    </Html>
  );
}

/** Ground, street, lot pad, lot line, setback buffers, neighbouring massing and dimension tags. */
export function Lot() {
  const { inputs, layout } = useSiteLayout();
  const view = useSceneStore((s) => VIEWS[s.view]);
  const { lot, zones, zoneHits } = layout;
  const front = lot.maxZ;

  // Lot-line points only change with lot size → memoised.
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

  const zoneMat = (hitZone: boolean) => (hitZone ? materials.setbackHit : view.setbacks === "strong" ? materials.setbackStrong : materials.setbackIdle);
  const W = inputs.lotWidth;

  return (
    <group>
      {/* Ground + street context */}
      <mesh geometry={unitPlane} material={materials.ground} position={[0, -0.02, 0]} scale={[1600, 1, 1600]} receiveShadow />
      <mesh geometry={unitPlane} material={materials.sidewalk} position={[0, 0.005, front + SIDEWALK / 2]} scale={[1600, 1, SIDEWALK]} receiveShadow />
      <mesh geometry={unitPlane} material={materials.street} position={[0, 0, front + SIDEWALK + STREET / 2]} scale={[1600, 1, STREET]} receiveShadow />

      {/* Lot pad (slightly raised) */}
      <mesh geometry={unitBox} material={materials.lot} position={[0, -0.3, 0]} scale={[W, 0.32, inputs.lotLength]} receiveShadow />
      <Line points={boundary} color={PALETTE.edge} lineWidth={1.5} dashed dashSize={2.5} gapSize={1.5} />

      {/* Setback buffers — intrusions turn opaque red */}
      <Pad rect={zones.left} y={0.04} material={zoneMat(zoneHits.left)} />
      <Pad rect={zones.right} y={0.04} material={zoneMat(zoneHits.right)} />
      <Pad rect={zones.rear} y={0.05} material={zoneMat(zoneHits.rear)} />

      {/* Neighbouring houses (context only), sharing one geometry + material */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          geometry={unitBox}
          material={materials.neighbor}
          position={[side * (W + 4), 0, front - inputs.frontSetback - 20]}
          scale={[Math.min(32, W * 0.6), 18, 40]}
          castShadow
          receiveShadow
        />
      ))}

      {view.labels && (
        <>
          <Tag position={[0, 0.5, front + 3]}>Lot {inputs.lotWidth}′ × {inputs.lotLength}′</Tag>
          {inputs.requiredRear > 0 && (
            <Tag position={[0, 0.5, lot.minZ + inputs.requiredRear / 2]} tone="setback">
              Rear setback {inputs.requiredRear}′
            </Tag>
          )}
          {inputs.requiredSide > 0 && (
            <Tag position={[lot.minX + inputs.requiredSide / 2, 0.5, 0]} tone="setback">
              Side {inputs.requiredSide}′
            </Tag>
          )}
        </>
      )}
    </group>
  );
}
