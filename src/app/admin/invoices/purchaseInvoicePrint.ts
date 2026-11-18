import { formatAmountNumber } from "@/app/lib/amountInput";
import { beneficiaryFromRecord, formatBeneficiaryLabel } from "@/app/lib/beneficiaries";
import { documentPaymentLabel, type DocumentPaymentFields } from "@/app/lib/documentPayments";

type PrintInvoiceItem = {
  title?: string | null;
  unit_price?: number | string | null;
  quantity?: number | string | null;
  total?: number | string | null;
  vat_amount?: number | string | null;
  discount_amount?: number | string | null;
  unit_type?: string | null;
};

type PrintInvoice = DocumentPaymentFields & {
  id?: number;
  number?: number | string | null;
  amount?: number | string | null;
  title?: string | null;
  description?: string | null;
  date?: string | null;
  user_name?: string | null;
  shop_account_id?: number | null;
  shop_account?: { id?: number; name?: string } | null;
  items?: PrintInvoiceItem[] | null;
  vat_amount?: number | string | null;
  discount_amount?: number | string | null;
  payable_amount?: number | string | null;
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function faNum(n: number): string {
  return formatAmountNumber(n) || "۰";
}

function unitLabel(unit?: string | null): string {
  if (unit === "kg") return "کیلو";
  if (unit === "liter") return "لیتر";
  if (unit === "piece") return "عدد";
  return "";
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const n = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function shopNumber(invoice?: PrintInvoice | null): number | null {
  const n = Number(invoice?.number);
  if (Number.isFinite(n) && n > 0) return n;
  const id = Number(invoice?.id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function lineTotal(item: PrintInvoiceItem): number {
  const total = toNumber(item.total);
  if (total > 0) return Math.round(total);
  const base = Math.round(toNumber(item.unit_price) * toNumber(item.quantity));
  const vat = Math.round(toNumber(item.vat_amount));
  const discount = Math.round(toNumber(item.discount_amount));
  return Math.max(0, base + vat - discount);
}

export type PurchaseInvoicePrintInput = {
  invoice: PrintInvoice;
  items?: PrintInvoiceItem[] | null;
  shopAccountName?: string;
  itemsTotal?: number;
  vatTotal?: number;
  discountTotal?: number;
  payableAmount?: number;
};

export function printPurchaseInvoice(input: PurchaseInvoicePrintInput): void {
  const { invoice } = input;
  const items = Array.isArray(input.items)
    ? input.items
    : Array.isArray(invoice.items)
      ? invoice.items
      : [];
  const beneficiary = formatBeneficiaryLabel(beneficiaryFromRecord(invoice)) || "—";
  const shopAccount =
    input.shopAccountName ||
    invoice.shop_account?.name ||
    (invoice.shop_account_id != null ? `حساب #${invoice.shop_account_id}` : "—");
  const number = shopNumber(invoice);
  const itemsTotal =
    input.itemsTotal != null
      ? input.itemsTotal
      : items.reduce((sum, row) => sum + Math.round(toNumber(row.unit_price) * toNumber(row.quantity)), 0);
  const vatTotal =
    input.vatTotal != null
      ? input.vatTotal
      : items.reduce((sum, row) => sum + Math.round(toNumber(row.vat_amount)), 0);
  const discountTotal =
    input.discountTotal != null
      ? input.discountTotal
      : items.reduce((sum, row) => sum + Math.round(toNumber(row.discount_amount)), 0);
  const payable =
    input.payableAmount != null
      ? input.payableAmount
      : Math.max(
          0,
          toNumber(invoice.payable_amount) ||
            Math.round(toNumber(invoice.amount) + toNumber(invoice.vat_amount) - toNumber(invoice.discount_amount)) ||
            itemsTotal + vatTotal - discountTotal,
        );

  const rows = items
    .filter((row) => String(row.title || "").trim())
    .map((row, index) => {
      const qty = toNumber(row.quantity);
      const unit = unitLabel(row.unit_type);
      const qtyText = qty > 0 ? `${faNum(qty)}${unit ? ` ${unit}` : ""}` : "—";
      return `<tr>
        <td>${escapeHtml(faNum(index + 1))}</td>
        <td style="text-align:right">${escapeHtml(row.title || "—")}</td>
        <td>${escapeHtml(qtyText)}</td>
        <td>${escapeHtml(faNum(Math.round(toNumber(row.unit_price))))}</td>
        <td>${escapeHtml(faNum(Math.round(toNumber(row.vat_amount))))}</td>
        <td>${escapeHtml(faNum(Math.round(toNumber(row.discount_amount))))}</td>
        <td>${escapeHtml(faNum(lineTotal(row)))}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>فاکتور خرید ${escapeHtml(number != null ? faNum(number) : "")}</title>
  <style>
    body { font-family: Tahoma, Arial, sans-serif; color: #111; padding: 16px; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .sub { font-size: 12px; color: #555; margin-bottom: 12px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; font-size: 12px; margin-bottom: 14px; }
    .meta div { border-bottom: 1px dashed #ddd; padding: 4px 0; }
    .meta span { color: #666; display: inline-block; min-width: 88px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #ccc; padding: 5px 6px; text-align: center; }
    th { background: #f3f5f8; }
    .totals { margin-top: 12px; width: 280px; margin-right: auto; font-size: 12px; }
    .totals table { width: 100%; }
    .totals td { border: none; padding: 3px 0; }
    .totals td:last-child { text-align: left; font-weight: 700; }
    .pay { margin-top: 10px; font-size: 12px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>فاکتور خرید</h1>
  <div class="sub">${escapeHtml(invoice.title || "بدون عنوان")}</div>
  <div class="meta">
    <div><span>طرف حساب / ذینفع</span> ${escapeHtml(beneficiary)}</div>
    <div><span>حساب پرداخت</span> ${escapeHtml(shopAccount || "—")}</div>
    <div><span>شماره فاکتور</span> ${escapeHtml(number != null ? faNum(number) : "—")}</div>
    <div><span>عنوان سند</span> ${escapeHtml(invoice.title || "—")}</div>
    <div><span>تاریخ</span> ${escapeHtml(invoice.date || "—")}</div>
    <div><span>کاربر</span> ${escapeHtml(invoice.user_name || "—")}</div>
  </div>
  ${
    invoice.description
      ? `<div class="sub"><strong>توضیحات:</strong> ${escapeHtml(invoice.description)}</div>`
      : ""
  }
  <div class="pay">پرداخت: ${escapeHtml(documentPaymentLabel(invoice))}</div>
  <table>
    <thead>
      <tr>
        <th>ردیف</th>
        <th>شرح</th>
        <th>مقدار</th>
        <th>فی</th>
        <th>مالیات</th>
        <th>تخفیف</th>
        <th>جمع</th>
      </tr>
    </thead>
    <tbody>${rows || `<tr><td colspan="7">ردیفی ثبت نشده</td></tr>`}</tbody>
  </table>
  <div class="totals">
    <table>
      <tr><td>جمع اقلام</td><td>${escapeHtml(faNum(itemsTotal))} تومان</td></tr>
      ${vatTotal > 0 ? `<tr><td>مالیات</td><td>${escapeHtml(faNum(vatTotal))} تومان</td></tr>` : ""}
      ${discountTotal > 0 ? `<tr><td>تخفیف</td><td>${escapeHtml(faNum(discountTotal))} تومان</td></tr>` : ""}
      <tr><td>قابل پرداخت</td><td>${escapeHtml(faNum(payable))} تومان</td></tr>
    </table>
  </div>
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;left:0;top:0;width:900px;height:700px;border:0;opacity:0;pointer-events:none;z-index:-1";
  const cleanup = () => window.setTimeout(() => iframe.remove(), 400);
  iframe.onload = () => {
    const frameWindow = iframe.contentWindow;
    if (!frameWindow) {
      iframe.remove();
      return;
    }
    frameWindow.addEventListener("afterprint", cleanup, { once: true });
    frameWindow.focus();
    frameWindow.print();
  };
  document.body.appendChild(iframe);
  iframe.srcdoc = html;
}
