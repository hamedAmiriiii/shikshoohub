"use client";

import { Box, Divider, Typography } from "@mui/material";
import { formatDailyTicketNumber } from "@/app/lib/dailyTicketNumber";
import { readAdminPosSettings } from "@/app/lib/adminPosSettings";
import {
  applyStationLayout,
  formatReceiptDate,
  formatReceiptNumber,
  getEnabledReceiptPrintStations,
  getPaymentTypeLabel,
  resolveStationPaperWidthMm,
  type ReceiptPrintStation,
  type SaleReceiptData,
  type SaleReceiptPrintSettings,
} from "@/app/lib/saleReceiptPrint";

function dailyTicketLabel(receipt: SaleReceiptData): string | null {
  if (!readAdminPosSettings().showDailyTicketNumber || receipt.dailyTicketNumber == null) return null;
  return `فیش ${formatDailyTicketNumber(receipt.dailyTicketNumber)}`;
}

function ticketSx(paperWidthMm: number, settings: SaleReceiptPrintSettings) {
  return {
    width: `${paperWidthMm}mm`,
    maxWidth: "100%",
    mx: "auto",
    bgcolor: "var(--admin-on-accent)",
    color: "#111",
    fontFamily: "Tahoma, Arial, sans-serif",
    fontSize: `${settings.fontSize}px`,
    lineHeight: settings.lineHeight,
    p: `${settings.paddingMm}mm`,
    boxSizing: "border-box",
    "& .MuiTypography-root": {
      color: "#111",
      fontFamily: "Tahoma, Arial, sans-serif",
    },
  } as const;
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
      <Typography sx={{ fontWeight: bold ? 700 : 400 }}>{label}</Typography>
      <Typography sx={{ fontWeight: bold ? 700 : 400 }}>{value}</Typography>
    </Box>
  );
}

export function HallReceiptTicket({
  receipt,
  settings,
  paperWidthMm,
}: {
  receipt: SaleReceiptData;
  settings: SaleReceiptPrintSettings;
  paperWidthMm: number;
}) {
  const shopTitle = settings.shopTitle || receipt.shopName || "فاکتور فروش";
  const itemGap = settings.compactItems ? 0.5 : 1;

  return (
    <Box
      className="print-ticket print-ticket-hall"
      sx={ticketSx(paperWidthMm, settings)}
    >
      <Typography align="center" sx={{ fontWeight: 800, fontSize: `${settings.titleFontSize}px`, mb: 0.5 }}>
        {shopTitle}
      </Typography>
      <Typography align="center" sx={{ fontWeight: 700, fontSize: `${settings.fontSize - 1}px`, mb: 0.5 }}>
        فیش سالن
      </Typography>
      {dailyTicketLabel(receipt) ? (
        <Typography align="center" sx={{ fontWeight: 800, fontSize: `${settings.titleFontSize}px`, mb: 0.5 }}>
          {dailyTicketLabel(receipt)}
        </Typography>
      ) : null}

      {settings.showDate && (
        <Typography align="center" sx={{ fontSize: `${settings.fontSize - 1}px`, mb: 1 }}>
          {formatReceiptDate(receipt.createdAt)}
        </Typography>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 0.5 }}>
        <Box sx={{ minWidth: 0 }}>
          {settings.showPurchaseId && receipt.purchaseId != null && (
            <Typography sx={{ fontSize: `${settings.fontSize - 1}px`, mb: 0.5 }}>
              شماره فاکتور: {receipt.purchaseId}
            </Typography>
          )}
          {settings.showCustomerPhone && receipt.phone && (
            <Typography sx={{ fontSize: `${settings.fontSize - 1}px`, mb: 0.5 }}>
              مشتری: {receipt.phone}
            </Typography>
          )}
        </Box>
        {receipt.tableLabel ? (
          <Typography sx={{ fontWeight: 800, fontSize: `${settings.fontSize}px`, flexShrink: 0 }}>
            {receipt.tableLabel}
          </Typography>
        ) : null}
      </Box>

      <Divider sx={{ my: 1, borderColor: "#000" }} />

      {receipt.items.map((item, index) => (
        <Box key={`${item.id ?? index}-${index}`} sx={{ mb: itemGap }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: `${settings.fontSize}px`,
              lineHeight: settings.compactItems ? 1.3 : settings.lineHeight,
            }}
          >
            {item.name}
          </Typography>
          {item.note ? (
            <Typography sx={{ fontSize: `${settings.fontSize - 1}px` }}>یادداشت: {item.note}</Typography>
          ) : null}
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
            {settings.showItemUnitPrice ? (
              <Typography sx={{ fontSize: `${settings.fontSize - 1}px` }}>
                {formatReceiptNumber(item.quantity)} × {formatReceiptNumber(item.unitPrice)}
              </Typography>
            ) : (
              <Typography sx={{ fontSize: `${settings.fontSize - 1}px` }}>
                تعداد: {formatReceiptNumber(item.quantity)}
              </Typography>
            )}
            <Typography sx={{ fontSize: `${settings.fontSize - 1}px`, fontWeight: 700 }}>
              {formatReceiptNumber(item.lineTotal)}
            </Typography>
          </Box>
        </Box>
      ))}

      <Divider sx={{ my: 1, borderColor: "#000" }} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: settings.compactItems ? 0.1 : 0.25 }}>
        <Row label="جمع" value={formatReceiptNumber(receipt.subtotal)} />
        {receipt.discount > 0 && <Row label="تخفیف" value={formatReceiptNumber(receipt.discount)} />}
        {receipt.creditUsed > 0 && <Row label="اعتبار" value={formatReceiptNumber(receipt.creditUsed)} />}
        {receipt.backPrice > 0 && <Row label="برگشتی" value={formatReceiptNumber(receipt.backPrice)} />}
        <Row label="مبلغ نهایی" value={`${formatReceiptNumber(receipt.finalTotal)} تومان`} bold />
        {receipt.payableNow > 0 && receipt.payableNow !== receipt.finalTotal && (
          <Row label="قابل پرداخت" value={`${formatReceiptNumber(receipt.payableNow)} تومان`} />
        )}
      </Box>

      {settings.showPaymentMethod && (
        <>
          <Divider sx={{ my: 1, borderColor: "#000" }} />
          <Typography sx={{ fontSize: `${settings.fontSize - 1}px`, mb: 0.5 }}>
            روش پرداخت: {getPaymentTypeLabel(receipt)}
          </Typography>
          {receipt.footerNote ? (
            <Typography sx={{ fontSize: `${settings.fontSize - 1}px`, mb: 0.5 }}>{receipt.footerNote}</Typography>
          ) : null}
          {receipt.customerNote ? (
            <Typography sx={{ fontSize: `${settings.fontSize - 1}px`, mb: 0.5, whiteSpace: "pre-wrap" }}>
              توضیحات: {receipt.customerNote}
            </Typography>
          ) : null}
          {(receipt.settlementMode === "split" || receipt.paymentType === "cheque") && (
            <>
              {!!receipt.cardAmount && (
                <Typography sx={{ fontSize: `${settings.fontSize - 1}px` }}>
                  کارت: {formatReceiptNumber(receipt.cardAmount)} تومان
                </Typography>
              )}
              {!!receipt.cashAmount && (
                <Typography sx={{ fontSize: `${settings.fontSize - 1}px` }}>
                  نقد: {formatReceiptNumber(receipt.cashAmount)} تومان
                </Typography>
              )}
            </>
          )}
          {receipt.paymentType === "installment" && receipt.installmentAmount != null && (
            <Typography sx={{ fontSize: `${settings.fontSize - 1}px` }}>
              مبلغ هر قسط: {formatReceiptNumber(Math.floor(receipt.installmentAmount))} تومان
            </Typography>
          )}
        </>
      )}

      {settings.footerText && (
        <>
          <Divider sx={{ my: 1, borderColor: "#000" }} />
          <Typography align="center" sx={{ fontSize: `${settings.fontSize - 1}px`, mt: 1 }}>
            {settings.footerText}
          </Typography>
        </>
      )}
    </Box>
  );
}

function PrepStationTicket({
  receipt,
  settings,
  paperWidthMm,
  station,
  title,
}: {
  receipt: SaleReceiptData;
  settings: SaleReceiptPrintSettings;
  paperWidthMm: number;
  station: Exclude<ReceiptPrintStation, "hall">;
  title: string;
}) {
  const shopTitle = settings.shopTitle || receipt.shopName || "";
  const itemGap = settings.compactItems ? 0.5 : 1;

  return (
    <Box className={`print-ticket print-ticket-${station}`} sx={ticketSx(paperWidthMm, settings)}>
      <Typography align="center" sx={{ fontWeight: 800, fontSize: `${settings.titleFontSize}px`, mb: 0.5 }}>
        {title}
      </Typography>
      {shopTitle ? (
        <Typography align="center" sx={{ fontSize: `${settings.fontSize - 1}px`, mb: 0.5 }}>
          {shopTitle}
        </Typography>
      ) : null}
      {dailyTicketLabel(receipt) ? (
        <Typography align="center" sx={{ fontWeight: 800, fontSize: `${settings.titleFontSize}px`, mb: 0.5 }}>
          {dailyTicketLabel(receipt)}
        </Typography>
      ) : null}
      {settings.showDate && (
        <Typography align="center" sx={{ fontSize: `${settings.fontSize - 1}px`, mb: 1 }}>
          {formatReceiptDate(receipt.createdAt)}
        </Typography>
      )}
      {receipt.tableLabel ? (
        <Typography align="center" sx={{ fontWeight: 800, fontSize: `${settings.titleFontSize}px`, mb: 1 }}>
          {receipt.tableLabel}
        </Typography>
      ) : null}
      {settings.showPurchaseId && receipt.purchaseId != null && (
        <Typography align="center" sx={{ fontSize: `${settings.fontSize - 1}px`, mb: 1 }}>
          سفارش {receipt.purchaseId}
        </Typography>
      )}

      <Divider sx={{ my: 1, borderColor: "#000" }} />

      {receipt.items.map((item, index) => (
        <Box key={`${station}-${item.id ?? index}-${index}`} sx={{ mb: itemGap }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
            <Typography sx={{ fontWeight: 800, fontSize: `${settings.fontSize + 1}px` }}>{item.name}</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: `${settings.fontSize + 1}px`, flexShrink: 0 }}>
              × {formatReceiptNumber(item.quantity)}
            </Typography>
          </Box>
          {item.note ? (
            <Typography sx={{ fontSize: `${settings.fontSize}px`, fontWeight: 700 }}>
              یادداشت: {item.note}
            </Typography>
          ) : null}
        </Box>
      ))}

      {receipt.customerNote ? (
        <>
          <Divider sx={{ my: 1, borderColor: "#000" }} />
          <Typography sx={{ fontWeight: 800, fontSize: `${settings.fontSize}px`, whiteSpace: "pre-wrap" }}>
            توضیحات سفارش: {receipt.customerNote}
          </Typography>
        </>
      ) : null}
    </Box>
  );
}

export function ReceiptTicketsBlock({
  receipt,
  settings,
  paperWidthMm,
}: {
  receipt: SaleReceiptData;
  settings: SaleReceiptPrintSettings;
  paperWidthMm?: number;
}) {
  const stations = getEnabledReceiptPrintStations(settings);

  return (
    <>
      {stations.includes("hall") && (
        <HallReceiptTicket
          receipt={receipt}
          settings={applyStationLayout(settings, "hall")}
          paperWidthMm={paperWidthMm ?? resolveStationPaperWidthMm(settings, "hall")}
        />
      )}
      {stations.includes("kitchen") && (
        <PrepStationTicket
          receipt={receipt}
          settings={applyStationLayout(settings, "kitchen")}
          paperWidthMm={resolveStationPaperWidthMm(settings, "kitchen")}
          station="kitchen"
          title={settings.kitchenTitle || "آشپزخانه"}
        />
      )}
      {stations.includes("extra") && (
        <PrepStationTicket
          receipt={receipt}
          settings={applyStationLayout(settings, "extra")}
          paperWidthMm={resolveStationPaperWidthMm(settings, "extra")}
          station="extra"
          title={settings.extraTitle || "بار"}
        />
      )}
    </>
  );
}
