export type ShopServiceIconKey =
  | "cleaning"
  | "blanket"
  | "towel"
  | "water"
  | "pillow"
  | "iron"
  | "laundry"
  | "maintenance"
  | "wifi"
  | "other";

export type ShopService = {
  id: number;
  name: string;
  description?: string | null;
  icon_key?: ShopServiceIconKey | string;
  sort_order?: number;
  is_active?: boolean;
  price?: number;
  is_free?: boolean;
};

export type TableServiceRequest = {
  id: number;
  status?: string;
  status_label?: string;
  service_id?: number | null;
  name?: string;
  icon_key?: string;
  note?: string | null;
  phone?: string | null;
  table_label?: string | null;
  table_number?: number | null;
  created_at?: string;
  scheduled_at?: string | null;
  done_at?: string | null;
};

export const SHOP_SERVICE_ICONS: { key: ShopServiceIconKey; emoji: string; label: string }[] = [
  { key: "cleaning", emoji: "✨", label: "نظافت" },
  { key: "blanket", emoji: "🛏️", label: "پتو" },
  { key: "towel", emoji: "🛁", label: "حوله" },
  { key: "water", emoji: "💧", label: "آب" },
  { key: "pillow", emoji: "🛌", label: "بالش" },
  { key: "iron", emoji: "👔", label: "اتو" },
  { key: "laundry", emoji: "👕", label: "رختشویی" },
  { key: "maintenance", emoji: "🔧", label: "تعمیر" },
  { key: "wifi", emoji: "📶", label: "اینترنت" },
  { key: "other", emoji: "🛎️", label: "سایر" },
];

export const SUGGESTED_SHOP_SERVICES: Array<{ name: string; description: string; icon_key: ShopServiceIconKey }> = [
  { name: "تمیز کردن اتاق", description: "نظافت و مرتب‌کردن اتاق", icon_key: "cleaning" },
  { name: "پتوی جدید", description: "آوردن پتو یا روانداز اضافه", icon_key: "blanket" },
  { name: "حوله اضافه", description: "حوله تمیز برای حمام", icon_key: "towel" },
  { name: "آب معدنی", description: "چند بطری آب برای اتاق", icon_key: "water" },
  { name: "بالش اضافه", description: "بالش بیشتر برای مهمان", icon_key: "pillow" },
];

export function shopServiceEmoji(iconKey?: string | null): string {
  return SHOP_SERVICE_ICONS.find((item) => item.key === iconKey)?.emoji || "🛎️";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asBool(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

export function extractShopServices(res: unknown): ShopService[] {
  const obj = asRecord(res);
  const list = Array.isArray(res)
    ? res
    : Array.isArray(obj?.services)
      ? obj.services
      : Array.isArray(obj?.data)
        ? obj.data
        : [];
  return list.filter((item): item is ShopService => Boolean(asRecord(item)?.id));
}

export function extractRoomServicesEnabled(res: unknown): boolean {
  const obj = asRecord(res);
  if (!obj) return false;
  if (obj.enabled != null) return asBool(obj.enabled);
  const nested = asRecord(obj.settings);
  if (nested?.room_services_enabled != null) return asBool(nested.room_services_enabled);
  return asBool(obj.room_services_enabled);
}

export function extractTableServiceRequests(res: unknown): TableServiceRequest[] {
  const obj = asRecord(res);
  const list = Array.isArray(res)
    ? res
    : Array.isArray(obj?.requests)
      ? obj.requests
      : Array.isArray(obj?.data)
        ? obj.data
        : [];
  return list.filter((item): item is TableServiceRequest => Boolean(asRecord(item)?.id));
}
