"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import { toast } from "react-toastify";
import {
  ACCOUNTING_SOURCE_TYPES,
  accountingSourceLabel,
  accountingVoucherStatusLabel,
  fetchAccountingVouchers,
  formatAccountingMoney,
  isReversalVoucher,
  type AccountingVoucher,
} from "@/app/lib/accounting";
import {
  AccountingPageShell,
  AccountingTableCell,
  AccountingTableRow,
  accountingButtonSx,
  accountingFieldSx,
  accountingPaginationSx,
} from "@/app/admin/accounting/ui";

function statusChip(voucher: AccountingVoucher) {
  const label = accountingVoucherStatusLabel(voucher);
  if (voucher.status === "reversed") {
    return <Chip size="small" label={label} sx={{ height: 22, fontSize: 11 }} />;
  }
  if (isReversalVoucher(voucher)) {
    return (
      <Chip
        size="small"
        label={label}
        sx={{ height: 22, fontSize: 11, bgcolor: "var(--admin-info-bg)", color: "var(--admin-info-icon)" }}
      />
    );
  }
  return (
    <Chip
      size="small"
      label={label}
      sx={{ height: 22, fontSize: 11, bgcolor: "var(--admin-accent)", color: "#fff" }}
    />
  );
}

function AccountingVouchersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSource = searchParams.get("source_type") || "";
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AccountingVoucher[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sourceType, setSourceType] = useState(initialSource);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAccountingVouchers({
        page,
        perPage: 20,
        sourceType: sourceType || undefined,
        status: status || undefined,
      });
      setRows(res.data);
      setLastPage(Math.max(1, res.last_page));
      setTotal(res.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در دریافت اسناد");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, sourceType, status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AccountingPageShell
      title="اسناد حسابداری"
      subtitle={`${new Intl.NumberFormat("fa-IR").format(total)} سند`}
      actions={
        <>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={load}
            disabled={loading}
            sx={{ color: "var(--admin-text)", borderColor: "var(--admin-border)" }}
          >
            بروزرسانی
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push("/admin/accounting/vouchers/new")}
            sx={accountingButtonSx}
          >
            سند دستی
          </Button>
        </>
      }
    >
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 180, ...accountingFieldSx }}>
          <InputLabel>منبع</InputLabel>
          <Select
            label="منبع"
            value={sourceType}
            onChange={(e) => {
              setSourceType(e.target.value);
              setPage(1);
            }}
          >
            {ACCOUNTING_SOURCE_TYPES.map((item) => (
              <MenuItem key={item.value || "all"} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140, ...accountingFieldSx }}>
          <InputLabel>وضعیت</InputLabel>
          <Select
            label="وضعیت"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="">همه</MenuItem>
            <MenuItem value="posted">ثبت‌شده</MenuItem>
            <MenuItem value="reversed">برگشت‌خورده</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : rows.length === 0 ? (
        <Typography sx={{ color: "var(--admin-text-muted)", py: 4, textAlign: "center" }}>
          سندی یافت نشد.
        </Typography>
      ) : (
        <TableContainer sx={{ borderRadius: "10px", border: "1px solid var(--admin-border)" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <AccountingTableCell>شماره</AccountingTableCell>
                <AccountingTableCell>تاریخ</AccountingTableCell>
                <AccountingTableCell>شرح</AccountingTableCell>
                <AccountingTableCell>منبع</AccountingTableCell>
                <AccountingTableCell align="left">بدهکار</AccountingTableCell>
                <AccountingTableCell align="left">بستانکار</AccountingTableCell>
                <AccountingTableCell>وضعیت</AccountingTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <AccountingTableRow
                  key={row.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => router.push(`/admin/accounting/vouchers/${row.id}`)}
                >
                  <AccountingTableCell>{row.number}</AccountingTableCell>
                  <AccountingTableCell>{row.date}</AccountingTableCell>
                  <AccountingTableCell>
                    <Typography sx={{ fontSize: 12, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {row.description || "—"}
                    </Typography>
                  </AccountingTableCell>
                  <AccountingTableCell>{accountingSourceLabel(row.source_type)}</AccountingTableCell>
                  <AccountingTableCell align="left">{formatAccountingMoney(row.debit_total)}</AccountingTableCell>
                  <AccountingTableCell align="left">{formatAccountingMoney(row.credit_total)}</AccountingTableCell>
                  <AccountingTableCell>{statusChip(row)}</AccountingTableCell>
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

export default function AccountingVouchersPageWithSuspense() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      }
    >
      <AccountingVouchersPage />
    </Suspense>
  );
}
