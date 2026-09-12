import {
  applyStationLayout,
  getEnabledReceiptPrintStations,
  getStationPrinterName,
  resolvePaperWidthMm,
  type ReceiptPrintStation,
  type SaleReceiptData,
  type SaleReceiptPrintSettings,
} from "@/app/lib/saleReceiptPrint";
import { buildStationTicketHtml } from "@/app/lib/saleReceiptHtml";

import { applyQzDemoSigning } from "@/app/lib/qzDemoSigning";

export const QZ_TRAY_DOWNLOAD_URL =
  "https://api.webinoo-plus.ir/storage/appwebino/webino-try.exe";
const QZ_SCRIPT_SRC = "/vendor/qz-tray.js";

type QzApi = {
  websocket: {
    connect: (opts?: { retries?: number; delay?: number }) => Promise<void>;
    isActive: () => boolean;
  };
  printers: {
    find: () => Promise<string[]>;
  };
  configs: {
    create: (printer: string, opts?: Record<string, unknown>) => unknown;
  };
  print: (config: unknown, data: unknown[]) => Promise<void>;
  security: {
    setCertificatePromise: (
      handler: (resolve: (cert: string) => void, reject: (err?: unknown) => void) => void,
    ) => void;
    setSignaturePromise: (
      factory: (
        toSign: string,
      ) => (resolve: (signature: string) => void, reject: (err?: unknown) => void) => void,
    ) => void;
    setSignatureAlgorithm: (algorithm: string) => void;
  };
};

declare global {
  interface Window {
    qz?: QzApi;
  }
}

let scriptPromise: Promise<QzApi> | null = null;

function loadQzScript(): Promise<QzApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("QZ_UNAVAILABLE"));
  }
  if (window.qz) return Promise.resolve(window.qz);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${QZ_SCRIPT_SRC}"]`);
    if (existing && window.qz) {
      resolve(window.qz);
      return;
    }
    const script = document.createElement("script");
    script.src = QZ_SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      if (window.qz) resolve(window.qz);
      else reject(new Error("QZ_LOAD_FAILED"));
    };
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("QZ_LOAD_FAILED"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function qzErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error || "");
  const text = raw.toLowerCase();
  if (text.includes("qz_unavailable") || text.includes("websocket") || text.includes("unable to establish")) {
    return "برنامه QZ Tray روی این سیستم اجرا نیست. نصب کنید، باز بگذارید، و یک‌بار اجازه اتصال سایت را بدهید.";
  }
  if (text.includes("qz_load")) {
    return "بارگذاری پل چاپ ناموفق بود. صفحه را رفرش کنید.";
  }
  if (text.includes("qz_credentials_missing")) {
    return "گواهی و کلید خصوصی QZ را در تنظیمات پرینتر وارد کنید.";
  }
  return raw || "چاپ بی‌صدا ناموفق بود.";
}

export async function connectQzTray(): Promise<QzApi> {
  const qz = await loadQzScript();
  applyQzDemoSigning(qz);
  if (!qz.websocket.isActive()) {
    await qz.websocket.connect({ retries: 3, delay: 1 });
  }
  return qz;
}

export async function listSystemPrinters(): Promise<string[]> {
  const qz = await connectQzTray();
  const found = await qz.printers.find();
  return Array.isArray(found) ? found.filter(Boolean) : [];
}

/** CSS reference DPI used for HTML layout before upscaling to the printer. */
const LAYOUT_DPI = 96;
/** Typical ESC/POS thermal density. */
const PRINT_DPI = 203;

function mmToPx(mm: number, dpi: number): number {
  return Math.max(1, Math.round((mm / 25.4) * dpi));
}

function pxToMm(px: number, dpi: number): number {
  return (px / dpi) * 25.4;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("QZ_RENDER_FAILED"));
    image.src = src;
  });
}

type TicketMetrics = {
  widthPx: number;
  heightPx: number;
  widthMm: number;
  heightMm: number;
};

type RasterizedTicket = TicketMetrics & {
  png: string;
};

function rewriteMmUnitsToPx(cssText: string): string {
  return cssText.replace(/(-?[\d.]+)\s*mm\b/gi, (_, raw: string) => {
    const mm = Number(raw);
    if (!Number.isFinite(mm)) return `${raw}mm`;
    return `${Math.round(mmToPx(mm, LAYOUT_DPI) * 100) / 100}px`;
  });
}

/**
 * Force pixel layout before measuring / SVG capture.
 * Absolute `mm` inside SVG foreignObject often resolves wrong and shrinks RTL
 * content into a tiny strip on the right of the ticket.
 */
function forcePixelTicketLayout(doc: Document, layoutWidthPx: number): void {
  doc.querySelectorAll("style").forEach((styleEl) => {
    styleEl.textContent = rewriteMmUnitsToPx(styleEl.textContent || "");
  });

  const htmlEl = doc.documentElement;
  const body = doc.body;
  htmlEl.setAttribute("dir", "rtl");

  const computed = doc.defaultView?.getComputedStyle(body);
  if (computed) {
    body.style.paddingTop = computed.paddingTop;
    body.style.paddingRight = computed.paddingRight;
    body.style.paddingBottom = computed.paddingBottom;
    body.style.paddingLeft = computed.paddingLeft;
  }

  htmlEl.style.cssText = [
    `width:${layoutWidthPx}px`,
    `max-width:${layoutWidthPx}px`,
    `min-width:${layoutWidthPx}px`,
    "margin:0",
    "background:#ffffff",
  ].join(";");

  body.style.width = `${layoutWidthPx}px`;
  body.style.maxWidth = `${layoutWidthPx}px`;
  body.style.minWidth = `${layoutWidthPx}px`;
  body.style.margin = "0";
  body.style.background = "#ffffff";
  body.style.boxSizing = "border-box";
  body.style.overflow = "visible";

  const style = doc.createElement("style");
  style.textContent = `
    html, body {
      width: ${layoutWidthPx}px !important;
      max-width: ${layoutWidthPx}px !important;
      min-width: ${layoutWidthPx}px !important;
      margin: 0 !important;
      background: #ffffff !important;
    }
    body { box-sizing: border-box !important; overflow: visible !important; }
    table.row { width: 100% !important; table-layout: fixed !important; }
    h1, .sub, .muted, .item, .note, hr { width: 100% !important; }
  `;
  doc.head.appendChild(style);
}

function measureTicketHeightPx(doc: Document): number {
  const body = doc.body;
  const root = doc.documentElement;
  return Math.max(
    body.scrollHeight,
    body.offsetHeight,
    root.scrollHeight,
    root.offsetHeight,
    48,
  );
}

async function withTicketIframe<T>(
  html: string,
  widthMm: number,
  run: (doc: Document, layoutWidthPx: number) => Promise<T>,
): Promise<T> {
  if (typeof document === "undefined") {
    throw new Error("QZ_UNAVAILABLE");
  }

  const layoutWidthPx = mmToPx(widthMm, LAYOUT_DPI);
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = [
    "position:fixed",
    "left:-12000px",
    "top:0",
    `width:${layoutWidthPx}px`,
    "height:8px",
    "border:0",
    "opacity:0",
    "pointer-events:none",
    "background:#fff",
  ].join(";");
  document.body.appendChild(iframe);

  try {
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error("QZ_RENDER_FAILED")), 4000);
      iframe.onload = () => {
        window.clearTimeout(timer);
        resolve();
      };
      iframe.onerror = () => {
        window.clearTimeout(timer);
        reject(new Error("QZ_RENDER_FAILED"));
      };
      iframe.srcdoc = html;
    });

    const doc = iframe.contentDocument;
    if (!doc?.body) throw new Error("QZ_RENDER_FAILED");

    forcePixelTicketLayout(doc, layoutWidthPx);

    if (doc.fonts?.ready) {
      await doc.fonts.ready.catch(() => undefined);
    }
    await new Promise((resolve) => window.setTimeout(resolve, 40));

    let heightPx = measureTicketHeightPx(doc);
    iframe.style.height = `${heightPx}px`;
    heightPx = measureTicketHeightPx(doc);
    iframe.style.height = `${heightPx}px`;

    return await run(doc, layoutWidthPx);
  } finally {
    iframe.remove();
  }
}

async function measureTicketMetrics(html: string, widthMm: number): Promise<TicketMetrics> {
  return withTicketIframe(html, widthMm, async (doc, layoutWidthPx) => {
    const heightPx = measureTicketHeightPx(doc);
    // Extra feed so the cutter does not clip the last line.
    const heightMm = Math.max(pxToMm(heightPx, LAYOUT_DPI) + 3, 25);
    return {
      widthPx: layoutWidthPx,
      heightPx,
      widthMm,
      heightMm,
    };
  });
}

/**
 * Build a clean XHTML fragment for SVG foreignObject.
 * Serializing a full HTML5 document often yields invalid XML and a blank/tiny render.
 */
function buildForeignObjectMarkup(doc: Document, layoutWidthPx: number, heightPx: number): string {
  const styles = Array.from(doc.querySelectorAll("style"))
    .map((el) => rewriteMmUnitsToPx(el.textContent || ""))
    .join("\n");

  const bodyHtml = doc.body.innerHTML
    .replace(/<br\s*>/gi, "<br/>")
    .replace(/<hr\s*>/gi, "<hr/>")
    .replace(/<(img|meta)(\s[^>]*?)?\s*>/gi, "<$1$2/>");

  const pad = doc.body.style.padding || "0";
  const fontFamily = doc.defaultView?.getComputedStyle(doc.body).fontFamily || "Tahoma, Arial, sans-serif";
  const fontSize = doc.defaultView?.getComputedStyle(doc.body).fontSize || "14px";
  const lineHeight = doc.defaultView?.getComputedStyle(doc.body).lineHeight || "1.35";

  return (
    `<div xmlns="http://www.w3.org/1999/xhtml" dir="rtl" lang="fa" ` +
    `style="width:${layoutWidthPx}px;min-width:${layoutWidthPx}px;max-width:${layoutWidthPx}px;` +
    `height:${heightPx}px;margin:0;padding:${pad};box-sizing:border-box;` +
    `background:#ffffff;color:#000000;font-family:${fontFamily};font-size:${fontSize};` +
    `line-height:${lineHeight};overflow:visible;">` +
    `<style>${styles}</style>${bodyHtml}</div>`
  );
}

async function rasterizeHtmlToPngBase64(html: string, widthMm: number): Promise<RasterizedTicket> {
  return withTicketIframe(html, widthMm, async (doc, layoutWidthPx) => {
    const heightPx = measureTicketHeightPx(doc);
    const xhtml = buildForeignObjectMarkup(doc, layoutWidthPx, heightPx);
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${layoutWidthPx}" height="${heightPx}">` +
      `<foreignObject x="0" y="0" width="${layoutWidthPx}" height="${heightPx}">${xhtml}</foreignObject></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));

    try {
      const image = await loadImage(url);
      const printScale = PRINT_DPI / LAYOUT_DPI;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(layoutWidthPx * printScale);
      canvas.height = Math.round(heightPx * printScale);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("QZ_RENDER_FAILED");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const sample = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let ink = 0;
      for (let i = 0; i < sample.length; i += 64) {
        if (sample[i] < 248 || sample[i + 1] < 248 || sample[i + 2] < 248) ink += 1;
      }
      if (ink < 4) throw new Error("QZ_RENDER_EMPTY");

      const heightMm = Math.max(pxToMm(canvas.height, PRINT_DPI) + 3, 25);
      return {
        png: canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, ""),
        widthMm,
        heightMm,
        widthPx: canvas.width,
        heightPx: canvas.height,
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  });
}

function buildQzPixelConfig(
  qz: QzApi,
  printerName: string,
  widthMm: number,
  heightMm: number,
) {
  // Inches + DPI so density is never misread as dots-per-mm.
  // scaleContent must stay false: a short driver page (≈5–6cm) would otherwise
  // shrink the whole ticket into a tiny strip on one side of the paper.
  return qz.configs.create(printerName, {
    colorType: "blackwhite",
    interpolation: "nearest-neighbor",
    rasterize: false,
    scaleContent: false,
    margins: 0,
    units: "in",
    size: {
      width: widthMm / 25.4,
      height: Math.max(heightMm, 25) / 25.4,
    },
    density: PRINT_DPI,
  });
}

export async function printHtmlToNamedPrinter(
  printerName: string,
  html: string,
  widthMm: number,
): Promise<void> {
  const qz = await connectQzTray();
  const metrics = await measureTicketMetrics(html, widthMm);
  const config = buildQzPixelConfig(qz, printerName, metrics.widthMm, metrics.heightMm);

  // Prefer QZ HTML: Java WebView lays out full-width RTL tickets correctly.
  try {
    await qz.print(config, [
      {
        type: "pixel",
        format: "html",
        flavor: "plain",
        data: html,
        options: {
          pageWidth: metrics.widthPx,
          pageHeight: metrics.heightPx,
        },
      },
    ]);
    return;
  } catch {
    // Fall through to browser rasterization.
  }

  const raster = await rasterizeHtmlToPngBase64(html, widthMm);
  const imageConfig = buildQzPixelConfig(qz, printerName, raster.widthMm, raster.heightMm);
  await qz.print(imageConfig, [
    {
      type: "pixel",
      format: "image",
      flavor: "base64",
      data: raster.png,
    },
  ]);
}

export function stationsWithAssignedPrinters(
  settings: SaleReceiptPrintSettings,
): ReceiptPrintStation[] {
  return getEnabledReceiptPrintStations(settings).filter((station) =>
    Boolean(getStationPrinterName(settings, station)),
  );
}

export function canSilentPrint(settings: SaleReceiptPrintSettings): boolean {
  return settings.silentPrint !== false && stationsWithAssignedPrinters(settings).length > 0;
}

export async function silentPrintReceiptStations(
  receipt: SaleReceiptData,
  settings: SaleReceiptPrintSettings,
): Promise<{ printed: ReceiptPrintStation[]; skipped: ReceiptPrintStation[] }> {
  const enabled = getEnabledReceiptPrintStations(settings);
  const printed: ReceiptPrintStation[] = [];
  const skipped: ReceiptPrintStation[] = [];

  await connectQzTray();

  let lastError: unknown;
  for (const station of enabled) {
    const printer = getStationPrinterName(settings, station);
    if (!printer) {
      skipped.push(station);
      continue;
    }
    try {
      const ticketSettings = applyStationLayout(settings, station);
      const html = buildStationTicketHtml(receipt, ticketSettings, station);
      await printHtmlToNamedPrinter(printer, html, resolvePaperWidthMm(ticketSettings));
      printed.push(station);
    } catch (error) {
      skipped.push(station);
      lastError = error;
    }
  }

  if (printed.length === 0) {
    throw lastError || new Error("برای ایستگاه‌های فعال پرینتری انتخاب نشده است.");
  }
  return { printed, skipped };
}
