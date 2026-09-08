import {
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
  "https://api.webinoplus.ir/storage/appwebino/webino-try.exe";
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

export async function printHtmlToNamedPrinter(
  printerName: string,
  html: string,
  widthMm: number,
): Promise<void> {
  const qz = await connectQzTray();
  const config = qz.configs.create(printerName, {
    scaleContent: true,
    rasterize: true,
    margins: 0,
    size: { width: widthMm, units: "mm" },
    interpolation: "nearest-neighbor",
    colorType: "grayscale",
  });
  await qz.print(config, [
    {
      type: "html",
      format: "plain",
      data: html,
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
  const widthMm = resolvePaperWidthMm(settings);

  await connectQzTray();

  let lastError: unknown;
  for (const station of enabled) {
    const printer = getStationPrinterName(settings, station);
    if (!printer) {
      skipped.push(station);
      continue;
    }
    try {
      const html = buildStationTicketHtml(receipt, settings, station);
      await printHtmlToNamedPrinter(printer, html, widthMm);
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
