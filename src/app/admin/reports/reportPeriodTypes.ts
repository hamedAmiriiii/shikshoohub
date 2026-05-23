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
  { key: "total_collected", label: "کل وصول‌شده در دوره", highlight: true },
  { key: "cash_and_card_total", label: "جمع نقد + کارت" },
  { key: "cash_amount", label: "پرداخت نقد" },
  { key: "card_amount", label: "پرداخت کارت" },
  { key: "installments_collected", label: "اقساط وصول‌شده" },
  { key: "uncollected_installments", label: "اقساط وصول‌نشده (فروش این دوره)" },
];

export function getPeriodNumber(period: ReportPeriod, key: keyof ReportPeriod): number | null {
  const v = period[key];
  return typeof v === "number" && !Number.isNaN(v) ? v : null;
}

export function periodHasCollectionDetails(period: ReportPeriod): boolean {
  return COLLECTION_DETAIL_FIELDS.some(({ key }) => getPeriodNumber(period, key) !== null);
}
