import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import tokenCode from "@/app/coponent/tokenCode";
import { mergeUserWithShopAccess, syncShopAccessFromLogin } from "@/app/lib/shopAccess";
import { mergeUserWithShopPermissions } from "@/app/lib/shopPermissions";
import { mergeUserWithShopFeatures, SHOP_FEATURES_CHANGED_EVENT } from "@/app/lib/shopFeatures";

export type AuditorShop = {
  atelier_id: number;
  code: string | null;
  name: string | null;
  auditor_label: string | null;
  shop_access_active: boolean;
};

export function parseAuditorShops(raw: unknown): AuditorShop[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as Record<string, unknown>).shops)
      ? ((raw as Record<string, unknown>).shops as unknown[])
      : [];
  return list
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      atelier_id: Number(item.atelier_id),
      code: typeof item.code === "string" ? item.code : null,
      name: typeof item.name === "string" ? item.name : null,
      auditor_label: typeof item.auditor_label === "string" ? item.auditor_label : null,
      shop_access_active: item.shop_access_active !== false,
    }))
    .filter((shop) => Number.isFinite(shop.atelier_id) && shop.atelier_id > 0);
}

/** پاسخ نشست (لاگین یا انتخاب فروشگاه) را مثل صفحهٔ ورود در localStorage می‌نویسد */
export function persistShopSessionPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const rawUser = (payload.user as Record<string, unknown>) || {};
  const user = mergeUserWithShopFeatures(
    mergeUserWithShopPermissions(mergeUserWithShopAccess(rawUser, payload), payload),
    payload,
  );
  localStorage.setItem("user", JSON.stringify(user));
  window.dispatchEvent(new CustomEvent(SHOP_FEATURES_CHANGED_EVENT));
  syncShopAccessFromLogin(payload);
  return user;
}

export async function fetchAuditorShops(): Promise<{ shops: AuditorShop[]; currentAtelierId: number | null; error?: string }> {
  const res = await FetchWithJwtClient("GET", "/api/auditor/shops", tokenCode());
  if (!res || res.hasError) {
    return { shops: [], currentAtelierId: null, error: String(res?.message || "خطا در دریافت فروشگاه‌ها") };
  }
  const current = Number(res.current_atelier_id);
  return {
    shops: parseAuditorShops(res),
    currentAtelierId: Number.isFinite(current) && current > 0 ? current : null,
  };
}

export async function selectAuditorShop(
  atelierId: number,
): Promise<{ user?: Record<string, unknown>; error?: string }> {
  const res = await FetchWithJwtClient("POST", `/api/auditor/shops/${atelierId}/select`, tokenCode(), {}, {
    body: JSON.stringify({}),
  });
  if (!res || res.hasError) {
    return { error: String(res?.message || "خطا در انتخاب فروشگاه") };
  }
  return { user: persistShopSessionPayload(res as Record<string, unknown>) };
}
