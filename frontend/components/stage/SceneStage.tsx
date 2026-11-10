"use client";

import dynamic from "next/dynamic";
import { Box } from "lucide-react";
import { StageOverlay } from "./StageOverlay";

function StageLoader() {
  return (
    <div className="absolute inset-0 grid place-items-center text-sm text-ink-2">
      <span className="inline-flex items-center gap-2">
        <Box className="size-4 animate-pulse" aria-hidden /> Building the site model…
      </span>
    </div>
  );
}

// Lazy, client-only: the 3D chunk never blocks first paint or server rendering.
const LazyStage = dynamic(() => import("./LazyStage"), { ssr: false, loading: StageLoader });

/** Persistent 3D stage. Mounted once in the app shell, so it survives route changes. */
export function SceneStage() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#e4e1d8]" aria-label="3D model of the lot and ADU" role="region">
      <LazyStage />
      <StageOverlay />
    </div>
  );
}
