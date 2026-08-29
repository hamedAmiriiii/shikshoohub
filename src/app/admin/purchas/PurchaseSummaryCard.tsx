"use client";

import { Box, Button, Chip, Typography } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { paymentTypeLabel } from "@/app/lib/paymentTypes";

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

export default function PurchaseSummaryCard({
  data,
  onOpenDetails,
}: {
  data: any;
  onOpenDetails: () => void;
}) {
  const itemCount = Array.isArray(data?.purchased_products)
    ? data.purchased_products.length
    : 0;
  const paymentLabel = data?.payment_type_label || paymentTypeLabel(data?.payment_type || "");
  const isInstallment = data?.payment_type === "installment";
  const isCheque = data?.payment_type === "cheque";

  return (
    <Box
      onClick={onOpenDetails}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        width: "100%",
        backgroundColor: "var(--admin-surface)",
        border: "1px solid var(--admin-border)",
        borderRadius: "12px",
        px: 1.25,
        py: 1,
        mb: 1,
        cursor: "pointer",
        "&:hover": { backgroundColor: "var(--admin-menu-hover)" },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.25 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--admin-text)" }}>
            #{data?.id ?? "—"}
          </Typography>
          {isInstallment ? (
            <Chip label="اقساطی" size="small" sx={{ height: 18, fontSize: 10, backgroundColor: "#ff9800", color: "#fff" }} />
          ) : null}
          {isCheque ? (
            <Chip label="چکی" size="small" sx={{ height: 18, fontSize: 10, backgroundColor: "#2196f3", color: "#fff" }} />
          ) : null}
          <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)" }}>
            {formatDate(data?.created_at || data?.createdAt)}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
          <Typography sx={{ fontSize: 12, color: "var(--admin-text)" }} dir="ltr">
            {data?.phone || "بدون شماره"}
          </Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--admin-accent)" }}>
            {data?.total_amount != null ? `${formatNumber(data.total_amount)} تومان` : "—"}
          </Typography>
          <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)" }}>
            {itemCount} کالا · {paymentLabel || "—"}
          </Typography>
        </Box>
      </Box>
      <Button
        size="small"
        variant="outlined"
        startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
        onClick={(e) => {
          e.stopPropagation();
          onOpenDetails();
        }}
        sx={{
          flexShrink: 0,
          fontSize: 11,
          minWidth: 0,
          px: 1,
          py: 0.25,
          color: "var(--admin-accent)",
          borderColor: "var(--admin-border)",
        }}
      >
        جزئیات
      </Button>
    </Box>
  );
}
