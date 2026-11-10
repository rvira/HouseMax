"use client";

import { useMemo } from "react";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { useControls } from "leva";

type EnvPreset = "studio" | "city" | "apartment" | "sunset" | "dawn";

/**
 * Image-based light + one shadow-casting sun.
 * "studio" builds the environment from Lightformers (no network fetch, rendered once with frames={1});
 * the other presets download an HDRI from the drei CDN, so they're for look-dev in Leva.
 */
export function Lighting({ lowPower = false }: { lowPower?: boolean }) {
  const { env, envIntensity, sunIntensity, azimuth, elevation, shadowSoftness, contactShadows } = useControls("Lighting", {
    env: { value: "studio" as EnvPreset, options: ["studio", "city", "apartment", "sunset", "dawn"] satisfies EnvPreset[] },
    envIntensity: { value: 0.55, min: 0, max: 3, step: 0.05 },
    sunIntensity: { value: 2.6, min: 0, max: 6, step: 0.1 },
    azimuth: { value: 35, min: 0, max: 360, step: 1, label: "sun azimuth°" },
    elevation: { value: 52, min: 5, max: 89, step: 1, label: "sun elevation°" },
    shadowSoftness: { value: 4, min: 0, max: 12, step: 0.5 },
    contactShadows: { value: 0.7, min: 0, max: 1, step: 0.05, label: "contact shadow" },
  });

  const sun = useMemo<[number, number, number]>(() => {
    const a = (azimuth * Math.PI) / 180;
    const e = (elevation * Math.PI) / 180;
    const r = 260;
    return [Math.cos(e) * Math.sin(a) * r, Math.sin(e) * r, Math.cos(e) * Math.cos(a) * r];
  }, [azimuth, elevation]);

  return (
    <>
      {env === "studio" ? (
        <Environment resolution={256} frames={1} environmentIntensity={envIntensity}>
          <Lightformer form="rect" intensity={2.4} position={[0, 120, 0]} rotation-x={Math.PI / 2} scale={[300, 300, 1]} />
          <Lightformer form="rect" intensity={1.2} position={[-160, 40, 60]} rotation-y={Math.PI / 2} scale={[200, 60, 1]} color="#fff4e6" />
          <Lightformer form="rect" intensity={0.8} position={[160, 30, -40]} rotation-y={-Math.PI / 2} scale={[200, 50, 1]} color="#e6efff" />
          <Lightformer form="ring" intensity={1.5} position={[0, 60, 180]} scale={60} />
        </Environment>
      ) : (
        <Environment preset={env} environmentIntensity={envIntensity} />
      )}

      <hemisphereLight args={["#ffffff", "#b9b1a0", 0.25]} />
      <directionalLight
        castShadow
        position={sun}
        intensity={sunIntensity}
        color="#fff6ea"
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
        shadow-radius={shadowSoftness}
      >
        {/* Tight ortho frustum around the site = sharper shadows for the same map size */}
        <orthographicCamera attach="shadow-camera" args={[-170, 170, 170, -170, 10, 700]} />
      </directionalLight>

      {/* Soft grounding under buildings — the "maquette on a table" cue. One depth pass + blur per rendered frame. */}
      {contactShadows > 0 && (
        <ContactShadows position={[0, 0.04, 0]} scale={360} far={30} blur={2.2} opacity={contactShadows} resolution={lowPower ? 256 : 512} color="#2d2b26" />
      )}
    </>
  );
}
