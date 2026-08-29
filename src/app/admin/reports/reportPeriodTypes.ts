export interface ReportPeriod {
  total_sales: number;
  total_profit: number;
  total_returns: number;
  card_amount?: number;
  cash_amount?: number;
  cash_and_card_total?: number;
  installments_collected?: number;
  total_collected?: number;
  uncollected_installments?: number;
  /** اعتبار مصرف‌شده مشتریان در دوره */
  credit_used_total?: number;
  /** نقد + کارت + اعتبار مصرف‌شده + اقساط وصول‌شده — مقایسه با فروش */
  settlement_total?: number;
}

export interface ReportData {
  today: ReportPeriod;
  yesterday: ReportPeriod;
  week: ReportPeriod;
  month: ReportPeriod;
  last_month: ReportPeriod;
  year: ReportPeriod;
  products_inventory?: {
    total_purchase_value: number;
    total_sale_value: number;
    products?: unknown[];
    produced_goods?: unknown[];
  };
  raw_materials_inventory?: {
    total_purchase_value: number;
    total_sale_value: number;
    stock_kg?: number;
  };
  meta?: {
    total_uncollected_installments?: number;
  };
}

export const COLLECTION_DETAIL_FIELDS: {
  key: keyof ReportPeriod;
  label: string;
  highlight?: boolean;
}[] = [
  { key: "settlement_total", label: "جمع تسویه (مقایسه با فروش)", highlight: true },
  { key: "credit_used_total", label: "اعتبار مصرف‌شده مشتریان" },
  { key: "total_collected", label: "کل وصول نقدی/کارتی + اقساط" },
  { key: "cash_and_card_total", label: "جمع نقد + کارت" },
  { key: "cash_amount", label: "پرداخت نقد" },
  { key: "card_amount", label: "پرداخت کارت" },
  { key: "installments_collected", label: "اقساط وصول‌شده" },
  { key: "uncollected_installments", label: "اقساط وصول‌نشده (فروش این دوره)" },
];

/** مبلغی که با فروش دوره مقایسه می‌شود */
export function getSettlementAmount(period: ReportPeriod): number | null {
  return (
    getPeriodNumber(period, "settlement_total") ??
    getPeriodNumber(period, "total_collected")
  );
}

export function getPeriodNumber(period: ReportPeriod, key: keyof ReportPeriod): number | null {
  const v = period[key];
  return typeof v === "number" && !Number.isNaN(v) ? v : null;
}

export function periodHasCollectionDetails(period: ReportPeriod): boolean {
  return COLLECTION_DETAIL_FIELDS.some(({ key }) => getPeriodNumber(period, key) !== null);
}
