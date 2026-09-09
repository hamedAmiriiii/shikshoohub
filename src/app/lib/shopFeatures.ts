export const SHOP_FEATURES_CHANGED_EVENT = "shop-features-changed";

export type ShopFeatures = {
  restaurant_cafe_enabled: boolean;
  room_services_enabled: boolean;
  produced_goods_enabled: boolean;
  accounting_enabled: boolean;
};

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

export function normalizeShopFeatures(raw: unknown): ShopFeatures {
  const obj = asRecord(raw);
  const nested = asRecord(obj?.shop_features) ?? obj;
  if (!nested) return { ...DEFAULT_FEATURES };
  return {
    restaurant_cafe_enabled: asBool(nested.restaurant_cafe_enabled),
    room_services_enabled: asBool(nested.room_services_enabled),
    produced_goods_enabled: asBool(nested.produced_goods_enabled),
    accounting_enabled: asBool(nested.accounting_enabled),
  };
}

export function getShopFeaturesFromUser(user?: Record<string, unknown> | null): ShopFeatures {
  if (!user) return { ...DEFAULT_FEATURES };
  const fromRoot = asRecord(user.shop_features);
  if (fromRoot) return normalizeShopFeatures(fromRoot);
  const atelier = asRecord(user.atelier);
  if (atelier?.shop_features) return normalizeShopFeatures(atelier.shop_features);
  return normalizeShopFeatures(user);
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

export function mergeUserWithShopFeatures(
  user: Record<string, unknown>,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const features = normalizeShopFeatures(
    payload.shop_features ?? asRecord(payload.user)?.shop_features ?? user.shop_features ?? payload,
  );
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
