"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { Verdict } from "@/lib/types";
import { STATE_MIN_SETBACK, computeSiteLayout, type SiteInputs } from "./layout";
import type { ViewId } from "./views";

/**
 * The scene store is the ONLY channel between the 3D <Canvas> and the rest of the app.
 *  - 2D → 3D: <SceneBridge> mirrors the project store in here; pages call setView/setGhost/setSite.
 *  - 3D → 2D: the Canvas writes `drag` while the ADU is being moved and calls `commitOffsets` on release.
 * Canvas components read it with selectors (or getState() inside useFrame) so React never re-renders
 * the 3D tree for unrelated UI changes.
 */

/** Values that come from the project (owned by lib/store.tsx). */
export interface ProjectMirror {
  projectId: string;
  isAdu: boolean;
  lotWidth: number;
  lotLength: number;
  aduHeight: number;
  sqft: number;
  aduRearOffset: number;
  aduSideOffset: number;
  transit: boolean | null;
  verdict: Verdict;
}

/** Massing assumptions that are not part of the project record (editable on the Site Plan page). */
export interface SiteAssumptions {
  primaryWidth: number;
  primaryLength: number;
  primaryHeight: number;
  frontSetback: number;
  aduWidth: number;
  requiredRear: number;
  requiredSide: number;
}

export type Offsets = Pick<SiteInputs, "aduRearOffset" | "aduSideOffset">;
/** A "what if" ADU drawn as a translucent ghost (By-Right Flip preview). */
export type Ghost = Partial<Pick<ProjectMirror, "aduHeight" | "sqft" | "aduRearOffset" | "aduSideOffset">>;

interface SceneState {
  project: ProjectMirror;
  site: SiteAssumptions;
  ghost: Ghost | null;
  view: ViewId;
  /** Live ADU position while dragging; kept after release until the project echoes it back (avoids snap-back). */
  drag: Offsets | null;
  dragActive: boolean;
  /** Width in CSS px of the canvas area covered by the 2D content panel; the camera re-centres around it. */
  panelInset: number;
  /** Bumped to replay the drop-in animation (new project loaded). */
  dropToken: number;
  /** Registered by <SceneBridge>; writes a finished drag back to the project. */
  commitOffsets: ((o: Offsets) => void) | null;

  syncProject: (p: ProjectMirror) => void;
  setSite: (patch: Partial<SiteAssumptions>) => void;
  setGhost: (g: Ghost | null) => void;
  setView: (v: ViewId) => void;
  setDrag: (o: Offsets | null) => void;
  beginDrag: () => void;
  endDrag: (o: Offsets) => void;
  setPanelInset: (px: number) => void;
  setCommitHandler: (fn: SceneState["commitOffsets"]) => void;
}

export const DEFAULT_SITE: SiteAssumptions = {
  primaryWidth: 34,
  primaryLength: 42,
  primaryHeight: 22,
  frontSetback: 20,
  aduWidth: 20,
  requiredRear: STATE_MIN_SETBACK,
  requiredSide: STATE_MIN_SETBACK,
};

export const useSceneStore = create<SceneState>()((set, get) => ({
  project: {
    projectId: "",
    isAdu: true,
    lotWidth: 60,
    lotLength: 120,
    aduHeight: 16,
    sqft: 560,
    aduRearOffset: 8,
    aduSideOffset: 20,
    transit: null,
    verdict: "CANT_TELL_YET",
  },
  site: DEFAULT_SITE,
  ghost: null,
  view: "overview",
  drag: null,
  dragActive: false,
  panelInset: 0,
  dropToken: 0,
  commitOffsets: null,

  syncProject: (p) => {
    const { project: prev, dropToken, dragActive, drag } = get();
    set({
      project: p,
      dropToken: p.projectId !== prev.projectId ? dropToken + 1 : dropToken,
      drag: dragActive ? drag : null,
    });
  },
  setSite: (patch) => set((s) => ({ site: { ...s.site, ...patch } })),
  setGhost: (ghost) => set({ ghost }),
  setView: (view) => set({ view }),
  setDrag: (drag) => set({ drag }),
  beginDrag: () => set({ dragActive: true }),
  endDrag: (o) => {
    set({ drag: o, dragActive: false });
    get().commitOffsets?.(o);
  },
  setPanelInset: (panelInset) => set({ panelInset }),
  setCommitHandler: (commitOffsets) => set({ commitOffsets }),
}));

export const aduLengthFor = (sqft: number, aduWidth: number) => Math.max(8, Math.round(sqft / aduWidth));

/** Flatten store state into layout inputs. `drag` (if any) overrides the committed position. */
export function getSiteInputs(s: Pick<SceneState, "project" | "site" | "drag">, override?: Ghost | null): SiteInputs {
  const p = { ...s.project, ...override };
  const pos = override ? p : (s.drag ?? p);
  return {
    lotWidth: p.lotWidth,
    lotLength: p.lotLength,
    primaryWidth: s.site.primaryWidth,
    primaryLength: s.site.primaryLength,
    primaryHeight: s.site.primaryHeight,
    frontSetback: s.site.frontSetback,
    aduWidth: s.site.aduWidth,
    aduLength: aduLengthFor(p.sqft, s.site.aduWidth),
    aduHeight: p.aduHeight,
    requiredRear: s.site.requiredRear,
    requiredSide: s.site.requiredSide,
    aduRearOffset: pos.aduRearOffset,
    aduSideOffset: pos.aduSideOffset,
  };
}

/** Stable (shallow-compared) inputs → memoised layout. Safe to use in both 2D and 3D components. */
export function useSiteLayout() {
  const inputs = useSceneStore(useShallow((s) => getSiteInputs(s)));
  return useMemo(() => ({ inputs, layout: computeSiteLayout(inputs) }), [inputs]);
}

/** Layout of the Flip "ghost" ADU, or null when there is no preview. */
export function useGhostLayout() {
  const ghost = useSceneStore((s) => s.ghost);
  const project = useSceneStore((s) => s.project);
  const site = useSceneStore((s) => s.site);
  return useMemo(() => (ghost ? computeSiteLayout(getSiteInputs({ project, site, drag: null }, ghost)) : null), [ghost, project, site]);
}
