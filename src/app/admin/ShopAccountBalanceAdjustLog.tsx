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
        mt: title ? 2 : 0,
        p: title ? 1.5 : 0,
        bgcolor: title ? "var(--admin-surface)" : "transparent",
        border: title ? "1px solid var(--admin-border)" : "none",
        borderRadius: 2,
      }}
    >
      {title ? (
        <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 14, mb: 1 }}>
          {title}
        </Typography>
      ) : null}
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
            const isCharge = row.kind === "charge";
            const up = row.amount > 0;
            const down = row.amount < 0;
            const deltaColor = isCharge || up
              ? "var(--admin-accent)"
              : down
                ? "var(--admin-error, #f87171)"
                : "var(--admin-text-muted)";
            const kindLabel =
              row.kind_label ||
              (isCharge ? "شارژ" : row.kind === "adjust" ? "اصلاح موجودی" : null);
            return (
              <Box
                key={String(row.id)}
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0, flexWrap: "wrap" }}>
                    {kindLabel ? (
                      <Box
                        component="span"
                        sx={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          px: 0.7,
                          py: 0.15,
                          borderRadius: 1,
                          bgcolor: isCharge
                            ? "rgba(120, 181, 104, 0.18)"
                            : "rgba(255, 255, 255, 0.06)",
                          color: isCharge ? "var(--admin-accent)" : "var(--admin-text-muted)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {kindLabel}
                      </Box>
                    ) : null}
                    <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 13 }}>
                      {row.account_name}
                      {row.account_type_label && !kindLabel ? (
                        <Box
                          component="span"
                          sx={{ color: "var(--admin-text-muted)", fontWeight: 500, fontSize: 11, mr: 0.75 }}
                        >
                          ({row.account_type_label})
                        </Box>
                      ) : null}
                    </Typography>
                  </Box>
                  <Typography sx={{ color: deltaColor, fontWeight: 700, fontSize: 13, direction: "ltr" }}>
                    {up || isCharge ? "+" : ""}
                    {formatNumber(row.amount)}
                  </Typography>
                </Box>
                {row.title ? (
                  <Typography sx={{ color: "var(--admin-text)", fontSize: 12, mt: 0.35, fontWeight: 600 }}>
                    {row.title}
                  </Typography>
                ) : null}
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mt: 0.35 }}>
                  {isCharge
                    ? row.counterparty_name
                      ? `از ${row.counterparty_name}`
                      : "شارژ تنخواه"
                    : row.balance_before != null && row.balance_after != null
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
