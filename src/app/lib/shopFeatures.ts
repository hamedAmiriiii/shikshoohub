export const SHOP_FEATURES_CHANGED_EVENT = "shop-features-changed";

export type ShopFeatures = {
  restaurant_cafe_enabled: boolean;
  room_services_enabled: boolean;
  produced_goods_enabled: boolean;
  accounting_enabled: boolean;
};

const FEATURE_KEYS = [
  "restaurant_cafe_enabled",
  "room_services_enabled",
  "produced_goods_enabled",
  "accounting_enabled",
] as const;

const DEFAULT_FEATURES: ShopFeatures = {
  restaurant_cafe_enabled: false,
  room_services_enabled: false,
  produced_goods_enabled: false,
  accounting_enabled: false,
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asBool(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true" || value === "yes" || value === "on";
}

function hasAnyFeatureKey(obj: Record<string, unknown>): boolean {
  return FEATURE_KEYS.some((key) => key in obj);
}

function pickFeatureSource(payload: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!payload) return null;
  const nested = asRecord(payload.shop_features);
  if (nested && hasAnyFeatureKey(nested)) return nested;
  const user = asRecord(payload.user);
  const fromUser = asRecord(user?.shop_features);
  if (fromUser && hasAnyFeatureKey(fromUser)) return fromUser;
  const atelier = asRecord(payload.atelier) ?? asRecord(user?.atelier);
  const fromAtelier = asRecord(atelier?.shop_features);
  if (fromAtelier && hasAnyFeatureKey(fromAtelier)) return fromAtelier;
  if (hasAnyFeatureKey(payload)) return payload;
  if (user && hasAnyFeatureKey(user)) return user;
  return null;
}

export function normalizeShopFeatures(raw: unknown): ShopFeatures {
  const obj = asRecord(raw);
  if (!obj) return { ...DEFAULT_FEATURES };
  const nested = asRecord(obj.shop_features);
  const source = nested && hasAnyFeatureKey(nested) ? nested : obj;
  return {
    restaurant_cafe_enabled: asBool(source.restaurant_cafe_enabled),
    room_services_enabled: asBool(source.room_services_enabled),
    produced_goods_enabled: asBool(source.produced_goods_enabled),
    accounting_enabled: asBool(source.accounting_enabled),
  };
}

export function getShopFeaturesFromUser(user?: Record<string, unknown> | null): ShopFeatures {
  if (!user) return { ...DEFAULT_FEATURES };
  const source = pickFeatureSource(user);
  if (source) return normalizeShopFeatures(source);
  return { ...DEFAULT_FEATURES };
}

export function readShopFeatures(): ShopFeatures {
  if (typeof window === "undefined") return { ...DEFAULT_FEATURES };
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return { ...DEFAULT_FEATURES };
    return getShopFeaturesFromUser(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return { ...DEFAULT_FEATURES };
  }
}

function writeUserShopFeatures(features: ShopFeatures): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("user");
    const current = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const atelier = asRecord(current.atelier);
    localStorage.setItem(
      "user",
      JSON.stringify({
        ...current,
        shop_features: features,
        ...(atelier ? { atelier: { ...atelier, shop_features: features } } : {}),
      }),
    );
    window.dispatchEvent(new CustomEvent(SHOP_FEATURES_CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

export function persistShopFeaturesFromPayload(payload: Record<string, unknown>): void {
  const source = pickFeatureSource(payload);
  if (!source) return;
  writeUserShopFeatures(normalizeShopFeatures(source));
}

export function mergeUserWithShopFeatures(
  user: Record<string, unknown>,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const source = pickFeatureSource(payload) ?? pickFeatureSource(user);
  const features = source ? normalizeShopFeatures(source) : getShopFeaturesFromUser(user);
  const atelier = asRecord(user.atelier);
  return {
    ...user,
    shop_features: features,
    ...(atelier ? { atelier: { ...atelier, shop_features: features } } : {}),
  };
}

export function shopFeatureAllowsPath(
  pathname: string | null | undefined,
  user?: Record<string, unknown> | null,
): boolean {
  if (!pathname) return true;
  const features = user ? getShopFeaturesFromUser(user) : readShopFeatures();
  if (pathname === "/admin/accounting" || pathname.startsWith("/admin/accounting/")) {
    return features.accounting_enabled;
  }
  if (pathname === "/admin/production" || pathname.startsWith("/admin/production/")) {
    return features.produced_goods_enabled;
  }
  if (pathname === "/admin/table-orders" || pathname.startsWith("/admin/table-orders/")) {
    return features.restaurant_cafe_enabled;
  }
  if (pathname === "/admin/shop-services" || pathname.startsWith("/admin/shop-services/")) {
    return features.room_services_enabled;
  }
  if (pathname === "/admin/shop-tables" || pathname.startsWith("/admin/shop-tables/")) {
    return features.restaurant_cafe_enabled || features.room_services_enabled;
  }
  return true;
}
