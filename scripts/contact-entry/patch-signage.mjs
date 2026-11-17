import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";

// node scripts/contact-entry/patch-signage.mjs APPROVED_DIR PLATES_DIR FFMPEG
//
// APPROVED_DIR holds the approved COMPASS-era entry assets (genellect/compass
// public/media/contact-entry at 6bb78ff). PLATES_DIR holds render-plate.py output.
// Only the pixels of the removed right-room lettering are replaced; everything else,
// including the study's own sign, stays exactly as approved.

const [approvedDir, platesDir, ffmpeg] = process.argv.slice(2);
if (!approvedDir || !platesDir || !ffmpeg) throw new Error("Usage: patch-signage.mjs APPROVED_DIR PLATES_DIR FFMPEG");

const approved = {
  "representative-desktop.mp4": "d6ad0d2768ff155223b6184f316da0d0482fcbf96ed98ddb9ab55ffd0f8d3670",
  "representative-mobile.mp4": "ea3f95e57ec97cd9c0f9418ab7bd99ae880670d6fc83f71533083c4718ea464a",
  "lobby-desktop.webp": "f549cd3086b3dc75ee5ae24b5ec8aa3efba2b46d0d438afbb95ddc8e7ccc2271",
  "lobby-mobile.webp": "334d33083a59e04fa75103950fc45daeb700b20fbf87519fa06d8a3011a13222"
};
const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");
for (const [file, hash] of Object.entries(approved)) {
  if (sha256(readFileSync(path.join(approvedDir, file))) !== hash) throw new Error(`Not the approved asset: ${file}`);
}

const output = path.resolve("public/images/contact-entry");
const work = mkdtempSync(path.join(tmpdir(), "contact-signage-"));

async function readRaw(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function dilate(mask, w, h, radius) {
  const tmp = new Uint8Array(mask.length), out = new Uint8Array(mask.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = 0;
    for (let k = -radius; k <= radius && !v; k++) { const xx = x + k; if (xx >= 0 && xx < w) v = mask[y * w + xx]; }
    tmp[y * w + x] = v;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = 0;
    for (let k = -radius; k <= radius && !v; k++) { const yy = y + k; if (yy >= 0 && yy < h) v = tmp[yy * w + x]; }
    out[y * w + x] = v;
  }
  return out;
}

function blur(values, w, h, radius) {
  let src = Float32Array.from(values);
  for (let pass = 0; pass < 2; pass++) {
    const tmp = new Float32Array(src.length), dst = new Float32Array(src.length);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let sum = 0, n = 0;
      for (let k = -radius; k <= radius; k++) { const xx = x + k; if (xx >= 0 && xx < w) { sum += src[y * w + xx]; n++; } }
      tmp[y * w + x] = sum / n;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let sum = 0, n = 0;
      for (let k = -radius; k <= radius; k++) { const yy = y + k; if (yy >= 0 && yy < h) { sum += tmp[yy * w + x]; n++; } }
      dst[y * w + x] = sum / n;
    }
    src = dst;
  }
  return src;
}

/** Per-channel least squares frame ≈ gain * plate + offset over the selected wall pixels. */
function fit(frame, plate, fw, left, top, w, h, use) {
  const coef = [];
  for (let c = 0; c < 3; c++) {
    let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!use[y * w + x]) continue;
      const p = plate[(y * w + x) * 3 + c], f = frame[((top + y) * fw + left + x) * 3 + c];
      n++; sx += p; sy += f; sxx += p * p; sxy += p * f;
    }
    const gain = n > 10 && sxx * n - sx * sx > 1e-6 ? (sxy * n - sx * sy) / (sxx * n - sx * sx) : 1;
    coef.push([gain, n ? (sy - gain * sx) / n : 0]);
  }
  return coef;
}

/** Replace the lettering in one image (RGB raw) with the colour-matched plate. Returns pixels changed. */
function patch(image, plateImage, region) {
  const { data: frame, width: fw, height: fh } = image;
  const { data: plate, width: w, height: h } = plateImage;
  let best;
  // The crop origin from Blender's border is fractional; find the exact pixel registration.
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const left = Math.round(region.left) + dx, top = Math.round(region.top) + dy;
    if (left < 0 || top < 0 || left + w > fw || top + h > fh) continue;
    const bright = new Uint8Array(w * h);
    const lum = [];
    for (let i = 0; i < w * h; i++) {
      const o = ((top + Math.floor(i / w)) * fw + left + (i % w)) * 3;
      lum.push(luma(frame[o], frame[o + 1], frame[o + 2]));
    }
    const sorted = [...lum].sort((a, b) => a - b), median = sorted[Math.floor(sorted.length / 2)];
    for (let i = 0; i < w * h; i++) bright[i] = lum[i] > median - 25 ? 1 : 0;
    const coef = fit(frame, plate, fw, left, top, w, h, bright);
    let error = 0, n = 0;
    for (let i = 0; i < w * h; i++) {
      if (!bright[i]) continue;
      const o = ((top + Math.floor(i / w)) * fw + left + (i % w)) * 3;
      for (let c = 0; c < 3; c++) { const d = frame[o + c] - (coef[c][0] * plate[i * 3 + c] + coef[c][1]); error += d * d; }
      n++;
    }
    if (!best || error / n < best.error) best = { left, top, error: error / n };
  }
  if (!best) throw new Error("Plate does not fit inside the frame");
  const { left, top } = best;

  // Lettering is markedly darker than the wall the plate predicts there.
  let wall = new Uint8Array(w * h).fill(1), letters = new Uint8Array(w * h);
  for (let round = 0; round < 3; round++) {
    const coef = fit(frame, plate, fw, left, top, w, h, wall);
    letters = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const o = ((top + Math.floor(i / w)) * fw + left + (i % w)) * 3;
      const predicted = luma(...[0, 1, 2].map(c => coef[c][0] * plate[i * 3 + c] + coef[c][1]));
      if (luma(frame[o], frame[o + 1], frame[o + 2]) < predicted - 10) letters[i] = 1;
    }
    const grown = dilate(letters, w, h, 3);
    wall = grown.map(v => 1 - v);
  }
  const coef = fit(frame, plate, fw, left, top, w, h, wall);
  // Keep a clean border so the graft never touches the crop edge.
  const edge = 6;
  const core = dilate(letters, w, h, 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < edge || y < edge || x >= w - edge || y >= h - edge) core[y * w + x] = 0;
  const alpha = blur(core, w, h, 2);
  let changed = 0;
  for (let i = 0; i < w * h; i++) {
    const a = Math.min(1, alpha[i] * 1.6);
    if (a <= 0.002) continue;
    const o = ((top + Math.floor(i / w)) * fw + left + (i % w)) * 3;
    for (let c = 0; c < 3; c++) {
      const target = Math.max(0, Math.min(255, coef[c][0] * plate[i * 3 + c] + coef[c][1]));
      frame[o + c] = Math.round(frame[o + c] * (1 - a) + target * a);
    }
    changed++;
  }
  return changed;
}

const manifestAssets = [];
for (const layout of ["desktop", "mobile"]) {
  const key = `representative-${layout}`;
  const plates = JSON.parse(readFileSync(path.join(platesDir, `${key}-plates.json`), "utf8"));
  const frames = path.join(work, layout);
  execFileSync("mkdir", ["-p", frames]);
  execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-i", path.join(approvedDir, `${key}.mp4`), "-vsync", "0", path.join(frames, "%04d.png")]);
  let patchedFrames = 0;
  for (let frame = 1; frame <= 48; frame++) {
    const file = path.join(frames, `${String(frame).padStart(4, "0")}.png`);
    if (!existsSync(file)) throw new Error(`Missing decoded frame ${layout} ${frame}`);
    const region = plates.regions[frame];
    if (!region) continue;
    const image = await readRaw(file);
    if (image.width !== plates.width || image.height !== plates.height) throw new Error("Frame size differs from the render");
    const changed = patch(image, await readRaw(path.join(platesDir, `${key}-plate-${String(frame).padStart(4, "0")}.png`)), region);
    await sharp(image.data, { raw: { width: image.width, height: image.height, channels: 3 } }).png().toFile(file + ".patched.png");
    rmSync(file);
    execFileSync("mv", [file + ".patched.png", file]);
    patchedFrames++;
    if (frame === 1) {
      const poster = await readRaw(path.join(approvedDir, `lobby-${layout}.webp`));
      patch(poster, await readRaw(path.join(platesDir, `${key}-plate-0001.png`)), region);
      await sharp(poster.data, { raw: { width: poster.width, height: poster.height, channels: 3 } }).webp({ quality: 90 }).toFile(path.join(output, `lobby-${layout}.webp`));
    }
    console.log(`${layout} frame ${frame}: ${changed} pixels replaced`);
  }
  execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-framerate", "24", "-i", path.join(frames, "%04d.png"), "-frames:v", "48", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", path.join(output, `entry-${layout}.mp4`)]);
  console.log(`Encoded entry-${layout}.mp4 (${patchedFrames} frames patched)`);
}
for (const file of ["lobby-desktop.webp", "lobby-mobile.webp", "entry-desktop.mp4", "entry-mobile.mp4"]) {
  const bytes = readFileSync(path.join(output, file));
  manifestAssets.push({ file, bytes: bytes.length, sha256: sha256(bytes) });
}
writeFileSync(path.join(output, "manifest.json"), JSON.stringify({
  author: "Yuto Matsui / CONTACT",
  source: "Approved COMPASS-era films (genellect/compass 6bb78ff) with the right-room lettering replaced by scripts/contact-entry/render-plate.py + patch-signage.mjs",
  frames: 48,
  fps: 24,
  durationSeconds: 2,
  assets: manifestAssets
}, null, 2) + "\n");
rmSync(work, { recursive: true, force: true });
