import DateObject from "react-date-object";
import { dateObjectToPayload, parseJalaliDateString, type JalaliDatePayload } from "@/app/lib/cheques";
import { formatAmountInput, formatAmountNumber, parseAmountInput } from "@/app/lib/amountInput";

export type DocumentPaymentMethod = "account" | "cheque" | "credit" | "mixed";
export type DocumentPaymentStatus = "paid" | "unpaid" | "partial";
export type DocumentPaymentKind = "invoice" | "expense";

export type DocumentPaymentBreakdown = {
  cash?: number | string;
  cash_amount?: number | string;
  cheque?: number | string;
  cheque_amount?: number | string;
  credit?: number | string;
  credit_amount?: number | string;
  remaining?: number | string;
  credit_remaining?: number | string;
  unpaid?: number | string;
};

export type DocumentPaymentFields = {
  payment_method?: string | null;
  payment_method_label?: string | null;
  payment_status?: string | null;
  payment_breakdown?: DocumentPaymentBreakdown | null;
  shop_account_id?: number | null;
  shop_account?: { id?: number; name?: string } | null;
  amount?: number | string | null;
};

export type DocumentPaymentFormState = {
  mode: DocumentPaymentMethod;
  shopAccountId: number | "";
  cashAmount: string;
  chequeAmount: string;
  creditAmount: string;
  chequeNumber: string;
  chequeBank: string;
  chequePayee: string;
  chequeDueDate: DateObject | null;
};

const METHOD_LABELS: Record<string, string> = {
  account: "نقد",
  cash: "نقد",
  نقد: "نقد",
  cheque: "چک",
  چک: "چک",
  credit: "نسیه",
  نسیه: "نسیه",
  mixed: "ترکیبی",
};

const STATUS_LABELS: Record<string, string> = {
  paid: "پرداخت‌شده",
  unpaid: "پرداخت‌نشده",
  partial: "بخشی پرداخت‌شده",
};

export function emptyDocumentPaymentForm(): DocumentPaymentFormState {
  return {
    mode: "account",
    shopAccountId: "",
    cashAmount: "",
    chequeAmount: "",
    creditAmount: "",
    chequeNumber: "",
    chequeBank: "",
    chequePayee: "",
    chequeDueDate: null,
  };
}

export function normalizeDocumentPaymentMethod(value?: string | null): DocumentPaymentMethod {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "cheque" || raw === "چک" || raw === "cheq") return "cheque";
  if (raw === "credit" || raw === "نسیه" || raw === "debt") return "credit";
  if (raw === "mixed" || raw === "ترکیبی" || raw === "split") return "mixed";
  return "account";
}

export function documentPaymentMethodLabel(value?: string | null): string {
  if (!value) return "—";
  return METHOD_LABELS[value] || METHOD_LABELS[String(value).toLowerCase()] || value;
}

export function documentPaymentStatusLabel(value?: string | null): string {
  if (!value) return "";
  return STATUS_LABELS[value] || STATUS_LABELS[String(value).toLowerCase()] || value;
}

function asAmount(value: unknown): number {
  return parseAmountInput(value as string | number);
}

export function documentPaymentLabel(doc?: DocumentPaymentFields | null): string {
  if (!doc) return "—";
  if (doc.payment_method_label) return doc.payment_method_label;
  return documentPaymentMethodLabel(doc.payment_method);
}

export function breakdownAmounts(breakdown?: DocumentPaymentBreakdown | null): {
  cash: number;
  cheque: number;
  credit: number;
  remaining: number;
} {
  const cash = asAmount(breakdown?.cash ?? breakdown?.cash_amount);
  const cheque = asAmount(breakdown?.cheque ?? breakdown?.cheque_amount);
  const credit = asAmount(breakdown?.credit ?? breakdown?.credit_amount);
  const remaining = asAmount(
    breakdown?.credit_remaining ?? breakdown?.remaining ?? breakdown?.unpaid,
  );
  return { cash, cheque, credit, remaining };
}

export function documentCreditRemaining(doc?: DocumentPaymentFields | null): number {
  if (!doc) return 0;
  const { remaining, credit } = breakdownAmounts(doc.payment_breakdown);
  if (remaining > 0) return remaining;
  const status = String(doc.payment_status || "").toLowerCase();
  const method = normalizeDocumentPaymentMethod(doc.payment_method);
  if (status === "unpaid" && (method === "credit" || method === "mixed")) {
    if (credit > 0) return credit;
    return asAmount(doc.amount);
  }
  if (status === "partial" && credit > 0) return remaining || credit;
  return 0;
}

export function canSettleDocumentPayment(doc?: DocumentPaymentFields | null): boolean {
  return documentCreditRemaining(doc) > 0;
}

function resolveShopAccountId(doc?: DocumentPaymentFields | null): number | "" {
  const direct = Number(doc?.shop_account_id);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const nested = Number(doc?.shop_account?.id);
  if (Number.isFinite(nested) && nested > 0) return nested;
  return "";
}

export function formFromDocumentPayment(
  doc?: DocumentPaymentFields | null,
): DocumentPaymentFormState {
  const form = emptyDocumentPaymentForm();
  if (!doc) return form;
  form.mode = normalizeDocumentPaymentMethod(doc.payment_method);
  form.shopAccountId = resolveShopAccountId(doc);
  const { cash, cheque, credit } = breakdownAmounts(doc.payment_breakdown);
  if (cash > 0) form.cashAmount = formatAmountNumber(cash);
  if (cheque > 0) form.chequeAmount = formatAmountNumber(cheque);
  if (credit > 0) form.creditAmount = formatAmountNumber(credit);
  return form;
}

function buildChequePayload(form: DocumentPaymentFormState): Record<string, unknown> | string {
  if (!form.chequeNumber.trim()) return "شماره چک را وارد کنید";
  const due = dateObjectToPayload(form.chequeDueDate);
  if (!due) return "تاریخ سررسید چک را انتخاب کنید";
  const cheque: Record<string, unknown> = {
    cheque_number: form.chequeNumber.trim(),
    due_date: due,
    type: "issued",
  };
  if (form.chequeBank.trim()) cheque.bank_name = form.chequeBank.trim();
  if (form.chequePayee.trim()) cheque.payee = form.chequePayee.trim();
  return cheque;
}

export function buildDocumentPaymentPayload(
  form: DocumentPaymentFormState,
  totalAmount: number,
): { payload: Record<string, unknown>; error?: undefined } | { payload?: undefined; error: string } {
  const total = Math.round(totalAmount);
  if (form.mode === "account") {
    if (form.shopAccountId === "") return { error: "حساب نقد را انتخاب کنید" };
    return {
      payload: {
        payment_method: "account",
        shop_account_id: form.shopAccountId,
      },
    };
  }

  if (form.mode === "credit") {
    return { payload: { payment_method: "credit" } };
  }

  if (form.mode === "cheque") {
    const cheque = buildChequePayload(form);
    if (typeof cheque === "string") return { error: cheque };
    return {
      payload: {
        payment_method: "cheque",
        cheque,
      },
    };
  }

  const cash = Math.round(parseAmountInput(form.cashAmount));
  const chequeAmount = Math.round(parseAmountInput(form.chequeAmount));
  const credit = Math.round(parseAmountInput(form.creditAmount));
  if (cash < 0 || chequeAmount < 0 || credit < 0) {
    return { error: "مبالغ پرداخت نمی‌تواند منفی باشد" };
  }
  if (cash + chequeAmount + credit !== total) {
    return {
      error: `جمع نقد، چک و نسیه باید برابر ${formatAmountNumber(total)} تومان باشد`,
    };
  }
  if (cash === 0 && chequeAmount === 0 && credit === 0) {
    return { error: "حداقل یک مبلغ پرداخت وارد کنید" };
  }
  if (cash > 0 && form.shopAccountId === "") {
    return { error: "برای سهم نقد، حساب برداشت را انتخاب کنید" };
  }

  const payload: Record<string, unknown> = {
    cash_amount: cash,
    cheque_amount: chequeAmount,
    credit_amount: credit,
  };
  if (form.shopAccountId !== "") payload.shop_account_id = form.shopAccountId;
  if (chequeAmount > 0) {
    const cheque = buildChequePayload(form);
    if (typeof cheque === "string") return { error: cheque };
    payload.cheque = cheque;
  }
  return { payload };
}

export function applyTotalToPaymentForm(
  form: DocumentPaymentFormState,
  totalAmount: number,
): DocumentPaymentFormState {
  if (form.mode !== "mixed") return form;
  const formatted = totalAmount > 0 ? formatAmountInput(String(Math.round(totalAmount))) : "";
  if (form.cashAmount || form.chequeAmount || form.creditAmount) return form;
  return { ...form, cashAmount: formatted };
}

export function parseJalaliDueDate(value?: string | JalaliDatePayload | null): DateObject | null {
  if (!value) return null;
  if (typeof value === "object" && "year" in value) {
    return parseJalaliDateString(`${value.year}/${value.month}/${value.day}`);
  }
  return parseJalaliDateString(String(value));
}
