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
  card_number?: string | null;
  sheba?: string | null;
  photo_url?: string | null;
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
  service_id: number | null;
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
  technician: {
    id: number;
    name: string | null;
    phone: string;
    specialty: string | null;
    rating_avg?: number | null;
    rating_count?: number;
    photo_url?: string | null;
  } | null;
  customer?: { id: number; name: string | null; phone: string } | null;
  rating?: number | null;
  review?: string | null;
  rated_at?: string | null;
  can_rate?: boolean;
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

export type RepairMapProvider = "neshan" | "osm";

export type RepairMapProviderSetting = "auto" | RepairMapProvider;

export type RepairServiceOption = { id: number; name: string };

export type RepairPublicConfig = {
  brand_name: string;
  support_phone: string;
  services: RepairServiceOption[];
  categories: string[];
  online_payment_enabled: boolean;
  card_payment_enabled: boolean;
  location_mode: RepairLocationMode;
  map_provider?: RepairMapProvider;
  neshan_map_key: string;
};

export type LatLng = { lat: number; lng: number };

export type RepairApprovalStatus = "approved" | "pending" | "rejected";

export type RepairTechnician = {
  id: number;
  name: string | null;
  phone: string;
  specialty: string | null;
  labor_share_percent: number;
  rating_avg?: number | null;
  rating_count?: number;
  card_number: string | null;
  sheba?: string | null;
  photo_url?: string | null;
  address?: string | null;
  notes: string | null;
  is_active: boolean;
  approval_status: RepairApprovalStatus;
  approval_note: string | null;
  service_ids: number[];
  services: string[];
  last_login_at: string | null;
  created_at?: string;
  open_requests?: number;
  balance?: number;
};

export type RepairTechnicianInput = {
  name?: string;
  phone?: string;
  specialty?: string | null;
  labor_share_percent?: number;
  card_number?: string | null;
  sheba?: string | null;
  notes?: string | null;
  is_active?: boolean;
  service_ids?: number[];
};

export type RepairAdminService = {
  id: number;
  name: string;
  is_active: boolean;
  sort_order: number;
  technicians_count: number;
  requests_count: number;
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
  location_mode: RepairLocationMode;
  map_provider?: RepairMapProviderSetting;
};

export type RepairDashboard = {
  counts: { status: RepairStatus; label: string; count: number }[];
  month: { jobs: number; revenue: number; platform_share: number; technician_share: number };
  technicians_balance: number;
  pending_technicians?: number;
  sms_balance?: number | null;
};

export type RepairSmsLog = {
  id: number;
  phone: string;
  message: string;
  sms_type: string;
  sms_type_label: string;
  sms_parts: number;
  delivery_status: string;
  delivery_status_label: string;
  can_refresh: boolean;
  created_at: string | null;
  status_checked_at: string | null;
};

export type RepairSmsPackage = {
  id: number;
  name: string;
  sms_count: number;
  price_rial: number;
  price_toman: number | null;
};

export type RepairSmsSummary = {
  enabled: boolean;
  balance: number;
  chars_per_sms: number;
  sent_today: number;
  used_this_month: number;
  packages: RepairSmsPackage[];
  gateways: { id: string; name: string }[];
  default_gateway: string;
  types: { id: string; label: string }[];
};

export type RepairSmsOrder = {
  id: number;
  name: string;
  sms_count: number;
  amount_toman: number;
  status: "paid" | "failed";
  gateway: string;
  ref_id: string | null;
  created_at: string | null;
  paid_at: string | null;
};

export type RepairTechVerifyResult =
  | { status: "ok"; token: string; user: RepairSessionUser }
  | { status: "pending" | "rejected"; message: string }
  | { status: "needs_registration"; registration_token: string; phone: string; services: RepairServiceOption[] };

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

export function isTechAppPath(pathname: string | null | undefined) {
  return pathname === "/repair/tech" || Boolean(pathname?.startsWith("/repair/tech/"));
}

export function repairLoginPathFor(pathname: string | null | undefined) {
  return isTechAppPath(pathname) ? "/repair/tech/login" : "/repair/login";
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
        const loginPath = repairLoginPathFor(window.location.pathname);
        if (!window.location.pathname.startsWith(loginPath)) {
          const next = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.replace(`${loginPath}?next=${next}`);
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
  techVerify: (phone: string, code: string) =>
    repairFetch<RepairTechVerifyResult>("POST", "/tech-auth/verify", { auth: false, body: { phone, code } }),
  techRegister: (body: {
    registration_token: string;
    name: string;
    specialty?: string;
    service_ids: number[];
    card_number?: string;
    sheba?: string;
    photo: string;
    address?: string;
  }) => repairFetch<{ status: string; message: string }>("POST", "/tech-auth/register", { auth: false, body }),
  me: () => repairFetch<{ user: RepairSessionUser }>("GET", "/me"),
  updateProfile: (body: {
    name?: string;
    address?: string | null;
    specialty?: string | null;
    card_number?: string | null;
    sheba?: string | null;
  }) => repairFetch<{ user: RepairSessionUser }>("PATCH", "/me", { body }),
  updatePhoto: (photo: string) =>
    repairFetch<{ message: string; user: RepairSessionUser }>("POST", "/me/photo", { body: { photo } }),
  logout: () => repairFetch<{ message: string }>("POST", "/logout"),
  reverseGeocode: (point: LatLng) =>
    repairFetch<{ address: string | null }>("GET", "/geo/reverse", { params: { lat: point.lat, lng: point.lng } }),

  myRequests: () => repairFetch<{ requests: RepairRequest[] }>("GET", "/requests"),
  createRequest: (body: {
    service_id?: number;
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
  rateRequest: (id: number, body: { rating: number; review?: string }) =>
    repairFetch<{ message: string; request: RepairRequest }>("POST", `/requests/${id}/rate`, { body }),
  techWallet: () =>
    repairFetch<{
      summary: RepairWalletSummary;
      share_percent: number;
      rating_avg?: number | null;
      rating_count?: number;
      payouts: RepairPayout[];
    }>("GET", "/tech/wallet"),

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
  adminCreateTechnician: (body: RepairTechnicianInput) =>
    repairFetch<{ message: string; technician: RepairTechnician }>("POST", "/admin/technicians", { body }),
  adminUpdateTechnician: (id: number, body: RepairTechnicianInput) =>
    repairFetch<{ message: string; technician: RepairTechnician }>("PATCH", `/admin/technicians/${id}`, { body }),
  adminTechnicianPhoto: (id: number, photo: string) =>
    repairFetch<{ message: string; technician: RepairTechnician }>("POST", `/admin/technicians/${id}/photo`, {
      body: { photo },
    }),
  adminApproveTechnician: (id: number, body: { labor_share_percent?: number; service_ids?: number[] }) =>
    repairFetch<{ message: string; technician: RepairTechnician }>("POST", `/admin/technicians/${id}/approve`, { body }),
  adminRejectTechnician: (id: number, reason?: string) =>
    repairFetch<{ message: string; technician: RepairTechnician }>("POST", `/admin/technicians/${id}/reject`, {
      body: { reason },
    }),
  adminServices: () => repairFetch<{ services: RepairAdminService[] }>("GET", "/admin/services"),
  adminCreateService: (body: { name: string; is_active?: boolean; sort_order?: number }) =>
    repairFetch<{ message: string }>("POST", "/admin/services", { body }),
  adminUpdateService: (id: number, body: { name?: string; is_active?: boolean; sort_order?: number }) =>
    repairFetch<{ message: string }>("PATCH", `/admin/services/${id}`, { body }),
  adminDeleteService: (id: number) => repairFetch<{ message: string }>("DELETE", `/admin/services/${id}`),
  adminPayouts: (technicianId?: number | string) =>
    repairFetch<{ payouts: RepairPayout[] }>("GET", "/admin/payouts", { params: { technician_id: technicianId } }),
  adminCreatePayout: (body: { technician_id: number; amount: number; paid_on?: string; method?: string; note?: string }) =>
    repairFetch<{ message: string; payout: RepairPayout }>("POST", "/admin/payouts", { body }),
  adminDeletePayout: (id: number) => repairFetch<{ message: string }>("DELETE", `/admin/payouts/${id}`),
  adminBalances: () => repairFetch<{ rows: RepairBalanceRow[] }>("GET", "/admin/balances"),
  adminSettings: () => repairFetch<{ settings: RepairSettings }>("GET", "/admin/settings"),
  adminSaveSettings: (body: Record<string, string | boolean>) =>
    repairFetch<{ message: string; settings: RepairSettings }>("PUT", "/admin/settings", { body }),
  adminSmsSummary: () => repairFetch<RepairSmsSummary>("GET", "/admin/sms/summary"),
  adminSmsLogs: (params: { type?: string; status?: string; q?: string; page?: number }) =>
    repairFetch<{ logs: RepairSmsLog[]; meta: { current_page: number; last_page: number; total: number } }>(
      "GET",
      "/admin/sms/logs",
      { params },
    ),
  adminSmsRefreshStatus: (id: number) => repairFetch<{ log: RepairSmsLog }>("POST", `/admin/sms/logs/${id}/refresh-status`),
  adminSmsRefreshPending: () => repairFetch<{ message: string; updated: number }>("POST", "/admin/sms/logs/refresh-pending"),
  adminSmsOrders: () => repairFetch<{ orders: RepairSmsOrder[] }>("GET", "/admin/sms/orders"),
  adminSmsPurchase: (body: { package_id: number; gateway?: string; return_url: string }) =>
    repairFetch<{ payment_url: string; authority?: string }>("POST", "/admin/sms/purchase", { body }),
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

export function qrImageUrl(data: string, size = 280) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&format=png&data=${encodeURIComponent(data)}`;
}
