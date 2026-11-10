"use client";

import { Html } from "@react-three/drei";
import { useSceneStore, useSiteLayout } from "@/lib/scene/store";
import { ADU_HEIGHT_FLOOR, ADU_HEIGHT_FLOOR_TRANSIT, rectCenter, rectSize } from "@/lib/scene/layout";
import { VIEWS } from "@/lib/scene/views";
import { materials, unitPlane } from "./materials";

/**
 * The state height guarantees drawn as glass planes over the ADU footprint:
 * 16 ft (every city must allow) and 18 ft (near major transit; dimmed unless transit is "yes").
 */
export function HeightEnvelope() {
  const visible = useSceneStore((s) => VIEWS[s.view].heightEnvelope && s.project.isAdu);
  const transit = useSceneStore((s) => s.project.transit);
  const { layout } = useSiteLayout();
  if (!visible) return null;

  const c = rectCenter(layout.adu);
  const { w, l } = rectSize(layout.adu);
  const tiers = [
    { h: ADU_HEIGHT_FLOOR, label: "16′ · every city must allow", active: true },
    {
      h: ADU_HEIGHT_FLOOR_TRANSIT,
      label: transit === true ? "18′ · near transit" : transit === null ? "18′ · only if near transit (unknown)" : "18′ · not near transit",
      active: transit === true,
    },
  ];

  return (
    <group position={[c.x, 0, c.z]}>
      {tiers.map((t) => (
        <group key={t.h} position={[0, t.h, 0]}>
          <mesh geometry={unitPlane} material={materials.envelope} scale={[w + 6, 1, l + 6]} renderOrder={3} visible={t.active || transit === null} />
          <Html position={[-(w + 6) / 2, 0, (l + 6) / 2]} zIndexRange={[20, 0]} className="pointer-events-none select-none">
            <span
              className={`whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-semibold shadow-sm tabular ${
                t.active ? "bg-brand-500 text-white" : "border border-dashed border-brand-500/50 bg-white/85 text-brand-700"
              }`}
            >
              {t.label}
            </span>
          </Html>
        </group>
      ))}
    </group>
  );
}
