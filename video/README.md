# Byright promo video

A 60-second product film for Byright, rendered programmatically with [Remotion](https://remotion.dev) and
React Three Fiber. 1280×720, 30 fps, 1800 frames, with a locally generated neural voiceover.

```bash
npm install
npm run studio      # live preview + timeline scrubbing
npm run render      # → out/byright-promo.mp4
npm run still       # → out/poster.png (frame 690, the verdict flip)
npm run voiceover   # regenerate public/vo/*.wav + src/vo-manifest.json (needs tools/tts deps, see below)
```

## Structure

```
remotion.config.ts      Tailwind v4, @byright alias → ../frontend, single three.js instance, ANGLE GL
src/
  index.ts              registerRoot
  Root.tsx              <Composition id="Promo">
  Promo.tsx             orchestrator: one <Sequence> per scene, cross-dissolves, VO <Audio>, optional ducked music
  timeline.ts           single source of truth: scene cut points + voiceover script
  vo-manifest.json      generated: exact VO durations (used for sync + music ducking)
  three/                3D only (everything inside <ThreeCanvas>)
    Stage.tsx           ThreeCanvas + studio lighting + camera driver + render-mode SettleFrame
    camera.ts           orbit-space camera tracks, bezier easings, "operator breath"
    SiteModel.tsx       the lot/house/ADU, driven purely by props
    Effects.tsx         DoF (world-space autofocus) + Bloom + ACES + grade + vignette + SMAA
    Backdrop.tsx        defocused site used behind UI-led scenes
    site.ts             the app's demo project
  ui/                   2D only (DOM/Tailwind overlays)
    anim.ts             scene-relative frame, springs, entrance style
    kit.tsx             Headline, Eyebrow, Glass, Chip, VerdictCard, LogoMark, Scrim
  scenes/               S1Reveal … S7Outro, one component per scene
tools/tts/voiceover.mjs Kokoro TTS + ffmpeg mastering
```

## Shared with the app

The video imports the app's pure site geometry (`frontend/lib/scene/layout.ts`) and its shared geometries,
materials and palette (`frontend/components/scene/materials.ts`) through the `@byright` alias, so the lot,
setback check and look are identical to the product. Physics is replaced by keyframed springs because
Remotion renders frames out of order and in parallel; every value is a pure function of the frame.

Every product claim on screen was checked against the app:
- verdicts come from running `frontend/lib/by-right-engine.ts` on the demo project (1 ft setbacks →
  Discretionary Likely; the three `findFlips` changes → By-Right Likely);
- checklist rows are verbatim Santa Ana items from `frontend/data/cities.json`;
- clock numbers are the app's (§ 66317(a); Santa Ana APR median 287 days, 682 projects).

## Voiceover

Generated locally with **Kokoro-82M** (Apache-2.0), voice `af_heart`, then mastered with ffmpeg
(high-pass, gentle compression, presence EQ, −16 LUFS). "Byright" is fed to the TTS as "By-right".

```bash
cd tools/tts && npm install && cd ../..
npm run voiceover -- --voice af_heart --speed 0.96   # other voices: af_bella, am_michael, bf_emma, bm_george
```

The script fails if any line would overrun its scene. To change copy, edit `spoken` in `src/timeline.ts`.
For a human or commercial voice instead, drop WAVs with the same names into `public/vo/` and update the
`seconds` values in `src/vo-manifest.json`.

## Music

None is bundled. Put a track at `public/music.mp3` and pass `{"music": "music.mp3"}` as props (Studio's props
panel, or `--props='{"music":"music.mp3","voiceover":true}'` on render). It fades in/out and ducks to 35%
under every voiceover line automatically.

## Render notes

- `@react-three/postprocessing` + Remotion: the composer is created one commit late, so on a freshly
  mounted canvas Remotion's single per-frame `advance()` drew nothing (transparent frames).
  `SettleFrame` in `three/Effects.tsx` holds the first frame with `delayRender` until the composer has drawn.
- GPU: `angle` (macOS). On a GPU-less Linux box use `--gl=swangle` (slow).
- 4K: `npx remotion render Promo out/promo-4k.mp4 --scale=3` renders 3840×2160 from the same composition.
