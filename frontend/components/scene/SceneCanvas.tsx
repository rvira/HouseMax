"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { useControls } from "leva";
import { AduBlock } from "./AduBlock";
import { CameraRig } from "./CameraRig";
import { Effects } from "./Effects";
import { GhostAdu } from "./GhostAdu";
import { HeightEnvelope } from "./HeightEnvelope";
import { Lighting } from "./Lighting";
import { Lot } from "./Lot";
import { MaterialControls } from "./MaterialControls";
import { PALETTE } from "./materials";
import { GRAVITY_FT } from "./physics";
import { PrimaryHouse } from "./PrimaryHouse";
import { SiteColliders } from "./SiteColliders";
import { Trees } from "./Trees";

/** Weak-device heuristic, decided once. (PerformanceMonitor misreads fps under frameloop="demand".) */
function detectLowPower() {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 8;
  return coarse || cores <= 4;
}

/**
 * Root of the 3D world — the equivalent of App.jsx for the scene. Loaded with next/dynamic (ssr: false), so
 * three.js, Rapier's WASM and postprocessing stay out of the initial page bundle.
 *
 * Performance notes:
 *  - frameloop="demand": the GPU is idle unless something changed (orbit, drag, drop, a prop update).
 *    Animated components opt in with useRenderWhile().
 *  - DPR capped at 1.75 (1 on low-power devices); lower-res contact shadows and no Bloom on low-power devices.
 *  - Physics sits in its own Suspense boundary so the site renders while Rapier's WASM initialises.
 *  - Reads ONLY from the zustand scene store; no React context crosses into the Canvas.
 */
export default function SceneCanvas() {
  const [lowPower] = useState(detectLowPower);
  const { background, fog, gravity, debugPhysics } = useControls("Scene", {
    background: PALETTE.background,
    fog: true,
    gravity: { value: GRAVITY_FT, min: 5, max: 150, step: 1, label: "gravity (ft/s²)" },
    debugPhysics: { value: false, label: "show colliders" },
  });

  return (
    <Canvas
      frameloop="demand"
      shadows="percentage"
      dpr={[1, lowPower ? 1 : 1.75]}
      camera={{ fov: 35, near: 1, far: 3000, position: [140, 120, 180] }}
      gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
    >
      <color attach="background" args={[background]} />
      {fog && <fog attach="fog" args={[background, 380, 1200]} />}

      <MaterialControls />
      <Lighting lowPower={lowPower} />

      <Lot />
      <PrimaryHouse />
      <Trees />

      <Suspense fallback={null}>
        <Physics gravity={[0, -gravity, 0]} interpolate={false} colliders={false} debug={debugPhysics}>
          <SiteColliders />
          <AduBlock />
        </Physics>
      </Suspense>

      <GhostAdu />
      <HeightEnvelope />
      <CameraRig />

      <Suspense fallback={null}>
        <Effects lowPower={lowPower} />
      </Suspense>
      <Preload all />
    </Canvas>
  );
}
