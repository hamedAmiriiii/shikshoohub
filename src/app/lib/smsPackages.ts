export type SmsPackageOrderStatus = "pending" | "approved" | "rejected";

export type SmsPackage = {
  id: number;
  name?: string;
  title?: string;
  sms_count?: number;
  message_count?: number;
  price?: number;
  amount?: number;
  description?: string;
  is_active?: boolean;
};

export type SmsPackageOrder = {
  id: number;
  status?: SmsPackageOrderStatus | string;
  admin_note?: string | null;
  created_at?: string;
  updated_at?: string;
  shop_name?: string;
  atelier_name?: string;
  phone?: string;
  atelier_id?: number;
  sms_package_id?: number;
  package?: SmsPackage;
  sms_package?: SmsPackage;
  sms_count?: number;
  price_rial?: number;
};

export const SMS_PACKAGE_ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار تأیید",
  approved: "تأیید شده",
  rejected: "رد شده",
};

export function extractApiList<T>(res: unknown): T[] {
  if (!res || typeof res !== "object") return [];
  const obj = res as Record<string, unknown>;
  if (Array.isArray(obj.data)) return obj.data as T[];
  if (Array.isArray(obj)) return obj as T[];
  return [];
}

export function getSmsPackageName(pkg: SmsPackage | null | undefined): string {
  if (!pkg) return "—";
  return pkg.name || pkg.title || "بسته پیامک";
}

export function getSmsPackageCount(pkg: SmsPackage | null | undefined): number {
  if (!pkg) return 0;
  if (typeof pkg.sms_count === "number") return pkg.sms_count;
  if (typeof pkg.message_count === "number") return pkg.message_count;
  return 0;
}

export function getSmsPackagePrice(pkg: SmsPackage | null | undefined): number {
  if (!pkg) return 0;
  if (typeof pkg.price === "number") return pkg.price;
  if (typeof (pkg as { price_rial?: number }).price_rial === "number") {
    return (pkg as { price_rial: number }).price_rial;
  }
  if (typeof pkg.amount === "number") return pkg.amount;
  return 0;
}

export function getOrderPackage(order: SmsPackageOrder): SmsPackage | null {
  return order.package || order.sms_package || null;
}

export function getOrderShopName(order: SmsPackageOrder): string {
  return order.shop_name || order.atelier_name || "—";
}

export function getOrderSmsCount(order: SmsPackageOrder): number {
  if (typeof order.sms_count === "number") return order.sms_count;
  return getSmsPackageCount(getOrderPackage(order));
}

export function getOrderPrice(order: SmsPackageOrder): number {
  if (typeof order.price === "number") return order.price;
  return getSmsPackagePrice(getOrderPackage(order));
}

export function formatSmsPackageOrderStatus(status?: string): string {
  if (!status) return "—";
  return SMS_PACKAGE_ORDER_STATUS_LABELS[status] || status;
}
