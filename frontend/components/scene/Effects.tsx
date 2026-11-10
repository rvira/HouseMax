"use client";

import { useEffect, type ReactElement } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useControls } from "leva";

/**
 * Post stack for the "architect's model" look:
 *  Bloom — threshold 1.0, so ONLY emissive > 1 glows (the red violation pulse); white walls never bloom.
 *  ACES tone mapping (more contrast than AgX for a white-on-white maquette), a light vignette, then SMAA (a single cheap pass instead of MSAA buffers).
 * Grounding/occlusion comes from <ContactShadows> in Lighting.tsx rather than an SSAO pass: N8AO 2.0.1 ships a
 * WebGLMultipleRenderTargets shim that crashes on three r187, and contact shadows are cheaper anyway.
 * `lowPower` skips Bloom's mip chain on weak devices.
 */
export function Effects({ lowPower }: { lowPower: boolean }) {
  const gl = useThree((s) => s.gl);
  const fx = useControls("Post-processing", {
    enabled: true,
    bloom: !lowPower,
    bloomIntensity: { value: 0.9, min: 0, max: 3, step: 0.05 },
    bloomThreshold: { value: 1, min: 0, max: 2, step: 0.05 },
    vignette: { value: 0.32, min: 0, max: 1, step: 0.01 },
  });

  // The composer does tone mapping itself; avoid double tone mapping on the renderer.
  useEffect(() => {
    gl.toneMapping = fx.enabled ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
  }, [gl, fx.enabled]);

  if (!fx.enabled) return null;

  const passes: ReactElement[] = [];
  if (fx.bloom) passes.push(<Bloom key="bloom" mipmapBlur intensity={fx.bloomIntensity} luminanceThreshold={fx.bloomThreshold} luminanceSmoothing={0.15} />);
  passes.push(<ToneMapping key="tm" mode={ToneMappingMode.ACES_FILMIC} />);
  if (fx.vignette > 0) passes.push(<Vignette key="vig" offset={0.35} darkness={fx.vignette} />);
  passes.push(<SMAA key="smaa" />);

  return (
    <EffectComposer multisampling={0} stencilBuffer={false}>
      {passes}
    </EffectComposer>
  );
}
