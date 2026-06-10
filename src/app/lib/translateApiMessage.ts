const FIELD_LABELS: Record<string, string> = {
  value: "مقدار",
  percent: "درصد اعتبار",
  max_amount: "سقف مبلغ خرید",
  tiers: "بازه‌ها",
  days: "تعداد روز",
  rate: "نرخ سود",
  enabled: "وضعیت",
};

/** ترجمهٔ پیام‌های اعتبارسنجی API به فارسی روان */
export function translateApiMessage(message: unknown): string {
  if (typeof message !== "string" || !message.trim()) {
    return "خطایی رخ داد";
  }

  let text = message.trim();

  for (const [key, label] of Object.entries(FIELD_LABELS)) {
    text = text.replace(
      new RegExp(`فیلد\\s+${key}\\s+`, "gi"),
      `فیلد «${label}» `,
    );
  }

  text = text.replace(/\bvalue\b/gi, "مقدار");
  text = text.replace(/\bpercent\b/gi, "درصد اعتبار");
  text = text.replace(/\bmax_amount\b/gi, "سقف مبلغ خرید");
  text = text.replace(/اجباری\s+است/gi, "الزامی است");
  text = text.replace(/مورد\s+نیاز\s+است/gi, "الزامی است");

  return text;
}

export function parseApiErrorMessage(errorText: string | undefined, fallback: string): string {
  if (!errorText) return fallback;
  try {
    const parsed = JSON.parse(errorText) as {
      message?: string;
      errors?: Record<string, string[]>;
    };
    if (parsed.message) {
      return translateApiMessage(parsed.message);
    }
    if (parsed.errors) {
      const firstKey = Object.keys(parsed.errors)[0];
      const firstMsg = firstKey ? parsed.errors[firstKey]?.[0] : undefined;
      if (firstMsg) return translateApiMessage(firstMsg);
    }
  } catch {
    return translateApiMessage(errorText);
  }
  return fallback;
}
