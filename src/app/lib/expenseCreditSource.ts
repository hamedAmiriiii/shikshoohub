export const EXPENSE_CREDIT_SOURCES = ["loyalty_purchase", "purchase_return", "manual"] as const;

export type ExpenseCreditSource = (typeof EXPENSE_CREDIT_SOURCES)[number];

export const EXPENSE_CREDIT_SOURCE_LABELS: Record<ExpenseCreditSource, string> = {
  loyalty_purchase: "وفاداری خرید",
  purchase_return: "برگشت خرید",
  manual: "افزایش دستی",
};

export function isExpenseCreditSource(value: string | null | undefined): value is ExpenseCreditSource {
  return EXPENSE_CREDIT_SOURCES.includes(value as ExpenseCreditSource);
}

export function expenseCreditSource(expense: {
  credit_source?: string | null;
  title?: string | null;
}): ExpenseCreditSource | null {
  if (isExpenseCreditSource(expense.credit_source)) return expense.credit_source;
  const title = expense.title || "";
  if (title.includes("وفاداری خرید")) return "loyalty_purchase";
  if (title.includes("برگشت خرید")) return "purchase_return";
  if (title.includes("افزایش دستی")) return "manual";
  return null;
}

/** برگشت در فروش خالص کم شده؛ دوباره در سود به‌عنوان هزینه نمی‌آید. */
export function creditSourceCountsInProfit(source: ExpenseCreditSource): boolean {
  return source !== "purchase_return";
}
