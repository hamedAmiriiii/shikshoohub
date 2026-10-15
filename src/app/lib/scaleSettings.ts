export const SCALE_SETTINGS_KEY = "admin_scale_settings";
export const SCALE_SETTINGS_CHANGED_EVENT = "admin-scale-settings-changed";

export type ScaleModelId = "sadr_vista_b";

export type ScaleSettings = {
  enabled: boolean;
  model: ScaleModelId;
  /** نام پورت مثل COM3 */
  port: string;
  baudRate: number;
  /** خواندن خودکار وزن در دیالوگ تعداد کالای کیلویی */
  autoFillQuantity: boolean;
};

export const SCALE_BAUD_RATES = [4800, 9600, 19200, 38400] as const;

export const SCALE_MODEL_LABELS: Record<ScaleModelId, string> = {
  sadr_vista_b: "ترازو صدر مدل ویستا B",
};

const DEFAULT_SETTINGS: ScaleSettings = {
  enabled: false,
  model: "sadr_vista_b",
  port: "",
  baudRate: 9600,
  autoFillQuantity: true,
};

export function readScaleSettings(): ScaleSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(SCALE_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<ScaleSettings>;
    const baud = Number(parsed.baudRate);
    return {
      enabled: Boolean(parsed.enabled),
      model: parsed.model === "sadr_vista_b" ? "sadr_vista_b" : "sadr_vista_b",
      port: typeof parsed.port === "string" ? parsed.port.slice(0, 40) : "",
      baudRate: SCALE_BAUD_RATES.includes(baud as (typeof SCALE_BAUD_RATES)[number])
        ? baud
        : 9600,
      autoFillQuantity: parsed.autoFillQuantity !== false,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function writeScaleSettings(partial: Partial<ScaleSettings>): ScaleSettings {
  const merged = { ...readScaleSettings(), ...partial };
  if (typeof window !== "undefined") {
    localStorage.setItem(SCALE_SETTINGS_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent(SCALE_SETTINGS_CHANGED_EVENT));
  }
  return merged;
}

export function isScaleReady(settings: ScaleSettings = readScaleSettings()): boolean {
  return Boolean(settings.enabled && settings.port.trim());
}
