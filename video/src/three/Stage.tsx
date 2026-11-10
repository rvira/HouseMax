import { useLayoutEffect, type ReactNode } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { ThreeCanvas } from "@remotion/three";
import { useVideoConfig } from "remotion";
import { orbitToPosition, type Orbit } from "./camera";
import { SettleFrame } from "./Effects";

export const STUDIO_BG = "#e4e1d8";

/** Drives the default camera from an Orbit every frame (layout effect → runs before ThreeCanvas advances). */
function CinematicCamera({ orbit }: { orbit: Orbit }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    const [x, y, z] = orbitToPosition(orbit);
    camera.position.set(x, y, z);
    camera.fov = orbit.fov ?? 32;
    camera.near = 1;
    camera.far = 3000;
    camera.updateProjectionMatrix();
    camera.lookAt(orbit.tx, orbit.ty, orbit.tz);
  });
  return null;
}

/**
 * One 3D shot: canvas + studio lighting + camera. Scenes pass the subject and effects as children.
 * `light` (0..1) dims the whole rig for the reveal; `background` lets a scene fade from night to studio.
 */
export function Stage({ orbit, light = 1, background = STUDIO_BG, children }: { orbit: Orbit; light?: number; background?: string; children: ReactNode }) {
  const { width, height } = useVideoConfig();
  const sunAz = (35 * Math.PI) / 180;
  const sunEl = (52 * Math.PI) / 180;
  const sun: [number, number, number] = [Math.cos(sunEl) * Math.sin(sunAz) * 260, Math.sin(sunEl) * 260, Math.cos(sunEl) * Math.cos(sunAz) * 260];

  return (
    <ThreeCanvas
      width={width}
      height={height}
      dpr={1.5}
      shadows="percentage"
      gl={{ antialias: false, toneMapping: THREE.NoToneMapping, preserveDrawingBuffer: true }}
      camera={{ fov: 32, near: 1, far: 3000, position: [200, 160, 240] }}
    >
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, 420, 1300]} />
      <CinematicCamera orbit={orbit} />

      <Environment resolution={256} frames={1} environmentIntensity={0.48 * light}>
        <Lightformer form="rect" intensity={2.4} position={[0, 120, 0]} rotation-x={Math.PI / 2} scale={[300, 300, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[-160, 40, 60]} rotation-y={Math.PI / 2} scale={[200, 60, 1]} color="#fff4e6" />
        <Lightformer form="rect" intensity={0.8} position={[160, 30, -40]} rotation-y={-Math.PI / 2} scale={[200, 50, 1]} color="#e6efff" />
      </Environment>
      <hemisphereLight args={["#ffffff", "#b9b1a0", 0.25 * light]} />
      <directionalLight castShadow position={sun} intensity={2.6 * light} color="#fff6ea" shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.05} shadow-radius={4}>
        <orthographicCamera attach="shadow-camera" args={[-170, 170, 170, -170, 10, 700]} />
      </directionalLight>
      <ContactShadows position={[0, 0.04, 0]} scale={360} far={30} blur={2.2} opacity={0.7 * light} resolution={512} color="#2d2b26" />

      {children}
      <SettleFrame />
    </ThreeCanvas>
  );
}
