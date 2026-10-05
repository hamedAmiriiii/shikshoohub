"use client";

import { Fragment, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Collapse,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import {
  formatFaDate,
  formatToman,
  toFaNumber,
  type MarketerPayoutRow,
  type MarketerReferralRow,
  type MarketerSummary,
} from "@/app/lib/marketing";

export const headCellSx = {
  color: "var(--admin-text-secondary)",
  fontWeight: 700,
  whiteSpace: "nowrap",
  borderColor: "var(--admin-border)",
} as const;

export const cellSx = {
  color: "var(--admin-text)",
  whiteSpace: "nowrap",
  borderColor: "var(--admin-border)",
} as const;

export const tableContainerSx = {
  borderRadius: "14px",
  backgroundColor: "var(--admin-surface-alt)",
  border: "1px solid var(--admin-border)",
} as const;

export function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card sx={{ backgroundColor: "var(--admin-surface-alt)", border: "1px solid var(--admin-border)", height: "100%" }}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "12px", mb: 0.5 }}>{label}</Typography>
        <Typography
          sx={{
            color: accent ? "var(--admin-accent)" : "var(--admin-text)",
            fontWeight: 800,
            fontSize: { xs: "17px", md: "20px" },
          }}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function SummaryCards({ summary, percent }: { summary: MarketerSummary; percent?: number }) {
  const items: { label: string; value: string; accent?: boolean }[] = [
    { label: "بازدید از لینک", value: toFaNumber(summary.visitors_count) },
    { label: "ثبت‌نام‌شده", value: toFaNumber(summary.registered_count) },
    { label: "خرید اکانت پولی", value: toFaNumber(summary.paid_shops_count) },
    { label: "جمع خریدها", value: formatToman(summary.total_sales_toman) },
    ...(percent !== undefined ? [{ label: "درصد پورسانت", value: `${toFaNumber(percent)}٪` }] : []),
    { label: "کل پورسانت", value: formatToman(summary.total_commission_toman) },
    { label: "تسویه‌شده", value: formatToman(summary.total_paid_toman) },
    { label: "مانده قابل تسویه", value: formatToman(summary.balance_toman), accent: true },
  ];

  return (
    <Grid container spacing={1.25}>
      {items.map((item) => (
        <Grid item xs={6} md={3} key={item.label}>
          <StatCard {...item} />
        </Grid>
      ))}
    </Grid>
  );
}

function ReferralRow({ row, showShopCode }: { row: MarketerReferralRow; showShopCode: boolean }) {
  const [open, setOpen] = useState(false);
  const hasPurchases = row.purchases.length > 0;

  return (
    <Fragment>
      <TableRow hover>
        <TableCell sx={cellSx} padding="checkbox">
          {hasPurchases ? (
            <IconButton size="small" onClick={() => setOpen((v) => !v)} sx={{ color: "var(--admin-text-secondary)" }}>
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          ) : null}
        </TableCell>
        <TableCell sx={cellSx}>
          <Typography sx={{ fontWeight: 700, fontSize: "14px" }}>{row.shop_name || "—"}</Typography>
          {showShopCode && row.shop_code ? (
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "11px" }}>{row.shop_code}</Typography>
          ) : null}
        </TableCell>
        <TableCell sx={cellSx}>
          <Typography sx={{ fontSize: "13px" }}>{row.owner_name || "—"}</Typography>
          <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px", direction: "ltr", textAlign: "right" }}>
            {row.owner_phone || ""}
          </Typography>
        </TableCell>
        <TableCell sx={cellSx}>{formatFaDate(row.registered_at)}</TableCell>
        <TableCell sx={cellSx}>
          <Chip
            size="small"
            label={row.is_paid ? "اکانت پولی" : "آزمایشی"}
            color={row.is_paid ? "success" : "default"}
            variant={row.is_paid ? "filled" : "outlined"}
          />
        </TableCell>
        <TableCell sx={cellSx}>{row.total_sales_toman ? formatToman(row.total_sales_toman) : "—"}</TableCell>
        <TableCell sx={{ ...cellSx, color: "var(--admin-accent)", fontWeight: 700 }}>
          {row.total_commission_toman ? formatToman(row.total_commission_toman) : "—"}
        </TableCell>
      </TableRow>
      {hasPurchases ? (
        <TableRow>
          <TableCell colSpan={7} sx={{ p: 0, borderColor: "var(--admin-border)" }}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ p: 1.5, backgroundColor: "var(--admin-surface)" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headCellSx}>تاریخ خرید</TableCell>
                      <TableCell sx={headCellSx}>شرح</TableCell>
                      <TableCell sx={headCellSx}>مبلغ خرید</TableCell>
                      <TableCell sx={headCellSx}>درصد</TableCell>
                      <TableCell sx={headCellSx}>پورسانت</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {row.purchases.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell sx={cellSx}>{formatFaDate(p.purchased_at, true)}</TableCell>
                        <TableCell sx={cellSx}>{p.description || "خرید اکانت"}</TableCell>
                        <TableCell sx={cellSx}>{formatToman(p.purchase_amount_toman)}</TableCell>
                        <TableCell sx={cellSx}>{toFaNumber(p.percent)}٪</TableCell>
                        <TableCell sx={{ ...cellSx, fontWeight: 700 }}>{formatToman(p.commission_toman)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      ) : null}
    </Fragment>
  );
}

export function ReferralsTable({
  rows,
  emptyText,
  showShopCode = false,
}: {
  rows: MarketerReferralRow[];
  emptyText: string;
  showShopCode?: boolean;
}) {
  return (
    <TableContainer component={Paper} elevation={0} sx={tableContainerSx}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={headCellSx} padding="checkbox" />
            <TableCell sx={headCellSx}>فروشگاه</TableCell>
            <TableCell sx={headCellSx}>مالک</TableCell>
            <TableCell sx={headCellSx}>تاریخ ثبت‌نام</TableCell>
            <TableCell sx={headCellSx}>وضعیت</TableCell>
            <TableCell sx={headCellSx}>جمع خرید</TableCell>
            <TableCell sx={headCellSx}>پورسانت</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} sx={{ ...cellSx, color: "var(--admin-text-secondary)", textAlign: "center", py: 3 }}>
                {emptyText}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => <ReferralRow key={row.id} row={row} showShopCode={showShopCode} />)
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function PayoutsTable({
  rows,
  onDelete,
}: {
  rows: MarketerPayoutRow[];
  onDelete?: (row: MarketerPayoutRow) => void;
}) {
  return (
    <TableContainer component={Paper} elevation={0} sx={tableContainerSx}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={headCellSx}>تاریخ</TableCell>
            <TableCell sx={headCellSx}>مبلغ</TableCell>
            <TableCell sx={headCellSx}>توضیح</TableCell>
            {onDelete ? <TableCell sx={headCellSx} /> : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={onDelete ? 4 : 3}
                sx={{ ...cellSx, color: "var(--admin-text-secondary)", textAlign: "center", py: 3 }}
              >
                هنوز تسویه‌ای انجام نشده است.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell sx={cellSx}>{formatFaDate(row.paid_at, true)}</TableCell>
                <TableCell sx={{ ...cellSx, fontWeight: 700 }}>{formatToman(row.amount_toman)}</TableCell>
                <TableCell sx={{ ...cellSx, whiteSpace: "normal" }}>{row.note || "—"}</TableCell>
                {onDelete ? (
                  <TableCell sx={cellSx}>
                    <Typography
                      component="button"
                      onClick={() => onDelete(row)}
                      sx={{
                        border: 0,
                        background: "none",
                        cursor: "pointer",
                        color: "var(--admin-danger, #e53935)",
                        fontSize: "12px",
                      }}
                    >
                      حذف
                    </Typography>
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
