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

/** Keep digits/LTR fragments from breaking RTL Persian layout. */
function ltr(value: string): string {
  return `<span class="ltr">${escapeHtml(value)}</span>`;
}

function dailyTicketHtml(receipt: SaleReceiptData): string {
  if (!readAdminPosSettings().showDailyTicketNumber || receipt.dailyTicketNumber == null) return "";
  return `<div class="sub">فیش ${ltr(formatDailyTicketNumber(receipt.dailyTicketNumber))}</div>`;
}

const TICKET_LAYOUT_DPI = 96;

function mmToLayoutPx(mm: number): number {
  return Math.max(1, Math.round((mm / 25.4) * TICKET_LAYOUT_DPI));
}

function wrapTicketHtml(inner: string, settings: SaleReceiptPrintSettings): string {
  const widthMm = resolvePaperWidthMm(settings);
  const widthPx = mmToLayoutPx(widthMm);
  const padPx = mmToLayoutPx(settings.paddingMm);
  // Slightly larger than UI settings so thermal dots stay readable.
  const font = Math.min(18, Math.max(settings.fontSize + 1, 13));
  const title = Math.min(22, Math.max(settings.titleFontSize + 2, 16));
  const lh = Math.max(settings.lineHeight, 1.45);
  const fontUrl = "/fonts/Iranian%20Sans.ttf";
  return `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
<meta charset="utf-8"/>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<style>
  @font-face {
    font-family: "IRANSans";
    src: url("${fontUrl}") format("truetype");
    font-weight: 100 900;
    font-style: normal;
    font-display: block;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    width: ${widthPx}px;
    max-width: ${widthPx}px;
    color: #000;
    background: #fff;
    direction: rtl;
  }
  body {
    padding: ${padPx}px;
    font-family: "IRANSans", "Iranian Sans", Tahoma, "Segoe UI", sans-serif;
    font-size: ${font}px;
    font-weight: 600;
    line-height: ${lh};
    text-align: right;
    -webkit-font-smoothing: antialiased;
    text-rendering: geometricPrecision;
  }
  h1, .sub, .muted, .item, .note, .block, hr, table.row { width: 100%; }
  h1 {
    font-size: ${title}px;
    font-weight: 800;
    text-align: center;
    margin: 0 0 6px;
    letter-spacing: 0;
  }
  .sub { text-align: center; font-weight: 700; margin: 0 0 6px; font-size: ${font + 1}px; }
  .muted { text-align: center; font-size: ${font}px; margin: 0 0 8px; font-weight: 600; }
  table.row { border-collapse: collapse; table-layout: fixed; }
  table.row td {
    vertical-align: top;
    padding: 2px 0;
    word-wrap: break-word;
  }
  table.row td.label { text-align: right; width: 62%; }
  table.row td.value {
    text-align: left;
    width: 38%;
    white-space: nowrap;
    direction: ltr;
    unicode-bidi: embed;
    font-weight: 700;
  }
  .ltr { direction: ltr; unicode-bidi: embed; display: inline-block; font-weight: 700; }
  .item { margin-bottom: ${settings.compactItems ? 5 : 9}px; }
  .name { font-weight: 800; text-align: right; }
  hr { border: none; border-top: 2px solid #000; margin: 8px 0; }
  .bold { font-weight: 800; }
  .note { white-space: pre-wrap; text-align: right; }
  .block { text-align: right; margin: 0 0 4px; }
</style>
</head>
<body>${inner}</body>
</html>`;
}

function rowHtml(label: string, valueHtml: string, bold = false): string {
  const cls = bold ? " bold" : "";
  return `<table class="row${cls}"><tr><td class="label">${escapeHtml(label)}</td><td class="value">${valueHtml}</td></tr></table>`;
}

function hallInner(receipt: SaleReceiptData, settings: SaleReceiptPrintSettings): string {
  const shopTitle = escapeHtml(settings.shopTitle || receipt.shopName || "فاکتور فروش");
  const items = receipt.items
    .map((item) => {
      const qtyPrice = settings.showItemUnitPrice
        ? `${ltr(formatReceiptNumber(item.quantity))} × ${ltr(formatReceiptNumber(item.unitPrice))}`
        : `تعداد: ${ltr(formatReceiptNumber(item.quantity))}`;
      const note = item.note ? `<div class="block">یادداشت: ${escapeHtml(item.note)}</div>` : "";
      return `<div class="item"><div class="name">${escapeHtml(item.name)}</div>${note}<table class="row"><tr><td class="label">${qtyPrice}</td><td class="value bold">${ltr(formatReceiptNumber(item.lineTotal))}</td></tr></table></div>`;
    })
    .join("");

  const extras: string[] = [];
  extras.push(rowHtml("جمع", ltr(formatReceiptNumber(receipt.subtotal))));
  if (receipt.discount > 0) extras.push(rowHtml("تخفیف", ltr(formatReceiptNumber(receipt.discount))));
  if (receipt.creditUsed > 0) extras.push(rowHtml("اعتبار", ltr(formatReceiptNumber(receipt.creditUsed))));
  if (receipt.backPrice > 0) extras.push(rowHtml("برگشتی", ltr(formatReceiptNumber(receipt.backPrice))));
  extras.push(rowHtml("مبلغ نهایی", `${ltr(formatReceiptNumber(receipt.finalTotal))} تومان`, true));
  if (receipt.payableNow > 0 && receipt.payableNow !== receipt.finalTotal) {
    extras.push(rowHtml("قابل پرداخت", `${ltr(formatReceiptNumber(receipt.payableNow))} تومان`));
  }

  const pay: string[] = [];
  if (settings.showPaymentMethod) {
    pay.push(`<div class="block">روش پرداخت: ${escapeHtml(getPaymentTypeLabel(receipt))}</div>`);
    if (receipt.footerNote) pay.push(`<div class="block">${escapeHtml(receipt.footerNote)}</div>`);
    if (receipt.customerNote) {
      pay.push(`<div class="note">توضیحات: ${escapeHtml(receipt.customerNote)}</div>`);
    }
    if (receipt.settlementMode === "split" || receipt.paymentType === "cheque") {
      if (receipt.cardAmount) {
        pay.push(`<div class="block">کارت: ${ltr(formatReceiptNumber(receipt.cardAmount))} تومان</div>`);
      }
      if (receipt.cashAmount) {
        pay.push(`<div class="block">نقد: ${ltr(formatReceiptNumber(receipt.cashAmount))} تومان</div>`);
      }
    }
    if (receipt.paymentType === "installment" && receipt.installmentAmount != null) {
      pay.push(
        `<div class="block">مبلغ هر قسط: ${ltr(formatReceiptNumber(Math.floor(receipt.installmentAmount)))} تومان</div>`,
      );
    }
  }

  return `
    <h1>${shopTitle}</h1>
    <div class="sub">فیش سالن</div>
    ${dailyTicketHtml(receipt)}
    ${settings.showDate ? `<div class="muted">${ltr(formatReceiptDate(receipt.createdAt))}</div>` : ""}
    <table class="row">
      <tr>
        <td class="label">
          ${settings.showPurchaseId && receipt.purchaseId != null ? `<div class="block">شماره فاکتور: ${ltr(String(receipt.purchaseId))}</div>` : ""}
          ${settings.showCustomerPhone && receipt.phone ? `<div class="block">مشتری: ${ltr(receipt.phone)}</div>` : ""}
        </td>
        ${receipt.tableLabel ? `<td class="value bold">${escapeHtml(receipt.tableLabel)}</td>` : ""}
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
      const note = item.note ? `<div class="bold block">یادداشت: ${escapeHtml(item.note)}</div>` : "";
      return `<div class="item"><table class="row"><tr><td class="label name">${escapeHtml(item.name)}</td><td class="value bold">× ${ltr(formatReceiptNumber(item.quantity))}</td></tr></table>${note}</div>`;
    })
    .join("");

  return `
    <h1>${escapeHtml(title)}</h1>
    ${dailyTicketHtml(receipt)}
    ${shopTitle ? `<div class="muted">${escapeHtml(shopTitle)}</div>` : ""}
    ${settings.showDate ? `<div class="muted">${ltr(formatReceiptDate(receipt.createdAt))}</div>` : ""}
    ${receipt.tableLabel ? `<div class="sub">${escapeHtml(receipt.tableLabel)}</div>` : ""}
    ${settings.showPurchaseId && receipt.purchaseId != null ? `<div class="muted">سفارش ${ltr(String(receipt.purchaseId))}</div>` : ""}
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
