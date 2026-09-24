"use client";

import { Box, Divider, Typography } from "@mui/material";
import { formatDailyTicketNumber } from "@/app/lib/dailyTicketNumber";
import { readAdminPosSettings } from "@/app/lib/adminPosSettings";
import { normalizeReceiptTemplateId } from "@/app/lib/receiptTemplates";
import {
  applyStationLayout,
  formatReceiptDate,
  formatReceiptDateOnly,
  formatReceiptNumber,
  formatReceiptTimeOnly,
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

function TotalsBlock({
  receipt,
  settings,
}: {
  receipt: SaleReceiptData;
  settings: SaleReceiptPrintSettings;
}) {
  return (
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
  );
}

function PaymentBlock({
  receipt,
  settings,
}: {
  receipt: SaleReceiptData;
  settings: SaleReceiptPrintSettings;
}) {
  if (!settings.showPaymentMethod) return null;
  return (
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
  );
}

function ClassicHallTicket({
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
    <Box className="print-ticket print-ticket-hall" sx={ticketSx(paperWidthMm, settings)}>
      <Typography align="center" sx={{ fontWeight: 800, fontSize: `${settings.titleFontSize}px`, mb: 0.5 }}>
        {shopTitle}
      </Typography>
      {settings.hallTitle ? (
        <Typography align="center" sx={{ fontWeight: 700, fontSize: `${settings.fontSize - 1}px`, mb: 0.5 }}>
          {settings.hallTitle}
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
          {receipt.customerName ? (
            <Typography sx={{ fontSize: `${settings.fontSize - 1}px`, mb: 0.5 }}>
              نام مشتری: {receipt.customerName}
            </Typography>
          ) : null}
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
      <TotalsBlock receipt={receipt} settings={settings} />
      <PaymentBlock receipt={receipt} settings={settings} />

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

function RetailHallTicket({
  receipt,
  settings,
  paperWidthMm,
}: {
  receipt: SaleReceiptData;
  settings: SaleReceiptPrintSettings;
  paperWidthMm: number;
}) {
  const shopTitle = settings.shopTitle || receipt.shopName || "فاکتور فروش";
  const fs = Math.max(9, settings.fontSize - 1);
  const cashierLabel = settings.cashierLabel || "صندوق‌دار";

  return (
    <Box className="print-ticket print-ticket-hall" sx={{ ...ticketSx(paperWidthMm, settings), p: `${Math.max(2, settings.paddingMm)}mm` }}>
      <Box sx={{ border: "1.5px solid #111", borderRadius: "8px", p: 1, mb: 1 }}>
        <Typography align="center" sx={{ fontWeight: 800, fontSize: `${settings.titleFontSize}px`, mb: 0.75 }}>
          {shopTitle}
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 0.5,
            fontSize: `${fs}px`,
            mb: 0.5,
          }}
        >
          {settings.showPurchaseId && receipt.purchaseId != null ? (
            <Typography sx={{ fontSize: `${fs}px` }}>شماره فاکتور: {receipt.purchaseId}</Typography>
          ) : (
            <span />
          )}
          {settings.showDate ? (
            <Typography align="center" sx={{ fontSize: `${fs}px` }}>
              {formatReceiptTimeOnly(receipt.createdAt)}
              <br />
              {formatReceiptDateOnly(receipt.createdAt)}
            </Typography>
          ) : (
            <span />
          )}
          <Typography align="left" sx={{ fontSize: `${fs}px` }} dir="rtl">
            {receipt.cashierName ? `${cashierLabel}: ${receipt.cashierName}` : cashierLabel}
          </Typography>
        </Box>
        {(receipt.customerName || (settings.showCustomerPhone && receipt.phone)) && (
          <>
            <Divider sx={{ my: 0.75, borderColor: "#111" }} />
            <Typography align="center" sx={{ fontSize: `${fs}px`, fontWeight: 700 }}>
              {receipt.customerName
                ? `نام مشتری : ${receipt.customerName}`
                : `مشتری : ${receipt.phone}`}
            </Typography>
          </>
        )}
      </Box>

      <Box
        component="table"
        sx={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: `${fs}px`,
          mb: 1,
          "& th, & td": {
            border: "1px solid #111",
            p: "3px 2px",
            textAlign: "center",
            verticalAlign: "middle",
          },
          "& th": { fontWeight: 800, bgcolor: "#f3f3f3" },
          "& td.name": { textAlign: "right", fontWeight: 700 },
        }}
      >
        <thead>
          <tr>
            <th>نام کالا</th>
            <th>تعداد</th>
            {settings.showItemUnitPrice ? <th>فی</th> : null}
            <th>جمع</th>
          </tr>
        </thead>
        <tbody>
          {receipt.items.map((item, index) => (
            <tr key={`${item.id ?? index}-${index}`}>
              <td className="name">{item.name}</td>
              <td>{formatReceiptNumber(item.quantity)}</td>
              {settings.showItemUnitPrice ? <td>{formatReceiptNumber(item.unitPrice)}</td> : null}
              <td>{formatReceiptNumber(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </Box>

      <Typography sx={{ fontSize: `${fs}px`, mb: 0.35 }}>جمع اقلام: {formatReceiptNumber(receipt.items.length)}</Typography>
      <Typography sx={{ fontSize: `${fs}px`, mb: 0.35 }}>
        جمع فاکتور: {formatReceiptNumber(receipt.subtotal)}
      </Typography>
      {receipt.discount > 0 ? (
        <Typography sx={{ fontSize: `${fs}px`, mb: 0.75 }}>
          سود شما از این خرید: {formatReceiptNumber(receipt.discount)}
        </Typography>
      ) : null}

      <Box
        sx={{
          bgcolor: "#111",
          color: "#fff",
          textAlign: "center",
          py: 1,
          px: 0.5,
          mb: 1,
          "& .MuiTypography-root": { color: "#fff !important" },
        }}
      >
        <Typography sx={{ fontSize: `${fs}px` }}>مبلغ پرداختی شما:</Typography>
        <Typography sx={{ fontWeight: 800, fontSize: `${settings.titleFontSize + 2}px` }}>
          {formatReceiptNumber(receipt.payableNow || receipt.finalTotal)} ریال
        </Typography>
      </Box>

      {settings.showPaymentMethod ? (
        <Typography align="center" sx={{ fontSize: `${fs}px`, mb: 0.5 }}>
          {getPaymentTypeLabel(receipt)}
        </Typography>
      ) : null}

      {settings.shopAddress ? (
        <Typography align="center" sx={{ fontSize: `${fs - 1}px` }}>
          آدرس {settings.shopAddress}
        </Typography>
      ) : null}
      {settings.shopPhone ? (
        <Typography align="center" sx={{ fontSize: `${fs - 1}px` }}>
          تلفن {settings.shopPhone}
        </Typography>
      ) : null}
      {settings.footerText ? (
        <Typography align="center" sx={{ fontSize: `${fs - 1}px`, mt: 0.5 }}>
          {settings.footerText}
        </Typography>
      ) : null}
    </Box>
  );
}

function MinimalHallTicket({
  receipt,
  settings,
  paperWidthMm,
}: {
  receipt: SaleReceiptData;
  settings: SaleReceiptPrintSettings;
  paperWidthMm: number;
}) {
  const shopTitle = settings.shopTitle || receipt.shopName || "فاکتور فروش";
  const dash = "··············";
  const itemGap = settings.compactItems ? 0.4 : 0.8;

  return (
    <Box className="print-ticket print-ticket-hall" sx={ticketSx(paperWidthMm, settings)}>
      <Typography align="center" sx={{ fontWeight: 700, fontSize: `${settings.titleFontSize}px`, letterSpacing: 1 }}>
        {shopTitle}
      </Typography>
      <Typography align="center" sx={{ fontSize: `${settings.fontSize - 2}px`, color: "#444", mb: 1 }}>
        فاکتور فروش
      </Typography>
      {settings.showDate ? (
        <Typography align="center" sx={{ fontSize: `${settings.fontSize - 1}px`, mb: 0.5 }}>
          {formatReceiptDate(receipt.createdAt)}
        </Typography>
      ) : null}
      {settings.showPurchaseId && receipt.purchaseId != null ? (
        <Typography align="center" sx={{ fontSize: `${settings.fontSize - 1}px`, mb: 1 }}>
          #{receipt.purchaseId}
        </Typography>
      ) : null}
      <Typography align="center" sx={{ fontSize: 10, letterSpacing: 2, mb: 1, userSelect: "none" }}>
        {dash}
      </Typography>

      {receipt.items.map((item, index) => (
        <Box key={`${item.id ?? index}-${index}`} sx={{ mb: itemGap }}>
          <Typography sx={{ fontWeight: 600, fontSize: `${settings.fontSize}px` }}>{item.name}</Typography>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography sx={{ fontSize: `${settings.fontSize - 1}px`, color: "#444" }}>
              {settings.showItemUnitPrice
                ? `${formatReceiptNumber(item.quantity)} × ${formatReceiptNumber(item.unitPrice)}`
                : `× ${formatReceiptNumber(item.quantity)}`}
            </Typography>
            <Typography sx={{ fontSize: `${settings.fontSize - 1}px` }}>
              {formatReceiptNumber(item.lineTotal)}
            </Typography>
          </Box>
        </Box>
      ))}

      <Typography align="center" sx={{ fontSize: 10, letterSpacing: 2, my: 1, userSelect: "none" }}>
        {dash}
      </Typography>
      <TotalsBlock receipt={receipt} settings={settings} />
      {(settings.showCustomerPhone && receipt.phone) || receipt.customerName ? (
        <Typography align="center" sx={{ fontSize: `${settings.fontSize - 1}px`, mt: 1 }}>
          {receipt.customerName || receipt.phone}
        </Typography>
      ) : null}
      {settings.footerText ? (
        <Typography align="center" sx={{ fontSize: `${settings.fontSize - 2}px`, mt: 1.5, color: "#555" }}>
          {settings.footerText}
        </Typography>
      ) : null}
      {settings.shopPhone ? (
        <Typography align="center" sx={{ fontSize: `${settings.fontSize - 2}px`, color: "#555" }}>
          {settings.shopPhone}
        </Typography>
      ) : null}
    </Box>
  );
}

function BoldHallTicket({
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
    <Box className="print-ticket print-ticket-hall" sx={{ ...ticketSx(paperWidthMm, settings), p: 0, overflow: "hidden" }}>
      <Box
        sx={{
          bgcolor: "#111",
          color: "#fff",
          py: 1.25,
          px: `${settings.paddingMm}mm`,
          mb: 1,
          "& .MuiTypography-root": { color: "#fff !important" },
        }}
      >
        <Typography align="center" sx={{ fontWeight: 900, fontSize: `${settings.titleFontSize + 1}px` }}>
          {shopTitle}
        </Typography>
        {dailyTicketLabel(receipt) ? (
          <Typography align="center" sx={{ fontWeight: 700, fontSize: `${settings.fontSize}px`, mt: 0.25 }}>
            {dailyTicketLabel(receipt)}
          </Typography>
        ) : null}
      </Box>

      <Box sx={{ px: `${settings.paddingMm}mm`, pb: `${settings.paddingMm}mm` }}>
        {settings.showDate ? (
          <Typography align="center" sx={{ fontSize: `${settings.fontSize - 1}px`, mb: 0.5 }}>
            {formatReceiptDate(receipt.createdAt)}
          </Typography>
        ) : null}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          {settings.showPurchaseId && receipt.purchaseId != null ? (
            <Typography sx={{ fontSize: `${settings.fontSize - 1}px`, fontWeight: 700 }}>
              فاکتور {receipt.purchaseId}
            </Typography>
          ) : (
            <span />
          )}
          {receipt.tableLabel ? (
            <Typography sx={{ fontSize: `${settings.fontSize}px`, fontWeight: 800 }}>{receipt.tableLabel}</Typography>
          ) : null}
        </Box>

        <Box sx={{ borderTop: "3px solid #111", borderBottom: "3px solid #111", py: 1, mb: 1 }}>
          {receipt.items.map((item, index) => (
            <Box key={`${item.id ?? index}-${index}`} sx={{ mb: itemGap }}>
              <Typography sx={{ fontWeight: 800, fontSize: `${settings.fontSize + 1}px` }}>{item.name}</Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography sx={{ fontSize: `${settings.fontSize - 1}px` }}>
                  {settings.showItemUnitPrice
                    ? `${formatReceiptNumber(item.quantity)} × ${formatReceiptNumber(item.unitPrice)}`
                    : `تعداد ${formatReceiptNumber(item.quantity)}`}
                </Typography>
                <Typography sx={{ fontWeight: 800 }}>{formatReceiptNumber(item.lineTotal)}</Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <TotalsBlock receipt={receipt} settings={settings} />

        <Box
          sx={{
            mt: 1.25,
            border: "2px solid #111",
            py: 1,
            textAlign: "center",
          }}
        >
          <Typography sx={{ fontSize: `${settings.fontSize - 1}px` }}>قابل پرداخت</Typography>
          <Typography sx={{ fontWeight: 900, fontSize: `${settings.titleFontSize + 4}px` }}>
            {formatReceiptNumber(receipt.payableNow || receipt.finalTotal)}
          </Typography>
          <Typography sx={{ fontSize: `${settings.fontSize - 1}px` }}>تومان</Typography>
        </Box>

        <PaymentBlock receipt={receipt} settings={settings} />

        {(settings.shopAddress || settings.shopPhone || settings.footerText) && (
          <Box sx={{ mt: 1.25, textAlign: "center" }}>
            {settings.shopAddress ? (
              <Typography sx={{ fontSize: `${settings.fontSize - 2}px` }}>{settings.shopAddress}</Typography>
            ) : null}
            {settings.shopPhone ? (
              <Typography sx={{ fontSize: `${settings.fontSize - 2}px` }}>{settings.shopPhone}</Typography>
            ) : null}
            {settings.footerText ? (
              <Typography sx={{ fontSize: `${settings.fontSize - 1}px`, mt: 0.5, fontWeight: 700 }}>
                {settings.footerText}
              </Typography>
            ) : null}
          </Box>
        )}
      </Box>
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
  const templateId = normalizeReceiptTemplateId(settings.templateId);
  if (templateId === "retail") {
    return <RetailHallTicket receipt={receipt} settings={settings} paperWidthMm={paperWidthMm} />;
  }
  if (templateId === "minimal") {
    return <MinimalHallTicket receipt={receipt} settings={settings} paperWidthMm={paperWidthMm} />;
  }
  if (templateId === "bold") {
    return <BoldHallTicket receipt={receipt} settings={settings} paperWidthMm={paperWidthMm} />;
  }
  return <ClassicHallTicket receipt={receipt} settings={settings} paperWidthMm={paperWidthMm} />;
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
