"use client";

import { useState } from "react";
import { Leva } from "leva";
import SceneCanvas from "@/components/scene/SceneCanvas";

const debugEnabled = () => process.env.NODE_ENV !== "production" || new URLSearchParams(window.location.search).has("debug");

/**
 * Everything heavy lives in this chunk (three, R3F, drei, Rapier, postprocessing, leva), loaded with
 * next/dynamic + ssr:false from <SceneStage>. The Leva panel is a DOM sibling of the Canvas, never inside it.
 * It is always mounted (leva would otherwise auto-mount a global panel) but hidden in production unless ?debug.
 */
export default function LazyStage() {
  const [debug] = useState(debugEnabled);
  return (
    <>
      <SceneCanvas />
      <div className="absolute right-3 top-3 z-20 w-[300px] max-w-[calc(100%-1.5rem)]">
        <Leva fill collapsed hideCopyButton hidden={!debug} titleBar={{ title: "Scene debug" }} />
      </div>
    </>
  );
}
