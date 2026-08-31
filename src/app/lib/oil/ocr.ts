import { extractPlateFromOcr } from "./plate";
import type { OilPlateParts } from "./types";

function loadImage(file: File): Promise<HTMLImageElement> {
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

function preprocessPlateImage(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const maxW = 1400;
  const scale = img.width > maxW ? maxW / img.width : 1;
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  const contrast = 1.7;
  const intercept = 128 * (1 - contrast);
  for (let i = 0; i < d.length; i += 4) {
    let g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    g = g * contrast + intercept;
    g = Math.max(0, Math.min(255, g));
    d[i] = d[i + 1] = d[i + 2] = g;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export async function recognizeIranianPlate(
  file: File,
  onProgress?: (status: string, progress: number) => void,
): Promise<OilPlateParts | null> {
  const img = await loadImage(file);
  const canvas = preprocessPlateImage(img);

  const { createWorker, PSM } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text" && typeof m.progress === "number") {
        onProgress?.("در حال خواندن پلاک…", m.progress);
      } else if (m.status) {
        onProgress?.(
          m.status === "loading tesseract core"
            ? "بارگذاری موتور تشخیص…"
            : "آماده‌سازی…",
          0,
        );
      }
    },
  });

  try {
    await worker.setParameters({
      tessedit_char_whitelist:
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    });

    const { data } = await worker.recognize(canvas);
    const fromBlock = extractPlateFromOcr(data.text || "");
    if (fromBlock) return fromBlock;

    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_LINE,
    });
    const second = await worker.recognize(canvas);
    return extractPlateFromOcr(second.data.text || "");
  } finally {
    await worker.terminate();
  }
}
