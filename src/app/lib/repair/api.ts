const BASE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL || "https://api.webinoo-plus.ir"
).replace(/\/$/, "");

const TOKEN_KEY = "repair_token";
const USER_KEY = "repair_user";

export type RepairRole = "admin" | "technician" | "customer";

export type RepairSessionUser = {
  id: number;
  role: RepairRole;
  name: string | null;
  phone: string;
  specialty?: string | null;
  address?: string | null;
};

export type RepairStatus =
  | "pending"
  | "assigned"
  | "in_progress"
  | "invoiced"
  | "payment_review"
  | "completed"
  | "canceled";

export type RepairRequest = {
  id: number;
  category: string | null;
  description: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  contact_name: string | null;
  contact_phone: string;
  preferred_time: string | null;
  status: RepairStatus;
  status_label: string;
  labor_amount: number;
  parts_amount: number;
  total_amount: number;
  cost_description: string | null;
  payment_method: string | null;
  payment_method_label: string | null;
  payment_ref: string | null;
  has_receipt: boolean;
  receipt_url: string | null;
  receipt_submitted_at: string | null;
  receipt_reject_reason: string | null;
  technician: { id: number; name: string | null; phone: string; specialty: string | null } | null;
  customer?: { id: number; name: string | null; phone: string } | null;
  share_percent?: number;
  technician_share?: number;
  platform_share?: number;
  admin_note?: string | null;
  assigned_at: string | null;
  started_at: string | null;
  invoiced_at: string | null;
  paid_at: string | null;
  completed_at: string | null;
  canceled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
};

export type RepairPaymentOptions = {
  online_enabled: boolean;
  card_enabled: boolean;
  card_number: string;
  card_holder: string;
  bank_name: string;
};

export type RepairLocationMode = "off" | "optional" | "required";

export type RepairPublicConfig = {
  brand_name: string;
  support_phone: string;
  categories: string[];
  online_payment_enabled: boolean;
  card_payment_enabled: boolean;
  location_mode: RepairLocationMode;
  neshan_map_key: string;
};

export type LatLng = { lat: number; lng: number };

export type RepairTechnician = {
  id: number;
  name: string | null;
  phone: string;
  specialty: string | null;
  labor_share_percent: number;
  card_number: string | null;
  notes: string | null;
  is_active: boolean;
  last_login_at: string | null;
  open_requests?: number;
  balance?: number;
};

export type RepairPayout = {
  id: number;
  technician_id: number;
  technician_name: string | null;
  amount: number;
  paid_on: string | null;
  method: string | null;
  note: string | null;
};

export type RepairBalanceRow = {
  technician: RepairTechnician;
  completed_jobs: number;
  revenue: number;
  platform_share: number;
  earned: number;
  paid: number;
  balance: number;
};

export type RepairWalletSummary = {
  completed_jobs: number;
  earned: number;
  paid: number;
  balance: number;
};

export type RepairSettings = {
  brand_name: string;
  support_phone: string;
  card_number: string;
  card_holder: string;
  bank_name: string;
  online_payment_enabled: string;
  card_payment_enabled: string;
  default_labor_share_percent: string;
  categories: string;
  location_mode: RepairLocationMode;
};

export type RepairDashboard = {
  counts: { status: RepairStatus; label: string; count: number }[];
  month: { jobs: number; revenue: number; platform_share: number; technician_share: number };
  technicians_balance: number;
};

export type RepairApiError = { hasError: true; statusCode: number; message: string; retry_after_seconds?: number };

export function isRepairError(res: unknown): res is RepairApiError {
  return Boolean(res && typeof res === "object" && (res as RepairApiError).hasError);
}

export function getRepairToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getRepairUser(): RepairSessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as RepairSessionUser) : null;
  } catch {
    return null;
  }
}

export function saveRepairSession(token: string | null, user: RepairSessionUser) {
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearRepairSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function repairHomeFor(role: RepairRole | undefined | null) {
  if (role === "admin") return "/repair/admin";
  if (role === "technician") return "/repair/tech";
  return "/repair/requests";
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function repairFetch<T>(
  method: Method,
  path: string,
  options: { body?: unknown; params?: Record<string, string | number | undefined | null>; auth?: boolean } = {},
): Promise<T | RepairApiError> {
  const { body, params, auth = true } = options;
  const url = new URL(`${BASE_URL}/api/repair${path}`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = auth ? getRepairToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    let json: Record<string, unknown> = {};
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = { message: text };
      }
    }
    if (!response.ok) {
      if (response.status === 401 && auth && typeof window !== "undefined") {
        clearRepairSession();
        if (!window.location.pathname.startsWith("/repair/login")) {
          const next = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.replace(`/repair/login?next=${next}`);
        }
      }
      const errors = json.errors as Record<string, string[]> | undefined;
      const firstError = errors ? Object.values(errors)[0]?.[0] : undefined;
      return {
        hasError: true,
        statusCode: response.status,
        message: (typeof json.message === "string" && json.message) || firstError || `خطای ${response.status}`,
        retry_after_seconds: typeof json.retry_after_seconds === "number" ? json.retry_after_seconds : undefined,
      };
    }
    return json as T;
  } catch {
    return { hasError: true, statusCode: 0, message: "خطا در اتصال به سرور" };
  }
}

export const repairApi = {
  config: () => repairFetch<RepairPublicConfig>("GET", "/config", { auth: false }),
  sendCode: (phone: string) =>
    repairFetch<{ message: string; is_new: boolean; retry_after_seconds: number }>("POST", "/auth/send-code", {
      auth: false,
      body: { phone },
    }),
  verify: (phone: string, code: string, name?: string) =>
    repairFetch<{ token: string; user: RepairSessionUser }>("POST", "/auth/verify", {
      auth: false,
      body: { phone, code, name: name || undefined },
    }),
  me: () => repairFetch<{ user: RepairSessionUser }>("GET", "/me"),
  updateProfile: (body: { name?: string; address?: string | null }) =>
    repairFetch<{ user: RepairSessionUser }>("PATCH", "/me", { body }),
  logout: () => repairFetch<{ message: string }>("POST", "/logout"),
  reverseGeocode: (point: LatLng) =>
    repairFetch<{ address: string | null }>("GET", "/geo/reverse", { params: { lat: point.lat, lng: point.lng } }),

  myRequests: () => repairFetch<{ requests: RepairRequest[] }>("GET", "/requests"),
  createRequest: (body: {
    category?: string;
    description: string;
    address: string;
    latitude?: number;
    longitude?: number;
    contact_name?: string;
    contact_phone?: string;
    preferred_time?: string;
  }) => repairFetch<{ message: string; request: RepairRequest }>("POST", "/requests", { body }),
  myRequest: (id: number | string) =>
    repairFetch<{ request: RepairRequest; payment: RepairPaymentOptions }>("GET", `/requests/${id}`),
  cancelMyRequest: (id: number, reason?: string) =>
    repairFetch<{ message: string; request: RepairRequest }>("POST", `/requests/${id}/cancel`, { body: { reason } }),
  payOnline: (id: number, returnUrl: string) =>
    repairFetch<{ payment_url: string }>("POST", `/requests/${id}/pay`, { body: { return_url: returnUrl } }),
  uploadReceipt: (id: number, receiptBase64: string, paymentRef?: string) =>
    repairFetch<{ message: string; request: RepairRequest }>("POST", `/requests/${id}/receipt`, {
      body: { receipt_base64: receiptBase64, payment_ref: paymentRef || undefined },
    }),

  techRequests: (status?: string) =>
    repairFetch<{ requests: RepairRequest[] }>("GET", "/tech/requests", { params: { status } }),
  techRequest: (id: number | string) => repairFetch<{ request: RepairRequest }>("GET", `/tech/requests/${id}`),
  techStart: (id: number) => repairFetch<{ message: string; request: RepairRequest }>("POST", `/tech/requests/${id}/start`),
  techSetCost: (id: number, body: { labor_amount: number; parts_amount: number; cost_description?: string }) =>
    repairFetch<{ message: string; request: RepairRequest }>("PUT", `/tech/requests/${id}/cost`, { body }),
  techWallet: () =>
    repairFetch<{ summary: RepairWalletSummary; share_percent: number; payouts: RepairPayout[] }>("GET", "/tech/wallet"),

  adminDashboard: () => repairFetch<RepairDashboard>("GET", "/admin/dashboard"),
  adminRequests: (params: { status?: string; technician_id?: number | string; q?: string; page?: number }) =>
    repairFetch<{ requests: RepairRequest[]; meta: { current_page: number; last_page: number; total: number } }>(
      "GET",
      "/admin/requests",
      { params },
    ),
  adminRequest: (id: number | string) => repairFetch<{ request: RepairRequest }>("GET", `/admin/requests/${id}`),
  adminAssign: (id: number, technicianId: number, adminNote?: string) =>
    repairFetch<{ message: string; request: RepairRequest }>("POST", `/admin/requests/${id}/assign`, {
      body: { technician_id: technicianId, admin_note: adminNote },
    }),
  adminSetCost: (
    id: number,
    body: { labor_amount: number; parts_amount: number; cost_description?: string; share_percent?: number },
  ) => repairFetch<{ message: string; request: RepairRequest }>("PUT", `/admin/requests/${id}/cost`, { body }),
  adminApproveReceipt: (id: number) =>
    repairFetch<{ message: string; request: RepairRequest }>("POST", `/admin/requests/${id}/receipt/approve`),
  adminRejectReceipt: (id: number, reason?: string) =>
    repairFetch<{ message: string; request: RepairRequest }>("POST", `/admin/requests/${id}/receipt/reject`, {
      body: { reason },
    }),
  adminMarkPaid: (id: number, paymentRef?: string) =>
    repairFetch<{ message: string; request: RepairRequest }>("POST", `/admin/requests/${id}/mark-paid`, {
      body: { payment_ref: paymentRef },
    }),
  adminCancel: (id: number, reason?: string) =>
    repairFetch<{ message: string; request: RepairRequest }>("POST", `/admin/requests/${id}/cancel`, { body: { reason } }),
  adminNote: (id: number, adminNote: string) =>
    repairFetch<{ request: RepairRequest }>("PATCH", `/admin/requests/${id}/note`, { body: { admin_note: adminNote } }),
  adminTechnicians: () =>
    repairFetch<{ technicians: RepairTechnician[]; default_share_percent: number }>("GET", "/admin/technicians"),
  adminCreateTechnician: (body: Partial<RepairTechnician>) =>
    repairFetch<{ message: string; technician: RepairTechnician }>("POST", "/admin/technicians", { body }),
  adminUpdateTechnician: (id: number, body: Partial<RepairTechnician>) =>
    repairFetch<{ message: string; technician: RepairTechnician }>("PATCH", `/admin/technicians/${id}`, { body }),
  adminPayouts: (technicianId?: number | string) =>
    repairFetch<{ payouts: RepairPayout[] }>("GET", "/admin/payouts", { params: { technician_id: technicianId } }),
  adminCreatePayout: (body: { technician_id: number; amount: number; paid_on?: string; method?: string; note?: string }) =>
    repairFetch<{ message: string; payout: RepairPayout }>("POST", "/admin/payouts", { body }),
  adminDeletePayout: (id: number) => repairFetch<{ message: string }>("DELETE", `/admin/payouts/${id}`),
  adminBalances: () => repairFetch<{ rows: RepairBalanceRow[] }>("GET", "/admin/balances"),
  adminSettings: () => repairFetch<{ settings: RepairSettings }>("GET", "/admin/settings"),
  adminSaveSettings: (body: Record<string, string | boolean>) =>
    repairFetch<{ message: string; settings: RepairSettings }>("PUT", "/admin/settings", { body }),
};

const faNumber = new Intl.NumberFormat("fa-IR");

export function formatToman(value: number | null | undefined) {
  return `${faNumber.format(Math.round(Number(value) || 0))} تومان`;
}

export function formatFaNumber(value: number | null | undefined) {
  return faNumber.format(Number(value) || 0);
}

export function formatFaDate(value: string | null | undefined, withTime = true) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export function toLatinDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

export function parseAmount(value: string) {
  const digits = toLatinDigits(value).replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
