const PUBLIC_API_BASE =
  process.env.NEXT_PUBLIC_BASE_URL || "https://api.webinoplus.ir";

export type SelectOption = {
  value: string;
  label: string;
};

export type GeoItem = {
  id: number;
  name: string;
};

export type AgencyRequest = {
  id: number;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  education?: string;
  education_label?: string;
  status?: string;
  status_label?: string;
  admin_note?: string | null;
  state_id?: number;
  city_id?: number;
  state?: { id?: number; name?: string } | null;
  city?: { id?: number; name?: string } | null;
  state_name?: string;
  city_name?: string;
  created_at?: string;
  updated_at?: string;
};

export type AgencyRequestFormOptions = {
  states: GeoItem[];
  educations: SelectOption[];
};

export type AgencyRequestsMeta = {
  statuses: SelectOption[];
  educations: SelectOption[];
  statusCounts: Record<string, number>;
};

export type AgencyRequestPayload = {
  first_name: string;
  last_name: string;
  state_id: number;
  city_id: number;
  phone: string;
  education: string;
};

export type ApiFailure = {
  hasError: true;
  statusCode: number;
  message?: string;
  errors?: Record<string, string[]>;
};

export const IRAN_MOBILE_PATTERN = /^09\d{9}$/;

const STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار بررسی",
  new: "جدید",
  in_progress: "در حال پیگیری",
  contacted: "تماس گرفته شد",
  approved: "تأیید شده",
  accepted: "تأیید شده",
  rejected: "رد شده",
  canceled: "لغو شده",
  cancelled: "لغو شده",
  done: "انجام شده",
};

const EDUCATION_LABELS: Record<string, string> = {
  under_diploma: "زیر دیپلم",
  below_diploma: "زیر دیپلم",
  diploma: "دیپلم",
  associate: "فوق دیپلم",
  associate_degree: "فوق دیپلم",
  bachelor: "لیسانس",
  bachelors: "لیسانس",
  master: "فوق لیسانس",
  masters: "فوق لیسانس",
  phd: "دکتری",
  doctorate: "دکتری",
};

export function toEnglishDigits(value: string): string {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  return String(value)
    .replace(/[۰-۹]/g, (ch) => String(persianDigits.indexOf(ch)))
    .replace(/[٠-٩]/g, (ch) => String(arabicDigits.indexOf(ch)));
}

export function normalizeMobile(value: string): string {
  return toEnglishDigits(value).replace(/\D/g, "");
}

/** شماره‌های ۹۸۹۱۲… و ۹۱۲… را به قالب استاندارد ۰۹۱۲… برمی‌گرداند */
export function toIranMobile(value: string): string {
  const digits = normalizeMobile(value);
  if (digits.length === 12 && digits.startsWith("98")) return `0${digits.slice(2)}`;
  if (digits.length === 10 && digits.startsWith("9")) return `0${digits}`;
  return digits;
}

export function isApiFailure(res: unknown): res is ApiFailure {
  return Boolean(res && typeof res === "object" && (res as ApiFailure).hasError);
}

export function formatAgencyStatus(status?: string): string {
  if (!status) return "—";
  return STATUS_LABELS[status] || status;
}

export function getAgencyStatusColor(
  status?: string,
): "warning" | "info" | "success" | "error" | "default" {
  switch (status) {
    case "pending":
    case "new":
      return "warning";
    case "in_progress":
    case "contacted":
      return "info";
    case "approved":
    case "accepted":
    case "done":
      return "success";
    case "rejected":
    case "canceled":
    case "cancelled":
      return "error";
    default:
      return "default";
  }
}

export function formatEducation(education?: string): string {
  if (!education) return "—";
  return EDUCATION_LABELS[education] || education;
}

export function getRequesterName(item: AgencyRequest): string {
  const full = [item.first_name, item.last_name].filter(Boolean).join(" ").trim();
  return full || item.full_name || "—";
}

export function getStateName(item: AgencyRequest): string {
  return item.state?.name || item.state_name || "—";
}

export function getCityName(item: AgencyRequest): string {
  return item.city?.name || item.city_name || "—";
}

export function formatAgencyDate(value?: string): string {
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

/** فهرست گزینه‌ها ممکن است آرایهٔ رشته، آرایهٔ آبجکت یا نگاشت value→label باشد */
function normalizeOptions(raw: unknown): SelectOption[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((item): SelectOption | null => {
        if (typeof item === "string") {
          return { value: item, label: formatEducationOrStatus(item) };
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

function formatEducationOrStatus(value: string): string {
  return EDUCATION_LABELS[value] || STATUS_LABELS[value] || value;
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

export async function fetchAgencyFormOptions(): Promise<
  AgencyRequestFormOptions | ApiFailure
> {
  const res = await publicApi("GET", "/api/agency-requests/form-options");
  if (isApiFailure(res)) return res;

  const payload = (res?.data ?? res ?? {}) as Record<string, unknown>;
  return {
    states: normalizeGeoItems(payload.states ?? payload.provinces),
    educations: normalizeOptions(payload.educations ?? payload.education),
  };
}

/** شناسهٔ استان همان id جدول استان‌هاست (نه ستون code) */
export async function fetchCitiesByState(stateId: number): Promise<GeoItem[]> {
  const res = await publicApi("GET", `/api/geo/cities?state_id=${stateId}`);
  return normalizeGeoItems(Array.isArray(res) ? res : res?.data);
}

export async function submitAgencyRequest(
  payload: AgencyRequestPayload,
): Promise<any> {
  return publicApi("POST", "/api/agency-requests", payload);
}

export function getAgencyErrorMessage(res: unknown, fallback: string): string {
  if (!res || typeof res !== "object") return fallback;
  const record = res as ApiFailure & { errorText?: string };

  if (record.statusCode === 429) {
    return "تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً بعداً دوباره تلاش کنید.";
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

export function parseAgencyMeta(res: unknown): AgencyRequestsMeta {
  const root = (res && typeof res === "object" ? res : {}) as Record<string, unknown>;
  const meta = (root.meta && typeof root.meta === "object" ? root.meta : root) as Record<
    string,
    unknown
  >;

  const rawCounts = meta.status_counts ?? meta.statusCounts ?? {};
  const statusCounts: Record<string, number> = {};
  if (rawCounts && typeof rawCounts === "object") {
    if (Array.isArray(rawCounts)) {
      rawCounts.forEach((entry) => {
        if (entry && typeof entry === "object") {
          const record = entry as Record<string, unknown>;
          const key = record.status ?? record.value;
          const count = Number(record.count ?? record.total);
          if (key !== undefined && Number.isFinite(count)) {
            statusCounts[String(key)] = count;
          }
        }
      });
    } else {
      Object.entries(rawCounts as Record<string, unknown>).forEach(([key, value]) => {
        const count = Number(value);
        if (Number.isFinite(count)) statusCounts[key] = count;
      });
    }
  }

  return {
    statuses: normalizeOptions(meta.statuses ?? meta.status),
    educations: normalizeOptions(meta.educations ?? meta.education),
    statusCounts,
  };
}
