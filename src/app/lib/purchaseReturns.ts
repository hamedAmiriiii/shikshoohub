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

export type CardRefundDestination = "customer_credit" | "shop_account" | "pos_terminal";

export type PosTerminalRefundAvailability = {
  available: boolean;
  reason: string | null;
  date: string;
  date_jalali: string | null;
  pending_card_amount: number;
};

/** برگشت از کارتخوانِ روزِ فاکتور، وقتی تطبیق آن روز هنوز ثبت نشده. */
export async function fetchPosTerminalRefundAvailability(
  purchaseId: number,
): Promise<PosTerminalRefundAvailability | null> {
  const res = await FetchWithJwtClient(
    "GET",
    `/api/purchased-products/${purchaseId}/return-options`,
    tokenCode(),
  );
  if (!res || res.hasError || !res.pos_terminal || typeof res.pos_terminal !== "object") return null;
  const pos = res.pos_terminal as Record<string, unknown>;
  return {
    available: Boolean(pos.available),
    reason: typeof pos.reason === "string" ? pos.reason : null,
    date: String(pos.date ?? ""),
    date_jalali: typeof pos.date_jalali === "string" ? pos.date_jalali : null,
    pending_card_amount: Number(pos.pending_card_amount) || 0,
  };
}

export type PurchaseReturnPayload = {
  phone?: string;
  notes?: string;
  quantity?: number;
  card_refund_destination?: CardRefundDestination;
  shop_account_id?: number;
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
  payload: {
    phone?: string;
    notes?: string;
    card_refund_destination?: CardRefundDestination;
    shop_account_id?: number;
  },
) {
  return FetchWithJwtClient("POST", `/api/purchased-products/${purchaseId}/return`, payload);
}

export function purchaseReturnCreditMessage(res: unknown): string {
  if (!res || typeof res !== "object") return "";
  const r = res as Record<string, unknown>;
  const item =
    r.returned_item && typeof r.returned_item === "object"
      ? (r.returned_item as Record<string, unknown>)
      : null;

  const credit =
    Number(
      r.credit_refunded ??
        r.credit_added ??
        r.credit_returned ??
        item?.credit_refunded ??
        0,
    ) || 0;
  const cash =
    Number(r.cash_refunded ?? item?.cash_refunded ?? 0) || 0;
  const card =
    Number(r.card_refunded ?? item?.card_refunded ?? 0) || 0;
  const destination = String(
    r.card_refund_destination ?? item?.card_refund_destination ?? "customer_credit",
  );
  const reversed =
    Number(r.credit_reclaimed ?? r.credit_used_reversed ?? r.credit_deducted ?? item?.credit_earned_reversed ?? 0) || 0;

  const parts: string[] = [];
  if (cash > 0) {
    parts.push(
      `مبلغ نقد از صندوق برگردانده شد (${new Intl.NumberFormat("fa-IR").format(Math.floor(cash))} تومان).`,
    );
  }
  if (card > 0 && destination === "shop_account") {
    parts.push(
      `مبلغ کارت از حساب فروشگاه برداشت شد (${new Intl.NumberFormat("fa-IR").format(Math.floor(card))} تومان).`,
    );
  }
  if (card > 0 && destination === "pos_terminal") {
    parts.push(
      `مبلغ کارت از کارتخوان روز فاکتور برگشت و از جمع کارتخوان آن روز کم شد (${new Intl.NumberFormat("fa-IR").format(Math.floor(card))} تومان).`,
    );
  }
  if (credit > 0) {
    parts.push(
      `مبلغ به اعتبار مشتری اضافه شد (${new Intl.NumberFormat("fa-IR").format(Math.floor(credit))} تومان).`,
    );
  }
  if (reversed > 0) {
    parts.push(
      `اعتبار استفاده‌شده در این خرید به نسبت برگشت اصلاح شد (${new Intl.NumberFormat("fa-IR").format(Math.floor(reversed))} تومان).`,
    );
  }
  return parts.join(" ");
}
