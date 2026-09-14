const PUBLIC_API_BASE =
  process.env.NEXT_PUBLIC_BASE_URL || "https://api.webinoo-plus.ir";

export type GeoItem = {
  id: number;
  name: string;
};

export type ConsultationRequest = {
  id: number;
  name?: string;
  phone?: string;
  business_name?: string;
  state_id?: number;
  city_id?: number;
  state_name?: string;
  city_name?: string;
  state?: { id?: number; name?: string } | null;
  city?: { id?: number; name?: string } | null;
  source?: string;
  source_label?: string;
  status?: string;
  status_label?: string;
  admin_note?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type SelectOption = {
  value: string;
  label: string;
};

export type ConsultationRequestsMeta = {
  statuses: SelectOption[];
  sources: SelectOption[];
  statusCounts: Record<string, number>;
};

export type ConsultationPayload = {
  name: string;
  phone: string;
  state_id: number;
  city_id: number;
  business_name: string;
  source?: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار بررسی",
  contacted: "تماس گرفته شد",
  done: "انجام شد",
  rejected: "رد شده",
};

const SOURCE_LABELS: Record<string, string> = {
  digital_menu: "منوی دیجیتال",
  accounting: "حسابداری و فروش",
};

export function formatConsultationStatus(status?: string): string {
  if (!status) return "—";
  return STATUS_LABELS[status] || status;
}

export function getConsultationStatusColor(
  status?: string,
): "warning" | "info" | "success" | "error" | "default" {
  switch (status) {
    case "pending":
      return "warning";
    case "contacted":
      return "info";
    case "done":
      return "success";
    case "rejected":
      return "error";
    default:
      return "default";
  }
}

export function formatConsultationSource(source?: string, label?: string): string {
  if (label) return label;
  if (!source) return "—";
  return SOURCE_LABELS[source] || source;
}

export function getConsultationStateName(item: ConsultationRequest): string {
  return item.state?.name || item.state_name || "—";
}

export function getConsultationCityName(item: ConsultationRequest): string {
  return item.city?.name || item.city_name || "—";
}

export function formatConsultationDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizeOptions(raw: unknown): SelectOption[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item): SelectOption | null => {
        if (typeof item === "string") {
          return { value: item, label: STATUS_LABELS[item] || SOURCE_LABELS[item] || item };
        }
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          const value = record.value ?? record.key ?? record.id ?? record.name;
          const label = record.label ?? record.title ?? record.name ?? value;
          if (value === undefined || value === null) return null;
          return { value: String(value), label: String(label) };
        }
        return null;
      })
      .filter((option): option is SelectOption => option !== null);
  }
  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>).map(([value, label]) => ({
      value,
      label: typeof label === "string" ? label : String(value),
    }));
  }
  return [];
}

export function parseConsultationMeta(res: unknown): ConsultationRequestsMeta {
  const root = (res && typeof res === "object" ? res : {}) as Record<string, unknown>;
  const meta = (root.meta && typeof root.meta === "object" ? root.meta : root) as Record<
    string,
    unknown
  >;

  const rawCounts = meta.counts ?? meta.status_counts ?? meta.statusCounts ?? {};
  const statusCounts: Record<string, number> = {};
  if (rawCounts && typeof rawCounts === "object" && !Array.isArray(rawCounts)) {
    Object.entries(rawCounts as Record<string, unknown>).forEach(([key, value]) => {
      const count = Number(value);
      if (Number.isFinite(count)) statusCounts[key] = count;
    });
  }

  return {
    statuses: normalizeOptions(meta.statuses ?? meta.status),
    sources: normalizeOptions(meta.sources ?? meta.source),
    statusCounts,
  };
}

export type ApiFailure = {
  hasError: true;
  statusCode: number;
  message?: string;
  errors?: Record<string, string[]>;
};

export const IRAN_MOBILE_PATTERN = /^09\d{9}$/;

export function toEnglishDigits(value: string): string {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  return String(value)
    .replace(/[۰-۹]/g, (ch) => String(persianDigits.indexOf(ch)))
    .replace(/[٠-٩]/g, (ch) => String(arabicDigits.indexOf(ch)));
}

export function toIranMobile(value: string): string {
  const digits = toEnglishDigits(value).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("98")) return `0${digits.slice(2)}`;
  if (digits.length === 10 && digits.startsWith("9")) return `0${digits}`;
  return digits;
}

export function isApiFailure(res: unknown): res is ApiFailure {
  return Boolean(res && typeof res === "object" && (res as ApiFailure).hasError);
}

function normalizeGeoItems(raw: unknown): GeoItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): GeoItem | null => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const id = Number(record.id);
      const name = record.name ?? record.title;
      if (!Number.isFinite(id) || !name) return null;
      return { id, name: String(name) };
    })
    .filter((item): item is GeoItem => item !== null);
}

async function publicApi(
  method: "GET" | "POST",
  path: string,
  body?: Record<string, unknown>,
): Promise<any> {
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body) headers["Content-Type"] = "application/json";

    const response = await fetch(`${PUBLIC_API_BASE}${path}`, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const text = await response.text();
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = null;
    }

    if (!response.ok) {
      const extra =
        parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? (parsed as Record<string, unknown>)
          : { message: text };
      return { hasError: true, statusCode: response.status, ...extra };
    }

    return parsed;
  } catch {
    return { hasError: true, statusCode: 0, message: "خطا در ارتباط با سرور" };
  }
}

export async function fetchConsultationFormOptions(): Promise<
  { states: GeoItem[] } | ApiFailure
> {
  const res = await publicApi("GET", "/api/consultation-requests/form-options");
  if (isApiFailure(res)) return res;
  const payload = (res?.data ?? res ?? {}) as Record<string, unknown>;
  return { states: normalizeGeoItems(payload.states ?? payload.provinces) };
}

export async function fetchCitiesByState(stateId: number): Promise<GeoItem[]> {
  const res = await publicApi("GET", `/api/geo/cities?state_id=${stateId}`);
  return normalizeGeoItems(Array.isArray(res) ? res : res?.data);
}

export async function submitConsultationRequest(
  payload: ConsultationPayload,
): Promise<any> {
  return publicApi("POST", "/api/consultation-requests", payload);
}

export function getConsultationErrorMessage(res: unknown, fallback: string): string {
  if (!res || typeof res !== "object") return fallback;
  const record = res as ApiFailure;

  if (record.statusCode === 429) {
    return "با این شماره اخیراً درخواست ثبت شده است. همکاران ما به‌زودی تماس می‌گیرند.";
  }

  if (record.errors && typeof record.errors === "object") {
    const first = Object.values(record.errors).flat()[0];
    if (typeof first === "string" && first.trim()) return first;
  }

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }

  return fallback;
}
