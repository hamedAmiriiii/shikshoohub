import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import tokenCode from "@/app/coponent/tokenCode";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import DateObject from "react-date-object";
import { todayJalaliDateObject } from "@/app/lib/cheques";

export type AccountingLevel = "group" | "kol" | "moein" | "tafsili" | string;
export type AccountingNature = "debit" | "credit" | string;
export type AccountingKind =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "cogs"
  | "expense"
  | string;
export type AccountingLinkedType = "shop_account" | "till" | null | string;
export type AccountingVoucherStatus = "posted" | "reversed" | string;

export type AccountingAccount = {
  id: number;
  parent_id: number | null;
  code: string;
  name: string;
  level: AccountingLevel;
  level_label: string;
  nature: AccountingNature;
  nature_label: string;
  kind: AccountingKind;
  is_system: boolean;
  linked_type: AccountingLinkedType;
  linked_id: number | null;
  is_active: boolean;
  children: AccountingAccount[];
};

export type AccountingVoucherLine = {
  id: number;
  account_id: number;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  description: string;
  sort_order: number;
};

export type AccountingVoucher = {
  id: number;
  number: number;
  date: string;
  description: string;
  source_type: string;
  source_id: number | null;
  status: AccountingVoucherStatus;
  status_label: string;
  reverses_voucher_id: number | null;
  debit_total: number;
  credit_total: number;
  lines: AccountingVoucherLine[];
};

export type AccountingVoucherList = {
  data: AccountingVoucher[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
};

export type AccountingVoucherLineInput = {
  account_id?: number;
  account_code?: string;
  debit: number;
  credit: number;
  description?: string;
};

export type TrialBalanceRow = {
  account_id: number;
  code: string;
  name: string;
  level: AccountingLevel;
  nature: AccountingNature;
  kind: AccountingKind;
  debit_turnover: number;
  credit_turnover: number;
  debit_balance: number;
  credit_balance: number;
};

export type TrialBalanceReport = {
  from: string | null;
  to: string | null;
  rows: TrialBalanceRow[];
  totals: {
    debit_turnover: number;
    credit_turnover: number;
    debit_balance: number;
    credit_balance: number;
  };
  balanced: boolean;
};

export type LedgerRow = {
  line_id: number;
  voucher_id: number;
  number: number;
  date: string;
  description: string;
  line_description: string;
  source_type: string;
  is_reversal: boolean;
  debit: number;
  credit: number;
  running: number;
  running_debit: number;
  running_credit: number;
};

export type LedgerReport = {
  account: {
    account_id: number;
    code: string;
    name: string;
    nature: AccountingNature;
  };
  from: string | null;
  to: string | null;
  opening: {
    debit: number;
    credit: number;
    debit_balance: number;
    credit_balance: number;
  };
  rows: LedgerRow[];
  period: { debit: number; credit: number };
  closing: {
    debit: number;
    credit: number;
    debit_balance: number;
    credit_balance: number;
  };
};

export type ProfitLossReport = {
  from: string | null;
  to: string | null;
  sales: number;
  discounts: number;
  cogs: number;
  gross_profit: number;
  operating_expense: number;
  payroll: number;
  loyalty: number;
  other_income: number;
  net_profit: number;
  note: string;
};

export type BalanceSheetRow = {
  code: string;
  name?: string;
  debit_balance?: number;
  credit_balance?: number;
};

export type CashCompareRow = {
  code: string;
  name?: string;
  linked_type?: string | null;
  shop_account_id?: number | null;
  ledger_balance: number;
  operational_balance: number | null;
  difference: number | null;
  note: string | null;
};

export type BalanceSheetReport = {
  as_of: string | null;
  assets: { rows: BalanceSheetRow[]; total: number };
  liabilities: { rows: BalanceSheetRow[]; total: number };
  equity: { rows: BalanceSheetRow[]; total: number };
  current_profit: number;
  current_profit_label: string;
  equation: {
    assets: number;
    liabilities_equity_profit: number;
    balanced: boolean;
  };
  cash_compare: CashCompareRow[];
  note: string;
};

export type OpeningResult = {
  ok: boolean;
  already_posted: boolean;
  message: string;
  data: AccountingVoucher | null;
  statusCode: number;
};

export const ACCOUNTING_SOURCE_TYPES = [
  { value: "", label: "همه منابع" },
  { value: "manual", label: "دستی" },
  { value: "purchase", label: "فروش" },
  { value: "installment_pay", label: "وصول قسط" },
  { value: "debt_settle", label: "تسویه نسیه" },
  { value: "cheque_clear", label: "وصول چک" },
  { value: "recon_deposit", label: "تطبیق روزانه" },
  { value: "account_transfer", label: "شارژ تنخواه" },
  { value: "opening", label: "افتتاحیه" },
  { value: "invoice", label: "فاکتور خرید" },
  { value: "expense", label: "هزینه" },
  { value: "document_payment", label: "تسویه فاکتور/هزینه" },
  { value: "production", label: "تولید" },
  { value: "purchase_return", label: "برگشت فروش" },
  { value: "income", label: "چک دریافتنی" },
  { value: "manual_trade", label: "خرید و فروش دستی" },
] as const;

const OPERATIONAL_SOURCE_TYPES = new Set([
  "purchase",
  "installment_pay",
  "debt_settle",
  "cheque_clear",
  "recon_deposit",
  "account_transfer",
  "opening",
  "invoice",
  "expense",
  "document_payment",
  "production",
  "purchase_return",
  "income",
  "manual_trade",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBool(value: unknown, fallback = false): boolean {
  if (value === true || value === 1 || value === "1" || value === "true") return true;
  if (value === false || value === 0 || value === "0" || value === "false") return false;
  return fallback;
}

function authToken(): string {
  return tokenCode() || "";
}

function throwApiError(res: unknown, fallback: string): never {
  throw new Error(getApiErrorMessage(res, fallback));
}

function unwrapData(res: unknown): unknown {
  const obj = asRecord(res);
  if (!obj) return res;
  if (obj.hasError) throwApiError(obj, "خطای حسابداری");
  return obj.data ?? res;
}

export function formatAccountingMoney(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "۰";
  return new Intl.NumberFormat("fa-IR").format(Math.round(n));
}

export function jalaliYmd(d: DateObject | null | undefined): string {
  if (!d) return "";
  const month = d.month?.number ?? Number(d.month);
  return `${d.year}-${String(month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

export function todayJalaliYmd(): string {
  return jalaliYmd(todayJalaliDateObject());
}

export function accountingSourceLabel(sourceType?: string | null): string {
  const found = ACCOUNTING_SOURCE_TYPES.find((item) => item.value === sourceType);
  return found?.label || sourceType || "—";
}

export function accountingVoucherStatusLabel(voucher: AccountingVoucher): string {
  if (voucher.status === "reversed") return voucher.status_label || "برگشت‌خورده";
  if (voucher.status === "posted" && voucher.reverses_voucher_id != null) {
    return "برگشت";
  }
  return voucher.status_label || "ثبت‌شده";
}

export function isReversalVoucher(voucher: AccountingVoucher): boolean {
  return voucher.status === "posted" && voucher.reverses_voucher_id != null;
}

export function canReverseVoucherFromUi(voucher: AccountingVoucher): boolean {
  return (
    voucher.status === "posted" &&
    voucher.reverses_voucher_id == null &&
    voucher.source_type === "manual"
  );
}

export function isOperationalVoucher(voucher: Pick<AccountingVoucher, "source_type">): boolean {
  return OPERATIONAL_SOURCE_TYPES.has(voucher.source_type);
}

export function voucherSourceHref(voucher: Pick<AccountingVoucher, "source_type">): string | null {
  switch (voucher.source_type) {
    case "purchase":
      return "/admin/purchas";
    case "invoice":
      return "/admin/invoices";
    case "expense":
      return "/admin/expenses";
    case "document_payment":
      return "/admin/invoices";
    case "cheque_clear":
    case "income":
      return "/admin/cheques";
    case "recon_deposit":
      return "/admin/daily-reconciliation";
    case "account_transfer":
      return "/admin/petty-cash";
    case "installment_pay":
      return "/admin/installments";
    case "debt_settle":
      return "/admin/purchase-debts";
    case "production":
      return "/admin/production";
    case "purchase_return":
      return "/admin/returned-products";
    case "manual_trade":
      return "/admin/manual-trades";
    default:
      return null;
  }
}

export function flattenAccounts(nodes: AccountingAccount[]): AccountingAccount[] {
  const out: AccountingAccount[] = [];
  const walk = (list: AccountingAccount[]) => {
    for (const node of list) {
      out.push(node);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(nodes);
  return out;
}

export function postingAccounts(nodes: AccountingAccount[]): AccountingAccount[] {
  return flattenAccounts(nodes).filter(
    (item) => item.is_active && (item.level === "moein" || item.level === "tafsili"),
  );
}

function parseAccount(raw: unknown): AccountingAccount | null {
  const obj = asRecord(raw);
  if (!obj) return null;
  const id = asNumber(obj.id, 0);
  if (!id) return null;
  const childrenRaw = Array.isArray(obj.children) ? obj.children : [];
  return {
    id,
    parent_id: obj.parent_id == null ? null : asNumber(obj.parent_id, 0) || null,
    code: asString(obj.code),
    name: asString(obj.name),
    level: asString(obj.level),
    level_label: asString(obj.level_label),
    nature: asString(obj.nature),
    nature_label: asString(obj.nature_label),
    kind: asString(obj.kind),
    is_system: asBool(obj.is_system, false),
    linked_type: obj.linked_type == null ? null : asString(obj.linked_type),
    linked_id: obj.linked_id == null ? null : asNumber(obj.linked_id, 0) || null,
    is_active: asBool(obj.is_active, true),
    children: childrenRaw
      .map(parseAccount)
      .filter((item): item is AccountingAccount => item != null),
  };
}

function parseLine(raw: unknown, index = 0): AccountingVoucherLine | null {
  const obj = asRecord(raw);
  if (!obj) return null;
  return {
    id: asNumber(obj.id, index + 1),
    account_id: asNumber(obj.account_id),
    account_code: asString(obj.account_code),
    account_name: asString(obj.account_name),
    debit: asNumber(obj.debit),
    credit: asNumber(obj.credit),
    description: asString(obj.description),
    sort_order: asNumber(obj.sort_order, index + 1),
  };
}

function parseVoucher(raw: unknown): AccountingVoucher | null {
  const obj = asRecord(raw);
  if (!obj) return null;
  const id = asNumber(obj.id, 0);
  if (!id) return null;
  const linesRaw = Array.isArray(obj.lines) ? obj.lines : [];
  return {
    id,
    number: asNumber(obj.number),
    date: asString(obj.date),
    description: asString(obj.description),
    source_type: asString(obj.source_type, "manual"),
    source_id: obj.source_id == null ? null : asNumber(obj.source_id, 0) || null,
    status: asString(obj.status, "posted"),
    status_label: asString(obj.status_label),
    reverses_voucher_id:
      obj.reverses_voucher_id == null ? null : asNumber(obj.reverses_voucher_id, 0) || null,
    debit_total: asNumber(obj.debit_total),
    credit_total: asNumber(obj.credit_total),
    lines: linesRaw
      .map((line, index) => parseLine(line, index))
      .filter((item): item is AccountingVoucherLine => item != null),
  };
}

export async function fetchAccountingAccounts(options?: {
  includeInactive?: boolean;
}): Promise<AccountingAccount[]> {
  const params: Record<string, string> = {};
  if (options?.includeInactive) params.include_inactive = "1";
  const res = await FetchWithJwtClient(
    "GET",
    "/api/accounting/accounts",
    authToken(),
    params,
  );
  const payload = unwrapData(res);
  const list = Array.isArray(payload) ? payload : Array.isArray(asRecord(payload)?.data)
    ? (asRecord(payload)!.data as unknown[])
    : [];
  return list.map(parseAccount).filter((item): item is AccountingAccount => item != null);
}

export async function createAccountingAccount(body: {
  parent_id: number;
  code: string;
  name: string;
  level: "moein" | "tafsili";
}): Promise<AccountingAccount> {
  const res = await FetchWithJwtClient("POST", "/api/accounting/accounts", authToken(), {}, {
    body: JSON.stringify(body),
  });
  const payload = unwrapData(res);
  const parsed = parseAccount(payload);
  if (!parsed) throwApiError(res, "حساب ایجاد شد ولی پاسخ نامعتبر بود.");
  return parsed;
}

export async function updateAccountingAccount(
  id: number,
  body: { name?: string; is_active?: boolean },
): Promise<AccountingAccount> {
  const res = await FetchWithJwtClient(
    "PUT",
    `/api/accounting/accounts/${id}`,
    authToken(),
    {},
    { body: JSON.stringify(body) },
  );
  const payload = unwrapData(res);
  const parsed = parseAccount(payload);
  if (!parsed) throwApiError(res, "حساب به‌روز شد ولی پاسخ نامعتبر بود.");
  return parsed;
}

export async function fetchAccountingVouchers(options?: {
  page?: number;
  perPage?: number;
  sourceType?: string;
  status?: string;
}): Promise<AccountingVoucherList> {
  const params: Record<string, string | number> = {
    per_page: options?.perPage ?? 20,
    page: options?.page ?? 1,
  };
  if (options?.sourceType) params.source_type = options.sourceType;
  if (options?.status) params.status = options.status;
  const res = await FetchWithJwtClient(
    "GET",
    "/api/accounting/vouchers",
    authToken(),
    params,
  );
  const obj = asRecord(res);
  if (obj?.hasError) throwApiError(obj, "خطا در دریافت اسناد");
  const nested = asRecord(obj?.data);
  const listRaw = Array.isArray(obj?.data)
    ? obj!.data
    : Array.isArray(nested?.data)
      ? nested!.data
      : [];
  return {
    data: listRaw
      .map(parseVoucher)
      .filter((item): item is AccountingVoucher => item != null),
    current_page: asNumber(obj?.current_page ?? nested?.current_page, 1),
    last_page: asNumber(obj?.last_page ?? nested?.last_page, 1),
    total: asNumber(obj?.total ?? nested?.total, 0),
    per_page: asNumber(obj?.per_page ?? nested?.per_page, 20),
  };
}

export async function fetchAccountingVoucher(id: number): Promise<AccountingVoucher> {
  const res = await FetchWithJwtClient(
    "GET",
    `/api/accounting/vouchers/${id}`,
    authToken(),
  );
  const parsed = parseVoucher(unwrapData(res));
  if (!parsed) throwApiError(res, "سند یافت نشد");
  return parsed;
}

export async function createAccountingVoucher(body: {
  date?: string;
  description?: string;
  source_type?: string;
  source_id?: number;
  lines: AccountingVoucherLineInput[];
}): Promise<AccountingVoucher> {
  const res = await FetchWithJwtClient("POST", "/api/accounting/vouchers", authToken(), {}, {
    body: JSON.stringify(body),
  });
  const parsed = parseVoucher(unwrapData(res));
  if (!parsed) throwApiError(res, "سند ثبت شد ولی پاسخ نامعتبر بود.");
  return parsed;
}

export async function reverseAccountingVoucher(id: number): Promise<AccountingVoucher> {
  const res = await FetchWithJwtClient(
    "POST",
    `/api/accounting/vouchers/${id}/reverse`,
    authToken(),
  );
  const parsed = parseVoucher(unwrapData(res));
  if (!parsed) throwApiError(res, "برگشت سند انجام شد ولی پاسخ نامعتبر بود.");
  return parsed;
}

function parseTrialBalance(raw: unknown): TrialBalanceReport {
  const obj = asRecord(raw) ?? {};
  const totals = asRecord(obj.totals) ?? {};
  const rows = Array.isArray(obj.rows) ? obj.rows : [];
  return {
    from: obj.from == null ? null : asString(obj.from),
    to: obj.to == null ? null : asString(obj.to),
    rows: rows.map((row) => {
      const r = asRecord(row) ?? {};
      return {
        account_id: asNumber(r.account_id),
        code: asString(r.code),
        name: asString(r.name),
        level: asString(r.level),
        nature: asString(r.nature),
        kind: asString(r.kind),
        debit_turnover: asNumber(r.debit_turnover),
        credit_turnover: asNumber(r.credit_turnover),
        debit_balance: asNumber(r.debit_balance),
        credit_balance: asNumber(r.credit_balance),
      };
    }),
    totals: {
      debit_turnover: asNumber(totals.debit_turnover),
      credit_turnover: asNumber(totals.credit_turnover),
      debit_balance: asNumber(totals.debit_balance),
      credit_balance: asNumber(totals.credit_balance),
    },
    balanced: asBool(obj.balanced, true),
  };
}

export async function fetchTrialBalance(options?: {
  from?: string;
  to?: string;
  includeZero?: boolean;
}): Promise<TrialBalanceReport> {
  const params: Record<string, string> = {};
  if (options?.from) params.from = options.from;
  if (options?.to) params.to = options.to;
  if (options?.includeZero) params.include_zero = "1";
  const res = await FetchWithJwtClient(
    "GET",
    "/api/accounting/trial-balance",
    authToken(),
    params,
  );
  return parseTrialBalance(unwrapData(res));
}

function parseLedger(raw: unknown): LedgerReport {
  const obj = asRecord(raw) ?? {};
  const account = asRecord(obj.account) ?? {};
  const opening = asRecord(obj.opening) ?? {};
  const period = asRecord(obj.period) ?? {};
  const closing = asRecord(obj.closing) ?? {};
  const rows = Array.isArray(obj.rows) ? obj.rows : [];
  return {
    account: {
      account_id: asNumber(account.account_id),
      code: asString(account.code),
      name: asString(account.name),
      nature: asString(account.nature),
    },
    from: obj.from == null ? null : asString(obj.from),
    to: obj.to == null ? null : asString(obj.to),
    opening: {
      debit: asNumber(opening.debit),
      credit: asNumber(opening.credit),
      debit_balance: asNumber(opening.debit_balance),
      credit_balance: asNumber(opening.credit_balance),
    },
    rows: rows.map((row) => {
      const r = asRecord(row) ?? {};
      return {
        line_id: asNumber(r.line_id),
        voucher_id: asNumber(r.voucher_id),
        number: asNumber(r.number),
        date: asString(r.date),
        description: asString(r.description),
        line_description: asString(r.line_description),
        source_type: asString(r.source_type),
        is_reversal: asBool(r.is_reversal),
        debit: asNumber(r.debit),
        credit: asNumber(r.credit),
        running: asNumber(r.running),
        running_debit: asNumber(r.running_debit),
        running_credit: asNumber(r.running_credit),
      };
    }),
    period: {
      debit: asNumber(period.debit),
      credit: asNumber(period.credit),
    },
    closing: {
      debit: asNumber(closing.debit),
      credit: asNumber(closing.credit),
      debit_balance: asNumber(closing.debit_balance),
      credit_balance: asNumber(closing.credit_balance),
    },
  };
}

export async function fetchLedger(options: {
  accountId: number;
  from?: string;
  to?: string;
}): Promise<LedgerReport> {
  const params: Record<string, string | number> = { account_id: options.accountId };
  if (options.from) params.from = options.from;
  if (options.to) params.to = options.to;
  const res = await FetchWithJwtClient(
    "GET",
    "/api/accounting/ledger",
    authToken(),
    params,
  );
  return parseLedger(unwrapData(res));
}

export async function fetchProfitLoss(options?: {
  from?: string;
  to?: string;
}): Promise<ProfitLossReport> {
  const params: Record<string, string> = {};
  if (options?.from) params.from = options.from;
  if (options?.to) params.to = options.to;
  const res = await FetchWithJwtClient(
    "GET",
    "/api/accounting/profit-loss",
    authToken(),
    params,
  );
  const obj = asRecord(unwrapData(res)) ?? {};
  return {
    from: obj.from == null ? null : asString(obj.from),
    to: obj.to == null ? null : asString(obj.to),
    sales: asNumber(obj.sales),
    discounts: asNumber(obj.discounts),
    cogs: asNumber(obj.cogs),
    gross_profit: asNumber(obj.gross_profit),
    operating_expense: asNumber(obj.operating_expense),
    payroll: asNumber(obj.payroll),
    loyalty: asNumber(obj.loyalty),
    other_income: asNumber(obj.other_income),
    net_profit: asNumber(obj.net_profit),
    note: asString(obj.note),
  };
}

function parseBalanceSection(raw: unknown): { rows: BalanceSheetRow[]; total: number } {
  const obj = asRecord(raw) ?? {};
  const rows = Array.isArray(obj.rows) ? obj.rows : [];
  return {
    total: asNumber(obj.total),
    rows: rows.map((row) => {
      const r = asRecord(row) ?? {};
      return {
        code: asString(r.code),
        name: asString(r.name) || undefined,
        debit_balance: r.debit_balance == null ? undefined : asNumber(r.debit_balance),
        credit_balance: r.credit_balance == null ? undefined : asNumber(r.credit_balance),
      };
    }),
  };
}

export async function fetchBalanceSheet(options?: {
  asOf?: string;
}): Promise<BalanceSheetReport> {
  const params: Record<string, string> = {};
  if (options?.asOf) params.as_of = options.asOf;
  const res = await FetchWithJwtClient(
    "GET",
    "/api/accounting/balance-sheet",
    authToken(),
    params,
  );
  const obj = asRecord(unwrapData(res)) ?? {};
  const equation = asRecord(obj.equation) ?? {};
  const compare = Array.isArray(obj.cash_compare) ? obj.cash_compare : [];
  return {
    as_of: obj.as_of == null ? null : asString(obj.as_of),
    assets: parseBalanceSection(obj.assets),
    liabilities: parseBalanceSection(obj.liabilities),
    equity: parseBalanceSection(obj.equity),
    current_profit: asNumber(obj.current_profit),
    current_profit_label: asString(obj.current_profit_label, "سود جاری"),
    equation: {
      assets: asNumber(equation.assets),
      liabilities_equity_profit: asNumber(equation.liabilities_equity_profit),
      balanced: asBool(equation.balanced, true),
    },
    cash_compare: compare.map((row) => {
      const r = asRecord(row) ?? {};
      return {
        code: asString(r.code),
        name: asString(r.name) || undefined,
        linked_type: r.linked_type == null ? null : asString(r.linked_type),
        shop_account_id:
          r.shop_account_id == null ? null : asNumber(r.shop_account_id, 0) || null,
        ledger_balance: asNumber(r.ledger_balance),
        operational_balance:
          r.operational_balance == null ? null : asNumber(r.operational_balance),
        difference: r.difference == null ? null : asNumber(r.difference),
        note: r.note == null ? null : asString(r.note),
      };
    }),
    note: asString(obj.note),
  };
}

export async function postAccountingOpening(date?: string): Promise<OpeningResult> {
  const res = await FetchWithJwtClient(
    "POST",
    "/api/accounting/opening",
    authToken(),
    {},
    { body: JSON.stringify(date ? { date } : {}) },
  );
  const obj = asRecord(res) ?? {};
  if (obj.hasError) throwApiError(obj, "خطا در ثبت افتتاحیه");
  const nested = asRecord(obj.data);
  const voucherRaw = nested && (nested.id != null || nested.number != null) ? nested : obj.data;
  return {
    ok: asBool(obj.ok, true),
    already_posted: asBool(obj.already_posted, false),
    message: asString(obj.message, "انجام شد."),
    data: parseVoucher(voucherRaw),
    statusCode: asNumber(obj.statusCode, 200),
  };
}
