"use client";

import { useThree } from "@react-three/fiber";
import { folder, useControls } from "leva";
import { PALETTE, materials } from "./materials";

/**
 * Leva → shared materials, applied transiently via onChange: the material is mutated in place and one frame is
 * requested. Nothing re-renders in React, so tweaking colours is free even mid-drag.
 */
export function MaterialControls() {
  const invalidate = useThree((s) => s.invalidate);
  const color = (mat: { color: { set: (v: string) => void } }, value: string) => ({
    value,
    onChange: (v: string) => {
      mat.color.set(v);
      invalidate();
    },
  });

  useControls("Materials", {
    buildings: folder({
      house: color(materials.house, PALETTE.house),
      roof: color(materials.roof, PALETTE.roof),
      adu: color(materials.adu, PALETTE.adu),
      glazing: color(materials.glazing, PALETTE.glazing),
    }),
    site: folder({
      lot: color(materials.lot, PALETTE.lot),
      ground: color(materials.ground, PALETTE.ground),
      street: color(materials.street, PALETTE.street),
      canopy: color(materials.canopy, PALETTE.canopy),
      setbackOpacity: {
        value: materials.setbackIdle.opacity,
        min: 0,
        max: 0.6,
        step: 0.01,
        onChange: (v: number) => {
          materials.setbackIdle.opacity = v;
          materials.setbackStrong.opacity = Math.min(1, v + 0.1);
          invalidate();
        },
      },
    }),
  });

  return null;
}
