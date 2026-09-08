/**
 * Desktop / local-API mode: Laravel runs on loopback; internet is irrelevant.
 * Prefer window.webinooDesktop (Electron) or NEXT_PUBLIC_DESKTOP baked at build.
 */
export function isDesktopLocalMode(): boolean {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_DESKTOP === "1") {
    return true;
  }
  if (typeof window !== "undefined") {
    const w = window as Window & { webinooDesktop?: { isDesktop?: boolean } };
    if (w.webinooDesktop?.isDesktop) return true;
  }
  const apiBase = (process.env.NEXT_PUBLIC_BASE_URL || "").toLowerCase();
  return (
    apiBase.includes("127.0.0.1") ||
    apiBase.includes("localhost")
  );
}

/** For UI that historically used navigator.onLine (cloud PWA). Local API is always "up". */
export function isAppOnline(): boolean {
  if (isDesktopLocalMode()) return true;
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}
