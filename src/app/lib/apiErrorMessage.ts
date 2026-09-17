const PHONE_FIELD_HINT =
  "شماره تلفن معتبر نیست. باید با ۰۹ شروع شود و دقیقاً ۱۱ رقم باشد (مثال: ۰۹۱۲۳۴۵۶۷۸۹).";

function translateKnownValidation(message: string): string {
  const raw = String(message || "").trim();
  if (!raw) return "";
  const lower = raw.toLowerCase();

  if (
    lower.includes("phone") &&
    (lower.includes("format") ||
      lower.includes("regex") ||
      lower.includes("invalid") ||
      lower.includes("digits") ||
      lower.includes("must be"))
  ) {
    return PHONE_FIELD_HINT;
  }
  if (raw.includes("The phone field") || raw.includes("phone field")) {
    return PHONE_FIELD_HINT;
  }
  if (lower.includes("the given data was invalid")) {
    return "اطلاعات ارسال‌شده نامعتبر است. لطفاً ورودی‌ها را بررسی کنید.";
  }
  if (lower.includes("unauthenticated") || lower.includes("unauthorized")) {
    return "نشست شما منقضی شده است. دوباره وارد شوید.";
  }

  return raw;
}

function firstValidationError(errors: unknown): string {
  if (!errors || typeof errors !== "object") return "";
  for (const value of Object.values(errors as Record<string, unknown>)) {
    if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
      return translateKnownValidation(value[0]);
    }
    if (typeof value === "string" && value.trim()) {
      return translateKnownValidation(value);
    }
  }
  return "";
}

function messageFromParsed(parsed: Record<string, unknown>): string {
  const fromErrors = firstValidationError(parsed.errors);
  if (fromErrors) return fromErrors;
  if (typeof parsed.error === "string" && parsed.error.trim()) {
    return translateKnownValidation(parsed.error);
  }
  if (typeof parsed.message === "string" && parsed.message.trim()) {
    return translateKnownValidation(parsed.message);
  }
  return "";
}

export function getApiErrorMessage(res: any, fallback: string): string {
  if (!res) return fallback;

  if (res.errors) {
    const fromErrors = firstValidationError(res.errors);
    if (fromErrors) return fromErrors;
  }
  if (typeof res.error === "string" && res.error.trim()) {
    return translateKnownValidation(res.error);
  }
  if (typeof res.message === "string" && res.message.trim()) {
    const translated = translateKnownValidation(res.message);
    // اگر فقط پیام کلی لاراول بود و errors جدا هست
    if (res.errors) {
      const fromErrors = firstValidationError(res.errors);
      if (fromErrors) return fromErrors;
    }
    return translated;
  }

  if (typeof res.errorText === "string") {
    try {
      const parsed = JSON.parse(res.errorText) as Record<string, unknown>;
      const fromParsed = messageFromParsed(parsed);
      if (fromParsed) return fromParsed;
    } catch {
      if (res.errorText && res.errorText !== "fetch failed") {
        return translateKnownValidation(res.errorText);
      }
    }
  }

  return fallback;
}

export type ProductLimitError = {
  message: string;
  upgrade_url: string;
  upgrade_label: string;
  code: string;
};

/** خطای سقف ۱۰۰۰ کالا — در صورت وجود لینک خرید اشتراک طلایی */
export function parseProductLimitError(res: any): ProductLimitError | null {
  let parsed: Record<string, unknown> | null = null;
  if (res && typeof res === "object") {
    if (res.code === "PRODUCT_LIMIT_REACHED") {
      parsed = res as Record<string, unknown>;
    } else if (typeof res.errorText === "string") {
      try {
        parsed = JSON.parse(res.errorText) as Record<string, unknown>;
      } catch {
        parsed = null;
      }
    }
  }
  if (!parsed || parsed.code !== "PRODUCT_LIMIT_REACHED") return null;
  const message =
    typeof parsed.message === "string" && parsed.message.trim()
      ? parsed.message
      : "شما به سقف ایجاد محصول رسیدید. برای ثبت بیشتر باید اشتراک طلایی بخرید.";
  const upgrade_url =
    typeof parsed.upgrade_url === "string" && parsed.upgrade_url.trim()
      ? parsed.upgrade_url
      : "/admin/shop-plans";
  const upgrade_label =
    typeof parsed.upgrade_label === "string" && parsed.upgrade_label.trim()
      ? parsed.upgrade_label
      : "اشتراک طلایی";

  return { message, upgrade_url, upgrade_label, code: "PRODUCT_LIMIT_REACHED" };
}

/** خطاهایی که نباید به صف آفلاین بروند (ورودی نامعتبر / احراز هویت) */
export function isNonRetryableClientError(res: unknown): boolean {
  if (!res || typeof res !== "object") return false;
  const obj = res as Record<string, unknown>;
  const status = Number(obj.statusCode ?? obj.status);
  if ([400, 401, 403, 422].includes(status)) return true;

  const text = getApiErrorMessage(obj, "").toLowerCase();
  if (!text) return false;
  return (
    text.includes("شماره تلفن") ||
    text.includes("نامعتبر") ||
    text.includes("phone") ||
    text.includes("validation")
  );
}
