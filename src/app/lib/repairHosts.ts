/** دامنه‌هایی که کل سایت‌شان سامانهٔ تعمیرات است. */
const BUILTIN_REPAIR_HOSTS = ["omidtamir.ir", "www.omidtamir.ir"];

export function repairHostNames(): Set<string> {
  const extra = (process.env.NEXT_PUBLIC_REPAIR_HOSTS || "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...BUILTIN_REPAIR_HOSTS, ...extra]);
}

export function isRepairHostname(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const names = repairHostNames();
  return raw.split(",").some((part) => {
    const host = part.trim().toLowerCase().replace(/:\d+$/, "");
    return host !== "" && names.has(host);
  });
}

/** مسیر معادل داخل اپ تعمیرات؛ null یعنی همین مسیر باید بماند. */
export function repairPathFor(pathname: string): string | null {
  if (pathname === "/repair" || pathname.startsWith("/repair/")) return null;
  if (pathname === "/api" || pathname.startsWith("/api/")) return null;
  if (pathname === "/pay" || pathname.startsWith("/pay/")) return null;
  return pathname === "/" ? "/repair" : `/repair${pathname}`;
}
