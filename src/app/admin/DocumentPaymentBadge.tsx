"use client";

import { Box, Chip, Typography } from "@mui/material";
import { formatAmountNumber } from "@/app/lib/amountInput";
import {
  breakdownAmounts,
  canSettleDocumentPayment,
  documentCreditRemaining,
  documentPaymentLabel,
  documentPaymentStatusLabel,
  type DocumentPaymentFields,
} from "@/app/lib/documentPayments";

function chipSx(kind: "method" | "status" | "warn") {
  if (kind === "warn") {
    return {
      height: 20,
      fontSize: 11,
      backgroundColor: "rgba(230, 162, 60, 0.18)",
      color: "#e6a23c",
    };
  }
  if (kind === "status") {
    return {
      height: 20,
      fontSize: 11,
      backgroundColor: "rgba(255, 68, 68, 0.12)",
      color: "#ff8a80",
    };
  }
  return {
    height: 20,
    fontSize: 11,
    backgroundColor: "var(--admin-menu-hover)",
    color: "var(--admin-text)",
  };
}

export function DocumentPaymentChips({ doc }: { doc?: DocumentPaymentFields | null }) {
  if (!doc?.payment_method && !doc?.payment_method_label) return <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>—</Typography>;
  const status = String(doc.payment_status || "").toLowerCase();
  const statusLabel = documentPaymentStatusLabel(doc.payment_status);
  return (
    <Box sx={{ display: "flex", gap: 0.4, justifyContent: "center", flexWrap: "wrap" }}>
      <Chip size="small" label={documentPaymentLabel(doc)} sx={chipSx("method")} />
      {status && status !== "paid" && statusLabel ? (
        <Chip size="small" label={statusLabel} sx={chipSx(status === "partial" ? "warn" : "status")} />
      ) : null}
    </Box>
  );
}

export function DocumentPaymentBreakdownView({ doc }: { doc?: DocumentPaymentFields | null }) {
  if (!doc) return null;
  const { cash, cheque, credit } = breakdownAmounts(doc.payment_breakdown);
  const remaining = documentCreditRemaining(doc);
  if (!cash && !cheque && !credit && !remaining && !doc.payment_method) return null;
  const rows = [
    cash > 0 ? ["نقد", cash] : null,
    cheque > 0 ? ["چک", cheque] : null,
    credit > 0 ? ["نسیه", credit] : null,
    remaining > 0 ? ["باقی‌مانده نسیه", remaining] : null,
  ].filter(Boolean) as Array<[string, number]>;
  if (rows.length === 0) {
    return (
      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
        نوع پرداخت: {documentPaymentLabel(doc)}
      </Typography>
    );
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.35 }}>
      <Typography sx={{ color: "var(--admin-text)", fontSize: 12, fontWeight: 600 }}>
        پرداخت: {documentPaymentLabel(doc)}
        {doc.payment_status && String(doc.payment_status).toLowerCase() !== "paid"
          ? ` — ${documentPaymentStatusLabel(doc.payment_status)}`
          : ""}
      </Typography>
      {rows.map(([label, amount]) => (
        <Typography key={label} sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
          {label}: {formatAmountNumber(amount)} تومان
        </Typography>
      ))}
    </Box>
  );
}

export function documentNeedsSettle(doc?: DocumentPaymentFields | null): boolean {
  return canSettleDocumentPayment(doc);
}
