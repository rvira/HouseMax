"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Edges, Html, useCursor } from "@react-three/drei";
import {
  CuboidCollider,
  RigidBody,
  useAfterPhysicsStep,
  useBeforePhysicsStep,
  useRapier,
  type RapierCollider,
  type RapierRigidBody,
} from "@react-three/rapier";
import { useControls } from "leva";
import { useSceneStore, useSiteLayout } from "@/lib/scene/store";
import { centerToOffsets, rectCenter, rectSize } from "@/lib/scene/layout";
import { VIEWS } from "@/lib/scene/views";
import { ADU_GROUPS, DRAG_QUERY_GROUPS, useRenderWhile } from "./physics";
import { PALETTE, VERDICT_COLORS, materials, unitBox } from "./materials";

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The detached ADU — the primary interactive object.
 *
 * Physics model (Rapier):
 *  - Normally a kinematic body. Dragging moves it through Rapier's character controller, which slides it along
 *    the primary residence and the lot-line walls instead of passing through them.
 *  - Setback buffers are NOT colliders: the user may push the ADU into one, because that is exactly what the
 *    by-right check needs to flag (the block pulses red and the label lists the violation).
 *  - When a new project loads it briefly becomes dynamic and drops onto the lot under gravity, then settles
 *    back to kinematic.
 *
 * Data flow: reads the scene store only. The live position goes to `drag` while moving; on release it's
 * committed through the store's `commitOffsets` (registered by <SceneBridge>), which updates the project.
 */
export function AduBlock() {
  const { inputs, layout } = useSiteLayout();
  const verdict = useSceneStore((s) => s.project.verdict);
  const dropToken = useSceneStore((s) => s.dropToken);
  const showLabels = useSceneStore((s) => VIEWS[s.view].labels);
  const { world, rapier } = useRapier();
  const controls = useThree((s) => s.controls) as unknown as { enabled: boolean } | null;
  const invalidate = useThree((s) => s.invalidate);

  const { dropHeight, pulse } = useControls("ADU", {
    dropHeight: { value: 36, min: 5, max: 120, step: 1, label: "drop height (ft)" },
    pulse: { value: 5, min: 0, max: 12, step: 0.5, label: "violation pulse" },
  });

  const body = useRef<RapierRigidBody>(null);
  const collider = useRef<RapierCollider>(null);
  const [dragging, setDragging] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered && !dragging, "grab");
  useCursor(dragging, "grabbing");

  // Scratch objects reused every event/frame (no per-frame allocation).
  const ground = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const grab = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());
  const settleFrames = useRef(0);

  // Kinematic character controller: slides along obstacles instead of stopping dead. Created in an effect (not
  // useMemo) so StrictMode's mount→cleanup→mount can't leave us holding a freed WASM object.
  const controller = useRef<ReturnType<typeof world.createCharacterController> | null>(null);
  useEffect(() => {
    const c = world.createCharacterController(0.05);
    c.setUp({ x: 0, y: 1, z: 0 });
    c.setSlideEnabled(true);
    controller.current = c;
    return () => {
      controller.current = null;
      world.removeCharacterController(c);
    };
  }, [world]);

  const { w, l } = rectSize(layout.adu);
  const h = layout.adu.height;
  const center = rectCenter(layout.adu);
  const violating = layout.violations.length > 0;
  const [initialPos] = useState<[number, number, number]>(() => [center.x, 0, center.z]);

  // Keep frames coming only while something is actually moving (Canvas uses frameloop="demand").
  useRenderWhile(dragging || dropping || (violating && pulse > 0 && !prefersReducedMotion()));

  // Slider / project changes → teleport the body (not while the user or gravity owns it).
  useEffect(() => {
    const b = body.current;
    if (!b || dragging || dropping) return;
    b.setTranslation({ x: center.x, y: 0, z: center.z }, true);
    invalidate();
  }, [center.x, center.z, dragging, dropping, invalidate]);

  // New project → drop it in from above.
  useEffect(() => {
    const b = body.current;
    if (!b || prefersReducedMotion()) return;
    const t = b.translation();
    b.setBodyType(rapier.RigidBodyType.Dynamic, true);
    b.setTranslation({ x: t.x, y: dropHeight, z: t.z }, true);
    b.setLinvel({ x: 0, y: 0, z: 0 }, true);
    settleFrames.current = 0;
    setDropping(true);
    // Only replay on a new project, not when the Leva slider moves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropToken, rapier]);

  useAfterPhysicsStep(() => {
    const b = body.current;
    if (!dropping || !b) return;
    const v = b.linvel();
    const t = b.translation();
    settleFrames.current = Math.abs(v.y) < 0.4 && t.y < 0.25 ? settleFrames.current + 1 : 0;
    if (settleFrames.current > 6 || b.isSleeping()) {
      b.setBodyType(rapier.RigidBodyType.KinematicPositionBased, true);
      b.setTranslation({ x: t.x, y: 0, z: t.z }, true);
      setDropping(false);
    }
  });

  // Drag: steer toward the pointer's ground-plane hit; the controller resolves collisions.
  useBeforePhysicsStep(() => {
    const b = body.current;
    const col = collider.current;
    const ctl = controller.current;
    if (!dragging || !b || !col || !ctl) return;
    const t = b.translation();
    ctl.computeColliderMovement(
      col,
      { x: target.current.x - t.x, y: 0, z: target.current.z - t.z },
      rapier.QueryFilterFlags.EXCLUDE_SENSORS,
      DRAG_QUERY_GROUPS,
    );
    const m = ctl.computedMovement();
    const nx = t.x + m.x;
    const nz = t.z + m.z;
    b.setNextKinematicTranslation({ x: nx, y: 0, z: nz });

    const o = centerToOffsets(inputs, nx, nz);
    const prev = useSceneStore.getState().drag;
    if (!prev || prev.aduRearOffset !== o.aduRearOffset || prev.aduSideOffset !== o.aduSideOffset) {
      useSceneStore.getState().setDrag(o);
    }
  });

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    const b = body.current;
    if (!b || dropping || !e.ray.intersectPlane(ground, hit)) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    const t = b.translation();
    grab.current.set(hit.x - t.x, 0, hit.z - t.z);
    target.current.set(t.x, 0, t.z);
    if (controls) controls.enabled = false;
    useSceneStore.getState().beginDrag();
    setDragging(true);
  };

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging || !e.ray.intersectPlane(ground, hit)) return;
    target.current.set(hit.x - grab.current.x, 0, hit.z - grab.current.z);
  };

  const endDrag = (e: ThreeEvent<PointerEvent>) => {
    const b = body.current;
    if (!dragging || !b) return;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    if (controls) controls.enabled = true;
    const t = b.translation();
    useSceneStore.getState().endDrag(centerToOffsets(inputs, t.x, t.z));
    setDragging(false);
  };

  // Violation glow: emissive > 1 crosses the Bloom threshold. Reset immediately when clear.
  useEffect(() => {
    if (!violating) {
      materials.adu.emissiveIntensity = 0;
      invalidate();
    } else if (pulse === 0 || prefersReducedMotion()) {
      materials.adu.emissiveIntensity = 1.4;
      invalidate();
    }
  }, [violating, pulse, invalidate]);
  useFrame(({ clock }) => {
    if (!violating || pulse === 0) return;
    materials.adu.emissiveIntensity = 1.3 + Math.sin(clock.elapsedTime * pulse) * 0.9;
  });

  const edgeColor = violating ? PALETTE.setback : hovered || dragging ? "#3b6cf6" : VERDICT_COLORS[verdict];

  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} enabledRotations={[false, false, false]} position={initialPos}>
      <CuboidCollider ref={collider} args={[w / 2, h / 2, l / 2]} position={[0, h / 2, 0]} collisionGroups={ADU_GROUPS} restitution={0.3} friction={1} />

      <group
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerOver={(e) => (e.stopPropagation(), setHovered(true))}
        onPointerOut={() => setHovered(false)}
      >
        <mesh geometry={unitBox} material={materials.adu} scale={[w, h, l]} castShadow receiveShadow>
          <Edges color={edgeColor} threshold={15} />
        </mesh>
        {/* Flat roof slab with a small overhang */}
        <mesh geometry={unitBox} material={materials.roof} position={[0, h, 0]} scale={[w + 1, 0.6, l + 1]} castShadow />
        {/* Glazing band on the street-facing wall */}
        <mesh geometry={unitBox} material={materials.glazing} position={[0, h * 0.18, l / 2 + 0.06]} scale={[w * 0.62, h * 0.55, 0.12]} />
      </group>

      {(showLabels || violating || dragging) && (
        <Html position={[0, h + 4, 0]} center zIndexRange={[20, 0]} className="pointer-events-none select-none">
          <div className="flex flex-col items-center gap-1 whitespace-nowrap">
            <span className="rounded-full border border-black/10 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-sm backdrop-blur tabular">
              ADU {w}′ × {l}′ · {h}′ tall
            </span>
            {violating && (
              <span className="rounded-full border border-critical/30 bg-[#fef2f2]/95 px-2.5 py-0.5 text-[10.5px] font-semibold text-[#a32626] shadow-sm">
                {layout.violations.map((v) => v.label).join(" · ")}
              </span>
            )}
          </div>
        </Html>
      )}
    </RigidBody>
  );
}
