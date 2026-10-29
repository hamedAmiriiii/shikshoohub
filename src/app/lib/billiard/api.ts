const API_BASE = (
  process.env.NEXT_PUBLIC_BASE_URL || "https://api.webinoo-plus.ir"
).replace(/\/$/, "");

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}/api/billiard${p}`;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("billiard_token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("billiard_token", token);
  else localStorage.removeItem("billiard_token");
}

export type ApiError = { message?: string; status: number };

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (options.auth !== false) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(apiUrl(path), { ...options, headers });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text || "پاسخ نامعتبر" };
  }

  if (!res.ok) {
    const err: ApiError = {
      message: data?.message || "خطا در ارتباط با سرور",
      status: res.status,
    };
    throw err;
  }

  return data as T;
}

export const statusLabel: Record<string, string> = {
  pre_registration: "پیش‌ثبت‌نام",
  registration_open: "ثبت‌نام فعال",
  registration_closed: "ثبت‌نام بسته",
  drawn: "قرعه‌کشی‌شده",
  live: "در حال برگزاری",
  finished: "پایان‌یافته",
  cancelled: "لغو شده",
  scheduled: "برنامه‌ریزی‌شده",
  finished_match: "پایان‌یافته",
  walkover: "عدم حضور",
  pending: "در انتظار",
  confirmed: "تأیید شده",
  rejected: "رد شده",
  unpaid: "پرداخت‌نشده",
  paid: "پرداخت‌شده",
  waived: "رایگان",
  failed: "ناموفق",
};

/** برچسب وضعیت پرداخت (جدا از وضعیت ثبت‌نام تا «pending» اشتباه نشود) */
export const paymentStatusLabel: Record<string, string> = {
  unpaid: "پرداخت‌نشده",
  pending: "در انتظار پرداخت",
  paid: "پرداخت‌شده",
  waived: "رایگان",
  failed: "پرداخت ناموفق",
};

export function isRegistrationSettled(r: { payment_status?: string; status?: string }): boolean {
  return r.payment_status === "paid" || r.payment_status === "waived";
}

export function formatToman(n: number): string {
  return new Intl.NumberFormat("fa-IR").format(n) + " تومان";
}
