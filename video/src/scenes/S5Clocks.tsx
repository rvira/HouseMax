import { AbsoluteFill } from "remotion";
import { Backdrop } from "../three/Backdrop";
import { GLIDE } from "../three/camera";
import { enter, range, useSceneFrame, useSpring } from "../ui/anim";
import { Eyebrow, Glass, Headline, Scrim } from "../ui/kit";

/**
 * Scene 5 — Two-Clock Ledger (0:35–0:44).
 * Numbers are the app's: statutory ADU clock (Gov. Code § 66317(a)(2)–(3): 15 business days to completeness,
 * 60 days to decide) beside Santa Ana's HCD APR median, permit → occupancy (287 days, 682 projects).
 * The two are different measures and are labelled as such.
 */
const MAX = 287;

function ClockRow({ at, label, sub, days, color }: { at: number; label: string; sub: string; days: number; color: string }) {
  const f = useSceneFrame();
  const p = useSpring(at);
  const grow = range(f, [at + 8, at + 70], [0, 1], GLIDE);
  return (
    <div style={enter(p, 18)}>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[24px] font-semibold text-ink">{label}</p>
          <p className="mt-1 text-[16px] text-ink-2">{sub}</p>
        </div>
        <p className="text-[64px] font-semibold leading-none tracking-tight text-ink tabular">
          {Math.round(days * grow)}
          <span className="ml-2 text-[24px] font-medium text-ink-2">days</span>
        </p>
      </div>
      <div className="mt-4 h-4 w-full overflow-hidden rounded-full bg-black/[0.06]">
        <div className="h-full rounded-full" style={{ width: `${(days / MAX) * 100 * grow}%`, background: color }} />
      </div>
    </div>
  );
}

export function S5Clocks() {
  const f = useSceneFrame();
  const card = useSpring(10);
  const foot = useSpring(170);
  return (
    <AbsoluteFill>
      <Backdrop frame={f} from={150} to={175} />
      <Scrim side="left" strength={0.92} />

      <AbsoluteFill className="justify-center px-16">
        <Eyebrow at={10}>Two-Clock Ledger</Eyebrow>
        <Headline at={14} text="The legal clock, beside the real one." className="mt-3 max-w-[900px] text-[52px] leading-[1.06]" />

        <Glass className="mt-10 w-[980px] space-y-9 p-9" style={enter(card, 30)}>
          <ClockRow at={40} label="Statutory deadline to decide" sub="15 business days to completeness, then 60 days · Gov. Code § 66317(a)" days={60} color="#3b6cf6" />
          <ClockRow at={90} label="Median permit → occupancy, Santa Ana" sub="682 projects · HCD Annual Progress Report data" days={287} color="#eb6834" />
        </Glass>
        <p className="mt-5 max-w-[620px] text-[15px] leading-relaxed text-ink-2" style={enter(foot, 10)}>
          Different measures, shown side by side: what the law requires of the city, and what projects actually experience.
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
