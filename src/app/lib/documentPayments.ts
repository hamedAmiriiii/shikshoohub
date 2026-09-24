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
  payments?: Array<{
    method?: string;
    amount?: number | string;
    cheque_id?: number | null;
    cheque?: {
      id?: number;
      cheque_number?: string;
      bank_name?: string | null;
      payee?: string | null;
      amount?: number | string;
      due_date?: string | null;
      due_date_jalali?: string | null;
    } | null;
  }>;
};

export type DocumentPaymentFields = {
  payment_method?: string | null;
  payment_method_label?: string | null;
  payment_status?: string | null;
  payment_breakdown?: DocumentPaymentBreakdown | null;
  /** ردیف‌های پرداخت سند؛ در لیست فاکتور و هزینه همین‌جا می‌آید */
  payments?: DocumentPaymentBreakdown["payments"];
  shop_account_id?: number | null;
  shop_account?: { id?: number; name?: string } | null;
  amount?: number | string | null;
};

export type DocumentChequeDraft = {
  key: string;
  amount: string;
  chequeNumber: string;
  chequeBank: string;
  chequePayee: string;
  chequeDueDate: DateObject | null;
  /** شناسه چک ذخیره‌شده؛ در ویرایش همان رکورد به‌روز می‌شود */
  chequeId?: number;
};

export type DocumentPaymentFormState = {
  mode: DocumentPaymentMethod;
  shopAccountId: number | "";
  cashAmount: string;
  chequeAmount: string;
  creditAmount: string;
  /** مبلغ چکی که هنوز به لیست اضافه نشده */
  draftChequeAmount: string;
  chequeNumber: string;
  chequeBank: string;
  chequePayee: string;
  chequeDueDate: DateObject | null;
  /** اگر چک باز از لیست ویرایش شده باشد */
  draftChequeId: number | null;
  cheques: DocumentChequeDraft[];
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
    draftChequeAmount: "",
    chequeNumber: "",
    chequeBank: "",
    chequePayee: "",
    chequeDueDate: null,
    draftChequeId: null,
    cheques: [],
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
  const payments = documentChequeSourceRows(doc);
  if (payments.length > 0) {
    form.cheques = payments
      .filter((row) => String(row?.method || "") === "cheque" && (row?.cheque || row?.cheque_id))
      .map((row, index) => {
        const cheque = row.cheque || {};
        const chequeId = Number(cheque.id ?? row.cheque_id);
        const amount = asAmount(row.amount ?? cheque.amount);
        return {
          key: `saved-${Number.isFinite(chequeId) && chequeId > 0 ? chequeId : index}`,
          chequeId: Number.isFinite(chequeId) && chequeId > 0 ? chequeId : undefined,
          amount: amount > 0 ? formatAmountNumber(amount) : "",
          chequeNumber: String(cheque.cheque_number || ""),
          chequeBank: String(cheque.bank_name || ""),
          chequePayee: String(cheque.payee || ""),
          chequeDueDate: parseJalaliDueDate(cheque.due_date_jalali || cheque.due_date || null),
        };
      });
    if (form.cheques.length > 0) {
      form.chequeAmount = formatAmountNumber(
        form.cheques.reduce((sum, row) => sum + parseAmountInput(row.amount), 0),
      );
    }
  }
  return form;
}

function chequeDraftError(draft: DocumentChequeDraft): string | null {
  if (!draft.chequeNumber.trim()) return "شماره چک را وارد کنید";
  if (parseAmountInput(draft.amount) <= 0) return "مبلغ چک را وارد کنید";
  if (!dateObjectToPayload(draft.chequeDueDate)) return "تاریخ سررسید چک را انتخاب کنید";
  return null;
}

function chequePayloadFromDraft(draft: DocumentChequeDraft): Record<string, unknown> {
  const due = dateObjectToPayload(draft.chequeDueDate);
  const cheque: Record<string, unknown> = {
    cheque_number: draft.chequeNumber.trim(),
    due_date: due,
    type: "issued",
  };
  if (draft.chequeBank.trim()) cheque.bank_name = draft.chequeBank.trim();
  if (draft.chequePayee.trim()) cheque.payee = draft.chequePayee.trim();
  return cheque;
}

function documentChequeSourceRows(doc: DocumentPaymentFields) {
  const breakdown = doc.payment_breakdown?.payments;
  const direct = doc.payments;
  const hasCheque = (rows?: DocumentPaymentBreakdown["payments"]) =>
    Array.isArray(rows) && rows.some((row) => row?.cheque || row?.cheque_id);
  if (hasCheque(direct) && !hasCheque(breakdown)) return direct || [];
  if (Array.isArray(breakdown) && breakdown.length > 0) return breakdown;
  return Array.isArray(direct) ? direct : [];
}

function draftFromOpenFields(form: DocumentPaymentFormState): DocumentChequeDraft | null {
  const touched =
    form.draftChequeAmount.trim() !== "" ||
    form.chequeNumber.trim() !== "" ||
    form.chequeBank.trim() !== "" ||
    form.chequePayee.trim() !== "" ||
    form.chequeDueDate != null;
  if (!touched) return null;
  return {
    key: "open",
    amount: form.draftChequeAmount,
    chequeNumber: form.chequeNumber,
    chequeBank: form.chequeBank,
    chequePayee: form.chequePayee,
    chequeDueDate: form.chequeDueDate,
    chequeId: form.draftChequeId ?? undefined,
  };
}

export function documentChequeTotal(cheques: DocumentChequeDraft[]): number {
  return cheques.reduce((sum, row) => sum + Math.round(parseAmountInput(row.amount)), 0);
}

function resolveChequeDrafts(
  form: DocumentPaymentFormState,
): { drafts: DocumentChequeDraft[]; error?: undefined } | { drafts?: undefined; error: string } {
  const drafts = [...form.cheques];
  const open = draftFromOpenFields(form);
  if (open) {
    const error = chequeDraftError(open);
    if (error) {
      return {
        error: drafts.length > 0 ? `چک جاری کامل نیست. ${error}` : error,
      };
    }
    drafts.push(open);
  }
  if (drafts.length === 0) return { error: "حداقل یک چک ثبت کنید" };
  for (const draft of drafts) {
    const error = chequeDraftError(draft);
    if (error) return { error };
  }
  return { drafts };
}

export function appendDocumentCheque(
  form: DocumentPaymentFormState,
): { form: DocumentPaymentFormState; error?: undefined } | { form?: undefined; error: string } {
  const open = draftFromOpenFields(form);
  if (!open) return { error: "مشخصات چک را وارد کنید" };
  const error = chequeDraftError(open);
  if (error) return { error };
  const cheques = [...form.cheques, { ...open, key: `cheque-${Date.now()}` }];
  return {
    form: {
      ...form,
      cheques,
      chequeAmount: formatAmountNumber(documentChequeTotal(cheques)),
      draftChequeAmount: "",
      chequeNumber: "",
      chequeBank: "",
      chequePayee: "",
      chequeDueDate: null,
      draftChequeId: null,
    },
  };
}

export function beginEditDocumentCheque(
  form: DocumentPaymentFormState,
  key: string,
): { form: DocumentPaymentFormState; error?: undefined } | { form?: undefined; error: string } {
  const target = form.cheques.find((row) => row.key === key);
  if (!target) return { error: "چک پیدا نشد" };
  let cheques = form.cheques.filter((row) => row.key !== key);
  const open = draftFromOpenFields(form);
  if (open && open.key !== target.key) {
    const error = chequeDraftError(open);
    if (error) return { error: `اول چک باز را کامل کنید یا خالی‌اش کنید. ${error}` };
    cheques = [...cheques, { ...open, key: `cheque-${Date.now()}` }];
  }
  return {
    form: {
      ...form,
      cheques,
      chequeAmount: cheques.length > 0 ? formatAmountNumber(documentChequeTotal(cheques)) : "",
      draftChequeAmount: target.amount,
      chequeNumber: target.chequeNumber,
      chequeBank: target.chequeBank,
      chequePayee: target.chequePayee,
      chequeDueDate: target.chequeDueDate,
      draftChequeId: target.chequeId ?? null,
    },
  };
}

export function removeDocumentCheque(
  form: DocumentPaymentFormState,
  key: string,
): DocumentPaymentFormState {
  const cheques = form.cheques.filter((row) => row.key !== key);
  return {
    ...form,
    cheques,
    chequeAmount: cheques.length > 0 ? formatAmountNumber(documentChequeTotal(cheques)) : "",
  };
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
    const resolved = resolveChequeDrafts(form);
    if (resolved.error || !resolved.drafts) return { error: resolved.error || "حداقل یک چک ثبت کنید" };
    const chequeSum = documentChequeTotal(resolved.drafts);
    if (chequeSum !== total) {
      return { error: `جمع چک‌ها باید برابر ${formatAmountNumber(total)} تومان باشد` };
    }
    return {
      payload: {
        payment_method: "cheque",
        payments: resolved.drafts.map((draft) => ({
          method: "cheque",
          amount: Math.round(parseAmountInput(draft.amount)),
          ...(draft.chequeId ? { cheque_id: draft.chequeId } : {}),
          cheque: chequePayloadFromDraft(draft),
        })),
      },
    };
  }

  const cash = Math.round(parseAmountInput(form.cashAmount));
  const openCheque = draftFromOpenFields(form);
  const listedCheques = openCheque || form.cheques.length > 0
    ? resolveChequeDrafts({
        ...form,
        cheques: form.cheques,
      })
    : { drafts: [] as DocumentChequeDraft[] };
  if ("error" in listedCheques && listedCheques.error && (openCheque || form.cheques.length > 0)) {
    return { error: listedCheques.error };
  }
  const chequeDrafts = "drafts" in listedCheques && listedCheques.drafts ? listedCheques.drafts : [];
  const chequeAmount = chequeDrafts.length > 0
    ? documentChequeTotal(chequeDrafts)
    : Math.round(parseAmountInput(form.chequeAmount));
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
    if (chequeDrafts.length === 0) return { error: "مشخصات چک را وارد کنید" };
    if (documentChequeTotal(chequeDrafts) !== chequeAmount) {
      return { error: "جمع چک‌های ثبت‌شده با مبلغ چک یکی نیست" };
    }
  }
  const payments: Array<Record<string, unknown>> = [];
  if (cash > 0) {
    payments.push({
      method: "account",
      amount: cash,
      shop_account_id: form.shopAccountId,
    });
  }
  chequeDrafts.forEach((draft) => {
    payments.push({
      method: "cheque",
      amount: Math.round(parseAmountInput(draft.amount)),
      ...(draft.chequeId ? { cheque_id: draft.chequeId } : {}),
      cheque: chequePayloadFromDraft(draft),
    });
  });
  if (credit > 0) {
    payments.push({ method: "credit", amount: credit });
  }
  payload.payments = payments;
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
