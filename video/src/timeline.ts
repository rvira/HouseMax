/**
 * Single source of truth for timing. Scenes, voiceover cues and on-screen beats all derive from here.
 * 60 s @ 30 fps = 1800 frames, 1280×720.
 */

export const FPS = 30;
export const WIDTH = 1280;
export const HEIGHT = 720;
export const DURATION = 60 * FPS;

/** Cross-dissolve length between scenes (frames). Each scene is mounted XFADE/2 early and late. */
export const XFADE = 16;

export type SceneId = "reveal" | "violation" | "flip" | "radar" | "clocks" | "packet" | "outro";

export interface SceneSpec {
  id: SceneId;
  /** Absolute frames: the cut points. */
  from: number;
  to: number;
  /** Voiceover: `text` is what we display/document; `spoken` is fed to TTS (pronunciation-tuned). */
  vo: { text: string; spoken: string; /** frames after `from` */ at: number };
}

export const SCENES: SceneSpec[] = [
  {
    id: "reveal",
    from: 0,
    to: 240,
    vo: {
      at: 20,
      text: "In California, state law says a backyard home, an ADU, should be approved without a public hearing.",
      spoken: "In California, state law says a backyard home, an A D U, should be approved without a public hearing.",
    },
  },
  {
    id: "violation",
    from: 240,
    to: 510,
    vo: {
      at: 18,
      text: "But move it a few feet too close to the property line, and a public hearing is likely back on the table.",
      spoken: "But move it a few feet too close to the property line, and a public hearing is likely back on the table.",
    },
  },
  {
    id: "flip",
    from: 510,
    to: 780,
    vo: {
      at: 14,
      text: "Byright finds the smallest changes that fix it, re-checks every one, and the verdict flips to by-right likely.",
      spoken: "By-right finds the smallest changes that fix it, re-checks every one, and the verdict flips to by-right, likely.",
    },
  },
  {
    id: "radar",
    from: 780,
    to: 1050,
    vo: {
      at: 14,
      text: "It scans city checklists for renumbered law, and for discretionary steps that conflict with state law.",
      spoken: "It scans city checklists for renumbered law, and for discretionary steps that conflict with state law.",
    },
  },
  {
    id: "clocks",
    from: 1050,
    to: 1320,
    vo: {
      at: 14,
      text: "It sets the legal clock, sixty days to decide, beside how long permits really take.",
      spoken: "It sets the legal clock, sixty days to decide, beside how long permits really take.",
    },
  },
  {
    id: "packet",
    from: 1320,
    to: 1560,
    vo: {
      at: 12,
      text: "Then it drafts your submittal packet, citing only the statutes it relied on.",
      spoken: "Then it drafts your submittal packet, citing only the statutes it relied on.",
    },
  },
  {
    id: "outro",
    from: 1560,
    to: 1800,
    vo: {
      at: 96,
      text: "Byright. Know if it's by-right, and prove it.",
      spoken: "By-right. Know if it's by-right, and prove it.",
    },
  },
];

export const scene = (id: SceneId) => SCENES.find((s) => s.id === id)!;
