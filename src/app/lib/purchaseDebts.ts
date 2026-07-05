export type PurchaseDebtStatus = "pending" | "settled" | "all";

export type PurchaseDebtorRow = {
  phone: string;
  debt_count: number;
  total_debt_amount?: number;
  purchases?: PurchaseDebtInvoice[];
};

export type PurchaseDebtProduct = {
  id?: number;
  product_id?: number;
  name?: string;
  product_name?: string;
  quantity?: number;
  sale_price?: number;
  unit_price?: number;
  line_total?: number;
  size?: string | null;
  color?: string | null;
};

export type PurchaseDebtInvoice = {
  id: number;
  purchase_id?: number;
  phone?: string;
  status?: string;
  payment_type?: string;
  payment_type_label?: string;
  total_amount?: number;
  payable_amount?: number;
  debt_amount?: number;
  amount?: number;
  discount_amount?: number;
  credit_used?: number;
  created_at?: string;
  settled_at?: string | null;
  debt_settled_at?: string | null;
  is_debt_settled?: boolean;
  products?: PurchaseDebtProduct[];
  items?: PurchaseDebtProduct[];
};

export type PurchaseDebtsGridMeta = {
  total_debtors?: number;
  total_debt_amount?: number;
  total_debt_count?: number;
};

export type PurchaseDebtsGridResponse = {
  data?: PurchaseDebtorRow[];
  meta?: PurchaseDebtsGridMeta;
  total?: number;
};

function normalizeDebtInvoice(raw: Record<string, unknown>): PurchaseDebtInvoice {
  const invoice = { ...(raw as PurchaseDebtInvoice) };
  if (!invoice.status) {
    if (invoice.is_debt_settled === true) invoice.status = "settled";
    else if (invoice.is_debt_settled === false) invoice.status = "pending";
  }
  return invoice;
}

export function extractDebtorList(res: unknown): PurchaseDebtorRow[] {
  if (!res || typeof res !== "object") return [];
  const obj = res as Record<string, unknown>;
  if (Array.isArray(obj.data)) {
    return (obj.data as Record<string, unknown>[]).map((row) => ({
      phone: String(row.phone ?? ""),
      debt_count: Number(row.debt_count) || 0,
      total_debt_amount: getDebtorTotalAmount(row),
      purchases: Array.isArray(row.purchases)
        ? row.purchases.map((p) => normalizeDebtInvoice(p as Record<string, unknown>))
        : undefined,
    }));
  }
  if (Array.isArray(obj)) return obj as PurchaseDebtorRow[];
  return [];
}

function getDebtorTotalAmount(row: Record<string, unknown>): number {
  if (typeof row.total_debt_amount === "number") return row.total_debt_amount;
  if (Array.isArray(row.purchases)) {
    return row.purchases.reduce((sum, item) => {
      const invoice = normalizeDebtInvoice(item as Record<string, unknown>);
      return sum + getDebtInvoiceAmount(invoice);
    }, 0);
  }
  return 0;
}

export function extractDebtGridMeta(res: unknown): PurchaseDebtsGridMeta {
  if (!res || typeof res !== "object") return {};
  const obj = res as Record<string, unknown>;
  if (obj.meta && typeof obj.meta === "object") return obj.meta as PurchaseDebtsGridMeta;
  return {};
}

export function extractDebtInvoiceList(res: unknown): PurchaseDebtInvoice[] {
  if (!res || typeof res !== "object") return [];
  const obj = res as Record<string, unknown>;

  let list: unknown[] = [];
  if (Array.isArray(obj.purchases)) {
    list = obj.purchases;
  } else if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
    const data = obj.data as Record<string, unknown>;
    if (Array.isArray(data.purchases)) list = data.purchases;
  } else if (Array.isArray(obj.data)) {
    list = obj.data;
  } else if (Array.isArray(obj)) {
    list = obj;
  }

  return list.map((item) => normalizeDebtInvoice(item as Record<string, unknown>));
}

export function getDebtInvoiceId(invoice: PurchaseDebtInvoice): number {
  return invoice.purchase_id ?? invoice.id;
}

export function getDebtInvoiceAmount(invoice: PurchaseDebtInvoice): number {
  if (typeof invoice.payable_amount === "number") return invoice.payable_amount;
  if (typeof invoice.debt_amount === "number") return invoice.debt_amount;
  if (typeof invoice.total_amount === "number") return invoice.total_amount;
  if (typeof invoice.amount === "number") return invoice.amount;
  return 0;
}

export function getDebtInvoiceProducts(invoice: PurchaseDebtInvoice): PurchaseDebtProduct[] {
  return invoice.products || invoice.items || [];
}

export function getDebtProductName(product: PurchaseDebtProduct): string {
  return product.product_name || product.name || "—";
}

export function isDebtInvoicePending(invoice: PurchaseDebtInvoice): boolean {
  if (invoice.is_debt_settled === true) return false;
  if (invoice.is_debt_settled === false) return true;
  return invoice.status !== "settled";
}

export function formatDebtStatus(invoice: PurchaseDebtInvoice | string | undefined): string {
  if (!invoice) return "—";
  if (typeof invoice === "string") {
    if (invoice === "pending") return "تسویه‌نشده";
    if (invoice === "settled") return "تسویه‌شده";
    return invoice;
  }
  if (invoice.is_debt_settled === true) return "تسویه‌شده";
  if (invoice.is_debt_settled === false) return "تسویه‌نشده";
  if (invoice.status === "pending") return "تسویه‌نشده";
  if (invoice.status === "settled") return "تسویه‌شده";
  return invoice.payment_type_label || invoice.status || "—";
}
