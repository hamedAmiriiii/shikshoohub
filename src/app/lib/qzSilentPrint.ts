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

function mmToPx(mm: number, dpi: number): number {
  return Math.max(1, Math.round((mm / 25.4) * dpi));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("QZ_RENDER_FAILED"));
    image.src = src;
  });
}

async function rasterizeHtmlToPngBase64(html: string, widthMm: number): Promise<string> {
  if (typeof document === "undefined") {
    throw new Error("QZ_UNAVAILABLE");
  }

  const layoutWidthPx = mmToPx(widthMm, 96);
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = [
    "position:fixed",
    "left:-12000px",
    "top:0",
    `width:${layoutWidthPx}px`,
    "height:40px",
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
    if (doc.fonts?.ready) {
      await doc.fonts.ready.catch(() => undefined);
    }
    await new Promise((resolve) => window.setTimeout(resolve, 40));

    const heightPx = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, 48);
    iframe.style.height = `${heightPx}px`;

    const xhtml = new XMLSerializer().serializeToString(doc.documentElement);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${layoutWidthPx}" height="${heightPx}">` +
      `<foreignObject width="100%" height="100%">${xhtml}</foreignObject></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));

    try {
      const image = await loadImage(url);
      const printScale = 203 / 96;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(layoutWidthPx * printScale);
      canvas.height = Math.round(heightPx * printScale);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("QZ_RENDER_FAILED");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const sample = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let ink = 0;
      for (let i = 0; i < sample.length; i += 64) {
        if (sample[i] < 248 || sample[i + 1] < 248 || sample[i + 2] < 248) ink += 1;
      }
      if (ink < 4) throw new Error("QZ_RENDER_EMPTY");
      return canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
    } finally {
      URL.revokeObjectURL(url);
    }
  } finally {
    iframe.remove();
  }
}

export async function printHtmlToNamedPrinter(
  printerName: string,
  html: string,
  widthMm: number,
): Promise<void> {
  const qz = await connectQzTray();
  const config = qz.configs.create(printerName, {
    colorType: "blackwhite",
    interpolation: "nearest-neighbor",
    rasterize: false,
    scaleContent: true,
    margins: 0,
    units: "mm",
    size: { width: widthMm },
    density: 203,
  });

  try {
    const png = await rasterizeHtmlToPngBase64(html, widthMm);
    await qz.print(config, [
      {
        type: "pixel",
        format: "image",
        flavor: "base64",
        data: png,
      },
    ]);
    return;
  } catch {
    // Fall back to QZ HTML if the browser cannot rasterize the ticket.
  }

  await qz.print(config, [
    {
      type: "pixel",
      format: "html",
      flavor: "plain",
      data: html,
      options: {
        pageWidth: mmToPx(widthMm, 96),
      },
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
