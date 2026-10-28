import { formatAmountInput, formatAmountNumber, parseAmountInput } from "@/app/lib/amountInput";

export type PurchaseVatMode = "none" | "percent" | "amount";

export type PurchaseVatFormState = {
  mode: PurchaseVatMode;
  percent: string;
  amount: string;
};

export const PURCHASE_VAT_SETTING_KEY = "purchase_vat_enabled";

export function emptyPurchaseVatForm(): PurchaseVatFormState {
  return { mode: "none", percent: "9", amount: "" };
}

export function purchaseVatFromDocument(doc?: {
  vat_mode?: string | null;
  vat_percent?: number | string | null;
  vat_amount?: number | string | null;
} | null): PurchaseVatFormState {
  const mode = String(doc?.vat_mode || "none").toLowerCase();
  if (mode === "percent") {
    return {
      mode: "percent",
      percent: doc?.vat_percent != null ? String(doc.vat_percent) : "9",
      amount: "",
    };
  }
  if (mode === "amount") {
    return {
      mode: "amount",
      percent: "9",
      amount: doc?.vat_amount != null ? formatAmountNumber(Number(doc.vat_amount) || 0) : "",
    };
  }
  return emptyPurchaseVatForm();
}

export function computePurchaseVat(baseAmount: number, form: PurchaseVatFormState): number {
  const base = Math.max(0, Math.round(baseAmount || 0));
  if (form.mode === "percent") {
    const percent = parseAmountInput(form.percent);
    if (percent <= 0) return 0;
    return Math.round((base * percent) / 100);
  }
  if (form.mode === "amount") {
    return Math.max(0, Math.round(parseAmountInput(form.amount)));
  }
  return 0;
}

export function purchaseVatPayable(baseAmount: number, form: PurchaseVatFormState): number {
  return Math.round(baseAmount || 0) + computePurchaseVat(baseAmount, form);
}

export function buildPurchaseVatPayload(
  baseAmount: number,
  form: PurchaseVatFormState,
  enabled: boolean,
): Record<string, unknown> {
  if (!enabled || form.mode === "none") {
    return { vat_mode: "none", vat_percent: null, vat_amount: 0 };
  }
  if (form.mode === "percent") {
    const percent = parseAmountInput(form.percent);
    return {
      vat_mode: "percent",
      vat_percent: percent,
      vat_amount: computePurchaseVat(baseAmount, form),
    };
  }
  return {
    vat_mode: "amount",
    vat_percent: null,
    vat_amount: computePurchaseVat(baseAmount, form),
  };
}

export function asPurchaseVatEnabled(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true" || value === "yes" || value === "on";
}

let purchaseVatEnabledCache = false;

export function setPurchaseVatEnabledCache(enabled: boolean): void {
  purchaseVatEnabledCache = Boolean(enabled);
}

export function readPurchaseVatEnabledCache(): boolean {
  return purchaseVatEnabledCache;
}

export { formatAmountInput };
