"use client";

import { Edges } from "@react-three/drei";
import { useSiteLayout } from "@/lib/scene/store";
import { rectCenter, rectSize } from "@/lib/scene/layout";
import { PALETTE, materials, unitBox, unitGable } from "./materials";

/** Primary residence: walls + gable roof, both scaled from shared unit geometries. */
export function PrimaryHouse() {
  const { layout } = useSiteLayout();
  const { house } = layout;
  const c = rectCenter(house);
  const { w, l } = rectSize(house);
  const wallH = Math.max(8, house.height - 7);

  return (
    <group position={[c.x, 0, c.z]}>
      <mesh geometry={unitBox} material={materials.house} scale={[w, wallH, l]} castShadow receiveShadow>
        <Edges color={PALETTE.edge} threshold={15} />
      </mesh>
      <mesh geometry={unitGable} material={materials.roof} position={[0, wallH, 0]} scale={[w + 2, house.height - wallH, l + 2]} castShadow receiveShadow />
      {/* Front door */}
      <mesh geometry={unitBox} material={materials.roof} position={[0, 0, l / 2 + 0.05]} scale={[4, 7.5, 0.2]} />
    </group>
  );
}
