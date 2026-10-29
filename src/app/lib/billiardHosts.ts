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

/** مسیر معادل داخل اپ بیلیارد؛ null یعنی همین مسیر باید بماند. */
export function billiardPathFor(pathname: string): string | null {
  if (pathname === "/billiard" || pathname.startsWith("/billiard/")) return null;
  if (pathname === "/api" || pathname.startsWith("/api/")) return null;
  if (pathname === "/pay" || pathname.startsWith("/pay/")) return null;
  return pathname === "/" ? "/billiard" : `/billiard${pathname}`;
}

export const BILLIARD_BASE = "/billiard";

/** لینک داخلی اپ بیلیارد با پیشوند /billiard */
export function billiardHref(path = "/"): string {
  if (!path || path === "/") return BILLIARD_BASE;
  if (path.startsWith("/billiard/") || path === "/billiard") return path;
  return `${BILLIARD_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
