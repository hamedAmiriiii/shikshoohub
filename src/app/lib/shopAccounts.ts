import { apiRequestError } from "@/app/lib/apiRequestError/client";

export type ShopAccountType = "main" | "petty_cash" | string;

export type ShopAccount = {
  id: number;
  name: string;
  balance: number;
  type?: ShopAccountType;
  is_default?: boolean;
  is_active?: boolean;
  sort_order?: number;
  deposits_total?: number;
  charged_total?: number;
  expenses_total?: number;
  invoices_total?: number;
};

export function isPettyCashAccount(account: Pick<ShopAccount, "type">): boolean {
  return account.type === "petty_cash";
}

export function isMainShopAccount(account: Pick<ShopAccount, "type">): boolean {
  return !isPettyCashAccount(account);
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
  type?: "petty_cash" | "main";
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

export function formatAccountOptionLabel(account: ShopAccount): string {
  const balance = new Intl.NumberFormat("fa-IR").format(account.balance || 0);
  const kind = isPettyCashAccount(account) ? "تنخواه" : "حساب";
  return `${account.name} (${kind} · موجودی ${balance})`;
}
