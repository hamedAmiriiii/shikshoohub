import { isPlateComplete, OIL_PLATE_LETTERS } from "./plate";
import type { OilPlateParts } from "./types";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const TW = 24;
const TH = 36;
const FONT =
  'bold 84px Tahoma, IRANSans, "Iranian Sans", "Noto Naskh Arabic", Arial, sans-serif';

type Glyph = { x: number; y: number; w: number; h: number };
type Match = { label: string; score: number; margin: number };

type Tmpl = { label: string; mat: Float32Array };

let templateCache: {
  digits: Tmpl[];
  letters: Tmpl[];
} | null = null;

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("خواندن عکس ناموفق بود"));
    };
    img.src = url;
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("فشرده‌سازی عکس ناموفق بود"));
      },
      "image/jpeg",
      quality,
    );
  });
}

/** اگر عکس گوشی خیلی بزرگ باشد، کوچک و سبکش می‌کند */
export async function compressPlatePhoto(file: File): Promise<File> {
  try {
    const img = await loadImage(file);
    const maxEdge = 1280;
    const longest = Math.max(img.width, img.height);
    const scale = longest > maxEdge ? maxEdge / longest : 1;
    if (scale === 1 && file.size <= 280_000 && file.type === "image/jpeg") {
      return file;
    }
    const canvas = drawToCanvas(img, img.width * scale, img.height * scale);
    const blob = await canvasToJpeg(canvas, 0.72);
    if (blob.size >= file.size && file.type === "image/jpeg") return file;
    return new File([blob], "plate.jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

function drawToCanvas(img: CanvasImageSource, w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function otsu(gray: Uint8Array): number {
  const hist = new Array(256).fill(0);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
  const total = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0;
  let wB = 0;
  let maxVar = 0;
  let thresh = 127;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const v = wB * wF * (mB - mF) * (mB - mF);
    if (v > maxVar) {
      maxVar = v;
      thresh = t;
    }
  }
  return thresh;
}

function grayscale(data: Uint8ClampedArray): Uint8Array {
  const gray = new Uint8Array(data.length / 4);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }
  return gray;
}

function isBlue(r: number, g: number, b: number) {
  return b > 70 && b > r + 25 && b > g * 0.9 && r < 120;
}

function blueColumnScores(data: Uint8ClampedArray, w: number, h: number): number[] {
  const scores = new Array(w).fill(0);
  for (let x = 0; x < w; x++) {
    let n = 0;
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 4;
      if (isBlue(data[i], data[i + 1], data[i + 2])) n++;
    }
    scores[x] = n / h;
  }
  return scores;
}

function meanRange(arr: number[], a: number, b: number) {
  let s = 0;
  const n = Math.max(1, b - a);
  for (let i = a; i < b; i++) s += arr[i];
  return s / n;
}

function orientAndCropBlue(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;
  const { width: w, height: h } = canvas;
  const img = ctx.getImageData(0, 0, w, h);
  const scores = blueColumnScores(img.data, w, h);
  const band = Math.max(4, Math.round(w * 0.12));
  const left = meanRange(scores, 0, band);
  const right = meanRange(scores, w - band, w);
  let source: CanvasImageSource = canvas;
  if (right > 0.12 && right > left * 1.4) {
    const flipped = document.createElement("canvas");
    flipped.width = w;
    flipped.height = h;
    const fctx = flipped.getContext("2d");
    if (fctx) {
      fctx.translate(w, 0);
      fctx.scale(-1, 1);
      fctx.drawImage(canvas, 0, 0);
      source = flipped;
    }
  }
  const work = source === canvas ? canvas : (source as HTMLCanvasElement);
  const wctx = work.getContext("2d", { willReadFrequently: true });
  if (!wctx) return work;
  const data = wctx.getImageData(0, 0, w, h).data;
  const leftScores = blueColumnScores(data, w, h);
  const leftBlue = meanRange(leftScores, 0, band);
  if (leftBlue < 0.1) return work;
  let cut = 0;
  for (let x = 0; x < Math.round(w * 0.28); x++) {
    if (leftScores[x] > 0.08) cut = x + 1;
    else if (cut > 8 && leftScores[x] < 0.03) break;
  }
  if (cut < 8) return work;
  return drawToCanvas(work, w - cut, h);
}

function findSeparatorX(gray: Uint8Array, w: number, h: number, thresh: number): number {
  const from = Math.round(w * 0.68);
  const to = Math.round(w * 0.92);
  let bestX = Math.round(w * 0.8);
  let best = -1;
  for (let x = from; x < to; x++) {
    let dark = 0;
    for (let y = Math.round(h * 0.12); y < Math.round(h * 0.88); y++) {
      if (gray[y * w + x] < thresh) dark++;
    }
    if (dark > best) {
      best = dark;
      bestX = x;
    }
  }
  return best > h * 0.35 ? bestX : Math.round(w * 0.8);
}

function cropCanvas(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  w: number,
  h: number,
): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(w));
  out.height = Math.max(1, Math.round(h));
  const ctx = out.getContext("2d");
  if (ctx) ctx.drawImage(canvas, x, y, w, h, 0, 0, out.width, out.height);
  return out;
}

function toInk(gray: Uint8Array, thresh: number): Uint8Array {
  const ink = new Uint8Array(gray.length);
  let dark = 0;
  for (let i = 0; i < gray.length; i++) if (gray[i] < thresh) dark++;
  const darkIsInk = dark < gray.length * 0.55;
  for (let i = 0; i < gray.length; i++) {
    const isDark = gray[i] < thresh;
    ink[i] = (darkIsInk ? isDark : !isDark) ? 1 : 0;
  }
  return ink;
}

function dilate(ink: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(ink.length);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (
        ink[i] ||
        ink[i - 1] ||
        ink[i + 1] ||
        ink[i - w] ||
        ink[i + w]
      ) {
        out[i] = 1;
      }
    }
  }
  return out;
}

function inkBand(ink: Uint8Array, w: number, h: number): { y0: number; y1: number } {
  const rows = new Array(h).fill(0);
  for (let y = 0; y < h; y++) {
    let n = 0;
    for (let x = 0; x < w; x++) if (ink[y * w + x]) n++;
    rows[y] = n;
  }
  const max = Math.max(...rows, 1);
  const limit = max * 0.18;
  let y0 = 0;
  let y1 = h - 1;
  while (y0 < h && rows[y0] < limit) y0++;
  while (y1 > y0 && rows[y1] < limit) y1--;
  const pad = Math.max(1, Math.round(h * 0.04));
  return {
    y0: Math.max(0, y0 - pad),
    y1: Math.min(h - 1, y1 + pad),
  };
}

function connectedBoxes(ink: Uint8Array, w: number, h: number): Glyph[] {
  const seen = new Uint8Array(ink.length);
  const boxes: Glyph[] = [];
  const stack: number[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const start = y * w + x;
      if (!ink[start] || seen[start]) continue;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let area = 0;
      stack.push(start);
      seen[start] = 1;
      while (stack.length) {
        const i = stack.pop() as number;
        area++;
        const cx = i % w;
        const cy = (i / w) | 0;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;
        const neighbors = [i - 1, i + 1, i - w, i + w, i - w - 1, i - w + 1, i + w - 1, i + w + 1];
        for (const n of neighbors) {
          if (n < 0 || n >= ink.length || seen[n] || !ink[n]) continue;
          const nx = n % w;
          const ny = (n / w) | 0;
          if (Math.abs(nx - cx) > 1 || Math.abs(ny - cy) > 1) continue;
          seen[n] = 1;
          stack.push(n);
        }
      }
      const gw = maxX - minX + 1;
      const gh = maxY - minY + 1;
      if (area < 12 || gw < 2 || gh < 6) continue;
      if (gw > w * 0.45 || gh > h * 0.98) continue;
      if (gh / gw > 12) continue;
      boxes.push({ x: minX, y: minY, w: gw, h: gh });
    }
  }
  return mergeDots(boxes);
}

function mergeDots(boxes: Glyph[]): Glyph[] {
  const items = boxes.slice().sort((a, b) => a.x - b.x);
  const used = new Array(items.length).fill(false);
  const out: Glyph[] = [];
  for (let i = 0; i < items.length; i++) {
    if (used[i]) continue;
    let cur = { ...items[i] };
    for (let j = i + 1; j < items.length; j++) {
      if (used[j]) continue;
      const b = items[j];
      const overlap = Math.min(cur.x + cur.w, b.x + b.w) - Math.max(cur.x, b.x);
      const minW = Math.min(cur.w, b.w);
      const vGap = Math.max(0, Math.max(cur.y, b.y) - Math.min(cur.y + cur.h, b.y + b.h));
      if (overlap > minW * 0.35 && vGap < Math.max(cur.h, b.h) * 0.55) {
        const x = Math.min(cur.x, b.x);
        const y = Math.min(cur.y, b.y);
        const r = Math.max(cur.x + cur.w, b.x + b.w);
        const btm = Math.max(cur.y + cur.h, b.y + b.h);
        cur = { x, y, w: r - x, h: btm - y };
        used[j] = true;
      }
    }
    out.push(cur);
  }
  return out.sort((a, b) => a.x - b.x);
}

function takeGlyphs(boxes: Glyph[], h: number, want: number): Glyph[] {
  if (boxes.length === 0) return [];
  const heights = boxes.map((b) => b.h).sort((a, b) => a - b);
  const median = heights[Math.floor(heights.length / 2)] || h * 0.5;
  let next = boxes.filter((b) => b.h >= median * 0.4 && b.h <= median * 1.8 && b.w >= 2);
  if (next.length < Math.min(3, want)) next = boxes.slice();
  next.sort((a, b) => a.x - b.x);
  while (next.length > want) {
    let drop = 0;
    let worst = Infinity;
    for (let i = 0; i < next.length; i++) {
      const area = next[i].h * next[i].w;
      if (area < worst) {
        worst = area;
        drop = i;
      }
    }
    next.splice(drop, 1);
  }
  return next;
}

function glyphMatrix(
  ink: Uint8Array,
  w: number,
  box: Glyph,
): Float32Array {
  const out = new Float32Array(TW * TH);
  const aspect = box.w / Math.max(1, box.h);
  let dw = TW;
  let dh = TH;
  if (aspect > TW / TH) dh = Math.max(8, Math.round(TW / aspect));
  else dw = Math.max(6, Math.round(TH * aspect));
  const ox = Math.floor((TW - dw) / 2);
  const oy = Math.floor((TH - dh) / 2);
  for (let yy = 0; yy < dh; yy++) {
    const sy = box.y + Math.min(box.h - 1, Math.floor((yy / dh) * box.h));
    for (let xx = 0; xx < dw; xx++) {
      const sx = box.x + Math.min(box.w - 1, Math.floor((xx / dw) * box.w));
      out[(oy + yy) * TW + (ox + xx)] = ink[sy * w + sx] ? 1 : 0;
    }
  }
  return out;
}

function renderChar(ch: string): Float32Array {
  const canvas = document.createElement("canvas");
  canvas.width = 140;
  canvas.height = 160;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return new Float32Array(TW * TH);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000";
  ctx.font = FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(ch, canvas.width / 2, canvas.height / 2 + 6);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const ink = new Uint8Array(width * height);
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dark = data[(y * width + x) * 4] < 80;
      if (!dark) continue;
      ink[y * width + x] = 1;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX <= minX || maxY <= minY) return new Float32Array(TW * TH);
  return glyphMatrix(ink, width, {
    x: minX,
    y: minY,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
  });
}

function getTemplates() {
  if (templateCache) return templateCache;
  const digits: Tmpl[] = [];
  const letters: Tmpl[] = [];
  DIGITS.forEach((d, i) => {
    digits.push({ label: d, mat: renderChar(FA_DIGITS[i]) });
    digits.push({ label: d, mat: renderChar(d) });
  });
  OIL_PLATE_LETTERS.forEach((letter) => {
    if (letter.length > 3) return;
    letters.push({ label: letter, mat: renderChar(letter) });
  });
  templateCache = { digits, letters };
  return templateCache;
}

function scoreAgainst(mat: Float32Array, tmpl: Float32Array): number {
  let inter = 0;
  let uni = 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < mat.length; i++) {
    const a = mat[i] > 0.5;
    const b = tmpl[i] > 0.5;
    if (a && b) inter++;
    if (a || b) uni++;
    dot += mat[i] * tmpl[i];
    na += mat[i] * mat[i];
    nb += tmpl[i] * tmpl[i];
  }
  const jac = uni ? inter / uni : 0;
  const ncc = na > 1 && nb > 1 ? dot / Math.sqrt(na * nb) : 0;
  return jac * 0.62 + ncc * 0.38;
}

function bestMatch(mat: Float32Array, tmpls: Tmpl[]): Match {
  const bestByLabel = new Map<string, number>();
  for (const tmpl of tmpls) {
    const s = scoreAgainst(mat, tmpl.mat);
    const prev = bestByLabel.get(tmpl.label) ?? -1;
    if (s > prev) bestByLabel.set(tmpl.label, s);
  }
  const ranked = [...bestByLabel.entries()].sort((a, b) => b[1] - a[1]);
  const [label, score] = ranked[0] || ["", 0];
  const second = ranked[1]?.[1] ?? 0;
  return { label, score, margin: score - second };
}

function classifyGlyphs(
  ink: Uint8Array,
  w: number,
  boxes: Glyph[],
): { digit: Match; letter: Match }[] {
  const tmpls = getTemplates();
  return boxes.map((box) => {
    const mat = glyphMatrix(ink, w, box);
    return {
      digit: bestMatch(mat, tmpls.digits),
      letter: bestMatch(mat, tmpls.letters),
    };
  });
}

function assemble(
  main: { digit: Match; letter: Match }[],
  province: { digit: Match; letter: Match }[],
): OilPlateParts | null {
  let glyphs = main;
  let prov = province;
  if (main.length >= 7 && province.length < 2) {
    glyphs = main.slice(0, 6);
    prov = main.slice(6, 8);
  }
  if (glyphs.length < 5) return null;

  const letterIdx = glyphs.length === 5 ? 1 : 2;
  const letterSlot = glyphs[letterIdx];
  if (!letterSlot?.letter.label) return null;

  const serial = glyphs
    .slice(0, letterIdx)
    .map((g) => g.digit.label)
    .join("")
    .slice(0, 2);
  const middle = glyphs
    .slice(letterIdx + 1)
    .map((g) => g.digit.label)
    .join("")
    .slice(0, 3);
  const provinceDigits = prov
    .map((g) => g.digit.label)
    .join("")
    .slice(0, 2);

  const parts: OilPlateParts = {
    serial,
    letter: letterSlot.letter.label,
    middle,
    province: provinceDigits,
  };
  return isPlateComplete(parts) ? parts : null;
}

function segmentRegion(
  canvas: HTMLCanvasElement,
  cropTop = 0,
): { boxes: Glyph[]; ink: Uint8Array; w: number; h: number } {
  let work = canvas;
  if (cropTop > 0) {
    work = cropCanvas(canvas, 0, cropTop, canvas.width, canvas.height - cropTop);
  }
  const ctx = work.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { boxes: [], ink: new Uint8Array(), w: 0, h: 0 };
  const { width: w, height: h } = work;
  const gray = grayscale(ctx.getImageData(0, 0, w, h).data);
  const thresh = otsu(gray);
  let ink = toInk(gray, thresh);
  const band = inkBand(ink, w, h);
  const cropped = cropCanvas(work, 0, band.y0, w, band.y1 - band.y0 + 1);
  const cctx = cropped.getContext("2d", { willReadFrequently: true });
  if (!cctx) return { boxes: [], ink, w, h };
  const cw = cropped.width;
  const ch = cropped.height;
  const cgray = grayscale(cctx.getImageData(0, 0, cw, ch).data);
  ink = dilate(toInk(cgray, otsu(cgray)), cw, ch);
  const boxes = connectedBoxes(ink, cw, ch);
  return { boxes, ink, w: cw, h: ch };
}

export async function recognizeIranianPlate(
  file: File,
  onProgress?: (status: string, progress: number) => void,
): Promise<OilPlateParts | null> {
  onProgress?.("پردازش تصویر روی گوشی…", 0.1);
  const img = await loadImage(file);
  const minH = 240;
  const maxW = 1280;
  let w = img.width;
  let h = img.height;
  if (h < minH) {
    const s = minH / h;
    w *= s;
    h *= s;
  }
  if (w > maxW) {
    const s = maxW / w;
    w *= s;
    h *= s;
  }
  const canvas0 = drawToCanvas(img, w, h);
  const canvas = orientAndCropBlue(canvas0);

  try {
    onProgress?.("جداسازی نویسه‌های پلاک…", 0.4);
    getTemplates();
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    const gray = grayscale(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
    const thresh = otsu(gray);
    const sep = findSeparatorX(gray, canvas.width, canvas.height, thresh);
    const mainCanvas = cropCanvas(canvas, 0, 0, sep - 4, canvas.height);
    const provCanvas = cropCanvas(
      canvas,
      sep + 4,
      0,
      canvas.width - sep - 4,
      canvas.height,
    );

    const mainSeg0 = segmentRegion(mainCanvas);
    const provSeg0 = segmentRegion(provCanvas, Math.round(provCanvas.height * 0.28));
    const usedMain = takeGlyphs(mainSeg0.boxes, mainSeg0.h, 6);
    const usedProv = takeGlyphs(provSeg0.boxes, provSeg0.h, 2);

    onProgress?.("تطبیق با قالب پلاک ایران…", 0.8);
    const fromSplit = assemble(
      classifyGlyphs(mainSeg0.ink, mainSeg0.w, usedMain),
      classifyGlyphs(provSeg0.ink, provSeg0.w, usedProv),
    );
    if (fromSplit) return fromSplit;

    const full = segmentRegion(canvas);
    const fullBoxes = takeGlyphs(full.boxes, full.h, 8);
    if (fullBoxes.length < 5) return null;
    return assemble(classifyGlyphs(full.ink, full.w, fullBoxes), []);
  } catch {
    return null;
  }
}
