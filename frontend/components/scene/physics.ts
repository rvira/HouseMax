import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { interactionGroups } from "@react-three/rapier";

/**
 * Collision groups (Rapier bitmasks):
 *  0 = ground, 1 = ADU, 2 = obstacles (lot-line walls + primary residence).
 * The ADU *physically* touches only the ground, so the drop-in always lands on the lot, never on the roof.
 * Obstacles only constrain the drag: the kinematic character controller queries group 2.
 */
export const GROUND_GROUPS = interactionGroups(0, [1]);
export const OBSTACLE_GROUPS = interactionGroups(2, [1]);
export const ADU_GROUPS = interactionGroups(1, [0]);
export const DRAG_QUERY_GROUPS = interactionGroups(1, [2]);

/** 1 world unit = 1 ft, so real gravity is ~32 ft/s². A bit more reads snappier on screen. */
export const GRAVITY_FT = 48;

/**
 * The Canvas runs with frameloop="demand" (no GPU work while idle).
 * Components that animate call this to keep frames coming only while they need them.
 */
export function useRenderWhile(active: boolean) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (active) invalidate();
  }, [active, invalidate]);
  useFrame(() => {
    if (active) invalidate();
  });
}
