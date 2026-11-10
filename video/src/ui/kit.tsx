import type { CSSProperties, ReactNode } from "react";
import { CheckCircle2, CircleHelp, XCircle, Zap } from "lucide-react";
import { interpolateColors } from "remotion";
import { enter, LIVELY, SILK, useSpring } from "./anim";

/** Small caps label above a headline. */
export function Eyebrow({ at, children, tone = "brand" }: { at: number; children: ReactNode; tone?: "brand" | "light" }) {
  const p = useSpring(at);
  return (
    <p style={enter(p, 12)} className={`text-[15px] font-semibold uppercase tracking-[0.18em] ${tone === "brand" ? "text-brand-600" : "text-white/70"}`}>
      {children}
    </p>
  );
}

/** Kinetic headline: words rise in on a 3-frame stagger. */
export function Headline({ at, text, className = "", style }: { at: number; text: string; className?: string; style?: CSSProperties }) {
  const words = text.split(" ");
  return (
    <h1 className={`font-semibold tracking-[-0.025em] text-ink ${className}`} style={style}>
      {words.map((w, i) => (
        <Word key={i} at={at + i * 3}>
          {w}
        </Word>
      ))}
    </h1>
  );
}

function Word({ at, children }: { at: number; children: ReactNode }) {
  const p = useSpring(at, SILK);
  return (
    <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
      <span className="inline-block" style={{ transform: `translateY(${(1 - p) * 105}%)`, opacity: Math.min(1, p * 1.6) }}>
        {children}&nbsp;
      </span>
    </span>
  );
}

/** Frosted card used for all floating UI. */
export function Glass({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`rounded-3xl border border-black/[0.06] bg-white/80 shadow-[0_30px_80px_-30px_rgba(14,20,36,0.45)] backdrop-blur-2xl ${className}`} style={style}>
      {children}
    </div>
  );
}

export function Chip({ at, tone, children }: { at: number; tone: "critical" | "warning" | "good" | "brand" | "glass"; children: ReactNode }) {
  const p = useSpring(at);
  const cls = {
    critical: "bg-[#fef2f2] text-critical-ink ring-critical/25",
    warning: "bg-warning/15 text-amber-ink ring-warning/40",
    good: "bg-good/10 text-good-ink ring-good/25",
    brand: "bg-brand-50 text-brand-700 ring-brand-500/25",
    /** For chips sitting on a coloured verdict card. */
    glass: "bg-white/15 text-white ring-white/30",
  }[tone];
  return (
    <span style={enter(p, 10)} className={`inline-flex items-center rounded-full px-3 py-1 text-[15px] font-semibold ring-1 tabular ${cls}`}>
      {children}
    </span>
  );
}

export type VerdictKind = "discretionary" | "cant" | "byright";
const VERDICTS: Record<VerdictKind, { label: string; from: string; to: string; icon: ReactNode }> = {
  discretionary: { label: "Discretionary Likely", from: "#8f2424", to: "#d03b3b", icon: <XCircle className="size-9" strokeWidth={2.2} /> },
  cant: { label: "Can't Tell Yet", from: "#8a6512", to: "#b88a1e", icon: <CircleHelp className="size-9" strokeWidth={2.2} /> },
  byright: { label: "By-Right Likely", from: "#0f7a52", to: "#1baf7a", icon: <CheckCircle2 className="size-9" strokeWidth={2.2} /> },
};

/**
 * The app's verdict as a hero card. `flip` (0..1) morphs verdict `from` into `to`: the gradient cross-fades
 * while the label rolls vertically. Labels/colours mirror VERDICT_META in the app.
 */
export function VerdictCard({ at, from, to = from, flip = 0, children }: { at: number; from: VerdictKind; to?: VerdictKind; flip?: number; children?: ReactNode }) {
  const p = useSpring(at);
  const a = VERDICTS[from];
  const b = VERDICTS[to];
  const c1 = interpolateColors(flip, [0, 1], [a.from, b.from]);
  const c2 = interpolateColors(flip, [0, 1], [a.to, b.to]);
  return (
    <div
      style={{ ...enter(p, 30), background: `linear-gradient(135deg, ${c1}, ${c2})` }}
      className="w-[500px] overflow-hidden rounded-3xl p-7 text-white shadow-[0_30px_80px_-24px_rgba(14,20,36,0.55)]"
    >
      <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-white/70">By-right pathway verdict</p>
      <div className="relative mt-2 h-[52px] overflow-hidden">
        <Label y={-flip * 100} icon={a.icon} text={a.label} />
        {to !== from && <Label y={(1 - flip) * 100} icon={b.icon} text={b.label} />}
      </div>
      {children && <div className="mt-5 flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

function Label({ y, icon, text }: { y: number; icon: ReactNode; text: string }) {
  return (
    <div className="absolute inset-0 flex items-center gap-3 whitespace-nowrap text-[36px] font-semibold tracking-tight" style={{ transform: `translateY(${y}%)` }}>
      {icon}
      {text}
    </div>
  );
}

/** Byright mark: the app's gradient tile + bolt. */
export function LogoMark({ at, size = 96 }: { at: number; size?: number }) {
  const p = useSpring(at, LIVELY);
  return (
    <div
      className="grid place-items-center rounded-[28%] bg-gradient-to-br from-[#3b6cf6] to-[#1baf7a] text-white shadow-[0_20px_60px_-10px_rgba(59,108,246,0.6)]"
      style={{ width: size, height: size, transform: `scale(${p}) rotate(${(1 - p) * -24}deg)`, opacity: Math.min(1, p * 2) }}
    >
      <Zap style={{ width: size * 0.52, height: size * 0.52 }} strokeWidth={2.2} />
    </div>
  );
}

/** Soft legibility gradient behind overlay text (a scrim, not a box). */
export function Scrim({ side, strength = 0.85 }: { side: "left" | "bottom" | "right"; strength?: number }) {
  const dir = { left: "to right", bottom: "to top", right: "to left" }[side];
  return (
    <div
      className="absolute inset-0"
      style={{ background: `linear-gradient(${dir}, rgba(245,245,242,${strength}) 0%, rgba(245,245,242,${strength * 0.55}) 32%, rgba(245,245,242,0) 58%)` }}
    />
  );
}
