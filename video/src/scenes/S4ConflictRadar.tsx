import { AbsoluteFill } from "remotion";
import { Backdrop } from "../three/Backdrop";
import { enter, range, useSceneFrame, useSpring } from "../ui/anim";
import { Eyebrow, Glass, Headline, Scrim } from "../ui/kit";
import { SMOOTH } from "../three/camera";

/**
 * Scene 4 — Conflict Radar (0:26–0:35).
 * Real items from the app's Santa Ana ADU checklist (frontend/data/cities.json). A scan line sweeps the
 * document; as it passes each row, the row is flagged exactly as the app classifies it.
 */
const ROWS = [
  {
    text: "Side and rear setbacks per Gov. Code",
    cite: "§ 65852.2",
    tail: ": minimum 4 feet.",
    tag: "Stale citation",
    fix: "→ § 66314(d)(7)",
    tone: "brand" as const,
  },
  {
    text: "Applicant must provide written approval from neighborhood HOA before building division intake.",
    tag: "Discretionary · HOA sign-off",
    tone: "critical" as const,
  },
  {
    text: "ADUs over 800 sq ft subject to architectural design review for neighborhood compatibility.",
    tag: "Discretionary · design review",
    tone: "critical" as const,
  },
];

const SCAN_START = 40;
const SCAN_END = 150;
const DOC_TOP = 92; // px offset of first row inside the card body
const ROW_H = 104;

export function S4ConflictRadar() {
  const f = useSceneFrame();
  const card = useSpring(6);
  const scan = range(f, [SCAN_START, SCAN_END], [0, 1], SMOOTH);
  const scanY = DOC_TOP - 20 + scan * (ROWS.length * ROW_H + 30);
  const hitAt = (i: number) => SCAN_START + ((DOC_TOP + i * ROW_H + 30 - (DOC_TOP - 20)) / (ROWS.length * ROW_H + 30)) * (SCAN_END - SCAN_START) * 0.82;
  const count = ROWS.filter((_, i) => f >= hitAt(i)).length;
  const summary = useSpring(172);
  const counter = useSpring(60);

  return (
    <AbsoluteFill>
      <Backdrop frame={f} from={70} to={95} />
      <Scrim side="left" strength={0.92} />

      <AbsoluteFill className="flex-row items-center gap-14 px-16">
        <Glass className="relative w-[640px] overflow-hidden p-0" style={enter(card, 40)}>
          <div className="flex items-center justify-between border-b border-black/[0.06] px-7 py-5">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-ink-2">City checklist</p>
              <p className="text-[22px] font-semibold text-ink">Santa Ana · ADU submittal</p>
            </div>
            <span className="rounded-full bg-black/[0.05] px-3 py-1 text-[14px] font-medium text-ink-2">Illustrative</span>
          </div>

          <div className="relative px-7 pb-6 pt-2">
            {ROWS.map((r, i) => {
              const hit = range(f, [hitAt(i), hitAt(i) + 10], [0, 1]);
              const tint = r.tone === "critical" ? `rgba(208,59,59,${0.07 * hit})` : `rgba(59,108,246,${0.07 * hit})`;
              return (
                <div key={i} className="relative mt-3 rounded-2xl px-4 py-3" style={{ background: tint, height: ROW_H - 12 }}>
                  <p className="text-[18px] leading-snug text-ink">
                    {r.cite ? (
                      <>
                        {r.text}{" "}
                        <span className="relative font-semibold">
                          {r.cite}
                          <span className="absolute left-0 top-1/2 h-[2px] bg-critical" style={{ width: `${hit * 100}%` }} />
                        </span>
                        <span className="font-semibold text-brand-600" style={{ opacity: hit, marginLeft: 6 }}>
                          {r.fix}
                        </span>
                        {r.tail}
                      </>
                    ) : (
                      r.text
                    )}
                  </p>
                  <span
                    className={`absolute bottom-2.5 right-3 rounded-full px-2.5 py-0.5 text-[13px] font-semibold ring-1 ${
                      r.tone === "critical" ? "bg-[#fef2f2] text-critical-ink ring-critical/25" : "bg-brand-50 text-brand-700 ring-brand-500/25"
                    }`}
                    style={{ opacity: hit, transform: `scale(${0.85 + 0.15 * hit})` }}
                  >
                    {r.tag}
                  </span>
                </div>
              );
            })}

            {/* Scan line */}
            {scan > 0 && scan < 1 && (
              <div className="pointer-events-none absolute inset-x-0" style={{ top: scanY }}>
                <div className="h-[2px] bg-brand-500 shadow-[0_0_24px_6px_rgba(59,108,246,0.45)]" />
                <div className="h-16 bg-gradient-to-b from-brand-500/15 to-transparent" />
              </div>
            )}
          </div>
        </Glass>

        <div className="w-[420px]">
          <Eyebrow at={14}>Conflict Radar</Eyebrow>
          <Headline at={18} text="Checklists, audited against state law." className="mt-3 text-[50px] leading-[1.06]" />
          <div className="mt-8 flex items-baseline gap-3" style={enter(counter, 16)}>
            <span className="text-[96px] font-semibold leading-none tracking-tight text-ink tabular">{count}</span>
            <span className="text-[24px] font-medium text-ink-2">conflicts found</span>
          </div>
          <p className="mt-3 text-[19px] leading-relaxed text-ink-2" style={enter(summary, 12)}>
            1 renumbered citation · 2 discretionary steps
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
