"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useSceneStore } from "@/lib/scene/store";
import { materials, treeCanopy, treeTrunk } from "./materials";

const MAX_TREES = 24;

/** Deterministic pseudo-random so tree placement is stable across renders. */
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Street trees as two InstancedMeshes → 2 draw calls total, no matter how many trees.
 * Matrices are rewritten only when the lot size changes.
 */
export function Trees() {
  const lotWidth = useSceneStore((s) => s.project.lotWidth);
  const lotLength = useSceneStore((s) => s.project.lotLength);
  const invalidate = useThree((s) => s.invalidate);
  const trunks = useRef<THREE.InstancedMesh>(null);
  const canopies = useRef<THREE.InstancedMesh>(null);

  const placements = useMemo(() => {
    const out: { x: number; z: number; s: number }[] = [];
    const front = lotLength / 2 + 3; // sidewalk planting strip
    for (let i = 0; i < 9; i++) out.push({ x: -160 + i * 40 + rand(i) * 8, z: front, s: 0.8 + rand(i + 50) * 0.5 });
    // Backyard trees along the rear fence, outside the lot
    for (let i = 0; i < 5; i++) out.push({ x: -lotWidth + i * (lotWidth / 2) + rand(i + 9) * 6, z: -lotLength / 2 - 10 - rand(i + 30) * 8, s: 1 + rand(i + 70) * 0.6 });
    return out.slice(0, MAX_TREES);
  }, [lotWidth, lotLength]);

  useLayoutEffect(() => {
    const t = trunks.current;
    const c = canopies.current;
    if (!t || !c) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    placements.forEach((p, i) => {
      const h = 9 * p.s;
      t.setMatrixAt(i, m.compose(new THREE.Vector3(p.x, 0, p.z), q, new THREE.Vector3(p.s * 1.4, h, p.s * 1.4)));
      c.setMatrixAt(i, m.compose(new THREE.Vector3(p.x, h + 4 * p.s, p.z), q, new THREE.Vector3(7 * p.s, 8 * p.s, 7 * p.s)));
    });
    t.count = c.count = placements.length;
    t.instanceMatrix.needsUpdate = c.instanceMatrix.needsUpdate = true;
    t.computeBoundingSphere();
    c.computeBoundingSphere();
    invalidate();
  }, [placements, invalidate]);

  return (
    <>
      <instancedMesh ref={trunks} args={[treeTrunk, materials.trunk, MAX_TREES]} castShadow />
      <instancedMesh ref={canopies} args={[treeCanopy, materials.canopy, MAX_TREES]} castShadow receiveShadow />
    </>
  );
}
