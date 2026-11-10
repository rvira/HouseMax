"use client";

import { AlertTriangle, CheckCircle2, Home, RefreshCw, Ruler } from "lucide-react";
import { useProject } from "@/lib/store";
import { aduLengthFor, useSceneStore, useSiteLayout } from "@/lib/scene/store";
import { STATE_MIN_SETBACK } from "@/lib/scene/layout";
import { VERDICT_META } from "@/lib/by-right-engine";
import { Badge, Card, CardHeader, Disclaimer, Page, PageTitle, Slider } from "@/components/ui/primitives";

/**
 * Controls for the shared 3D scene. The model itself is the persistent stage behind this panel
 * (components/stage); this page only edits the project (lot, ADU size/position) and the scene's
 * massing assumptions (house size, required setbacks).
 */
export default function SitePlanPage() {
  const { project: p, evaluation, update } = useProject();
  const site = useSceneStore((s) => s.site);
  const setSite = useSceneStore((s) => s.setSite);
  const { layout } = useSiteLayout();

  const aduLength = aduLengthFor(p.sqft, site.aduWidth);
  const maxSide = Math.max(0, p.lotWidth - site.aduWidth);
  const maxRear = Math.max(0, p.lotDepth - aduLength);
  const violating = layout.violations.length > 0;
  const verdict = VERDICT_META[evaluation.verdict];

  return (
    <Page>
      <PageTitle
        eyebrow="Spatial check"
        title="3D Site Plan"
        description="Drag the ADU in the model or use the sliders. Crossing a setback buffer turns it red, and the verdict updates."
      />

      <div className="space-y-5">
        <Card className="p-5">
          <div className="flex items-start gap-3">
            {violating ? <AlertTriangle className="mt-0.5 size-5 shrink-0 text-critical" /> : <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-good" />}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{violating ? "Setback violation" : "ADU fits the buildable area"}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-2">
                {violating
                  ? layout.violations.map((v) => v.label).join(" · ")
                  : `Clear of the ${site.requiredSide} ft side and ${site.requiredRear} ft rear buffers.`}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone={verdict.tone}>Verdict: {verdict.label}</Badge>
                {p.type !== "ADU_DETACHED" && <Badge tone="warning">Models a detached ADU</Badge>}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="ADU & setbacks" icon={Ruler} subtitle="Floor area stays synced with the intake." />
          <div className="space-y-6 p-5 pb-8">
            <Slider label="ADU width" unit="ft" value={site.aduWidth} min={10} max={40} onChange={(aduWidth) => setSite({ aduWidth })} />
            <Slider
              label="ADU length"
              unit="ft"
              value={aduLength}
              min={8}
              max={60}
              onChange={(len) => update({ sqft: Math.round(len * site.aduWidth) })}
              marker={{ value: Math.round(1200 / site.aduWidth), label: "max" }}
            />
            <Slider label="ADU height" unit="ft" value={p.height} min={8} max={30} step={0.5} onChange={(height) => update({ height })} marker={{ value: 16, label: "16 ft" }} />
            <Slider label="Distance from rear line" unit="ft" value={p.rearSetback} min={0} max={Math.max(1, maxRear)} step={0.5} onChange={(rearSetback) => update({ rearSetback })} marker={{ value: site.requiredRear, label: `${site.requiredRear} ft min` }} />
            <Slider label="Distance from side line" unit="ft" value={p.sideSetback} min={0} max={Math.max(1, maxSide)} step={0.5} onChange={(sideSetback) => update({ sideSetback })} marker={{ value: site.requiredSide, label: `${site.requiredSide} ft min` }} />
            <Slider label="Required rear setback" unit="ft" value={site.requiredRear} min={0} max={20} onChange={(requiredRear) => setSite({ requiredRear })} />
            <Slider label="Required side setback" unit="ft" value={site.requiredSide} min={0} max={20} onChange={(requiredSide) => setSite({ requiredSide })} />
            <button
              type="button"
              onClick={() => setSite({ requiredRear: STATE_MIN_SETBACK, requiredSide: STATE_MIN_SETBACK })}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline"
            >
              <RefreshCw className="size-3" /> Reset to state minimum (4 ft)
            </button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Lot & residence" icon={Home} />
          <div className="space-y-6 p-5 pb-6">
            <Slider label="Lot width" unit="ft" value={p.lotWidth} min={30} max={120} onChange={(lotWidth) => update({ lotWidth, lotArea: lotWidth * p.lotDepth })} />
            <Slider label="Lot length" unit="ft" value={p.lotDepth} min={60} max={240} onChange={(lotDepth) => update({ lotDepth, lotArea: p.lotWidth * lotDepth })} />
            <Slider label="House width" unit="ft" value={site.primaryWidth} min={16} max={Math.max(16, p.lotWidth)} onChange={(primaryWidth) => setSite({ primaryWidth })} />
            <Slider label="House length" unit="ft" value={site.primaryLength} min={20} max={80} onChange={(primaryLength) => setSite({ primaryLength })} />
          </div>
        </Card>

        <Disclaimer>Illustrative massing only. Required setbacks default to the 4 ft state ADU maximum (Gov. Code § 66314(d)(7)).</Disclaimer>
      </div>
    </Page>
  );
}
