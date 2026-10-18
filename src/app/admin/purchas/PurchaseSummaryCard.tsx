"use client";

import { Box, Chip, Typography } from "@mui/material";
import { paymentTypeLabel } from "@/app/lib/paymentTypes";
import { purchaseHasReturns } from "@/app/lib/purchaseEdit";
import { formatPurchaseItemsSummary } from "@/app/lib/purchaseListDisplay";
import { PurchaseRowActions } from "./PurchaseRowActions";
import { readAdminPosSettings } from "@/app/lib/adminPosSettings";
import { dailyTicketFromRecord, formatDailyTicketNumber } from "@/app/lib/dailyTicketNumber";

const formatNumber = (num: number | string) => {
  const numValue = typeof num === "string" ? parseFloat(num.replace(/,/g, "")) : num;
  if (isNaN(numValue)) return "—";
  return new Intl.NumberFormat("fa-IR").format(numValue);
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "نامشخص";
  try {
    if (dateString.includes("T")) {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "numeric",
      }).format(date);
    }
    return dateString.split(" ")[0];
  } catch {
    return dateString;
  }
};

const formatRowNumber = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

export default function PurchaseSummaryCard({
  data,
  rowNumber,
  onOpenDetails,
}: {
  data: any;
  rowNumber?: number;
  onOpenDetails: () => void;
}) {
  const itemsSummary = formatPurchaseItemsSummary(data);
  const paymentLabel = data?.payment_type_label || paymentTypeLabel(data?.payment_type || "");
  const isInstallment = data?.payment_type === "installment";
  const isCheque = data?.payment_type === "cheque";
  const hasReturns = purchaseHasReturns(data);
  const fullyReturned = Boolean(data?.is_fully_returned) || (hasReturns && Number(data?.total_amount || 0) <= 0.02);
  const showDailyTicket = Boolean(readAdminPosSettings().showDailyTicketNumber);
  const dailyTicket = showDailyTicket ? dailyTicketFromRecord(data) : null;
  const displayAmount = fullyReturned
    ? Number(data?.returned_sale_total || 0)
    : Number(data?.total_amount || 0);

  return (
    <Box
      onClick={onOpenDetails}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        width: "100%",
        direction: "rtl",
        backgroundColor: fullyReturned ? "rgba(198,40,40,0.08)" : "var(--admin-surface)",
        border: fullyReturned ? "1px solid rgba(198,40,40,0.35)" : "1px solid var(--admin-border)",
        borderRadius: "12px",
        px: 1.25,
        py: 1,
        mb: 1,
        cursor: "pointer",
        opacity: fullyReturned ? 0.92 : 1,
        "&:hover": { backgroundColor: fullyReturned ? "rgba(198,40,40,0.12)" : "var(--admin-menu-hover)" },
      }}
    >
      {rowNumber != null ? (
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 800,
            color: "var(--admin-text-muted)",
            minWidth: 22,
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          {formatRowNumber(rowNumber)}
        </Typography>
      ) : null}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.25 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--admin-text)" }}>
            {dailyTicket != null ? `فیش ${formatDailyTicketNumber(dailyTicket)}` : `#${data?.id ?? "—"}`}
          </Typography>
          {dailyTicket != null ? (
            <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)" }}>#{data?.id ?? "—"}</Typography>
          ) : null}
          {isInstallment ? (
            <Chip label="اقساطی" size="small" sx={{ height: 18, fontSize: 10, backgroundColor: "var(--admin-warning)", color: "var(--admin-on-accent)" }} />
          ) : null}
          {isCheque ? (
            <Chip label="چکی" size="small" sx={{ height: 18, fontSize: 10, backgroundColor: "var(--admin-online)", color: "var(--admin-on-accent)" }} />
          ) : null}
          {fullyReturned ? (
            <Chip label="برگشت کامل" size="small" sx={{ height: 18, fontSize: 10, backgroundColor: "#c62828", color: "#fff" }} />
          ) : hasReturns ? (
            <Chip label="برگشتی دارد" size="small" sx={{ height: 18, fontSize: 10, backgroundColor: "#ef6c00", color: "#fff" }} />
          ) : null}
          <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)" }}>
            {formatDate(data?.created_at || data?.createdAt)}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
          {data?.customer_name ? (
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--admin-text)" }}>
              {data.customer_name}
            </Typography>
          ) : null}
          <Typography sx={{ fontSize: 12, color: "var(--admin-text)" }} dir="ltr">
            {data?.phone || "بدون شماره"}
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 700,
              color: fullyReturned ? "#c62828" : "var(--admin-accent)",
              textDecoration: fullyReturned ? "line-through" : "none",
            }}
          >
            {displayAmount > 0 || data?.total_amount != null
              ? `${formatNumber(fullyReturned ? displayAmount || data.total_amount : data.total_amount)} تومان`
              : "—"}
          </Typography>
          <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)", lineHeight: 1.5 }}>
            {fullyReturned ? "فاکتور برگشت‌خورده" : itemsSummary}
            {" · "}
            {paymentLabel || "—"}
            {data?.sold_by_name ? ` · فروشنده: ${data.sold_by_name}` : ""}
            {data?.last_return_user_name
              ? ` · برگشت توسط: ${data.last_return_user_name}`
              : hasReturns
                ? " · برگشتی دارد"
                : ""}
            {data?.last_return_at ? ` · ${formatDate(data.last_return_at)}` : ""}
          </Typography>
        </Box>
      </Box>
      <Box onClick={(e) => e.stopPropagation()}>
        <PurchaseRowActions item={data} onOpenDetails={() => onOpenDetails()} />
      </Box>
    </Box>
  );
}
