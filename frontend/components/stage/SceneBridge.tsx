"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useProject } from "@/lib/store";
import { useSceneStore } from "@/lib/scene/store";
import { viewForPath } from "@/lib/scene/views";

/**
 * The single seam between the app (React context in lib/store.tsx) and the 3D world (zustand scene store).
 *  project/evaluation → scene store   (one-way mirror of the fields the scene draws)
 *  route              → scene view    (camera preset + emphasis)
 *  finished ADU drag  → project.update (proposed setbacks), via the registered commit handler
 * Renders nothing.
 */
export function SceneBridge() {
  const { project: p, evaluation, update } = useProject();
  const pathname = usePathname();

  useEffect(() => {
    useSceneStore.getState().syncProject({
      projectId: p.id,
      isAdu: p.type === "ADU_DETACHED",
      lotWidth: p.lotWidth,
      lotLength: p.lotDepth,
      aduHeight: p.height,
      sqft: p.sqft,
      aduRearOffset: p.rearSetback,
      aduSideOffset: p.sideSetback,
      transit: p.transit,
      verdict: evaluation.verdict,
    });
  }, [p.id, p.type, p.lotWidth, p.lotDepth, p.height, p.sqft, p.rearSetback, p.sideSetback, p.transit, evaluation.verdict]);

  useEffect(() => {
    useSceneStore.getState().setView(viewForPath(pathname));
  }, [pathname]);

  useEffect(() => {
    const { setCommitHandler } = useSceneStore.getState();
    setCommitHandler((o) => update({ rearSetback: o.aduRearOffset, sideSetback: o.aduSideOffset }));
    return () => setCommitHandler(null);
  }, [update]);

  return null;
}
