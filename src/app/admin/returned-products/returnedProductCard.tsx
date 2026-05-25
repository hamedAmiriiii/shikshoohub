"use client";

import { Box, Divider, Typography } from "@mui/material";
import { paymentTypeLabel } from "./types";

export interface PurchaseItemReturnRow {
  id: number;
  purchase_id: number;
  purchased_product_id: number;
  product_name: string;
  barcode?: string;
  quantity: number;
  sale_price: number;
  purchase_price?: number;
  return_sale_total: number;
  return_purchase_total?: number;
  phone: string;
  payment_type: string;
  credit_returned?: number;
  date?: string;
  date_jalali: string;
  created_at?: string;
  user_name?: string;
  notes?: string | null;
}

const formatNumber = (num: number | string) => {
  const numValue = typeof num === "string" ? parseFloat(num.replace(/,/g, "")) : num;
  if (Number.isNaN(numValue)) return "—";
  return new Intl.NumberFormat("fa-IR").format(Math.round(numValue));
};

function CardInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ textAlign: "center", py: 0.5 }}>
      <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)", mb: 0.25 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--admin-text)" }}>{value}</Typography>
    </Box>
  );
}

export default function ReturnedProductCard({ data }: { data: PurchaseItemReturnRow }) {
  const [, timePart] = (data.created_at || "").split(" ");

  return (
    <Box
      sx={{
        backgroundColor: "var(--admin-surface)",
        borderRadius: "16px",
        border: "1px solid var(--admin-border)",
        p: 2,
        textAlign: "center",
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: "rgba(120, 181, 104, 0.4)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
        },
      }}
    >
      <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 15, mb: 0.5 }}>
        {data.product_name || "—"}
      </Typography>
      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
        {data.date_jalali || data.date || "—"}
        {timePart ? ` · ${timePart}` : ""}
      </Typography>

      <Divider sx={{ borderColor: "var(--admin-divider)", my: 1.25 }} />

      <CardInfoRow label="فاکتور" value={String(data.purchase_id)} />
      <CardInfoRow label="تعداد برگشت" value={formatNumber(data.quantity)} />
      {data.barcode && <CardInfoRow label="بارکد" value={data.barcode} />}
      <CardInfoRow label="قیمت واحد فروش" value={`${formatNumber(data.sale_price)} تومان`} />
      <CardInfoRow label="جمع برگشت فروش" value={`${formatNumber(data.return_sale_total)} تومان`} />
      {data.return_purchase_total != null && data.return_purchase_total > 0 && (
        <CardInfoRow label="جمع برگشت خرید" value={`${formatNumber(data.return_purchase_total)} تومان`} />
      )}
      {data.phone && <CardInfoRow label="موبایل مشتری" value={data.phone} />}
      {data.payment_type && (
        <CardInfoRow label="نوع پرداخت" value={paymentTypeLabel(data.payment_type)} />
      )}
      {data.credit_returned != null && data.credit_returned > 0 && (
        <CardInfoRow label="برگشت اعتبار" value={`${formatNumber(data.credit_returned)} تومان`} />
      )}
      {data.user_name && <CardInfoRow label="پرسنل" value={data.user_name} />}
      {data.notes?.trim() && <CardInfoRow label="یادداشت" value={data.notes} />}
    </Box>
  );
}
