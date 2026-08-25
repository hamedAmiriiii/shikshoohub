export type PaymentType = "cash" | "installment" | "debt" | "cheque";

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  cash: "نقدی",
  card: "کارت",
  installment: "اقساطی",
  debt: "نسیه",
  cheque: "چکی",
  mixed: "ترکیبی",
  split: "ترکیبی",
  online: "آنلاین",
};

export function paymentTypeLabel(type: string): string {
  if (!type) return "—";
  return PAYMENT_TYPE_LABELS[type] ?? type;
}
