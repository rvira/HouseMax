"use client";

import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useSiteLayout } from "@/lib/scene/store";
import { rectCenter, rectSize } from "@/lib/scene/layout";
import { GROUND_GROUPS, OBSTACLE_GROUPS } from "./physics";

const WALL = 1; // half-thickness (ft)
const WALL_H = 40;

/**
 * Invisible physics: ground slab, lot-line walls and the primary residence.
 * Setback zones are deliberately NOT here — entering them is a violation to flag, not a wall.
 * Colliders are recreated by @react-three/rapier when their args change (lot resize), which is cheap.
 */
export function SiteColliders() {
  const { layout } = useSiteLayout();
  const { lot, house } = layout;
  const { w: W, l: L } = rectSize(lot);
  const hc = rectCenter(house);
  const hs = rectSize(house);

  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[800, 1, 800]} position={[0, -1, 0]} collisionGroups={GROUND_GROUPS} restitution={0.3} friction={1} />
      <CuboidCollider args={[W / 2 + WALL * 2, WALL_H, WALL]} position={[0, WALL_H, lot.minZ - WALL]} collisionGroups={OBSTACLE_GROUPS} />
      <CuboidCollider args={[W / 2 + WALL * 2, WALL_H, WALL]} position={[0, WALL_H, lot.maxZ + WALL]} collisionGroups={OBSTACLE_GROUPS} />
      <CuboidCollider args={[WALL, WALL_H, L / 2]} position={[lot.minX - WALL, WALL_H, 0]} collisionGroups={OBSTACLE_GROUPS} />
      <CuboidCollider args={[WALL, WALL_H, L / 2]} position={[lot.maxX + WALL, WALL_H, 0]} collisionGroups={OBSTACLE_GROUPS} />
      <CuboidCollider args={[hs.w / 2, house.height / 2, hs.l / 2]} position={[hc.x, house.height / 2, hc.z]} collisionGroups={OBSTACLE_GROUPS} />
    </RigidBody>
  );
}
