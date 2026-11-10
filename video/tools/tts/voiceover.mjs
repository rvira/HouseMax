#!/usr/bin/env node
/**
 * Generates the promo voiceover locally with Kokoro-82M (Apache-2.0 neural TTS, no API key, runs on CPU),
 * then masters each line with ffmpeg and writes src/vo-manifest.json with exact durations so the
 * Remotion timeline can sync captions/beats and fail loudly if a line overruns its scene.
 *
 *   npm run voiceover                     # default voice
 *   npm run voiceover -- --voice am_michael --speed 0.95
 *
 * Model weights (~330 MB fp32) download from Hugging Face on first run into tools/tts/.cache.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "@huggingface/transformers";
import { KokoroTTS } from "kokoro-js";
import { FPS, SCENES } from "../../src/timeline.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const outDir = path.join(root, "public/vo");
const tmpDir = path.join(here, ".cache/raw");
env.cacheDir = path.join(here, ".cache/models");

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const voice = arg("voice", "af_heart");
const speed = Number(arg("speed", "0.96"));
const only = arg("only", null);

mkdirSync(outDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });

console.log(`Loading Kokoro (voice ${voice}, speed ${speed})…`);
const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "fp32", device: "cpu" });

const probe = (file) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim());

const lines = {};
let overruns = 0;
for (const s of SCENES) {
  if (only && s.id !== only) continue;
  const raw = path.join(tmpDir, `${s.id}.wav`);
  const out = path.join(outDir, `${s.id}.wav`);
  const audio = await tts.generate(s.vo.spoken, { voice, speed });
  await audio.save(raw);

  // Broadcast-style mastering: trim edge silence, de-rumble, gentle compression, presence lift, -16 LUFS, 48 kHz.
  execFileSync("ffmpeg", [
    "-y", "-v", "error", "-i", raw,
    "-af",
    [
      "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.03",
      "areverse",
      "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.12",
      "areverse",
      "highpass=f=80",
      "acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2",
      "equalizer=f=3500:t=q:w=1.2:g=2",
      "loudnorm=I=-16:TP=-1.5:LRA=7",
      "aresample=48000",
    ].join(","),
    "-ac", "1", out,
  ]);

  const seconds = probe(out);
  const sceneFrames = s.to - s.from;
  const endFrame = s.vo.at + Math.ceil(seconds * FPS);
  const fits = endFrame <= sceneFrames - 8;
  if (!fits) overruns++;
  lines[s.id] = { file: `vo/${s.id}.wav`, seconds: Number(seconds.toFixed(3)), endFrame, sceneFrames, fits };
  console.log(`${fits ? "✓" : "✗ OVERRUN"} ${s.id.padEnd(10)} ${seconds.toFixed(2)}s → ends at local frame ${endFrame}/${sceneFrames}`);
}

if (!only) {
  writeFileSync(path.join(root, "src/vo-manifest.json"), JSON.stringify({ voice, speed, model: "Kokoro-82M-v1.0 (fp32)", lines }, null, 2) + "\n");
  rmSync(tmpDir, { recursive: true, force: true });
}
if (overruns) {
  console.error(`\n${overruns} line(s) overrun their scene. Shorten the copy in src/timeline.ts or raise --speed.`);
  process.exit(1);
}
