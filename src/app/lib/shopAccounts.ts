import { apiRequestError } from "@/app/lib/apiRequestError/client";

/** مقادیر API: shop | petty_cash | till */
export type ShopAccountType = "shop" | "petty_cash" | "till" | string;

export type ShopAccount = {
  id: number;
  name: string;
  balance: number;
  type?: ShopAccountType;
  is_till?: boolean;
  is_default?: boolean;
  is_active?: boolean;
  sort_order?: number;
  deposits_total?: number;
  charged_total?: number;
  expenses_total?: number;
  invoices_total?: number;
  adjustments_total?: number;
};

export function isPettyCashAccount(account: Pick<ShopAccount, "type">): boolean {
  return account.type === "petty_cash";
}

export function isTillAccount(account: Pick<ShopAccount, "type" | "is_till">): boolean {
  return account.is_till === true || account.type === "till";
}

export function isMainShopAccount(account: Pick<ShopAccount, "type" | "is_till">): boolean {
  if (isTillAccount(account)) return false;
  if (isPettyCashAccount(account)) return false;
  return true;
}

export function remainingBalanceDeleteMessage(account: ShopAccount): string | null {
  const balance = Number(account.balance) || 0;
  if (Math.abs(balance) < 0.01) return null;
  const amount = new Intl.NumberFormat("fa-IR").format(Math.round(Math.abs(balance)));
  const kind = isPettyCashAccount(account) ? "تنخواه" : "حساب";
  const state = balance < 0 ? "بدهکار" : "مانده";
  return `این ${kind} «${account.name}» هنوز ${state} ${amount} تومان دارد. اول موجودی را صفر کنید، بعد حذف کنید.`;
}

export function parseShopAccounts(raw: unknown): ShopAccount[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const id = Number(row.id);
      if (!Number.isFinite(id) || id <= 0) return null;
      if (row.is_active === false) return null;
      return {
        id,
        name: typeof row.name === "string" && row.name.trim() ? row.name.trim() : `حساب ${id}`,
        balance: Math.floor(Number(row.balance) || 0),
        type: typeof row.type === "string" ? row.type : undefined,
        is_default: Boolean(row.is_default),
        is_active: row.is_active !== false,
        sort_order:
          row.sort_order != null && Number.isFinite(Number(row.sort_order))
            ? Number(row.sort_order)
            : undefined,
        deposits_total:
          row.deposits_total != null ? Math.floor(Number(row.deposits_total) || 0) : undefined,
        charged_total:
          row.charged_total != null ? Math.floor(Number(row.charged_total) || 0) : undefined,
        expenses_total:
          row.expenses_total != null ? Math.floor(Number(row.expenses_total) || 0) : undefined,
        invoices_total:
          row.invoices_total != null ? Math.floor(Number(row.invoices_total) || 0) : undefined,
        adjustments_total:
          row.adjustments_total != null ? Math.floor(Number(row.adjustments_total) || 0) : undefined,
        is_till: row.is_till === true || row.type === "till",
      } satisfies ShopAccount;
    })
    .filter((item): item is ShopAccount => item != null)
    .sort((a, b) => (a.sort_order ?? a.id) - (b.sort_order ?? b.id));
}

function extractAccountsPayload(res: unknown): unknown {
  if (!res || typeof res !== "object") return [];
  const r = res as Record<string, unknown>;
  if (r.hasError) return [];
  if (Array.isArray(r.shop_accounts)) return r.shop_accounts;
  if (Array.isArray(r.data)) return r.data;
  if (r.data && typeof r.data === "object") {
    const nested = r.data as Record<string, unknown>;
    if (Array.isArray(nested.shop_accounts)) return nested.shop_accounts;
    if (Array.isArray(nested.data)) return nested.data;
  }
  if (Array.isArray(r)) return r;
  return [];
}

export async function fetchShopAccounts(options?: {
  type?: "petty_cash" | "shop";
  token?: string;
}): Promise<ShopAccount[]> {
  const token = options?.token ?? (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");
  const query = options?.type ? `?type=${encodeURIComponent(options.type)}` : "";
  const res = await apiRequestError(
    "Get",
    {},
    {},
    `/api/shop-accounts${query}`,
    true,
    true,
    token
  );
  if (res?.hasError) {
    throw new Error(
      typeof res.message === "string" ? res.message : "خطا در دریافت حساب‌ها"
    );
  }
  return parseShopAccounts(extractAccountsPayload(res));
}

export async function setShopAccountBalances(payload: {
  date?: string;
  description?: string;
  items: { shop_account_id: number; target_balance: number }[];
}): Promise<{ message: string }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
  const res = await apiRequestError(
    "Post",
    {},
    payload,
    "/api/shop-accounts/set-balances",
    true,
    true,
    token
  );
  if (res?.hasError) {
    throw new Error(
      typeof res.message === "string" ? res.message : "خطا در تنظیم مانده حساب"
    );
  }
  const rec = res && typeof res === "object" ? (res as Record<string, unknown>) : {};
  return {
    message: typeof rec.message === "string" ? rec.message : "مانده حساب‌ها به‌روز شد.",
  };
}

export type ShopAccountBalanceAdjustmentLog = {
  id: number | string;
  shop_account_id: number;
  account_name: string;
  account_type?: string;
  account_type_label?: string;
  kind?: "adjust" | "charge" | string;
  kind_label?: string;
  title?: string | null;
  counterparty_name?: string | null;
  amount: number;
  balance_before: number | null;
  balance_after: number | null;
  date: string | null;
  date_jalali: string | null;
  description: string | null;
  user_name: string | null;
  created_at_jalali: string | null;
};

export async function fetchShopAccountBalanceAdjustments(options?: {
  type?: "all" | "shop" | "petty_cash" | "till";
  shopAccountId?: number;
  limit?: number;
  token?: string;
}): Promise<ShopAccountBalanceAdjustmentLog[]> {
  const token =
    options?.token ?? (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");
  const params = new URLSearchParams();
  if (options?.type && options.type !== "all") params.set("type", options.type);
  if (options?.shopAccountId) params.set("shop_account_id", String(options.shopAccountId));
  if (options?.limit) params.set("limit", String(options.limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await apiRequestError(
    "Get",
    {},
    {},
    `/api/shop-accounts/balance-adjustments${query}`,
    true,
    true,
    token
  );
  if (res?.hasError) {
    throw new Error(
      typeof res.message === "string" ? res.message : "خطا در دریافت لاگ اصلاح مانده"
    );
  }
  const rec = res && typeof res === "object" ? (res as Record<string, unknown>) : {};
  const raw = Array.isArray(rec.data) ? rec.data : Array.isArray(res) ? res : [];
  return raw
    .map((item) => parseBalanceLogRow(item))
    .filter((item): item is ShopAccountBalanceAdjustmentLog => item != null);
}

function parseBalanceLogRow(item: unknown): ShopAccountBalanceAdjustmentLog | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  const rawId = row.id;
  const id =
    typeof rawId === "string" && rawId.trim() !== ""
      ? rawId
      : Number(rawId);
  if (typeof id === "number" && (!Number.isFinite(id) || id <= 0)) return null;
  if (typeof id === "string" && !id.trim()) return null;
  return {
    id,
    shop_account_id: Number(row.shop_account_id) || 0,
    account_name:
      typeof row.account_name === "string" ? row.account_name : `حساب ${String(id)}`,
    account_type: typeof row.account_type === "string" ? row.account_type : undefined,
    account_type_label:
      typeof row.account_type_label === "string" ? row.account_type_label : undefined,
    kind: typeof row.kind === "string" ? row.kind : undefined,
    kind_label: typeof row.kind_label === "string" ? row.kind_label : undefined,
    title: typeof row.title === "string" ? row.title : null,
    counterparty_name:
      typeof row.counterparty_name === "string" ? row.counterparty_name : null,
    amount: Math.round(Number(row.amount) || 0),
    balance_before:
      row.balance_before == null ? null : Math.round(Number(row.balance_before) || 0),
    balance_after:
      row.balance_after == null ? null : Math.round(Number(row.balance_after) || 0),
    date: typeof row.date === "string" ? row.date : null,
    date_jalali: typeof row.date_jalali === "string" ? row.date_jalali : null,
    description: typeof row.description === "string" ? row.description : null,
    user_name: typeof row.user_name === "string" ? row.user_name : null,
    created_at_jalali:
      typeof row.created_at_jalali === "string" ? row.created_at_jalali : null,
  };
}

/** لاگ تراکنش‌های تنخواه: شارژ + اصلاح موجودی */
export async function fetchPettyCashTransactions(options?: {
  shopAccountId?: number;
  limit?: number;
  token?: string;
}): Promise<ShopAccountBalanceAdjustmentLog[]> {
  const token =
    options?.token ?? (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");
  const params = new URLSearchParams();
  if (options?.shopAccountId) params.set("shop_account_id", String(options.shopAccountId));
  if (options?.limit) params.set("limit", String(options.limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await apiRequestError(
    "Get",
    {},
    {},
    `/api/shop-accounts/petty-cash-transactions${query}`,
    true,
    true,
    token
  );
  if (res?.hasError) {
    throw new Error(
      typeof res.message === "string" ? res.message : "خطا در دریافت لاگ تراکنش‌های تنخواه"
    );
  }
  const rec = res && typeof res === "object" ? (res as Record<string, unknown>) : {};
  const raw = Array.isArray(rec.data) ? rec.data : Array.isArray(res) ? res : [];
  return raw
    .map((item) => parseBalanceLogRow(item))
    .filter((item): item is ShopAccountBalanceAdjustmentLog => item != null);
}

export function formatAccountOptionLabel(account: ShopAccount): string {
  const balance = new Intl.NumberFormat("fa-IR").format(account.balance || 0);
  const kind =
    account.type === "till"
      ? "صندوق"
      : isPettyCashAccount(account)
        ? "تنخواه"
        : "بانک";
  return `${account.name} (${kind} · موجودی ${balance})`;
}

export type ShopAccountTransactionEvent = {
  id: string;
  kind: string;
  kind_label: string;
  direction: "in" | "out" | string;
  amount: number;
  signed_amount: number;
  title: string;
  description?: string | null;
  at?: string | null;
  at_jalali?: string | null;
  date?: string | null;
  date_jalali?: string | null;
  href?: string | null;
  balance_after?: number | null;
};

export type ShopAccountTransactionHistory = {
  account: {
    id: number;
    name: string;
    type?: string;
    type_label?: string;
    is_till?: boolean;
    balance: number;
  };
  summary: {
    in_total: number;
    out_total: number;
    net: number;
    events_count: number;
    computed_balance: number;
    current_balance: number;
  };
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_more: boolean;
  };
  events: ShopAccountTransactionEvent[];
};

export const SHOP_ACCOUNT_TX_PAGE_SIZE = 30;

export async function fetchShopAccountTransactions(
  accountId: number,
  options?: { limit?: number; offset?: number; token?: string }
): Promise<ShopAccountTransactionHistory> {
  const token =
    options?.token ?? (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");
  const params = new URLSearchParams();
  const limit = options?.limit ?? SHOP_ACCOUNT_TX_PAGE_SIZE;
  const offset = options?.offset ?? 0;
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  const query = `?${params.toString()}`;
  const res = await apiRequestError(
    "Get",
    {},
    {},
    `/api/shop-accounts/${accountId}/transactions${query}`,
    true,
    true,
    token
  );
  if (res?.hasError) {
    throw new Error(
      typeof res.message === "string" ? res.message : "خطا در دریافت گردش حساب"
    );
  }
  const rec = res && typeof res === "object" ? (res as Record<string, unknown>) : {};
  const accountRaw = (rec.account && typeof rec.account === "object" ? rec.account : {}) as Record<
    string,
    unknown
  >;
  const summaryRaw = (rec.summary && typeof rec.summary === "object" ? rec.summary : {}) as Record<
    string,
    unknown
  >;
  const paginationRaw = (
    rec.pagination && typeof rec.pagination === "object" ? rec.pagination : {}
  ) as Record<string, unknown>;
  const eventsRaw = Array.isArray(rec.events) ? rec.events : [];
  const events = eventsRaw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const id = typeof row.id === "string" ? row.id : String(row.id ?? "");
      if (!id) return null;
      return {
        id,
        kind: typeof row.kind === "string" ? row.kind : "",
        kind_label: typeof row.kind_label === "string" ? row.kind_label : "",
        direction: typeof row.direction === "string" ? row.direction : "out",
        amount: Math.round(Number(row.amount) || 0),
        signed_amount: Math.round(Number(row.signed_amount) || 0),
        title: typeof row.title === "string" ? row.title : "",
        description: typeof row.description === "string" ? row.description : null,
        at: typeof row.at === "string" ? row.at : null,
        at_jalali: typeof row.at_jalali === "string" ? row.at_jalali : null,
        date: typeof row.date === "string" ? row.date : null,
        date_jalali: typeof row.date_jalali === "string" ? row.date_jalali : null,
        href: typeof row.href === "string" ? row.href : null,
        balance_after:
          row.balance_after == null ? null : Math.round(Number(row.balance_after) || 0),
      } satisfies ShopAccountTransactionEvent;
    })
    .filter((item): item is ShopAccountTransactionEvent => item != null);
  const total =
    Number(paginationRaw.total) ||
    Number(summaryRaw.events_count) ||
    events.length;
  const pageLimit = Number(paginationRaw.limit) || limit;
  const pageOffset = Number(paginationRaw.offset) || offset;
  const hasMore =
    typeof paginationRaw.has_more === "boolean"
      ? paginationRaw.has_more
      : pageOffset + events.length < total;
  return {
    account: {
      id: Number(accountRaw.id) || accountId,
      name: typeof accountRaw.name === "string" ? accountRaw.name : `حساب ${accountId}`,
      type: typeof accountRaw.type === "string" ? accountRaw.type : undefined,
      type_label: typeof accountRaw.type_label === "string" ? accountRaw.type_label : undefined,
      is_till: Boolean(accountRaw.is_till),
      balance: Math.round(Number(accountRaw.balance) || 0),
    },
    summary: {
      in_total: Math.round(Number(summaryRaw.in_total) || 0),
      out_total: Math.round(Number(summaryRaw.out_total) || 0),
      net: Math.round(Number(summaryRaw.net) || 0),
      events_count: Number(summaryRaw.events_count) || total,
      computed_balance: Math.round(Number(summaryRaw.computed_balance) || 0),
      current_balance: Math.round(Number(summaryRaw.current_balance) || 0),
    },
    pagination: {
      limit: pageLimit,
      offset: pageOffset,
      total,
      has_more: hasMore,
    },
    events,
  };
}
