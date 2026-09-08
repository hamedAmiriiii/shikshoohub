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

function wrapTicketHtml(inner: string, settings: SaleReceiptPrintSettings): string {
  const width = resolvePaperWidthMm(settings);
  const font = settings.fontSize;
  const title = settings.titleFontSize;
  const pad = settings.paddingMm;
  const lh = settings.lineHeight;
  return `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
<meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    width: ${width}mm;
    padding: ${pad}mm;
    color: #000;
    background: #fff;
    font-family: Tahoma, Arial, sans-serif;
    font-size: ${font}px;
    line-height: ${lh};
  }
  h1 { font-size: ${title}px; font-weight: 800; text-align: center; margin: 0 0 4px; }
  .sub { text-align: center; font-weight: 700; margin: 0 0 6px; }
  .muted { text-align: center; font-size: ${font - 1}px; margin: 0 0 8px; }
  .row { display: flex; justify-content: space-between; gap: 8px; }
  .item { margin-bottom: ${settings.compactItems ? 4 : 8}px; }
  .name { font-weight: 700; }
  hr { border: none; border-top: 1px solid #000; margin: 8px 0; }
  .bold { font-weight: 800; }
  .note { white-space: pre-wrap; }
</style>
</head>
<body>${inner}</body>
</html>`;
}

function hallInner(receipt: SaleReceiptData, settings: SaleReceiptPrintSettings): string {
  const shopTitle = escapeHtml(settings.shopTitle || receipt.shopName || "فاکتور فروش");
  const items = receipt.items
    .map((item) => {
      const qtyPrice = settings.showItemUnitPrice
        ? `${formatReceiptNumber(item.quantity)} × ${formatReceiptNumber(item.unitPrice)}`
        : `تعداد: ${formatReceiptNumber(item.quantity)}`;
      const note = item.note ? `<div>یادداشت: ${escapeHtml(item.note)}</div>` : "";
      return `<div class="item"><div class="name">${escapeHtml(item.name)}</div>${note}<div class="row"><span>${qtyPrice}</span><span class="bold">${formatReceiptNumber(item.lineTotal)}</span></div></div>`;
    })
    .join("");

  const extras: string[] = [];
  extras.push(`<div class="row"><span>جمع</span><span>${formatReceiptNumber(receipt.subtotal)}</span></div>`);
  if (receipt.discount > 0) extras.push(`<div class="row"><span>تخفیف</span><span>${formatReceiptNumber(receipt.discount)}</span></div>`);
  if (receipt.creditUsed > 0) extras.push(`<div class="row"><span>اعتبار</span><span>${formatReceiptNumber(receipt.creditUsed)}</span></div>`);
  if (receipt.backPrice > 0) extras.push(`<div class="row"><span>برگشتی</span><span>${formatReceiptNumber(receipt.backPrice)}</span></div>`);
  extras.push(`<div class="row bold"><span>مبلغ نهایی</span><span>${formatReceiptNumber(receipt.finalTotal)} تومان</span></div>`);
  if (receipt.payableNow > 0 && receipt.payableNow !== receipt.finalTotal) {
    extras.push(`<div class="row"><span>قابل پرداخت</span><span>${formatReceiptNumber(receipt.payableNow)} تومان</span></div>`);
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
    ${settings.showDate ? `<div class="muted">${escapeHtml(formatReceiptDate(receipt.createdAt))}</div>` : ""}
    <div class="row">
      <div>
        ${settings.showPurchaseId && receipt.purchaseId != null ? `<div>شماره فاکتور: ${escapeHtml(String(receipt.purchaseId))}</div>` : ""}
        ${settings.showCustomerPhone && receipt.phone ? `<div>مشتری: ${escapeHtml(receipt.phone)}</div>` : ""}
      </div>
      ${receipt.tableLabel ? `<div class="bold">${escapeHtml(receipt.tableLabel)}</div>` : ""}
    </div>
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
      return `<div class="item"><div class="row"><span class="name">${escapeHtml(item.name)}</span><span class="bold">× ${formatReceiptNumber(item.quantity)}</span></div>${note}</div>`;
    })
    .join("");

  return `
    <h1>${escapeHtml(title)}</h1>
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
