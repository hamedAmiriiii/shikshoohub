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
  TextField,
  Typography,
} from "@mui/material";
import UndoIcon from "@mui/icons-material/Undo";
import EditIcon from "@mui/icons-material/Edit";
import PostAddIcon from "@mui/icons-material/PostAdd";
import LockIcon from "@mui/icons-material/Lock";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { toast } from "react-toastify";
import {
  accountingSourceLabel,
  accountingVoucherStatusLabel,
  auditorReverseVoucher,
  canAuditorCorrectVoucher,
  canAuditorReverseVoucher,
  canReverseVoucherFromUi,
  fetchAccountingAuditLog,
  fetchAccountingPeriods,
  fetchAccountingVoucher,
  formatAccountingMoney,
  isOperationalVoucher,
  isReversalVoucher,
  reverseAccountingVoucher,
  voucherSourceHref,
  type AccountingAuditLogEntry,
  type AccountingVoucher,
} from "@/app/lib/accounting";
import {
  AccountingPageShell,
  AccountingTableCell,
  AccountingTableRow,
  accountingButtonSx,
  accountingFieldSx,
} from "@/app/admin/accounting/ui";

export default function AccountingVoucherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const [voucher, setVoucher] = useState<AccountingVoucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [canEditClosed, setCanEditClosed] = useState(false);
  const [reason, setReason] = useState("");
  const [auditLog, setAuditLog] = useState<AccountingAuditLogEntry[]>([]);

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
    fetchAccountingAuditLog({ voucherId: id })
      .then((res) => setAuditLog(res.data))
      .catch(() => setAuditLog([]));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchAccountingPeriods()
      .then((info) => setCanEditClosed(info.can_edit_closed))
      .catch(() => setCanEditClosed(false));
  }, []);

  const auditorReverse = Boolean(voucher && canEditClosed && canAuditorReverseVoucher(voucher));
  const ownerReverse = Boolean(voucher && !canEditClosed && !voucher.locked && canReverseVoucherFromUi(voucher));
  const reasonRequired = Boolean(voucher?.locked);

  const handleReverse = async () => {
    if (!voucher) return;
    if (auditorReverse && reasonRequired && reason.trim().length < 3) {
      toast.error("دلیل برگشت را بنویسید.");
      return;
    }
    setSaving(true);
    try {
      const reversed = auditorReverse
        ? await auditorReverseVoucher(voucher.id, reason.trim() || undefined)
        : await reverseAccountingVoucher(voucher.id);
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
  const showAdjusting =
    Boolean(voucher) &&
    canEditClosed &&
    voucher!.status === "posted" &&
    voucher!.reverses_voucher_id == null &&
    !canAuditorReverseVoucher(voucher!) &&
    voucher!.source_type !== "year_close" &&
    voucher!.source_type !== "year_close_adjust";

  return (
    <AccountingPageShell
      title={voucher ? `سند ${voucher.number}` : "جزئیات سند"}
      subtitle={voucher ? voucher.date : undefined}
      actions={
        voucher ? (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {canEditClosed && canAuditorCorrectVoucher(voucher) ? (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => router.push(`/admin/accounting/vouchers/new?correct=${voucher.id}`)}
                sx={accountingButtonSx}
              >
                اصلاح سند
              </Button>
            ) : null}
            {showAdjusting ? (
              <Button
                variant="contained"
                startIcon={<PostAddIcon />}
                onClick={() => router.push(`/admin/accounting/vouchers/new?ref=${voucher.id}`)}
                sx={accountingButtonSx}
              >
                سند اصلاحی
              </Button>
            ) : null}
            {auditorReverse || ownerReverse ? (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<UndoIcon />}
                onClick={() => setConfirmOpen(true)}
                sx={{ borderColor: "#e6a23c", color: "#e6a23c" }}
              >
                برگشت سند
              </Button>
            ) : null}
          </Box>
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
            {voucher.locked ? (
              <Chip
                icon={<LockIcon sx={{ fontSize: 16 }} />}
                label="دورهٔ بسته"
                sx={{ bgcolor: "var(--admin-surface)", color: "var(--admin-text)" }}
              />
            ) : null}
          </Box>

          {voucher.description ? (
            <Typography sx={{ color: "var(--admin-text)", mb: 2 }}>{voucher.description}</Typography>
          ) : null}

          {voucher.locked && !canEditClosed ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              این سند در دورهٔ بسته‌شده است و فقط حسابرس می‌تواند آن را اصلاح کند.
            </Alert>
          ) : null}

          {isOperationalVoucher(voucher) && !canEditClosed ? (
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

          {auditLog.length > 0 ? (
            <Box sx={{ mt: 3 }}>
              <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, mb: 1 }}>تاریخچهٔ تغییرات حسابرس</Typography>
              {auditLog.map((entry) => (
                <Box
                  key={entry.id}
                  sx={{
                    p: 1.5,
                    mb: 1,
                    borderRadius: "8px",
                    border: "1px solid var(--admin-border)",
                    bgcolor: "var(--admin-surface)",
                  }}
                >
                  <Typography sx={{ color: "var(--admin-text)", fontSize: 13 }}>
                    {entry.action_label}
                    {entry.user_name ? ` — ${entry.user_name}` : ""}
                    {entry.created_at ? ` — ${entry.created_at}` : ""}
                    {entry.in_closed_period ? ` — دورهٔ بسته تا ${entry.closed_through}` : ""}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
                    {entry.related_voucher_id && entry.related_voucher_id !== voucher.id ? (
                      <Button
                        size="small"
                        onClick={() => router.push(`/admin/accounting/vouchers/${entry.related_voucher_id}`)}
                      >
                        سند قبلی #{entry.related_voucher_number ?? entry.related_voucher_id}
                      </Button>
                    ) : null}
                    {entry.voucher_id && entry.voucher_id !== voucher.id ? (
                      <Button size="small" onClick={() => router.push(`/admin/accounting/vouchers/${entry.voucher_id}`)}>
                        سند جدید #{entry.voucher_number ?? entry.voucher_id}
                      </Button>
                    ) : null}
                  </Box>
                  {entry.reason ? (
                    <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mt: 0.5 }}>
                      دلیل: {entry.reason}
                    </Typography>
                  ) : null}
                </Box>
              ))}
            </Box>
          ) : null}
        </>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>برگشت سند</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13, mb: auditorReverse ? 2 : 0 }}>
            {auditorReverse
              ? "سند معکوس با همان تاریخ سند ساخته می‌شود و این سند «برگشت‌خورده» می‌شود."
              : "سند معکوس ساخته می‌شود و این سند «برگشت‌خورده» می‌شود. ادامه می‌دهید؟"}
          </Typography>
          {auditorReverse ? (
            <TextField
              label={reasonRequired ? "دلیل برگشت (الزامی)" : "دلیل برگشت (اختیاری)"}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              sx={accountingFieldSx}
            />
          ) : null}
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
