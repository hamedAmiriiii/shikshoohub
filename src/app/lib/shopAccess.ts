import DateObject from "react-date-object";
import gregorian from "react-date-object/calendars/gregorian";
import persian from "react-date-object/calendars/persian";
import { isSuperAdminUser } from "@/app/lib/superAdmin";

function toEnglishDigits(value: string): string {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  return value
    .replace(/[۰-۹]/g, (ch) => String(persianDigits.indexOf(ch)))
    .replace(/[٠-٩]/g, (ch) => String(arabicDigits.indexOf(ch)));
}

export const SHOP_ACCESS_EXPIRED_EVENT = "shop-access-expired";
export const SHOP_ACCESS_CLEARED_EVENT = "shop-access-cleared";
export const SHOP_ACCESS_EXPIRED_STORAGE_KEY = "shop_access_expired";
export const SHOP_SUBSCRIPTION_URL = "/landing#pricing";

export interface ShopAccessInfo {
  shop_access_starts_at?: string;
  shop_access_ends_at?: string;
  shop_access_active?: boolean;
  shop_access_days_remaining?: number;
  shop_access_suspended?: boolean;
}

export function getShopAccessFromUser(user: Record<string, unknown> | null | undefined): ShopAccessInfo | null {
  if (!user) return null;
  const direct = user.shop_access as ShopAccessInfo | undefined;
  if (direct?.shop_access_ends_at || direct?.shop_access_days_remaining != null) return direct;
  const atelier = user.atelier as Record<string, unknown> | undefined;
  const fromAtelier = atelier?.shop_access as ShopAccessInfo | undefined;
  if (fromAtelier) return fromAtelier;
  if (user.shop_access_ends_at) {
    return {
      shop_access_starts_at: user.shop_access_starts_at as string | undefined,
      shop_access_ends_at: user.shop_access_ends_at as string | undefined,
      shop_access_active: user.shop_access_active as boolean | undefined,
      shop_access_days_remaining: user.shop_access_days_remaining as number | undefined,
      shop_access_suspended: user.shop_access_suspended as boolean | undefined,
    };
  }
  return null;
}

/** ISO یا «YYYY-MM-DD HH:mm:ss» → مقدار input[type=date] */
export function toDateInputValue(iso?: string | null): string {
  if (!iso) return "";
  const part = iso.trim().split(/[T ]/)[0];
  return /^\d{4}-\d{2}-\d{2}$/.test(part) ? part : "";
}

/** تاریخ API (میلادی) → DateObject شمسی برای DatePicker */
export function parseAccessEndToDateObject(iso?: string | null): DateObject | null {
  const gregorian = toDateInputValue(iso);
  if (!gregorian) return null;
  try {
    return new DateObject({ date: gregorian, format: "YYYY-MM-DD" }).convert(persian);
  } catch {
    return null;
  }
}

/**
 * مقدار DatePicker → میلادی برای API
 * همان فرمت input[type=date] قبلی: YYYY-MM-DD (مثلاً 2027-01-15)
 */
export function gregorianApiDateFromDateObject(
  value: DateObject | DateObject[] | null | undefined,
): string {
  if (!value || Array.isArray(value)) return "";
  try {
    const d = value instanceof DateObject ? value : new DateObject(value);
    const g = d.convert(gregorian);
    let ymd = toEnglishDigits(g.format("YYYY-MM-DD"));

    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
      const native = g.toDate?.();
      if (native instanceof Date && !Number.isNaN(native.getTime())) {
        ymd = native.toISOString().slice(0, 10);
      }
    }

    return /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd : "";
  } catch {
    return "";
  }
}

export function formatAccessEndDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso.replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

export function formatAccessStatus(access: ShopAccessInfo | null): string {
  if (!access) return "";
  if (access.shop_access_suspended) return "تعلیق شده";
  if (access.shop_access_active === false) return "منقضی";
  const days = access.shop_access_days_remaining;
  if (typeof days === "number") {
    if (days <= 0) return "منقضی";
    return `${days.toLocaleString("fa-IR")} روز مانده`;
  }
  if (access.shop_access_active) return "فعال";
  return "";
}

export function getAccessMenuSummary(access: ShopAccessInfo | null): string | null {
  if (!access?.shop_access_ends_at) return null;
  const end = formatAccessEndDate(access.shop_access_ends_at);
  const status = formatAccessStatus(access);
  if (status) return `  ${end} — ${status}`;
  return ` تا ${end}`;
}

export function mergeUserWithShopAccess(
  user: Record<string, unknown>,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const shopAccess =
    (payload.shop_access as ShopAccessInfo | undefined) ??
    getShopAccessFromUser(payload) ??
    getShopAccessFromUser(user);
  if (!shopAccess) return user;
  return { ...user, shop_access: shopAccess, ...shopAccess };
}

const EXPIRED_MESSAGE_HINTS = ["غیرفعال", "پایان رسیده", "منقضی"];

export function isShopAccessExpiredInfo(access: ShopAccessInfo | null): boolean {
  if (!access) return false;
  if (access.shop_access_suspended) return true;
  if (access.shop_access_active === false) return true;
  if (typeof access.shop_access_days_remaining === "number" && access.shop_access_days_remaining <= 0) {
    return true;
  }
  return false;
}

function messageIndicatesExpired(message: unknown): boolean {
  if (typeof message !== "string") return false;
  return EXPIRED_MESSAGE_HINTS.some((hint) => message.includes(hint));
}

/** پاسخ خطای API (۴۰۳ یا بدنهٔ شامل shop_access) */
export function isShopAccessForbiddenResponse(res: Record<string, unknown> | null | undefined): boolean {
  if (!res) return false;
  if (isSuperAdminUser()) return false;

  const status = res.statusCode ?? res.status;
  const access = getShopAccessFromUser(res);

  if (access && isShopAccessExpiredInfo(access)) return true;

  if (status === 403) {
    if (
      res.shop_access_active === false ||
      (typeof res.shop_access_days_remaining === "number" && res.shop_access_days_remaining <= 0)
    ) {
      return true;
    }
    if (messageIndicatesExpired(res.message)) return true;
    if (typeof res.errorText === "string") {
      try {
        const parsed = JSON.parse(res.errorText) as Record<string, unknown>;
        return isShopAccessForbiddenResponse(parsed);
      } catch {
        return messageIndicatesExpired(res.errorText);
      }
    }
  }

  return false;
}

export function readStoredShopAccessExpired(): ShopAccessInfo | null {
  if (typeof window === "undefined") return null;
  try {
    if (localStorage.getItem(SHOP_ACCESS_EXPIRED_STORAGE_KEY) !== "1") return null;
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return getShopAccessFromUser(user);
  } catch {
    return null;
  }
}

export function clearShopAccessExpiredState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SHOP_ACCESS_EXPIRED_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(SHOP_ACCESS_CLEARED_EVENT));
}

export function persistShopAccessExpired(payload: Record<string, unknown>): void {
  if (typeof window === "undefined" || isSuperAdminUser()) return;

  const accessPatch: ShopAccessInfo = {
    shop_access_starts_at: payload.shop_access_starts_at as string | undefined,
    shop_access_ends_at: payload.shop_access_ends_at as string | undefined,
    shop_access_active: payload.shop_access_active as boolean | undefined,
    shop_access_days_remaining: payload.shop_access_days_remaining as number | undefined,
    shop_access_suspended: payload.shop_access_suspended as boolean | undefined,
  };

  try {
    const raw = localStorage.getItem("user");
    const user = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const merged = mergeUserWithShopAccess(user, {
      ...accessPatch,
      shop_access: { ...getShopAccessFromUser(user), ...accessPatch },
      shop_access_active: accessPatch.shop_access_active ?? false,
      shop_access_days_remaining: accessPatch.shop_access_days_remaining ?? 0,
    });
    localStorage.setItem("user", JSON.stringify(merged));
    localStorage.setItem(SHOP_ACCESS_EXPIRED_STORAGE_KEY, "1");
    window.dispatchEvent(
      new CustomEvent(SHOP_ACCESS_EXPIRED_EVENT, { detail: getShopAccessFromUser(merged) }),
    );
  } catch {
    localStorage.setItem(SHOP_ACCESS_EXPIRED_STORAGE_KEY, "1");
    window.dispatchEvent(new CustomEvent(SHOP_ACCESS_EXPIRED_EVENT, { detail: accessPatch }));
  }
}

export function notifyShopAccessIfExpired(res: Record<string, unknown> | null | undefined): void {
  if (!isShopAccessForbiddenResponse(res)) return;
  persistShopAccessExpired(res as Record<string, unknown>);
}

export function syncShopAccessFromLogin(payload: Record<string, unknown>): void {
  const access = getShopAccessFromUser(payload);
  if (access && isShopAccessExpiredInfo(access)) {
    persistShopAccessExpired(payload);
    return;
  }
  clearShopAccessExpiredState();
}
