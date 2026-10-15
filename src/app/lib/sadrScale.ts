import { connectQzTray, qzErrorMessage } from "@/app/lib/qzSilentPrint";

export const SADR_SCALE_SETTINGS_KEY = "sadr_vista_b_scale_settings";
export const SADR_SCALE_SETTINGS_CHANGED_EVENT = "sadr-scale-settings-changed";

export type SadrScaleTransport = "web_serial" | "qz";

export type SadrScaleSettings = {
  enabled: boolean;
  /** پورت COM برای مسیر QZ — مثل COM3 */
  port: string;
  baudRate: number;
  /** مسیر ترجیحی؛ پیش‌فرض USB مستقیم مرورگر */
  transport: SadrScaleTransport;
  usbVendorId?: number;
  usbProductId?: number;
  /** برچسب آخرین دستگاه انتخاب‌شده */
  deviceLabel?: string;
  model: "sadr_vista_b";
};

export const DEFAULT_SADR_SCALE_SETTINGS: SadrScaleSettings = {
  enabled: false,
  port: "",
  baudRate: 9600,
  transport: "web_serial",
  model: "sadr_vista_b",
};

export const SADR_SCALE_BAUD_OPTIONS = [2400, 4800, 9600, 19200, 38400] as const;

type QzSerialApi = {
  serial: {
    findPorts: () => Promise<string[]>;
    setSerialCallbacks: (calls: ((event: QzSerialEvent) => void) | Array<(event: QzSerialEvent) => void>) => void;
    openPort: (port: string, options?: Record<string, unknown>) => Promise<void>;
    sendData: (port: string, data: string | { type?: string; data: string | string[] }, options?: Record<string, unknown>) => Promise<void>;
    closePort: (port: string) => Promise<void>;
  };
};

type QzSerialEvent = {
  type?: string;
  portName?: string;
  output?: string;
  exception?: string;
};

/** حداقل تایپ برای Web Serial بدون وابستگی به lib DOM کامل */
type WebSerialPortInfo = { usbVendorId?: number; usbProductId?: number };
type WebSerialPort = {
  open: (options: {
    baudRate: number;
    dataBits?: number;
    stopBits?: number;
    parity?: string;
    flowControl?: string;
  }) => Promise<void>;
  close: () => Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
  getInfo: () => WebSerialPortInfo;
};

type WebSerial = {
  requestPort: (options?: { filters?: WebSerialPortInfo[] }) => Promise<WebSerialPort>;
  getPorts: () => Promise<WebSerialPort[]>;
};

function getWebSerial(): WebSerial | null {
  if (typeof navigator === "undefined") return null;
  const serial = (navigator as Navigator & { serial?: WebSerial }).serial;
  return serial ?? null;
}

export function isWebSerialSupported(): boolean {
  return Boolean(getWebSerial());
}

function getQzSerial(): QzSerialApi["serial"] {
  const qz = window.qz as unknown as QzSerialApi | undefined;
  if (!qz?.serial) {
    throw new Error("QZ_SERIAL_UNAVAILABLE");
  }
  return qz.serial;
}

function deviceLabelFromPort(port: WebSerialPort): string {
  const info = port.getInfo?.() || {};
  const vid = info.usbVendorId != null ? info.usbVendorId.toString(16).padStart(4, "0") : "?";
  const pid = info.usbProductId != null ? info.usbProductId.toString(16).padStart(4, "0") : "?";
  return `USB ${vid}:${pid}`;
}

export function readSadrScaleSettings(): SadrScaleSettings {
  if (typeof window === "undefined") return DEFAULT_SADR_SCALE_SETTINGS;
  try {
    const raw = localStorage.getItem(SADR_SCALE_SETTINGS_KEY);
    if (!raw) return DEFAULT_SADR_SCALE_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<SadrScaleSettings>;
    const baud = Number(parsed.baudRate);
    const transport: SadrScaleTransport =
      parsed.transport === "qz" ? "qz" : "web_serial";
    return {
      ...DEFAULT_SADR_SCALE_SETTINGS,
      enabled: Boolean(parsed.enabled),
      port: typeof parsed.port === "string" ? parsed.port.trim().slice(0, 40) : "",
      baudRate: SADR_SCALE_BAUD_OPTIONS.includes(baud as (typeof SADR_SCALE_BAUD_OPTIONS)[number])
        ? baud
        : 9600,
      transport,
      usbVendorId:
        parsed.usbVendorId != null && Number.isFinite(Number(parsed.usbVendorId))
          ? Number(parsed.usbVendorId)
          : undefined,
      usbProductId:
        parsed.usbProductId != null && Number.isFinite(Number(parsed.usbProductId))
          ? Number(parsed.usbProductId)
          : undefined,
      deviceLabel: typeof parsed.deviceLabel === "string" ? parsed.deviceLabel.slice(0, 80) : undefined,
      model: "sadr_vista_b",
    };
  } catch {
    return DEFAULT_SADR_SCALE_SETTINGS;
  }
}

export function writeSadrScaleSettings(partial: Partial<SadrScaleSettings>): SadrScaleSettings {
  const merged: SadrScaleSettings = {
    ...readSadrScaleSettings(),
    ...partial,
    model: "sadr_vista_b",
  };
  if (typeof merged.port === "string") merged.port = merged.port.trim().slice(0, 40);
  const baud = Number(merged.baudRate);
  merged.baudRate = SADR_SCALE_BAUD_OPTIONS.includes(baud as (typeof SADR_SCALE_BAUD_OPTIONS)[number])
    ? baud
    : 9600;
  merged.enabled = Boolean(merged.enabled);
  merged.transport = merged.transport === "qz" ? "qz" : "web_serial";
  if (typeof window !== "undefined") {
    localStorage.setItem(SADR_SCALE_SETTINGS_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent(SADR_SCALE_SETTINGS_CHANGED_EVENT));
  }
  return merged;
}

/** استخراج وزن (کیلو) از متن خام ترازو */
export function parseScaleWeightKg(raw: string): number | null {
  if (!raw) return null;
  const text = String(raw);

  const packet = text.match(/[\x01\x02]?[SUFsu\x53\x55\x46]?\s*([+-]?\d+[.,]?\d*)\s*(KG|kg|Kg|G|g)?/);
  if (packet) {
    const n = Number(packet[1].replace(",", "."));
    if (Number.isFinite(n)) {
      const unit = (packet[2] || "KG").toUpperCase();
      const kg = unit === "G" ? n / 1000 : n;
      if (kg >= 0 && kg <= 200) return Math.round(kg * 1000) / 1000;
    }
  }

  const withUnit = [...text.matchAll(/([+-]?\d+[.,]\d+|\d+)\s*(KG|kg|Kg|G|g)\b/g)];
  for (let i = withUnit.length - 1; i >= 0; i -= 1) {
    const m = withUnit[i];
    const n = Number(m[1].replace(",", "."));
    if (!Number.isFinite(n)) continue;
    const kg = m[2].toUpperCase() === "G" ? n / 1000 : n;
    if (kg >= 0 && kg <= 200) return Math.round(kg * 1000) / 1000;
  }

  const printable = text.replace(/[^\x20-\x7E]/g, " ");
  const nums = [...printable.matchAll(/([+-]?\d+[.,]\d+|\d+)/g)];
  for (let i = nums.length - 1; i >= 0; i -= 1) {
    const n = Number(nums[i][1].replace(",", "."));
    if (!Number.isFinite(n)) continue;
    if (n >= 0 && n <= 200) return Math.round(n * 1000) / 1000;
  }
  return null;
}

export function formatScaleRawPreview(raw: string, maxLen = 240): string {
  const escaped = String(raw)
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/\x02/g, "<STX>")
    .replace(/\x03/g, "<ETX>")
    .replace(/\x01/g, "<SOH>")
    .replace(/\x04/g, "<EOT>")
    .replace(/\x05/g, "<ENQ>")
    .replace(/\x06/g, "<ACK>")
    .replace(/[^\x20-\x7E\\<>]/g, (ch) => {
      const code = ch.charCodeAt(0);
      return `<${code.toString(16).padStart(2, "0")}>`;
    });
  return escaped.length > maxLen ? `${escaped.slice(0, maxLen)}…` : escaped;
}

export function scaleErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error || "");
  const text = raw.toLowerCase();
  if (text.includes("notsupported") || text.includes("web_serial_unsupported")) {
    return "این مرورگر Web Serial ندارد. از Chrome یا Edge روی دسکتاپ استفاده کنید.";
  }
  if (text.includes("no_port") || text.includes("no device selected") || text.includes("no_scale_port")) {
    return "اول با دکمه «انتخاب دستگاه USB» ترازو را انتخاب کنید.";
  }
  if (text.includes("failed to open") || text.includes("networkerror") || text.includes("already open")) {
    return "پورت مشغول است. برنامه دیگری که به ترازو وصل است را ببندید و دوباره امتحان کنید.";
  }
  if (text.includes("qz_serial")) {
    return "مسیر QZ در دسترس نیست. همان USB مستقیم را انتخاب کنید.";
  }
  if (text.includes("timeout") || text.includes("زمان")) {
    return "از ترازو پاسخی نیامد. کابل USB و baud را چک کنید.";
  }
  if (text.includes("websocket") || text.includes("qz")) {
    return qzErrorMessage(error);
  }
  return raw || "خطا در ارتباط با ترازو";
}

export type ScaleTestResult = {
  ok: boolean;
  raw: string;
  weightKg: number | null;
  message: string;
  chunks: number;
  transport: SadrScaleTransport;
};

function buildResult(
  buffer: string,
  chunks: number,
  lastWeight: number | null,
  transport: SadrScaleTransport,
): ScaleTestResult {
  const weightKg = parseScaleWeightKg(buffer) ?? lastWeight;
  if (buffer) {
    return {
      ok: true,
      raw: buffer,
      weightKg,
      chunks,
      transport,
      message:
        weightKg != null
          ? `داده دریافت شد — وزن تقریبی: ${weightKg} کیلو`
          : `داده خام آمد (${chunks} تکه) ولی وزن قابل تشخیص نبود`,
    };
  }
  return {
    ok: false,
    raw: "",
    weightKg: null,
    chunks: 0,
    transport,
    message: "هیچ بایتی از ترازو نیامد. کابل USB و baud را چک کنید و دوباره تست کنید.",
  };
}

async function writeWebSerialBytes(port: WebSerialPort, bytes: number[]) {
  if (!port.writable) return;
  const writer = port.writable.getWriter();
  try {
    await writer.write(new Uint8Array(bytes));
  } finally {
    writer.releaseLock();
  }
}

async function sendWebSerialProbes(port: WebSerialPort) {
  const probes: number[][] = [
    [0x05], // ENQ
    [0x57, 0x0d], // W\r
    [0x57, 0x0d, 0x0a], // W\r\n
    [0x11], // DC1
  ];
  for (const bytes of probes) {
    try {
      await writeWebSerialBytes(port, bytes);
      await new Promise((r) => setTimeout(r, 200));
    } catch {
      /* بعضی دستگاه‌ها فقط TX از سمت ترازو دارند */
    }
  }
}

async function pickMatchingWebPort(settings: SadrScaleSettings): Promise<WebSerialPort | null> {
  const serial = getWebSerial();
  if (!serial) return null;
  const ports = await serial.getPorts();
  if (!ports.length) return null;
  if (settings.usbVendorId != null && settings.usbProductId != null) {
    const match = ports.find((p) => {
      const info = p.getInfo?.() || {};
      return info.usbVendorId === settings.usbVendorId && info.usbProductId === settings.usbProductId;
    });
    if (match) return match;
  }
  return ports[0] ?? null;
}

/** دیالوگ انتخاب دستگاه USB (Chrome/Edge) — بدون QZ */
export async function requestWebSerialScalePort(): Promise<SadrScaleSettings> {
  const serial = getWebSerial();
  if (!serial) throw new Error("WEB_SERIAL_UNSUPPORTED");
  const port = await serial.requestPort();
  const info = port.getInfo?.() || {};
  const label = deviceLabelFromPort(port);
  return writeSadrScaleSettings({
    transport: "web_serial",
    usbVendorId: info.usbVendorId,
    usbProductId: info.usbProductId,
    deviceLabel: label,
    port: "",
  });
}

export async function hasGrantedWebSerialPort(): Promise<boolean> {
  const serial = getWebSerial();
  if (!serial) return false;
  const ports = await serial.getPorts();
  return ports.length > 0;
}

async function testViaWebSerial(options: {
  baudRate: number;
  listenMs: number;
  allowRequestPort?: boolean;
  onChunk?: (raw: string, weightKg: number | null) => void;
  signal?: AbortSignal;
}): Promise<ScaleTestResult> {
  const serial = getWebSerial();
  if (!serial) throw new Error("WEB_SERIAL_UNSUPPORTED");

  const settings = readSadrScaleSettings();
  let port = await pickMatchingWebPort(settings);
  if (!port) {
    if (!options.allowRequestPort) {
      throw new Error("NO_SCALE_PORT");
    }
    // فقط وقتی کاربر خودش تست/انتخاب کرده
    port = await serial.requestPort();
    const info = port.getInfo?.() || {};
    writeSadrScaleSettings({
      transport: "web_serial",
      usbVendorId: info.usbVendorId,
      usbProductId: info.usbProductId,
      deviceLabel: deviceLabelFromPort(port),
    });
  }

  let buffer = "";
  let chunks = 0;
  let lastWeight: number | null = null;
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  const decoder = new TextDecoder();
  let stop = false;

  try {
    await port.open({
      baudRate: options.baudRate,
      dataBits: 8,
      stopBits: 1,
      parity: "none",
      flowControl: "none",
    });

    if (!port.readable) {
      throw new Error("NO_SCALE_PORT");
    }
    reader = port.readable.getReader();

    const onAbort = () => {
      stop = true;
      void reader?.cancel().catch(() => undefined);
    };
    options.signal?.addEventListener("abort", onAbort, { once: true });

    const pump = (async () => {
      while (!stop) {
        const { value, done } = await reader!.read();
        if (done) break;
        if (!value?.length) continue;
        const out = decoder.decode(value, { stream: true });
        chunks += 1;
        buffer += out;
        lastWeight = parseScaleWeightKg(buffer) ?? lastWeight;
        options.onChunk?.(out, parseScaleWeightKg(out) ?? lastWeight);
      }
    })().catch(() => undefined);

    // اول فقط گوش بده — خیلی از ترازوهای USB مدام می‌فرستند
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, Math.min(1500, options.listenMs));
    });

    if (!buffer && !stop) {
      await sendWebSerialProbes(port);
    }

    const remaining = Math.max(500, options.listenMs - 1500);
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, remaining);
    });

    if (!buffer && !stop) {
      await sendWebSerialProbes(port);
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 1000);
      });
    }

    stop = true;
    try {
      await reader.cancel();
    } catch {
      /* ignore */
    }
    await pump;

    options.signal?.removeEventListener("abort", onAbort);
    return buildResult(buffer, chunks, lastWeight, "web_serial");
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

async function ensureQzSerial() {
  await connectQzTray();
  return getQzSerial();
}

export async function listScalePorts(): Promise<string[]> {
  try {
    const serial = await ensureQzSerial();
    const ports = await serial.findPorts();
    return Array.isArray(ports) ? ports.filter(Boolean).sort() : [];
  } catch {
    return [];
  }
}

function openQzOptions(baudRate: number) {
  return {
    baudRate,
    dataBits: 8,
    stopBits: 1,
    parity: "NONE",
    flowControl: "NONE",
    encoding: "UTF-8",
    rx: {},
  };
}

async function sendQzProbes(serial: QzSerialApi["serial"], port: string) {
  const probes: Array<string | { type: string; data: string }> = [
    { type: "HEX", data: "05" },
    "W\r",
    "W\r\n",
    { type: "HEX", data: "11" },
  ];
  for (const probe of probes) {
    try {
      await serial.sendData(port, typeof probe === "string" ? { type: "PLAIN", data: probe } : probe);
      await new Promise((r) => setTimeout(r, 200));
    } catch {
      /* ignore */
    }
  }
}

async function testViaQz(options: {
  port: string;
  baudRate: number;
  listenMs: number;
  onChunk?: (raw: string, weightKg: number | null) => void;
  signal?: AbortSignal;
}): Promise<ScaleTestResult> {
  const port = options.port.trim();
  if (!port) {
    return {
      ok: false,
      raw: "",
      weightKg: null,
      message: "برای مسیر QZ اول پورت COM را انتخاب کنید",
      chunks: 0,
      transport: "qz",
    };
  }

  const serial = await ensureQzSerial();
  let buffer = "";
  let chunks = 0;
  let lastWeight: number | null = null;

  const onEvent = (event: QzSerialEvent) => {
    if (event.portName && event.portName !== port) return;
    if (event.type === "ERROR" || event.exception) return;
    const out = typeof event.output === "string" ? event.output : "";
    if (!out) return;
    chunks += 1;
    buffer += out;
    lastWeight = parseScaleWeightKg(buffer) ?? lastWeight;
    options.onChunk?.(out, parseScaleWeightKg(out) ?? lastWeight);
  };

  serial.setSerialCallbacks(onEvent);

  try {
    try {
      await serial.closePort(port);
    } catch {
      /* ignore */
    }
    await serial.openPort(port, openQzOptions(options.baudRate));

    await new Promise<void>((resolve) => {
      const t = window.setTimeout(() => resolve(), Math.min(1500, options.listenMs));
      options.signal?.addEventListener("abort", () => {
        window.clearTimeout(t);
        resolve();
      }, { once: true });
    });

    if (!buffer) {
      await sendQzProbes(serial, port);
    }

    const remaining = Math.max(500, options.listenMs - 1500);
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, remaining);
    });

    return buildResult(buffer, chunks, lastWeight, "qz");
  } finally {
    try {
      await serial.closePort(port);
    } catch {
      /* ignore */
    }
    try {
      serial.setSerialCallbacks([]);
    } catch {
      /* ignore */
    }
  }
}

/** تست اتصال — اولویت با USB مستقیم (Web Serial)، در غیر این صورت QZ */
export async function testSadrScale(options?: {
  port?: string;
  baudRate?: number;
  listenMs?: number;
  transport?: SadrScaleTransport;
  /** در تست تنظیمات اجازه باز شدن دیالوگ انتخاب USB */
  allowRequestPort?: boolean;
  onChunk?: (raw: string, weightKg: number | null) => void;
  signal?: AbortSignal;
}): Promise<ScaleTestResult> {
  const settings = readSadrScaleSettings();
  const baudRate = options?.baudRate ?? settings.baudRate;
  const listenMs = options?.listenMs ?? 4000;
  const transport = options?.transport ?? settings.transport ?? "web_serial";

  if (transport === "web_serial" || (transport !== "qz" && isWebSerialSupported())) {
    try {
      return await testViaWebSerial({
        baudRate,
        listenMs,
        allowRequestPort: options?.allowRequestPort !== false && transport === "web_serial",
        onChunk: options?.onChunk,
        signal: options?.signal,
      });
    } catch (err) {
      // اگر کاربر مسیر وب را خواسته، خطا را برگردان؛ وگرنه به QZ برو
      if (transport === "web_serial") throw err;
    }
  }

  return testViaQz({
    port: options?.port ?? settings.port,
    baudRate,
    listenMs,
    onChunk: options?.onChunk,
    signal: options?.signal,
  });
}

/** یک‌بار وزن بخوان (برای دیالوگ فروش) — بدون باز کردن دیالوگ انتخاب دستگاه */
export async function readSadrScaleWeight(timeoutMs = 2500): Promise<number | null> {
  const settings = readSadrScaleSettings();
  if (!settings.enabled) return null;
  if (settings.transport === "qz" && !settings.port.trim()) return null;
  if (settings.transport !== "qz") {
    const ready = await hasGrantedWebSerialPort();
    if (!ready) return null;
  }

  try {
    const result = await testSadrScale({
      port: settings.port,
      baudRate: settings.baudRate,
      listenMs: timeoutMs,
      transport: settings.transport,
      allowRequestPort: false,
    });
    return result.weightKg;
  } catch {
    return null;
  }
}
