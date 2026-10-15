import { connectQzTray, qzErrorMessage } from "@/app/lib/qzSilentPrint";

export const CARD_READER_SETTINGS_KEY = "card_reader_settings";
export const CARD_READER_SETTINGS_CHANGED_EVENT = "card-reader-settings-changed";

export type CardReaderProvider = "behpardakht" | "saman" | "sadad" | "generic";
export type CardReaderTransport = "lan" | "usb";

export type CardReaderSettings = {
  enabled: boolean;
  provider: CardReaderProvider;
  transport: CardReaderTransport;
  host: string;
  port: number;
  baudRate: number;
  /** مبلغ فروشگاه تومان است؛ کارتخوان معمولاً ریال می‌خواهد */
  sendAsRial: boolean;
  usbVendorId?: number;
  usbProductId?: number;
  deviceLabel?: string;
};

export const CARD_READER_PROVIDERS: { id: CardReaderProvider; label: string; defaultPort: number }[] = [
  { id: "behpardakht", label: "به‌پرداخت ملت", defaultPort: 1024 },
  { id: "saman", label: "سامان کیش", defaultPort: 1197 },
  { id: "sadad", label: "سداد", defaultPort: 1024 },
  { id: "generic", label: "عمومی (متن/JSON)", defaultPort: 1024 },
];

export const CARD_READER_BAUD_OPTIONS = [9600, 19200, 38400, 115200] as const;

const DEFAULTS: CardReaderSettings = {
  enabled: false,
  provider: "behpardakht",
  transport: "lan",
  host: "",
  port: 1024,
  baudRate: 9600,
  sendAsRial: true,
};

type QzSocket = {
  open: (host: string, port: number, options?: { encoding?: string }) => Promise<void>;
  close: (host: string, port: number) => Promise<void>;
  sendData: (host: string, port: number, data: { type?: string; data: string }) => Promise<void>;
  setSocketCallbacks: (calls: ((event: { host?: string; port?: number; response?: string; exception?: string; type?: string }) => void) | []) => void;
};

type WebSerialPort = {
  open: (options: { baudRate: number; dataBits?: number; stopBits?: number; parity?: string; flowControl?: string }) => Promise<void>;
  close: () => Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
  getInfo: () => { usbVendorId?: number; usbProductId?: number };
};

function getWebSerial(): { requestPort: () => Promise<WebSerialPort>; getPorts: () => Promise<WebSerialPort[]> } | null {
  if (typeof navigator === "undefined") return null;
  return (navigator as Navigator & { serial?: { requestPort: () => Promise<WebSerialPort>; getPorts: () => Promise<WebSerialPort[]> } }).serial ?? null;
}

export function isCardReaderUsbSupported(): boolean {
  return Boolean(getWebSerial());
}

export function readCardReaderSettings(): CardReaderSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(CARD_READER_SETTINGS_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<CardReaderSettings>;
    const provider = CARD_READER_PROVIDERS.some((p) => p.id === parsed.provider)
      ? (parsed.provider as CardReaderProvider)
      : "behpardakht";
    const port = Number(parsed.port);
    const baud = Number(parsed.baudRate);
    return {
      ...DEFAULTS,
      enabled: Boolean(parsed.enabled),
      provider,
      transport: parsed.transport === "usb" ? "usb" : "lan",
      host: typeof parsed.host === "string" ? parsed.host.trim().slice(0, 80) : "",
      port: Number.isFinite(port) && port > 0 && port < 65536 ? port : DEFAULTS.port,
      baudRate: CARD_READER_BAUD_OPTIONS.includes(baud as (typeof CARD_READER_BAUD_OPTIONS)[number]) ? baud : 9600,
      sendAsRial: parsed.sendAsRial !== false,
      usbVendorId: parsed.usbVendorId != null ? Number(parsed.usbVendorId) : undefined,
      usbProductId: parsed.usbProductId != null ? Number(parsed.usbProductId) : undefined,
      deviceLabel: typeof parsed.deviceLabel === "string" ? parsed.deviceLabel.slice(0, 80) : undefined,
    };
  } catch {
    return DEFAULTS;
  }
}

export function writeCardReaderSettings(partial: Partial<CardReaderSettings>): CardReaderSettings {
  const merged: CardReaderSettings = { ...readCardReaderSettings(), ...partial };
  merged.host = merged.host.trim().slice(0, 80);
  merged.enabled = Boolean(merged.enabled);
  merged.sendAsRial = merged.sendAsRial !== false;
  merged.transport = merged.transport === "usb" ? "usb" : "lan";
  if (typeof window !== "undefined") {
    localStorage.setItem(CARD_READER_SETTINGS_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent(CARD_READER_SETTINGS_CHANGED_EVENT));
  }
  return merged;
}

export function cardReaderReady(settings = readCardReaderSettings()): boolean {
  if (!settings.enabled) return false;
  if (settings.transport === "lan") return Boolean(settings.host) && settings.port > 0;
  return Boolean(settings.deviceLabel || settings.usbVendorId);
}

export function tomanToDeviceAmount(toman: number, sendAsRial: boolean): number {
  const n = Math.round(Math.max(0, toman));
  return sendAsRial ? n * 10 : n;
}

function padAmount(amount: number): string {
  return String(Math.round(amount)).replace(/\D/g, "").padStart(12, "0").slice(-12);
}

/** فریم درخواست خرید برای هر شرکت */
export function buildCardReaderPayload(provider: CardReaderProvider, deviceAmount: number): string {
  const amount = padAmount(deviceAmount);
  if (provider === "behpardakht") {
    return `\x02${amount}\x03`;
  }
  if (provider === "saman") {
    return `${JSON.stringify({ TransactionType: "Purchase", Amount: String(Number(amount)) })}\n`;
  }
  if (provider === "sadad") {
    return `${JSON.stringify({ ServiceCode: "1", Amount: String(Number(amount)) })}\n`;
  }
  return `SALE ${Number(amount)}\r\n`;
}

export function parseCardReaderApproval(raw: string): { approved: boolean; decided: boolean; message: string } {
  const text = String(raw || "");
  if (!text.trim()) {
    return { approved: false, decided: false, message: "هنوز پاسخی از کارتخوان نیامده" };
  }

  const lower = text.toLowerCase();
  if (/cancel|لغو|انصراف|user\s*abort|زمان/.test(lower)) {
    return { approved: false, decided: true, message: "پرداخت روی کارتخوان لغو شد" };
  }
  if (/decline|rejected|ناموفق|خطا|failed|error|not approved/.test(lower) && !/"?(00|0)"?/.test(text)) {
    return { approved: false, decided: true, message: "کارتخوان پرداخت را رد کرد" };
  }

  const jsonCode = text.match(/"(?:responseCode|resCode|ResponseCode|statusCode|code)"\s*:\s*"?(\d+)"?/i);
  if (jsonCode) {
    const code = jsonCode[1];
    if (code === "0" || code === "00") {
      return { approved: true, decided: true, message: "کارتخوان پرداخت را تأیید کرد" };
    }
    return { approved: false, decided: true, message: `کارتخوان رد کرد (کد ${code})` };
  }

  if (/پرداخت موفق|تراکنش موفق|\bapproved\b|\bsuccess\b/i.test(text)) {
    return { approved: true, decided: true, message: "کارتخوان پرداخت را تأیید کرد" };
  }
  if (/"status"\s*:\s*"?(ok|success|approved)"/i.test(text)) {
    return { approved: true, decided: true, message: "کارتخوان پرداخت را تأیید کرد" };
  }
  if (/(?:resp|response|code)\s*[:=]\s*(0{1,2})\b/i.test(text)) {
    return { approved: true, decided: true, message: "کارتخوان پرداخت را تأیید کرد" };
  }
  const compact = text.replace(/[\s\x02\x03]/g, "");
  if (compact === "00" || compact === "0") {
    return { approved: true, decided: true, message: "کارتخوان پرداخت را تأیید کرد" };
  }

  return { approved: false, decided: false, message: "پاسخ کارتخوان هنوز کامل نیست" };
}

export function cardReaderErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error || "");
  const text = raw.toLowerCase();
  if (text.includes("cancel")) return "ارسال به کارتخوان لغو شد";
  if (text.includes("web_serial") || text.includes("notsupported")) {
    return "مرورگر USB کارتخوان را پشتیبانی نمی‌کند. Chrome یا Edge لازم است.";
  }
  if (text.includes("no_reader")) return "اول کارتخوان USB را انتخاب کنید";
  if (text.includes("qz") || text.includes("websocket")) return qzErrorMessage(error);
  if (text.includes("timeout") || text.includes("زمان")) return "کارتخوان در زمان مقرر پاسخ نداد";
  return raw || "ارتباط با کارتخوان برقرار نشد";
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const t = window.setTimeout(resolve, ms);
    const onAbort = () => {
      window.clearTimeout(t);
      reject(new Error("CANCELLED"));
    };
    if (signal?.aborted) onAbort();
    else signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function getQzSocket(): Promise<QzSocket> {
  const qz = await connectQzTray();
  const socket = (qz as unknown as { socket?: QzSocket }).socket;
  if (!socket) throw new Error("QZ_SOCKET_UNAVAILABLE");
  return socket;
}

async function exchangeLan(options: {
  host: string;
  port: number;
  payload?: string;
  timeoutMs: number;
  signal?: AbortSignal;
  onChunk?: (raw: string) => void;
}): Promise<string> {
  const socket = await getQzSocket();
  let buffer = "";
  socket.setSocketCallbacks((event) => {
    if (event?.exception) return;
    const piece = typeof event?.response === "string" ? event.response : "";
    if (!piece) return;
    buffer += piece;
    options.onChunk?.(buffer);
  });
  try {
    await socket.open(options.host, options.port, { encoding: "UTF-8" });
    if (options.payload) {
      await socket.sendData(options.host, options.port, { type: "PLAIN", data: options.payload });
    }
    const deadline = Date.now() + options.timeoutMs;
    while (Date.now() < deadline) {
      if (options.signal?.aborted) throw new Error("CANCELLED");
      const parsed = parseCardReaderApproval(buffer);
      if (parsed.decided) break;
      if (!options.payload && buffer.length > 0) break;
      await sleep(250, options.signal);
    }
    return buffer;
  } finally {
    try {
      await socket.close(options.host, options.port);
    } catch {
      /* ignore */
    }
    try {
      socket.setSocketCallbacks([]);
    } catch {
      /* ignore */
    }
  }
}

async function pickUsbPort(settings: CardReaderSettings, allowRequest: boolean): Promise<WebSerialPort> {
  const serial = getWebSerial();
  if (!serial) throw new Error("WEB_SERIAL_UNSUPPORTED");
  const ports = await serial.getPorts();
  const match = ports.find((p) => {
    const info = p.getInfo?.() || {};
    if (settings.usbVendorId != null && settings.usbProductId != null) {
      return info.usbVendorId === settings.usbVendorId && info.usbProductId === settings.usbProductId;
    }
    return true;
  });
  if (match) return match;
  if (!allowRequest) throw new Error("NO_READER");
  const port = await serial.requestPort();
  const info = port.getInfo?.() || {};
  const vid = info.usbVendorId != null ? info.usbVendorId.toString(16).padStart(4, "0") : "?";
  const pid = info.usbProductId != null ? info.usbProductId.toString(16).padStart(4, "0") : "?";
  writeCardReaderSettings({
    transport: "usb",
    usbVendorId: info.usbVendorId,
    usbProductId: info.usbProductId,
    deviceLabel: `USB ${vid}:${pid}`,
  });
  return port;
}

async function exchangeUsb(options: {
  settings: CardReaderSettings;
  payload?: string;
  timeoutMs: number;
  allowRequest: boolean;
  signal?: AbortSignal;
  onChunk?: (raw: string) => void;
}): Promise<string> {
  const port = await pickUsbPort(options.settings, options.allowRequest);
  const decoder = new TextDecoder();
  let buffer = "";
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let stop = false;
  try {
    await port.open({
      baudRate: options.settings.baudRate,
      dataBits: 8,
      stopBits: 1,
      parity: "none",
      flowControl: "none",
    });
    if (options.payload && port.writable) {
      const writer = port.writable.getWriter();
      try {
        await writer.write(new TextEncoder().encode(options.payload));
      } finally {
        writer.releaseLock();
      }
    }
    if (!port.readable) return buffer;
    reader = port.readable.getReader();
    const pump = (async () => {
      while (!stop) {
        const { value, done } = await reader!.read();
        if (done) break;
        if (!value?.length) continue;
        buffer += decoder.decode(value, { stream: true });
        options.onChunk?.(buffer);
      }
    })().catch(() => undefined);

    const deadline = Date.now() + options.timeoutMs;
    while (Date.now() < deadline) {
      if (options.signal?.aborted) break;
      if (parseCardReaderApproval(buffer).decided) break;
      if (!options.payload && buffer.length > 0) break;
      await sleep(250, options.signal).catch(() => undefined);
      if (options.signal?.aborted) break;
    }
    stop = true;
    try {
      await reader.cancel();
    } catch {
      /* ignore */
    }
    await pump;
    return buffer;
  } finally {
    try {
      reader?.releaseLock();
    } catch {
      /* ignore */
    }
    try {
      await port.close();
    } catch {
      /* ignore */
    }
  }
}

export async function requestCardReaderUsb(): Promise<CardReaderSettings> {
  const serial = getWebSerial();
  if (!serial) throw new Error("WEB_SERIAL_UNSUPPORTED");
  const port = await serial.requestPort();
  const info = port.getInfo?.() || {};
  const vid = info.usbVendorId != null ? info.usbVendorId.toString(16).padStart(4, "0") : "?";
  const pid = info.usbProductId != null ? info.usbProductId.toString(16).padStart(4, "0") : "?";
  return writeCardReaderSettings({
    transport: "usb",
    usbVendorId: info.usbVendorId,
    usbProductId: info.usbProductId,
    deviceLabel: `USB ${vid}:${pid}`,
  });
}

export type CardReaderResult = {
  approved: boolean;
  message: string;
  raw: string;
};

/** فقط باز کردن مسیر — بدون ارسال مبلغ */
export async function testCardReaderLink(): Promise<CardReaderResult> {
  const settings = readCardReaderSettings();
  if (settings.transport === "lan") {
    if (!settings.host) return { approved: false, message: "آی‌پی کارتخوان را وارد کنید", raw: "" };
    const raw = await exchangeLan({ host: settings.host, port: settings.port, timeoutMs: 2500 });
    return {
      approved: true,
      raw,
      message: raw
        ? "اتصال برقرار شد و داده هم آمد"
        : `به ${settings.host}:${settings.port} وصل شد`,
    };
  }
  const raw = await exchangeUsb({
    settings,
    timeoutMs: 1500,
    allowRequest: true,
  });
  return {
    approved: true,
    raw,
    message: raw ? "پورت USB باز شد و داده آمد" : "پورت USB کارتخوان باز شد",
  };
}

/** ارسال مبلغ و انتظار برای تأیید یا رد */
export async function chargeCardReader(
  amountToman: number,
  options?: { signal?: AbortSignal; timeoutMs?: number; onChunk?: (raw: string) => void; allowRequestPort?: boolean },
): Promise<CardReaderResult> {
  const settings = readCardReaderSettings();
  if (!settings.enabled) {
    return { approved: true, message: "", raw: "" };
  }
  const toman = Math.round(amountToman);
  if (toman <= 0) return { approved: true, message: "", raw: "" };

  const deviceAmount = tomanToDeviceAmount(toman, settings.sendAsRial);
  const payload = buildCardReaderPayload(settings.provider, deviceAmount);
  const timeoutMs = options?.timeoutMs ?? 120000;

  if (settings.transport === "lan" && !settings.host.trim()) {
    return { approved: false, raw: "", message: "IP کارتخوان در تنظیمات خالی است. فروش ثبت نشد." };
  }

  const raw =
    settings.transport === "lan"
      ? await exchangeLan({
          host: settings.host,
          port: settings.port,
          payload,
          timeoutMs,
          signal: options?.signal,
          onChunk: options?.onChunk,
        })
      : await exchangeUsb({
          settings,
          payload,
          timeoutMs,
          allowRequest: options?.allowRequestPort !== false,
          signal: options?.signal,
          onChunk: options?.onChunk,
        });

  if (options?.signal?.aborted) throw new Error("CANCELLED");

  const parsed = parseCardReaderApproval(raw);
  if (!raw) {
    return { approved: false, raw, message: "از کارتخوان پاسخی نیامد. فروش ثبت نشد." };
  }
  if (!parsed.decided) {
    return {
      approved: false,
      raw,
      message: "پاسخ کارتخوان قابل تشخیص نبود. فروش ثبت نشد.",
    };
  }
  return { approved: parsed.approved, raw, message: parsed.message };
}
