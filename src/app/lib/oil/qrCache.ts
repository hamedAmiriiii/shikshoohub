import { oilQrImageUrl, oilShopLandingUrl } from "./api";

const CACHE_KEY = "oil_qr_cache_v1";

type OilQrCacheEntry = {
  shopCode: string;
  landingUrl: string;
  size: number;
  dataUrl: string;
};

function readCache(): OilQrCacheEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OilQrCacheEntry;
    if (
      !parsed ||
      typeof parsed.shopCode !== "string" ||
      typeof parsed.landingUrl !== "string" ||
      typeof parsed.dataUrl !== "string" ||
      typeof parsed.size !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(entry: OilQrCacheEntry) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    /* quota / private mode */
  }
}

export function clearOilQrCache() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHE_KEY);
}

export function peekOilQrCache(shopCode: string, size = 280): string | null {
  const landingUrl = oilShopLandingUrl(shopCode);
  const cached = readCache();
  if (
    cached &&
    cached.shopCode === shopCode &&
    cached.landingUrl === landingUrl &&
    cached.size === size &&
    cached.dataUrl
  ) {
    return cached.dataUrl;
  }
  return null;
}

export async function loadOilQrDataUrl(shopCode: string, size = 280): Promise<string> {
  const landingUrl = oilShopLandingUrl(shopCode);
  const hit = peekOilQrCache(shopCode, size);
  if (hit) return hit;

  const remote = oilQrImageUrl(landingUrl, size);
  const res = await fetch(remote);
  if (!res.ok) throw new Error("qr fetch failed");
  const text = await res.text();
  if (!/<svg/i.test(text)) throw new Error("qr svg invalid");
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
  writeCache({ shopCode, landingUrl, size, dataUrl });
  return dataUrl;
}

export function oilQrLandingUrl(shopCode: string) {
  return oilShopLandingUrl(shopCode);
}

export function downloadOilQr(dataUrl: string, shopCode: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `oil-qr-${shopCode}.svg`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
