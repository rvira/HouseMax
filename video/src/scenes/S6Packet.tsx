import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { DRIFT } from "../three/camera";
import { enter, LIVELY, range, useSceneFrame, useSpring } from "../ui/anim";
import { Eyebrow, Headline } from "../ui/kit";

/**
 * Scene 6 — Submittal package (0:44–0:52).
 * The app's 4-page draft PDF (cover, spec matrix, applicant's statement, pre-flight checklist), every page
 * watermarked DRAFT. Pages deal in one by one along a CSS-3D arc, then the fan slowly turns.
 */
const PAGES: { title: string; body: ReactNode }[] = [
  {
    title: "Draft submittal packet",
    body: (
      <>
        <p className="text-[13px] text-ink-2">Detached ADU · Santa Ana</p>
        <div className="mt-4 inline-flex rounded-md bg-[#0f7a52] px-2 py-1 text-[12px] font-semibold text-white">By-Right Likely</div>
        <Lines n={6} />
      </>
    ),
  },
  {
    title: "Spec matrix",
    body: (
      <div className="mt-3 grid grid-cols-3 gap-1.5 text-[11px] text-ink-2">
        {["Floor area", "800 sq ft", "≤ 1,200", "Height", "16 ft", "16 ft", "Setbacks", "4 ft", "≤ 4 ft", "Parking", "1", "≤ 1"].map((c, i) => (
          <span key={i} className={`rounded px-1.5 py-1 ${i % 3 === 0 ? "font-semibold text-ink" : "bg-black/[0.04]"}`}>
            {c}
          </span>
        ))}
      </div>
    ),
  },
  {
    title: "Applicant's statement",
    body: (
      <>
        <p className="mt-3 text-[12px] leading-relaxed text-ink">
          This application is for a ministerial ADU permit under <b>Gov. Code § 66317(a)(1)</b>…
        </p>
        <Lines n={5} />
      </>
    ),
  },
  {
    title: "Pre-flight checklist",
    body: (
      <div className="mt-3 space-y-2">
        {["Site plan with setbacks dimensioned", "Floor plan & roof plan", "Exterior elevations (all sides)", "Title 24 energy compliance report"].map((t) => (
          <div key={t} className="flex items-center gap-2 text-[12px] text-ink">
            <span className="size-3.5 rounded-[4px] border border-black/25" /> {t}
          </div>
        ))}
      </div>
    ),
  },
];

function Lines({ n }: { n: number }) {
  return (
    <div className="mt-4 space-y-2">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="h-[6px] rounded-full bg-black/[0.07]" style={{ width: `${92 - ((i * 17) % 35)}%` }} />
      ))}
    </div>
  );
}

/** Cascade: page 1 (cover) in front, later pages stepping up and back behind it. */
function Page({ i, turn, title, children }: { i: number; turn: number; title: string; children: ReactNode }) {
  const p = useSpring(18 + (3 - i) * 12, LIVELY); // back pages deal in first, cover lands last
  const depth = i; // 0 = front
  const x = -depth * 64;
  const y = -depth * 34;
  const scale = 1 - depth * 0.04;
  return (
    <div
      className="absolute left-1/2 top-1/2 h-[440px] w-[340px] overflow-hidden rounded-xl bg-white p-7 shadow-[0_30px_60px_-20px_rgba(14,20,36,0.4)] ring-1 ring-black/[0.06]"
      style={{
        zIndex: 10 - depth,
        // Own perspective per page (no shared preserve-3d), so pages stack by z-index instead of intersecting.
        transform: `translate(-50%, -50%) translate3d(${x * p + 60}px, ${y * p + (1 - p) * 460}px, 0) perspective(1600px) rotateY(${turn}deg) rotateX(5deg) scale(${scale})`,
        opacity: Math.min(1, p * 1.5),
        filter: depth > 0 ? `brightness(${1 - depth * 0.025})` : undefined,
      }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">Page {i + 1} of 4</p>
      <p className="mt-1 text-[21px] font-semibold text-ink">{title}</p>
      {children}
      <p className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[28deg] text-[72px] font-black tracking-[0.12em] text-critical/[0.12]">
        DRAFT
      </p>
    </div>
  );
}

export function S6Packet() {
  const f = useSceneFrame();
  const turn = range(f, [0, 248], [-14, -4], DRIFT);
  const note = useSpring(120);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(120% 90% at 30% 40%, #fbfaf7 0%, #ebe8df 60%, #dcd8cc 100%)" }}>
      <AbsoluteFill className="flex-row items-center px-16">
        <div className="relative h-full w-[720px]">
          {PAGES.map((pg, i) => (
            <Page key={i} i={i} turn={turn} title={pg.title}>
              {pg.body}
            </Page>
          ))}
        </div>
        <div className="w-[440px]">
          <Eyebrow at={10}>Submittal package</Eyebrow>
          <Headline at={14} text="A draft packet, already cited." className="mt-3 text-[54px] leading-[1.05]" />
          <p className="mt-6 text-[20px] leading-relaxed text-ink-2" style={enter(note, 14)}>
            Four pages. The applicant's statement cites only the rules the verdict relied on. Watermarked DRAFT on every page.
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
