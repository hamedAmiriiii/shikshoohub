/** مسیرهایی که segment اول URL فروشگاه نیستند */
export const SHOP_RESERVED_SEGMENTS = new Set([
  "admin",
  "landing",
  "main",
  "offline",
  "show",
  "shotOut",
  "api",
  "_next",
  "favicon.ico",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "pic",
  "fonts",
  "login",
  "register",
  "cart",
  "orders",
  "product",
  "category",
]);

export interface ShopInfo {
  id?: number;
  name?: string;
  code?: string;
  address?: string;
  atelier_code?: string;
  shop_access_active?: boolean;
  [key: string]: unknown;
}

export function getShopCodeFromPathname(pathname: string | null | undefined): string | null {
  if (!pathname) return null;
  const segment = pathname.split("/").filter(Boolean)[0];
  if (!segment || SHOP_RESERVED_SEGMENTS.has(segment)) return null;
  return segment;
}

/** `/api/product` → `/api/milito/product` */
export function shopApiPath(shopCode: string, apiPath: string): string {
  const normalized = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
  if (normalized.startsWith("/api/geo/")) {
    return normalized;
  }
  if (normalized.startsWith(`/api/${shopCode}/`) || normalized === `/api/${shopCode}`) {
    return normalized;
  }
  if (normalized.startsWith("/api/")) {
    return `/api/${shopCode}${normalized.slice(4)}`;
  }
  return `/api/${shopCode}${normalized}`;
}

/** مسیر فرانت: `shopPath('milito', '/cart')` → `/milito/cart` */
export function shopPath(shopCode: string, path = ""): string {
  const suffix = path.startsWith("/") ? path : path ? `/${path}` : "";
  if (!suffix) return `/${shopCode}`;
  return `/${shopCode}${suffix}`;
}

export function customerTokenStorageKey(shopCode: string): string {
  return `customer_token_${shopCode}`;
}

export function customerDataStorageKey(shopCode: string): string {
  return `customer_data_${shopCode}`;
}

export function cartStorageKey(shopCode: string): string {
  return `shikshoo_cart_${shopCode}`;
}

export function getCustomerToken(shopCode: string): string | null {
  if (typeof window === "undefined") return null;
  const scoped = localStorage.getItem(customerTokenStorageKey(shopCode));
  if (scoped) return scoped;
  const legacy = localStorage.getItem("customer_token");
  return legacy;
}

export function setCustomerSession(
  shopCode: string,
  token: string,
  customer?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(customerTokenStorageKey(shopCode), token);
  if (customer) {
    localStorage.setItem(customerDataStorageKey(shopCode), JSON.stringify(customer));
  }
}

export function clearCustomerSession(shopCode: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(customerTokenStorageKey(shopCode));
  localStorage.removeItem(customerDataStorageKey(shopCode));
}

export const LAST_SHOP_CODE_KEY = "last_shop_code";

export function saveLastShopCode(shopCode: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_SHOP_CODE_KEY, shopCode);
}

export function getLastShopCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_SHOP_CODE_KEY);
}

/** از مسیر ریدایرکت مثل `/milito/cart` کد فروشگاه را می‌خواند */
export function getShopCodeFromRedirect(redirect: string): string | null {
  if (!redirect.startsWith("/")) return null;
  const segment = redirect.split("/").filter(Boolean)[0];
  if (!segment || SHOP_RESERVED_SEGMENTS.has(segment)) return null;
  return segment;
}

export function resolveCustomerShopCode(options: {
  explicitShop?: string | null;
  queryShop?: string | null;
  redirect?: string | null;
  /** فقط پس از hydration فعال شود تا SSR و کلاینت یکسان بمانند */
  includeStoredShop?: boolean;
}): string | null {
  const fromExplicit = options.explicitShop?.trim();
  if (fromExplicit) return fromExplicit;

  const fromQuery = options.queryShop?.trim();
  if (fromQuery) return fromQuery;

  const fromRedirect = options.redirect
    ? getShopCodeFromRedirect(options.redirect)
    : null;
  if (fromRedirect) return fromRedirect;

  if (options.includeStoredShop) {
    const fromStorage = getLastShopCode();
    if (fromStorage) return fromStorage;
  }

  const fromEnv = process.env.NEXT_PUBLIC_DEFAULT_SHOP?.trim();
  if (fromEnv) return fromEnv;

  return null;
}

/** مسیرهای ورود/ثبت‌نام مشتری (جدا از /admin/login) */
export function isCustomerAuthPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname === "/login" || pathname === "/register") return true;
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 2 && (parts[1] === "login" || parts[1] === "register")) {
    return !SHOP_RESERVED_SEGMENTS.has(parts[0]);
  }
  return false;
}

export function customerLoginPath(shopCode: string): string {
  return shopPath(shopCode, "/login");
}

export function customerRegisterPath(shopCode: string): string {
  return shopPath(shopCode, "/register");
}
