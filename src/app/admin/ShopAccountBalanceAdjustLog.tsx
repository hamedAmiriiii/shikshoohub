"use client";

import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import type { ShopAccountBalanceAdjustmentLog } from "@/app/lib/shopAccounts";

const formatNumber = (num: number) =>
  new Intl.NumberFormat("fa-IR").format(Math.round(num || 0));

type Props = {
  rows: ShopAccountBalanceAdjustmentLog[];
  loading?: boolean;
  title?: string;
  emptyText?: string;
};

export default function ShopAccountBalanceAdjustLog({
  rows,
  loading,
  title = "لاگ اصلاح موجودی",
  emptyText = "هنوز اصلاح دستی ثبت نشده است",
}: Props) {
  return (
    <Paper
      elevation={0}
      sx={{
        mt: 2,
        p: 1.5,
        bgcolor: "var(--admin-surface)",
        border: "1px solid var(--admin-border)",
        borderRadius: 2,
      }}
    >
      <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 14, mb: 1 }}>
        {title}
      </Typography>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress size={22} sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : rows.length === 0 ? (
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, py: 1 }}>
          {emptyText}
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.85 }}>
          {rows.map((row) => {
            const up = row.amount > 0;
            const down = row.amount < 0;
            const deltaColor = up
              ? "var(--admin-accent)"
              : down
                ? "var(--admin-error, #f87171)"
                : "var(--admin-text-muted)";
            return (
              <Box
                key={row.id}
                sx={{
                  p: 1,
                  borderRadius: 1.5,
                  bgcolor: "var(--admin-surface-alt)",
                  border: "1px solid var(--admin-border)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 1,
                    flexWrap: "wrap",
                    alignItems: "baseline",
                  }}
                >
                  <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 13 }}>
                    {row.account_name}
                    {row.account_type_label ? (
                      <Box
                        component="span"
                        sx={{ color: "var(--admin-text-muted)", fontWeight: 500, fontSize: 11, mr: 0.75 }}
                      >
                        ({row.account_type_label})
                      </Box>
                    ) : null}
                  </Typography>
                  <Typography sx={{ color: deltaColor, fontWeight: 700, fontSize: 13, direction: "ltr" }}>
                    {up ? "+" : ""}
                    {formatNumber(row.amount)}
                  </Typography>
                </Box>
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mt: 0.35 }}>
                  {row.balance_before != null && row.balance_after != null
                    ? `از ${formatNumber(row.balance_before)} به ${formatNumber(row.balance_after)}`
                    : "اصلاح مانده"}
                  {row.user_name ? ` · ${row.user_name}` : ""}
                  {row.created_at_jalali
                    ? ` · ${row.created_at_jalali}`
                    : row.date_jalali
                      ? ` · ${row.date_jalali}`
                      : ""}
                </Typography>
                {row.description ? (
                  <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mt: 0.25 }}>
                    {row.description}
                  </Typography>
                ) : null}
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}
