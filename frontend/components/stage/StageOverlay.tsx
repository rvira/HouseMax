"use client";

import { AlertTriangle, CheckCircle2, Hand } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSceneStore, useSiteLayout } from "@/lib/scene/store";
import { cn } from "@/components/ui/primitives";

/**
 * 2D HUD over the canvas (plain DOM). Reads the same scene store + pure layout as the Canvas,
 * so the status here and the red pulse in 3D can never disagree.
 */
export function StageOverlay() {
  const { layout } = useSiteLayout();
  const isAdu = useSceneStore((s) => s.project.isAdu);
  const ghost = useSceneStore((s) => s.ghost !== null);
  const violating = layout.violations.length > 0;

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex flex-col items-end gap-2">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={violating ? "bad" : "ok"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          role="status"
          className={cn(
            "flex max-w-sm items-start gap-2 rounded-xl border px-3 py-2 text-xs shadow-lg backdrop-blur-md",
            violating ? "border-critical/25 bg-[#fef2f2]/90 text-[#a32626]" : "border-black/[0.07] bg-white/85 text-ink",
          )}
        >
          {violating ? <AlertTriangle className="mt-px size-4 shrink-0" aria-hidden /> : <CheckCircle2 className="mt-px size-4 shrink-0 text-good" aria-hidden />}
          <div>
            <p className="font-semibold">{violating ? "Setback violation" : "ADU fits the buildable area"}</p>
            {violating && <p className="mt-0.5 leading-relaxed">{layout.violations.map((v) => v.label).join(" · ")}</p>}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-wrap justify-end gap-1.5 text-[10.5px] font-medium text-ink-2">
        {!isAdu && <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[#7a5200]">Models a detached ADU</span>}
        {ghost && <span className="rounded-full bg-brand-50/90 px-2 py-0.5 text-brand-700 ring-1 ring-brand-500/20">Blue ghost = after flip</span>}
        <span className="hidden items-center gap-1 rounded-full bg-white/75 px-2 py-0.5 backdrop-blur sm:inline-flex">
          <Hand className="size-3" aria-hidden /> Drag the ADU · orbit · scroll to zoom
        </span>
      </div>
    </div>
  );
}
