"use client";

import { Edges, Html } from "@react-three/drei";
import { useGhostLayout } from "@/lib/scene/store";
import { rectCenter, rectSize } from "@/lib/scene/layout";
import { PALETTE, materials, unitBox } from "./materials";

/** By-Right Flip preview: the "after" ADU as a translucent blue ghost. */
export function GhostAdu() {
  const ghost = useGhostLayout();
  if (!ghost) return null;
  const c = rectCenter(ghost.adu);
  const { w, l } = rectSize(ghost.adu);
  const h = ghost.adu.height;

  return (
    <group position={[c.x, 0.02, c.z]}>
      <mesh geometry={unitBox} material={materials.ghost} scale={[w + 0.3, h, l + 0.3]} renderOrder={2}>
        <Edges color={PALETTE.ghost} threshold={15} />
      </mesh>
      <Html position={[w / 2 + 2, h, 0]} zIndexRange={[20, 0]} className="pointer-events-none select-none">
        <span className="whitespace-nowrap rounded-full border border-brand-500/30 bg-brand-50/95 px-2 py-0.5 text-[10.5px] font-semibold text-brand-700 shadow-sm tabular">
          After flip · {h}′
        </span>
      </Html>
    </group>
  );
}
