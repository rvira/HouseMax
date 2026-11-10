"use client";

import { useEffect, useMemo, useRef, type ComponentRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { easing } from "maath";
import { useSceneStore } from "@/lib/scene/store";
import { computeSiteLayout, rectCenter } from "@/lib/scene/layout";
import { getSiteInputs } from "@/lib/scene/store";
import { VIEWS } from "@/lib/scene/views";

/**
 * OrbitControls + a route-driven fly-to. When the view (route) or the lot size changes, the camera eases to the
 * view's preset; any user orbit/zoom cancels the fly-to immediately. The camera's view offset tracks the 2D
 * panel width so the lot stays centred in the visible part of the canvas.
 */
export function CameraRig() {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);

  const view = useSceneStore((s) => s.view);
  const lotW = useSceneStore((s) => s.project.lotWidth);
  const lotL = useSceneStore((s) => s.project.lotLength);
  const spec = VIEWS[view];

  const flying = useRef(true);
  const inset = useRef(0);
  const goalPos = useMemo(() => new THREE.Vector3(), []);
  const goalTarget = useMemo(() => new THREE.Vector3(), []);

  // Recompute the goal when the route or lot changes. The ADU target is sampled once, so dragging doesn't yank the camera.
  useEffect(() => {
    const s = useSceneStore.getState();
    const layout = computeSiteLayout(getSiteInputs(s));
    const D = Math.max(lotW, lotL, 60);
    if (spec.target === "adu") {
      const c = rectCenter(layout.adu);
      goalTarget.set(c.x, layout.adu.height / 2, c.z);
    } else {
      goalTarget.set(0, 0, 0);
    }
    goalPos.set(goalTarget.x + spec.camera[0] * D, goalTarget.y + spec.camera[1] * D, goalTarget.z + spec.camera[2] * D);
    flying.current = true;
    invalidate();
  }, [view, lotW, lotL, spec, goalPos, goalTarget, invalidate]);

  // Respect prefers-reduced-motion: no autorotate.
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useFrame((_, dt) => {
    const c = controls.current;
    if (!c) return;
    let moving = false;

    if (flying.current) {
      easing.damp3(camera.position, goalPos, 0.45, dt);
      easing.damp3(c.target, goalTarget, 0.45, dt);
      c.update();
      if (camera.position.distanceTo(goalPos) < 0.2 && c.target.distanceTo(goalTarget) < 0.1) flying.current = false;
      moving = true;
    }

    // Shift the projection centre right by half the covered width (CSS px; setViewOffset works in ratios).
    const want = useSceneStore.getState().panelInset;
    if (Math.abs(inset.current - want) > 0.5) {
      inset.current = THREE.MathUtils.damp(inset.current, want, 6, dt);
      moving = true;
    } else inset.current = want;
    if (inset.current > 0.5) camera.setViewOffset(size.width, size.height, -inset.current / 2, 0, size.width, size.height);
    else if (camera.view) camera.clearViewOffset();

    if (moving) invalidate();
  });

  // Panel resized → wake the loop so the offset can ease.
  useEffect(() => useSceneStore.subscribe((s, p) => s.panelInset !== p.panelInset && invalidate()), [invalidate]);

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      maxPolarAngle={Math.PI / 2.15}
      minDistance={25}
      maxDistance={700}
      autoRotate={spec.autoRotate && !reduced}
      autoRotateSpeed={0.35}
      onStart={() => (flying.current = false)}
    />
  );
}
