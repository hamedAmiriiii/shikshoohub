"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Pagination,
  Switch,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { toast } from "react-toastify";
import { fetchAccountingAuditLog, type AccountingAuditLogEntry } from "@/app/lib/accounting";
import {
  AccountingPageShell,
  AccountingTableCell,
  AccountingTableRow,
  accountingPaginationSx,
} from "@/app/admin/accounting/ui";

export default function AccountingAuditLogPage() {
  const router = useRouter();
  const [rows, setRows] = useState<AccountingAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [closedOnly, setClosedOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAccountingAuditLog({ page, closedOnly });
      setRows(res.data);
      setLastPage(Math.max(1, res.last_page));
      setTotal(res.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در دریافت لاگ حسابرس");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, closedOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const voucherLink = (id: number | null, number: number | null) =>
    id ? (
      <Button
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/admin/accounting/vouchers/${id}`);
        }}
        sx={{ minWidth: 0, color: "var(--admin-accent)" }}
      >
        #{number ?? id}
      </Button>
    ) : (
      "—"
    );

  return (
    <AccountingPageShell
      title="لاگ حسابرس"
      subtitle={`${new Intl.NumberFormat("fa-IR").format(total)} تغییر — هر سندی که حسابرس زده، اصلاح یا برگشت کرده`}
      actions={
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={load}
          disabled={loading}
          sx={{ color: "var(--admin-text)", borderColor: "var(--admin-border)" }}
        >
          بروزرسانی
        </Button>
      }
    >
      <FormControlLabel
        control={
          <Switch
            checked={closedOnly}
            onChange={(e) => {
              setClosedOnly(e.target.checked);
              setPage(1);
            }}
          />
        }
        label="فقط تغییرات دوره‌های بسته"
        sx={{ color: "var(--admin-text)", mb: 1 }}
      />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : rows.length === 0 ? (
        <Typography sx={{ color: "var(--admin-text-muted)", py: 4, textAlign: "center" }}>
          هنوز تغییری ثبت نشده است.
        </Typography>
      ) : (
        <TableContainer sx={{ borderRadius: "10px", border: "1px solid var(--admin-border)" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <AccountingTableCell>زمان</AccountingTableCell>
                <AccountingTableCell>حسابرس</AccountingTableCell>
                <AccountingTableCell>کار</AccountingTableCell>
                <AccountingTableCell>سند جدید</AccountingTableCell>
                <AccountingTableCell>سند قبلی</AccountingTableCell>
                <AccountingTableCell>دوره</AccountingTableCell>
                <AccountingTableCell>دلیل</AccountingTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <AccountingTableRow key={row.id}>
                  <AccountingTableCell>{row.created_at || "—"}</AccountingTableCell>
                  <AccountingTableCell>{row.user_name || "—"}</AccountingTableCell>
                  <AccountingTableCell>{row.action_label}</AccountingTableCell>
                  <AccountingTableCell>{voucherLink(row.voucher_id, row.voucher_number)}</AccountingTableCell>
                  <AccountingTableCell>{voucherLink(row.related_voucher_id, row.related_voucher_number)}</AccountingTableCell>
                  <AccountingTableCell>
                    {row.in_closed_period ? (
                      <Chip
                        size="small"
                        label={`بسته تا ${row.closed_through}`}
                        sx={{ height: 22, fontSize: 11, bgcolor: "var(--admin-info-bg)", color: "var(--admin-info-icon)" }}
                      />
                    ) : (
                      <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>باز</Typography>
                    )}
                  </AccountingTableCell>
                  <AccountingTableCell>
                    <Typography sx={{ fontSize: 12, maxWidth: 280, whiteSpace: "pre-wrap" }}>{row.reason || "—"}</Typography>
                  </AccountingTableCell>
                </AccountingTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {lastPage > 1 ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Pagination
            count={lastPage}
            page={page}
            onChange={(_e, value) => setPage(value)}
            size="small"
            sx={accountingPaginationSx}
          />
        </Box>
      ) : null}
    </AccountingPageShell>
  );
}
