/** دامنه‌هایی که کل سایت‌شان سامانهٔ مسابقات بیلیارد است. */
const BUILTIN_BILLIARD_HOSTS = [
  "billiard.webinoplus.ir",
  "www.billiard.webinoplus.ir",
];

export function billiardHostNames(): Set<string> {
  const extra = (process.env.NEXT_PUBLIC_BILLIARD_HOSTS || "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...BUILTIN_BILLIARD_HOSTS, ...extra]);
}

export function isBilliardHostname(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const names = billiardHostNames();
  return raw.split(",").some((part) => {
    const host = part.trim().toLowerCase().replace(/:\d+$/, "");
    return host !== "" && names.has(host);
  });
}

/** مسیر عمومی اپ بیلیارد (آدرس مرورگر). پوشهٔ داخلی Next همچنان app/billiard است. */
export const BILLIARD_BASE = "/billiardkerman";

/** مسیر معادل داخل اپ بیلیارد؛ null یعنی همین مسیر باید بماند. */
export function billiardPathFor(pathname: string): string | null {
  if (pathname === BILLIARD_BASE || pathname.startsWith(`${BILLIARD_BASE}/`)) return null;
  // لینک‌های قدیمی /billiard → /billiardkerman
  if (pathname === "/billiard" || pathname.startsWith("/billiard/")) {
    return pathname.replace(/^\/billiard(?=\/|$)/, BILLIARD_BASE);
  }
  if (pathname === "/api" || pathname.startsWith("/api/")) return null;
  if (pathname === "/pay" || pathname.startsWith("/pay/")) return null;
  return pathname === "/" ? BILLIARD_BASE : `${BILLIARD_BASE}${pathname}`;
}

/** لینک داخلی اپ بیلیارد با پیشوند /billiardkerman */
export function billiardHref(path = "/"): string {
  if (!path || path === "/") return BILLIARD_BASE;
  if (path === BILLIARD_BASE || path.startsWith(`${BILLIARD_BASE}/`)) return path;
  if (path === "/billiard" || path.startsWith("/billiard/")) {
    return path.replace(/^\/billiard(?=\/|$)/, BILLIARD_BASE);
  }
  return `${BILLIARD_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export function isBilliardAppPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return (
    pathname === BILLIARD_BASE ||
    pathname.startsWith(`${BILLIARD_BASE}/`) ||
    pathname === "/billiard" ||
    pathname.startsWith("/billiard/")
  );
}
