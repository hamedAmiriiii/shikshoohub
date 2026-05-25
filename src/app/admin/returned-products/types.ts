export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  cash: "نقد",
  card: "کارت",
  installment: "اقساط",
  mixed: "ترکیبی",
  split: "ترکیبی",
};

export function paymentTypeLabel(type: string): string {
  if (!type) return "—";
  return PAYMENT_TYPE_LABELS[type] ?? type;
}
