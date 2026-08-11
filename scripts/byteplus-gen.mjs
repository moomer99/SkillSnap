#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// SkillSnap — BytePlus (ModelArk) promo-asset generator
//
// Generates IMAGES with Seedream and VIDEOS with Seedance via the BytePlus Ark
// REST API. No dependencies — uses Node's global fetch (Node 18+; you're on 24).
//
// Auth: reads BYTEPLUS_API_KEY. The script auto-loads .env.local if the var
// isn't already in the environment, so you can just run it directly.
//
// USAGE
//   node scripts/byteplus-gen.mjs image "<prompt>" [options]
//   node scripts/byteplus-gen.mjs video "<prompt>" [options]
//
// IMAGE options (Seedream):
//   --model <id>     default: $BYTEPLUS_IMAGE_MODEL or seedream-4-0-250828
//   --size  <size>   default: 2K   (e.g. 1K, 2K, 4K, or 1024x1024 / 2048x2048)
//   --watermark      add BytePlus watermark (default: off, for promo use)
//   --out   <dir>    output directory (default: promo-output)
//
// VIDEO options (Seedance):
//   --model <id>      default: $BYTEPLUS_VIDEO_MODEL or seedance-1-0-lite-t2v-250428
//                     (auto-switches to the i2v model when --image is given)
//   --image <path|url>  reference image → image-to-video
//   --ratio <r>       default: 16:9   (16:9, 9:16, 1:1, 4:3, 3:4, 21:9)
//   --resolution <r>  default: 720p   (480p, 720p, 1080p)
//   --duration <s>    default: 5      (seconds)
//   --camerafixed     lock the camera (default: off)
//   --out <dir>       output directory (default: promo-output)
//
// EXAMPLES
//   node scripts/byteplus-gen.mjs image "A friendly tradie fixing a tap, warm cinematic lighting, SkillSnap purple accents" --size 2K
//   node scripts/byteplus-gen.mjs video "Barber giving a fresh fade, close-up, upbeat" --ratio 9:16 --duration 5
//   node scripts/byteplus-gen.mjs video "Bring this photo to life, subtle motion" --image ./promo-output/seedream-xyz.png --ratio 9:16
//
// NOTE ON MODEL IDS: BytePlus model IDs are dated (…-250428) and rotate as new
// versions ship. If you get "model not found", check the current IDs in the
// BytePlus console → Model releases, and override with --model or the env vars
// BYTEPLUS_IMAGE_MODEL / BYTEPLUS_VIDEO_MODEL / BYTEPLUS_VIDEO_MODEL_I2V.
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

// ── Minimal .env.local loader ────────────────────────────────────────────────
// Only fills vars that aren't already set; never overrides the real environment.
function loadEnvLocal() {
  const path = ".env.local";
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnvLocal();

const API_KEY = process.env.BYTEPLUS_API_KEY;
const BASE = (process.env.BYTEPLUS_BASE_URL || "https://ark.ap-southeast.bytepluses.com/api/v3").replace(/\/+$/, "");

const MODELS = {
  image: process.env.BYTEPLUS_IMAGE_MODEL || "seedream-4-0-250828",
  videoT2V: process.env.BYTEPLUS_VIDEO_MODEL || "seedance-1-0-lite-t2v-250428",
  videoI2V: process.env.BYTEPLUS_VIDEO_MODEL_I2V || "seedance-1-0-lite-i2v-250428",
};

// ── Tiny arg parser: first non-flag after the command is the prompt ──────────
function parseArgs(argv) {
  const opts = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        opts[key] = true; // boolean flag
      } else {
        opts[key] = next;
        i++;
      }
    } else {
      positional.push(a);
    }
  }
  return { opts, positional };
}

function die(msg, code = 1) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(code);
}

function timestamp() {
  // yyyymmdd-hhmmss in local time, filename-safe
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) {
    const detail = json?.error?.message || json?.message || text || res.statusText;
    die(`API ${method} ${path} → ${res.status}: ${detail}`);
  }
  return json;
}

async function download(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) die(`Download failed (${res.status}) for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(outPath, buf);
  return buf.length;
}

// Local image → data URI (for image-to-video); pass through if already a URL.
function toImageUrl(pathOrUrl) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (!existsSync(pathOrUrl)) die(`Image not found: ${pathOrUrl}`);
  const ext = extname(pathOrUrl).toLowerCase().replace(".", "");
  const mime = ext === "jpg" ? "jpeg" : (ext || "png");
  const b64 = readFileSync(pathOrUrl).toString("base64");
  return `data:image/${mime};base64,${b64}`;
}

function extFromUrl(url, fallback) {
  const clean = url.split("?")[0];
  const e = extname(clean).toLowerCase();
  return e && e.length <= 5 ? e : fallback;
}

// ── IMAGE (Seedream) ─────────────────────────────────────────────────────────
async function generateImage(prompt, opts) {
  const model = opts.model || MODELS.image;
  const size = opts.size || "2K";
  const outDir = ensureDir(opts.out || "promo-output");

  console.log(`\n🎨 Seedream image`);
  console.log(`   model: ${model}   size: ${size}   watermark: ${opts.watermark ? "on" : "off"}`);
  console.log(`   prompt: ${prompt}`);

  const json = await api("POST", "/images/generations", {
    model,
    prompt,
    size,
    response_format: "url",
    watermark: !!opts.watermark,
  });

  const items = json.data || [];
  if (!items.length) die(`No image returned. Response: ${JSON.stringify(json).slice(0, 400)}`);

  const ts = timestamp();
  let i = 0;
  for (const item of items) {
    const url = item.url;
    if (!url) { console.warn("   (item had no url; skipping)"); continue; }
    const suffix = items.length > 1 ? `-${++i}` : "";
    const file = join(outDir, `seedream-${ts}${suffix}${extFromUrl(url, ".png")}`);
    const bytes = await download(url, file);
    console.log(`   ✔ saved ${file} (${(bytes / 1024).toFixed(0)} KB)`);
  }
  writeFileSync(join(outDir, `seedream-${ts}.txt`), `model: ${model}\nsize: ${size}\nprompt: ${prompt}\n`);
  console.log(`   ✔ prompt saved alongside\n`);
}

// ── VIDEO (Seedance) ─────────────────────────────────────────────────────────
async function generateVideo(prompt, opts) {
  const hasImage = !!opts.image;
  const model = opts.model || (hasImage ? MODELS.videoI2V : MODELS.videoT2V);
  const outDir = ensureDir(opts.out || "promo-output");

  // Seedance takes generation parameters as --flags appended to the text prompt.
  const flags = [
    `--ratio ${opts.ratio || "16:9"}`,
    `--resolution ${opts.resolution || "720p"}`,
    `--duration ${opts.duration || 5}`,
    `--camerafixed ${opts.camerafixed ? "true" : "false"}`,
  ].join("  ");
  const text = `${prompt}  ${flags}`;

  const content = [{ type: "text", text }];
  if (hasImage) {
    content.unshift({ type: "image_url", image_url: { url: toImageUrl(opts.image) } });
  }

  console.log(`\n🎬 Seedance video  ${hasImage ? "(image-to-video)" : "(text-to-video)"}`);
  console.log(`   model: ${model}`);
  console.log(`   ${flags}`);
  console.log(`   prompt: ${prompt}`);

  const created = await api("POST", "/contents/generations/tasks", { model, content });
  const taskId = created.id;
  if (!taskId) die(`No task id returned. Response: ${JSON.stringify(created).slice(0, 400)}`);
  console.log(`   task: ${taskId} — polling…`);

  // Poll until terminal state. Video gen typically takes 1–5 min.
  const POLL_MS = 5000;
  const TIMEOUT_MS = 15 * 60 * 1000;
  const started = Date.now();
  let lastStatus = "";
  for (;;) {
    if (Date.now() - started > TIMEOUT_MS) die(`Timed out after 15 min waiting for task ${taskId}.`);
    await new Promise((r) => setTimeout(r, POLL_MS));
    const task = await api("GET", `/contents/generations/tasks/${taskId}`);
    const status = task.status;
    if (status !== lastStatus) { process.stdout.write(`\n   status: ${status}`); lastStatus = status; }
    else process.stdout.write(".");

    if (status === "succeeded") {
      const url = task.content?.video_url;
      if (!url) die(`\nSucceeded but no video_url. Response: ${JSON.stringify(task).slice(0, 400)}`);
      const ts = timestamp();
      const file = join(outDir, `seedance-${ts}${extFromUrl(url, ".mp4")}`);
      const bytes = await download(url, file);
      writeFileSync(join(outDir, `seedance-${ts}.txt`), `model: ${model}\n${flags}\nprompt: ${prompt}\ntask: ${taskId}\n`);
      console.log(`\n   ✔ saved ${file} (${(bytes / 1024 / 1024).toFixed(1)} MB)`);
      console.log(`   video also available at: ${url}\n`);
      return;
    }
    if (status === "failed" || status === "cancelled") {
      die(`\nTask ${status}. ${task.error ? JSON.stringify(task.error) : ""}`);
    }
    // queued / running → keep polling
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
function usage() {
  console.log(`
BytePlus promo-asset generator

  node scripts/byteplus-gen.mjs image "<prompt>" [--size 2K] [--model <id>] [--watermark] [--out promo-output]
  node scripts/byteplus-gen.mjs video "<prompt>" [--ratio 16:9] [--resolution 720p] [--duration 5]
                                                 [--image <path|url>] [--camerafixed] [--model <id>] [--out promo-output]

Env: BYTEPLUS_API_KEY (required), BYTEPLUS_BASE_URL, BYTEPLUS_IMAGE_MODEL,
     BYTEPLUS_VIDEO_MODEL, BYTEPLUS_VIDEO_MODEL_I2V
`);
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || command === "-h" || command === "--help") { usage(); process.exit(0); }
  if (!API_KEY) die("BYTEPLUS_API_KEY is not set (checked env and .env.local).");

  const { opts, positional } = parseArgs(rest);
  const prompt = positional.join(" ").trim();
  if (!prompt) die(`A prompt is required.  e.g.  node scripts/byteplus-gen.mjs ${command} "your prompt here"`);

  if (command === "image") await generateImage(prompt, opts);
  else if (command === "video") await generateVideo(prompt, opts);
  else { usage(); die(`Unknown command "${command}". Use "image" or "video".`); }
}

main().catch((e) => die(e?.stack || String(e)));
