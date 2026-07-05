/**
 * قرارداد backend برای آفلاین فاز ۱
 *
 * POST /api/purchased-products
 * - فیلد اجباری/اختیاری: client_id (string UUID)
 * - unique constraint: (shop_id, client_id)
 *
 * رفتار مورد انتظار:
 * 1) client_id جدید → ثبت خرید عادی (201/200)
 * 2) client_id تکراری → بدون ثبت دوباره، همان پاسخ موفق قبلی:
 *    { "already_exists": true, "id": <purchase_id>, ... }
 *    یا HTTP 409 با code: "duplicate_client_id"
 *
 * frontend در هر دو حالت، عملیات را از صف outbox حذف می‌کند.
 */
export const PURCHASE_CLIENT_ID_FIELD = "client_id" as const;

export type PurchaseIdempotentResponse = {
  id?: number;
  purchase_id?: number;
  already_exists?: boolean;
  duplicate?: boolean;
  code?: string;
};
