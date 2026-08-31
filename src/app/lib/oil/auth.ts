import type { OilSession } from "./types";

export const OIL_TOKEN_KEY = "oil_token";
const OIL_SESSION_KEY = "oil_session";

export function getOilToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(OIL_TOKEN_KEY);
  return token && token.trim() ? token : null;
}

export function getOilSession(): OilSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(OIL_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OilSession;
  } catch {
    return null;
  }
}

export function saveOilSession(session: OilSession, token?: string): void {
  const nextToken = token || session.token || getOilToken();
  if (nextToken) localStorage.setItem(OIL_TOKEN_KEY, nextToken);
  const stored: OilSession = {
    project_type: "oil",
    user: session.user,
    shop: session.shop,
    shop_access: session.shop_access,
    sms: session.sms,
  };
  localStorage.setItem(OIL_SESSION_KEY, JSON.stringify(stored));
}

export function clearOilSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(OIL_TOKEN_KEY);
  localStorage.removeItem(OIL_SESSION_KEY);
}

export function isOilShopAccessActive(session: OilSession | null): boolean {
  return Boolean(session?.shop_access?.shop_access_active);
}
