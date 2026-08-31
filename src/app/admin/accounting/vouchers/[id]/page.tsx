"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import UndoIcon from "@mui/icons-material/Undo";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { toast } from "react-toastify";
import {
  accountingSourceLabel,
  accountingVoucherStatusLabel,
  canReverseVoucherFromUi,
  fetchAccountingVoucher,
  formatAccountingMoney,
  isOperationalVoucher,
  isReversalVoucher,
  reverseAccountingVoucher,
  voucherSourceHref,
  type AccountingVoucher,
} from "@/app/lib/accounting";
import {
  AccountingPageShell,
  AccountingTableCell,
  AccountingTableRow,
  accountingButtonSx,
} from "@/app/admin/accounting/ui";

export default function AccountingVoucherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const [voucher, setVoucher] = useState<AccountingVoucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(id) || id <= 0) return;
    setLoading(true);
    try {
      setVoucher(await fetchAccountingVoucher(id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "سند یافت نشد");
      setVoucher(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReverse = async () => {
    if (!voucher) return;
    setSaving(true);
    try {
      const reversed = await reverseAccountingVoucher(voucher.id);
      toast.success("سند برگشت خورد.");
      setConfirmOpen(false);
      router.push(`/admin/accounting/vouchers/${reversed.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در برگشت سند");
    } finally {
      setSaving(false);
    }
  };

  const sourceHref = voucher ? voucherSourceHref(voucher) : null;

  return (
    <AccountingPageShell
      title={voucher ? `سند ${voucher.number}` : "جزئیات سند"}
      subtitle={voucher ? voucher.date : undefined}
      actions={
        voucher && canReverseVoucherFromUi(voucher) ? (
          <Button
            variant="outlined"
            color="warning"
            startIcon={<UndoIcon />}
            onClick={() => setConfirmOpen(true)}
            sx={{ borderColor: "#e6a23c", color: "#e6a23c" }}
          >
            برگشت سند
          </Button>
        ) : null
      }
    >
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : !voucher ? (
        <Alert severity="error">سند یافت نشد.</Alert>
      ) : (
        <>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
            <Chip label={accountingVoucherStatusLabel(voucher)} sx={{ bgcolor: "var(--admin-surface)", color: "var(--admin-text)" }} />
            <Chip label={accountingSourceLabel(voucher.source_type)} sx={{ bgcolor: "var(--admin-surface)", color: "var(--admin-text)" }} />
            {voucher.source_id ? (
              <Chip label={`منبع #${voucher.source_id}`} sx={{ bgcolor: "var(--admin-surface)", color: "var(--admin-text)" }} />
            ) : null}
          </Box>

          {voucher.description ? (
            <Typography sx={{ color: "var(--admin-text)", mb: 2 }}>{voucher.description}</Typography>
          ) : null}

          {isOperationalVoucher(voucher) ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              این سند از عملیات ساخته شده است. برگشت دستی دفتر را از عملیات جدا می‌کند؛ مدرک اصلی را از همان بخش حذف کنید.
            </Alert>
          ) : null}

          {isReversalVoucher(voucher) && voucher.reverses_voucher_id ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              سند برگشتِ سند{" "}
              <Button
                size="small"
                onClick={() => router.push(`/admin/accounting/vouchers/${voucher.reverses_voucher_id}`)}
              >
                #{voucher.reverses_voucher_id}
              </Button>
            </Alert>
          ) : null}

          {sourceHref ? (
            <Button
              size="small"
              startIcon={<OpenInNewIcon />}
              onClick={() => router.push(sourceHref)}
              sx={{ mb: 2, color: "var(--admin-accent)" }}
            >
              رفتن به مدرک عملیات
            </Button>
          ) : null}

          <TableContainer sx={{ borderRadius: "10px", border: "1px solid var(--admin-border)" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <AccountingTableCell>کد</AccountingTableCell>
                  <AccountingTableCell>حساب</AccountingTableCell>
                  <AccountingTableCell>شرح آرتیکل</AccountingTableCell>
                  <AccountingTableCell align="left">بدهکار</AccountingTableCell>
                  <AccountingTableCell align="left">بستانکار</AccountingTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {voucher.lines.map((line) => (
                  <AccountingTableRow key={line.id}>
                    <AccountingTableCell>{line.account_code}</AccountingTableCell>
                    <AccountingTableCell>{line.account_name}</AccountingTableCell>
                    <AccountingTableCell>{line.description || "—"}</AccountingTableCell>
                    <AccountingTableCell align="left">{formatAccountingMoney(line.debit)}</AccountingTableCell>
                    <AccountingTableCell align="left">{formatAccountingMoney(line.credit)}</AccountingTableCell>
                  </AccountingTableRow>
                ))}
                <AccountingTableRow>
                  <AccountingTableCell colSpan={3} sx={{ fontWeight: 700 }}>
                    جمع
                  </AccountingTableCell>
                  <AccountingTableCell align="left" sx={{ fontWeight: 700 }}>
                    {formatAccountingMoney(voucher.debit_total)}
                  </AccountingTableCell>
                  <AccountingTableCell align="left" sx={{ fontWeight: 700 }}>
                    {formatAccountingMoney(voucher.credit_total)}
                  </AccountingTableCell>
                </AccountingTableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>برگشت سند دستی</DialogTitle>
        <DialogContent>
          سند معکوس ساخته می‌شود و این سند «برگشت‌خورده» می‌شود. ادامه می‌دهید؟
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>انصراف</Button>
          <Button onClick={handleReverse} disabled={saving} sx={accountingButtonSx}>
            {saving ? "در حال برگشت…" : "برگشت"}
          </Button>
        </DialogActions>
      </Dialog>
    </AccountingPageShell>
  );
}
