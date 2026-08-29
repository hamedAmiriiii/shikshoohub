import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import tokenCode from "@/app/coponent/tokenCode";

export function normalizeIranMobile(value: string): string {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  let digits = String(value ?? "")
    .replace(/[۰-۹]/g, (c) => String(persian.indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String(arabic.indexOf(c)))
    .replace(/\D/g, "");
  if (digits.startsWith("98") && digits.length >= 12) digits = `0${digits.slice(2)}`;
  if (digits.length === 10 && digits.startsWith("9")) digits = `0${digits}`;
  return digits.slice(0, 11);
}

export function isIranMobile(value: string): boolean {
  return /^09\d{9}$/.test(normalizeIranMobile(value));
}

export type PurchaseReturnPayload = {
  phone?: string;
  notes?: string;
  quantity?: number;
};

export async function returnPurchaseItem(
  purchaseId: number,
  itemId: number,
  payload: PurchaseReturnPayload,
) {
  const token = tokenCode();
  const params =
    payload.quantity != null ? { quantity: payload.quantity } : {};
  return FetchWithJwtClient(
    "DELETE",
    `/api/purchased-products/${purchaseId}/items/${itemId}`,
    token,
    params,
    { body: JSON.stringify(payload) },
  );
}

export async function returnFullPurchase(
  purchaseId: number,
  payload: { phone: string; notes?: string },
) {
  return FetchWithJwtClient("POST", `/api/purchased-products/${purchaseId}/return`, payload);
}

export function purchaseReturnCreditMessage(res: unknown): string {
  if (!res || typeof res !== "object") return "";
  const r = res as Record<string, unknown>;
  const credit =
    Number(r.credit_added ?? r.credit_returned ?? r.customer_credit ?? r.credit) || 0;
  const reversed =
    Number(r.credit_reclaimed ?? r.credit_used_reversed ?? r.credit_deducted) || 0;
  const parts: string[] = [];
  if (credit > 0) {
    parts.push(
      `مبلغ برگشتی به اعتبار مشتری اضافه شد (${new Intl.NumberFormat("fa-IR").format(Math.floor(credit))} تومان).`,
    );
  }
  if (reversed > 0) {
    parts.push(
      `اعتبار استفاده‌شده در این خرید به نسبت برگشت اصلاح شد (${new Intl.NumberFormat("fa-IR").format(Math.floor(reversed))} تومان).`,
    );
  }
  return parts.join(" ");
}
