import { formatDailyTicketNumber } from "@/app/lib/dailyTicketNumber";
import { readAdminPosSettings } from "@/app/lib/adminPosSettings";
import {
  formatReceiptDate,
  formatReceiptNumber,
  getPaymentTypeLabel,
  resolvePaperWidthMm,
  type ReceiptPrintStation,
  type SaleReceiptData,
  type SaleReceiptPrintSettings,
} from "@/app/lib/saleReceiptPrint";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function dailyTicketHtml(receipt: SaleReceiptData): string {
  if (!readAdminPosSettings().showDailyTicketNumber || receipt.dailyTicketNumber == null) return "";
  return `<div class="sub">فیش ${escapeHtml(formatDailyTicketNumber(receipt.dailyTicketNumber))}</div>`;
}

/** CSS px-per-mm at the browser reference density used by QZ rasterization. */
const TICKET_LAYOUT_DPI = 96;

function mmToLayoutPx(mm: number): number {
  return Math.max(1, Math.round((mm / 25.4) * TICKET_LAYOUT_DPI));
}

function wrapTicketHtml(inner: string, settings: SaleReceiptPrintSettings): string {
  const widthMm = resolvePaperWidthMm(settings);
  // Pixel widths avoid SVG foreignObject mis-resolving `mm` into a tiny RTL strip.
  const widthPx = mmToLayoutPx(widthMm);
  const padPx = mmToLayoutPx(settings.paddingMm);
  const font = settings.fontSize;
  const title = settings.titleFontSize;
  const lh = settings.lineHeight;
  return `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" dir="rtl" lang="fa">
<head>
<meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    width: ${widthPx}px;
    max-width: ${widthPx}px;
    min-width: ${widthPx}px;
    color: #000000;
    background: #ffffff;
  }
  body {
    padding: ${padPx}px;
    font-family: Tahoma, "Segoe UI", Arial, sans-serif;
    font-size: ${font}px;
    line-height: ${lh};
    width: ${widthPx}px;
    max-width: ${widthPx}px;
    min-width: ${widthPx}px;
    overflow: visible;
  }
  h1, .sub, .muted, .item, .note, hr { width: 100%; }
  h1 { font-size: ${title}px; font-weight: 800; text-align: center; margin: 0 0 4px; color: #000000; }
  .sub { text-align: center; font-weight: 700; margin: 0 0 6px; color: #000000; }
  .muted { text-align: center; font-size: ${font - 1}px; margin: 0 0 8px; color: #000000; }
  table.row { width: 100%; border-collapse: collapse; table-layout: fixed; }
  table.row td { vertical-align: top; color: #000000; word-wrap: break-word; }
  table.row td.end { text-align: left; white-space: nowrap; width: 1%; }
  .item { margin-bottom: ${settings.compactItems ? 4 : 8}px; color: #000000; }
  .name { font-weight: 700; color: #000000; }
  hr { border: none; border-top: 1px solid #000000; margin: 8px 0; }
  .bold { font-weight: 800; }
  .note { white-space: pre-wrap; color: #000000; }
</style>
</head>
<body>${inner}</body>
</html>`;
}

function rowHtml(label: string, value: string, bold = false): string {
  const cls = bold ? "bold" : "";
  return `<table class="row ${cls}"><tr><td>${label}</td><td class="end">${value}</td></tr></table>`;
}

function hallInner(receipt: SaleReceiptData, settings: SaleReceiptPrintSettings): string {
  const shopTitle = escapeHtml(settings.shopTitle || receipt.shopName || "فاکتور فروش");
  const items = receipt.items
    .map((item) => {
      const qtyPrice = settings.showItemUnitPrice
        ? `${formatReceiptNumber(item.quantity)} × ${formatReceiptNumber(item.unitPrice)}`
        : `تعداد: ${formatReceiptNumber(item.quantity)}`;
      const note = item.note ? `<div>یادداشت: ${escapeHtml(item.note)}</div>` : "";
      return `<div class="item"><div class="name">${escapeHtml(item.name)}</div>${note}<table class="row"><tr><td>${qtyPrice}</td><td class="end bold">${formatReceiptNumber(item.lineTotal)}</td></tr></table></div>`;
    })
    .join("");

  const extras: string[] = [];
  extras.push(rowHtml("جمع", formatReceiptNumber(receipt.subtotal)));
  if (receipt.discount > 0) extras.push(rowHtml("تخفیف", formatReceiptNumber(receipt.discount)));
  if (receipt.creditUsed > 0) extras.push(rowHtml("اعتبار", formatReceiptNumber(receipt.creditUsed)));
  if (receipt.backPrice > 0) extras.push(rowHtml("برگشتی", formatReceiptNumber(receipt.backPrice)));
  extras.push(rowHtml("مبلغ نهایی", `${formatReceiptNumber(receipt.finalTotal)} تومان`, true));
  if (receipt.payableNow > 0 && receipt.payableNow !== receipt.finalTotal) {
    extras.push(rowHtml("قابل پرداخت", `${formatReceiptNumber(receipt.payableNow)} تومان`));
  }

  const pay: string[] = [];
  if (settings.showPaymentMethod) {
    pay.push(`<div>روش پرداخت: ${escapeHtml(getPaymentTypeLabel(receipt))}</div>`);
    if (receipt.footerNote) pay.push(`<div>${escapeHtml(receipt.footerNote)}</div>`);
    if (receipt.customerNote) pay.push(`<div class="note">توضیحات: ${escapeHtml(receipt.customerNote)}</div>`);
    if (receipt.settlementMode === "split" || receipt.paymentType === "cheque") {
      if (receipt.cardAmount) pay.push(`<div>کارت: ${formatReceiptNumber(receipt.cardAmount)} تومان</div>`);
      if (receipt.cashAmount) pay.push(`<div>نقد: ${formatReceiptNumber(receipt.cashAmount)} تومان</div>`);
    }
    if (receipt.paymentType === "installment" && receipt.installmentAmount != null) {
      pay.push(`<div>مبلغ هر قسط: ${formatReceiptNumber(Math.floor(receipt.installmentAmount))} تومان</div>`);
    }
  }

  return `
    <h1>${shopTitle}</h1>
    <div class="sub">فیش سالن</div>
    ${dailyTicketHtml(receipt)}
    ${settings.showDate ? `<div class="muted">${escapeHtml(formatReceiptDate(receipt.createdAt))}</div>` : ""}
    <table class="row">
      <tr>
        <td>
          ${settings.showPurchaseId && receipt.purchaseId != null ? `<div>شماره فاکتور: ${escapeHtml(String(receipt.purchaseId))}</div>` : ""}
          ${settings.showCustomerPhone && receipt.phone ? `<div>مشتری: ${escapeHtml(receipt.phone)}</div>` : ""}
        </td>
        ${receipt.tableLabel ? `<td class="end bold">${escapeHtml(receipt.tableLabel)}</td>` : ""}
      </tr>
    </table>
    <hr/>
    ${items}
    <hr/>
    ${extras.join("")}
    ${pay.length ? `<hr/>${pay.join("")}` : ""}
    ${settings.footerText ? `<hr/><div class="muted">${escapeHtml(settings.footerText)}</div>` : ""}
  `;
}

function prepInner(
  receipt: SaleReceiptData,
  settings: SaleReceiptPrintSettings,
  title: string,
): string {
  const shopTitle = settings.shopTitle || receipt.shopName || "";
  const items = receipt.items
    .map((item) => {
      const note = item.note ? `<div class="bold">یادداشت: ${escapeHtml(item.note)}</div>` : "";
      return `<div class="item"><table class="row"><tr><td class="name">${escapeHtml(item.name)}</td><td class="end bold">× ${formatReceiptNumber(item.quantity)}</td></tr></table>${note}</div>`;
    })
    .join("");

  return `
    <h1>${escapeHtml(title)}</h1>
    ${dailyTicketHtml(receipt)}
    ${shopTitle ? `<div class="muted">${escapeHtml(shopTitle)}</div>` : ""}
    ${settings.showDate ? `<div class="muted">${escapeHtml(formatReceiptDate(receipt.createdAt))}</div>` : ""}
    ${receipt.tableLabel ? `<div class="sub">${escapeHtml(receipt.tableLabel)}</div>` : ""}
    ${settings.showPurchaseId && receipt.purchaseId != null ? `<div class="muted">سفارش ${escapeHtml(String(receipt.purchaseId))}</div>` : ""}
    <hr/>
    ${items}
    ${receipt.customerNote ? `<hr/><div class="note bold">توضیحات سفارش: ${escapeHtml(receipt.customerNote)}</div>` : ""}
  `;
}

export function buildStationTicketHtml(
  receipt: SaleReceiptData,
  settings: SaleReceiptPrintSettings,
  station: ReceiptPrintStation,
): string {
  if (station === "hall") {
    return wrapTicketHtml(hallInner(receipt, settings), settings);
  }
  const title =
    station === "kitchen" ? settings.kitchenTitle || "آشپزخانه" : settings.extraTitle || "بار";
  return wrapTicketHtml(prepInner(receipt, settings, title), settings);
}
