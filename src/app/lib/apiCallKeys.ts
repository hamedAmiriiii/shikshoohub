export const API_CALL_KEYS = ["auth_login", "auth_register", "user", "settings", "product_all"] as const;

export type ApiCallKey = (typeof API_CALL_KEYS)[number];

export const API_CALL_DEFS: Record<ApiCallKey, { method: string; path: string; title: string; hint: string }> = {
  auth_login: { method: "POST", path: "/api/auth/login", title: "ورود به پنل", hint: "هر بار زدن دکمه ورود" },
  auth_register: { method: "POST", path: "/api/auth/register", title: "ثبت‌نام فروشگاه", hint: "ساخت فروشگاه جدید" },
  user: { method: "GET", path: "/api/user", title: "باز شدن پنل ادمین", hint: "اولین درخواست بعد از باز کردن پنل" },
  settings: { method: "GET", path: "/api/settings", title: "تنظیمات فروشگاه", hint: "همراه باز شدن پنل خوانده می‌شود" },
  product_all: { method: "GET", path: "/api/product-all", title: "بارگذاری کالاهای صندوق", hint: "باز شدن صفحه فروش" },
};

export function isApiCallKey(value: unknown): value is ApiCallKey {
  return typeof value === "string" && (API_CALL_KEYS as readonly string[]).includes(value);
}

function pathOf(url: string): string {
  try {
    return new URL(url, "http://local").pathname.replace(/\/+$/, "") || "/";
  } catch {
    return url.split("?")[0].replace(/\/+$/, "");
  }
}

export function matchApiCallKey(method: string, url: string): ApiCallKey | null {
  const verb = method.toUpperCase();
  const path = pathOf(url);
  for (const key of API_CALL_KEYS) {
    const def = API_CALL_DEFS[key];
    if (def.method === verb && def.path === path) return key;
  }
  return null;
}
