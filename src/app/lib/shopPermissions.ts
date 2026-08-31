import { useCallback, useEffect, useState } from "react";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import tokenCode from "@/app/coponent/tokenCode";
import { isSuperAdminUser } from "@/app/lib/superAdmin";

export const SHOP_PERMISSION_CATALOG = [
  { key: "dashboard", title: "داشبورد" },
  { key: "pos", title: "فروش صندوق" },
  { key: "products", title: "کالاها" },
  { key: "categories", title: "دسته‌بندی" },
  { key: "manufacturers", title: "تولیدکننده" },
  { key: "customers", title: "مشتریان" },
  { key: "invoices", title: "فاکتورها" },
  { key: "expenses", title: "هزینه‌ها" },
  { key: "cheques", title: "چک‌ها" },
  { key: "manual_trades", title: "خرید و فروش دستی" },
  { key: "raw_materials", title: "مواد اولیه" },
  { key: "produced_goods", title: "کالای تولیدی" },
  { key: "shop_accounts", title: "حساب‌ها و تنخواه" },
  { key: "daily_reconciliations", title: "تطبیق روزانه" },
  { key: "employees", title: "کارمندان و حقوق" },
  { key: "shop_tables", title: "میز و سفارش میز" },
  { key: "settings", title: "تنظیمات فروشگاه" },
  { key: "reports", title: "گزارش مالی" },
  { key: "accounting", title: "حسابداری" },
  { key: "shop_sms", title: "پیامک فروشگاه" },
  { key: "backup", title: "پشتیبان‌گیری" },
  { key: "online_orders", title: "سفارش آنلاین" },
  { key: "returns", title: "مرجوعی" },
  { key: "debts", title: "نسیه و بدهی" },
  { key: "installments", title: "اقساط" },
  { key: "referral", title: "معرفی فروشگاه" },
] as const;

export type ShopPermissionKey = (typeof SHOP_PERMISSION_CATALOG)[number]["key"];

export type ShopPermissionItem = {
  key: string;
  title: string;
};

const TITLE_BY_KEY: Record<string, string> = Object.fromEntries(
  SHOP_PERMISSION_CATALOG.map((item) => [item.key, item.title]),
);

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/register-shop"];

const SUPER_ADMIN_PATHS = [
  "/admin/shop-sms-quota",
  "/admin/sms-package-orders",
  "/admin/agency-requests",
];

/** طولانی‌ترین پیشوند اول اعمال می‌شود */
const ROUTE_PERMISSIONS: { prefix: string; keys: ShopPermissionKey[] }[] = [
  { prefix: "/admin/payroll/employees", keys: ["employees"] },
  { prefix: "/admin/payroll/settings", keys: ["employees"] },
  { prefix: "/admin/payroll", keys: ["employees"] },
  { prefix: "/admin/product/create", keys: ["products"] },
  { prefix: "/admin/product/import", keys: ["products"] },
  { prefix: "/admin/product", keys: ["products"] },
  { prefix: "/admin/categories", keys: ["categories"] },
  { prefix: "/admin/manufacturers", keys: ["manufacturers"] },
  { prefix: "/admin/customers", keys: ["customers"] },
  { prefix: "/admin/invoices", keys: ["invoices"] },
  { prefix: "/admin/beneficiaries", keys: ["invoices", "expenses"] },
  { prefix: "/admin/expenses-statistics", keys: ["expenses"] },
  { prefix: "/admin/expenses", keys: ["expenses"] },
  { prefix: "/admin/cheques", keys: ["cheques"] },
  { prefix: "/admin/manual-trades", keys: ["manual_trades"] },
  { prefix: "/admin/production", keys: ["produced_goods", "raw_materials"] },
  { prefix: "/admin/shop-accounts", keys: ["shop_accounts"] },
  { prefix: "/admin/petty-cash", keys: ["shop_accounts"] },
  { prefix: "/admin/daily-reconciliation", keys: ["daily_reconciliations"] },
  { prefix: "/admin/shop-tables", keys: ["shop_tables"] },
  { prefix: "/admin/table-orders", keys: ["shop_tables"] },
  { prefix: "/admin/settings", keys: ["settings", "backup"] },
  { prefix: "/admin/reports", keys: ["reports"] },
  { prefix: "/admin/profit-loss", keys: ["reports"] },
  { prefix: "/admin/accounting", keys: ["accounting"] },
  { prefix: "/admin/shop-sms-logs", keys: ["shop_sms"] },
  { prefix: "/admin/broadcast-sms", keys: ["shop_sms"] },
  { prefix: "/admin/sms-packages", keys: ["shop_sms"] },
  { prefix: "/admin/orders", keys: ["online_orders"] },
  { prefix: "/admin/returned-products", keys: ["returns"] },
  { prefix: "/admin/purchase-debts", keys: ["debts"] },
  { prefix: "/admin/installment-credits", keys: ["installments"] },
  { prefix: "/admin/installments", keys: ["installments"] },
  { prefix: "/admin/referral", keys: ["referral"] },
  { prefix: "/admin/inventory", keys: ["products"] },
  { prefix: "/admin/best-selling", keys: ["products"] },
  { prefix: "/admin/bulk-discount", keys: ["products"] },
  { prefix: "/admin/purchas", keys: ["pos"] },
  { prefix: "/admin/pending-purchases", keys: ["pos"] },
  { prefix: "/admin/print", keys: ["pos"] },
  { prefix: "/admin", keys: ["pos", "dashboard"] },
];

const FIRST_ALLOWED_PATHS: { path: string; keys: ShopPermissionKey[] }[] = [
  { path: "/admin", keys: ["pos", "dashboard"] },
  { path: "/admin/product", keys: ["products"] },
  { path: "/admin/purchas", keys: ["pos"] },
  { path: "/admin/customers", keys: ["customers"] },
  { path: "/admin/orders", keys: ["online_orders"] },
  { path: "/admin/invoices", keys: ["invoices"] },
  { path: "/admin/beneficiaries", keys: ["invoices", "expenses"] },
  { path: "/admin/expenses", keys: ["expenses"] },
  { path: "/admin/reports", keys: ["reports"] },
  { path: "/admin/accounting", keys: ["accounting"] },
  { path: "/admin/payroll", keys: ["employees"] },
  { path: "/admin/settings", keys: ["settings", "backup"] },
  { path: "/admin/cheques", keys: ["cheques"] },
  { path: "/admin/manual-trades", keys: ["manual_trades"] },
  { path: "/admin/production", keys: ["produced_goods", "raw_materials"] },
  { path: "/admin/shop-accounts", keys: ["shop_accounts"] },
  { path: "/admin/daily-reconciliation", keys: ["daily_reconciliations"] },
  { path: "/admin/shop-tables", keys: ["shop_tables"] },
  { path: "/admin/shop-sms-logs", keys: ["shop_sms"] },
  { path: "/admin/returned-products", keys: ["returns"] },
  { path: "/admin/purchase-debts", keys: ["debts"] },
  { path: "/admin/installments", keys: ["installments"] },
  { path: "/admin/referral", keys: ["referral"] },
  { path: "/admin/categories", keys: ["categories"] },
  { path: "/admin/manufacturers", keys: ["manufacturers"] },
];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asBool(value: unknown): boolean | null {
  if (value === true || value === 1 || value === "1" || value === "true") return true;
  if (value === false || value === 0 || value === "0") return false;
  return null;
}

export function permissionTitle(key: string): string {
  return TITLE_BY_KEY[key] || key;
}

export function normalizePermissionKeys(raw: unknown): string[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      return normalizePermissionKeys(JSON.parse(trimmed));
    } catch {
      return trimmed.includes(",")
        ? Array.from(new Set(trimmed.split(",").map((item) => item.trim()).filter(Boolean)))
        : [trimmed];
    }
  }
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(asRecord(raw)?.data)
      ? (asRecord(raw)!.data as unknown[])
      : Array.isArray(asRecord(raw)?.permissions)
        ? (asRecord(raw)!.permissions as unknown[])
        : [];
  const keys: string[] = [];
  for (const item of list) {
    if (typeof item === "string" && item.trim()) {
      keys.push(item.trim());
      continue;
    }
    const obj = asRecord(item);
    const key = obj?.key ?? obj?.name ?? obj?.permission;
    if (typeof key === "string" && key.trim()) keys.push(key.trim());
  }
  return Array.from(new Set(keys));
}

export function parseShopPermissionsCatalog(res: unknown): ShopPermissionItem[] {
  const obj = asRecord(res);
  const nested = asRecord(obj?.data);
  const rawList =
    (Array.isArray(res) ? res : null) ??
    (Array.isArray(obj?.data) ? obj!.data : null) ??
    (Array.isArray(obj?.permissions) ? obj!.permissions : null) ??
    (Array.isArray(nested?.permissions) ? nested!.permissions : null) ??
    [];

  const parsed: ShopPermissionItem[] = [];
  for (const item of rawList as unknown[]) {
    if (typeof item === "string" && item.trim()) {
      parsed.push({ key: item.trim(), title: permissionTitle(item.trim()) });
      continue;
    }
    const rec = asRecord(item);
    const key = String(rec?.key ?? rec?.name ?? rec?.permission ?? "").trim();
    if (!key) continue;
    const title = String(rec?.title ?? rec?.label ?? rec?.name ?? permissionTitle(key));
    parsed.push({ key, title: title === key ? permissionTitle(key) : title });
  }

  if (parsed.length === 0) return [...SHOP_PERMISSION_CATALOG];

  const seen = new Set(parsed.map((item) => item.key));
  for (const item of SHOP_PERMISSION_CATALOG) {
    if (!seen.has(item.key)) parsed.push(item);
  }
  return parsed;
}

export async function fetchShopPermissionsCatalog(): Promise<ShopPermissionItem[]> {
  const token = tokenCode();
  if (!token) return [...SHOP_PERMISSION_CATALOG];
  const res = await FetchWithJwtClient("GET", "/api/shop-permissions", token);
  if (res?.hasError) return [...SHOP_PERMISSION_CATALOG];
  return parseShopPermissionsCatalog(res);
}

export function getStoredUser(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function mergeUserWithShopPermissions(
  user: Record<string, unknown>,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const isOwner =
    asBool(payload.shop_is_owner) ??
    asBool(asRecord(payload.user)?.shop_is_owner) ??
    asBool(user.shop_is_owner);
  const permissionsRaw =
    payload.shop_permissions ??
    asRecord(payload.user)?.shop_permissions ??
    user.shop_permissions ??
    user.permissions;
  const permissions = permissionsRaw != null ? normalizePermissionKeys(permissionsRaw) : null;
  return {
    ...user,
    ...(isOwner != null ? { shop_is_owner: isOwner } : {}),
    ...(permissions != null ? { shop_permissions: permissions } : {}),
  };
}

export function isShopOwner(user?: Record<string, unknown> | null): boolean {
  const u = user ?? getStoredUser();
  if (!u) return false;
  const flagged = asBool(u.shop_is_owner);
  if (flagged != null) return flagged;
  if (u.shop_permissions != null) return false;
  return true;
}

export function getShopPermissionKeys(user?: Record<string, unknown> | null): string[] {
  const u = user ?? getStoredUser();
  if (!u) return [];
  return normalizePermissionKeys(u.shop_permissions ?? u.permissions);
}

export function hasShopPermission(key: string, user?: Record<string, unknown> | null): boolean {
  if (isSuperAdminUser()) return true;
  if (isShopOwner(user)) return true;
  return getShopPermissionKeys(user).includes(key);
}

export function hasAnyShopPermission(
  keys: string | string[] | undefined | null,
  user?: Record<string, unknown> | null,
): boolean {
  if (!keys) return true;
  const list = Array.isArray(keys) ? keys : [keys];
  if (list.length === 0) return true;
  return list.some((key) => hasShopPermission(key, user));
}

function pathMatches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isPublicAdminPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return PUBLIC_ADMIN_PATHS.some((path) => pathMatches(pathname, path));
}

export function getRequiredPermissionKeys(pathname: string | null | undefined): ShopPermissionKey[] {
  if (!pathname) return [];
  const sorted = [...ROUTE_PERMISSIONS].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const route of sorted) {
    if (pathMatches(pathname, route.prefix)) return [...route.keys];
  }
  return [];
}

export function canAccessAdminPath(
  pathname: string | null | undefined,
  user?: Record<string, unknown> | null,
): boolean {
  if (!pathname || isPublicAdminPath(pathname)) return true;
  if (SUPER_ADMIN_PATHS.some((path) => pathMatches(pathname, path))) {
    return isSuperAdminUser();
  }
  if (isSuperAdminUser() || isShopOwner(user)) return true;
  const keys = getRequiredPermissionKeys(pathname);
  if (keys.length === 0) return true;
  if (hasAnyShopPermission(keys, user)) return true;
  if (pathname === "/admin" || pathname === "/admin/") {
    const hasOtherPage = FIRST_ALLOWED_PATHS.slice(1).some((item) =>
      hasAnyShopPermission(item.keys, user),
    );
    return !hasOtherPage;
  }
  return false;
}

export function getFirstAllowedAdminPath(user?: Record<string, unknown> | null): string {
  if (isSuperAdminUser() || isShopOwner(user)) return "/admin";
  for (const item of FIRST_ALLOWED_PATHS) {
    if (hasAnyShopPermission(item.keys, user)) return item.path;
  }
  return "/admin";
}

/** تا بعد از mount فیلتر نکن تا SSR و hydrate یکی باشند */
export function useShopPermissionGate() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  const can = useCallback(
    (keys?: string | string[] | null) => !ready || hasAnyShopPermission(keys),
    [ready],
  );
  return {
    ready,
    can,
    isOwner: !ready || isShopOwner(),
  };
}
