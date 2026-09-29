"use client";

import { useCallback, useEffect, useState } from "react";
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
  TextField,
  Typography,
} from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";
import { toast } from "react-toastify";
import {
  AccountingTableCell,
  AccountingTableRow,
  accountingButtonSx,
  accountingFieldSx,
  accountingPaginationSx,
} from "@/app/admin/accounting/ui";
import {
  fetchMoadianDocument,
  fetchMoadianDocuments,
  formatRial,
  moadianStatusColors,
  retryFailedMoadianDocuments,
  retryMoadianDocument,
  type MoadianDocument,
} from "@/app/lib/moadian";

function StatusChip({ doc }: { doc: MoadianDocument }) {
  const c = moadianStatusColors(doc.status);
  return <Chip size="small" label={doc.status_label} sx={{ height: 22, fontSize: 11, bgcolor: c.bg, color: c.color }} />;
}

export default function MoadianDocumentsTab({ refreshKey, onChanged }: { refreshKey: number; onChanged: () => void }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<MoadianDocument[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [status, setStatus] = useState("");
  const [subject, setSubject] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [detail, setDetail] = useState<MoadianDocument | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMoadianDocuments({ page, status, subject, search: appliedSearch });
      setRows(res.data);
      setLastPage(Math.max(1, res.last_page));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در دریافت صورتحساب‌ها");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, status, subject, appliedSearch]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const openDetail = async (id: number) => {
    try {
      setDetail(await fetchMoadianDocument(id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "صورتحساب یافت نشد");
    }
  };

  const retry = async (id: number) => {
    setBusy(true);
    try {
      toast.success(await retryMoadianDocument(id));
      setDetail(null);
      await load();
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ارسال دوباره ناموفق بود");
    } finally {
      setBusy(false);
    }
  };

  const retryAll = async () => {
    setBusy(true);
    try {
      toast.success(await retryFailedMoadianDocuments());
      await load();
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ارسال دوباره ناموفق بود");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2, alignItems: "center" }}>
        <FormControl size="small" sx={{ minWidth: 160, ...accountingFieldSx }}>
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
            <MenuItem value="queued">در صف ارسال</MenuItem>
            <MenuItem value="sent">در انتظار نتیجه</MenuItem>
            <MenuItem value="success">ثبت‌شده</MenuItem>
            <MenuItem value="failed">ناموفق</MenuItem>
            <MenuItem value="discarded">کنار گذاشته‌شده</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150, ...accountingFieldSx }}>
          <InputLabel>موضوع</InputLabel>
          <Select
            label="موضوع"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="">همه</MenuItem>
            <MenuItem value="1">اصلی</MenuItem>
            <MenuItem value="2">اصلاحی</MenuItem>
            <MenuItem value="3">ابطالی</MenuItem>
            <MenuItem value="4">برگشت از فروش</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="شماره فروش / شماره مالیاتی"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setAppliedSearch(search.trim());
              setPage(1);
            }
          }}
          onBlur={() => {
            if (search.trim() !== appliedSearch) {
              setAppliedSearch(search.trim());
              setPage(1);
            }
          }}
          sx={{ minWidth: 220, ...accountingFieldSx }}
        />
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" startIcon={<ReplayIcon />} onClick={retryAll} disabled={busy} sx={{ color: "var(--admin-text)", borderColor: "var(--admin-border)" }}>
          ارسال دوباره همهٔ ناموفق‌ها
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : rows.length === 0 ? (
        <Typography sx={{ color: "var(--admin-text-muted)", py: 4, textAlign: "center" }}>
          صورتحسابی یافت نشد. فروش‌های جدید پس از فعال‌سازی، حداکثر چند دقیقه بعد اینجا دیده می‌شوند.
        </Typography>
      ) : (
        <TableContainer sx={{ borderRadius: "10px", border: "1px solid var(--admin-border)" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <AccountingTableCell>فروش</AccountingTableCell>
                <AccountingTableCell>موضوع</AccountingTableCell>
                <AccountingTableCell>تاریخ صدور</AccountingTableCell>
                <AccountingTableCell>شماره مالیاتی</AccountingTableCell>
                <AccountingTableCell align="left">مالیات (ریال)</AccountingTableCell>
                <AccountingTableCell align="left">مبلغ کل (ریال)</AccountingTableCell>
                <AccountingTableCell>وضعیت</AccountingTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <AccountingTableRow key={row.id} hover sx={{ cursor: "pointer" }} onClick={() => openDetail(row.id)}>
                  <AccountingTableCell>{row.purchase_id ? `#${row.purchase_id}` : "—"}</AccountingTableCell>
                  <AccountingTableCell>{row.subject_label}</AccountingTableCell>
                  <AccountingTableCell>{row.issued_at || "—"}</AccountingTableCell>
                  <AccountingTableCell sx={{ direction: "ltr", fontFamily: "monospace" }}>{row.taxid}</AccountingTableCell>
                  <AccountingTableCell align="left">{row.subject === 3 ? "—" : formatRial(row.tvam + row.todam)}</AccountingTableCell>
                  <AccountingTableCell align="left">{row.subject === 3 ? "—" : formatRial(row.tbill)}</AccountingTableCell>
                  <AccountingTableCell>
                    <StatusChip doc={row} />
                  </AccountingTableCell>
                </AccountingTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {lastPage > 1 ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Pagination count={lastPage} page={page} onChange={(_e, v) => setPage(v)} size="small" sx={accountingPaginationSx} />
        </Box>
      ) : null}

      <Dialog open={detail !== null} onClose={() => setDetail(null)} maxWidth="md" fullWidth dir="rtl">
        {detail ? (
          <>
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              صورتحساب {detail.subject_label}
              {detail.purchase_id ? ` · فروش #${detail.purchase_id}` : ""}
              <StatusChip doc={detail} />
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1, mb: 2, fontSize: 13 }}>
                <div>
                  شماره مالیاتی: <span style={{ direction: "ltr", fontFamily: "monospace" }}>{detail.taxid}</span>
                </div>
                {detail.reference_taxid ? (
                  <div>
                    صورتحساب مرجع: <span style={{ direction: "ltr", fontFamily: "monospace" }}>{detail.reference_taxid}</span>
                  </div>
                ) : null}
                <div>نوع: {detail.invoice_type === 1 ? "نوع اول (با مشخصات خریدار)" : "نوع دوم"}</div>
                <div>تاریخ صدور: {detail.issued_at || "—"}</div>
                {detail.reference_number ? <div>شماره پیگیری سامانه: {detail.reference_number}</div> : null}
                {detail.sent_at ? <div>زمان ارسال: {detail.sent_at}</div> : null}
                {detail.insr ? <div>ارسال با تأخیر (ماده ۹)</div> : null}
              </Box>

              {detail.errors.length > 0 ? (
                <Alert severity="error" sx={{ mb: 1.5 }}>
                  {detail.errors.map((e, i) => (
                    <div key={i}>
                      {e.code ? <b style={{ direction: "ltr" }}>{e.code}: </b> : null}
                      {e.message}
                    </div>
                  ))}
                </Alert>
              ) : null}
              {detail.warnings.length > 0 ? (
                <Alert severity="warning" sx={{ mb: 1.5 }}>
                  {detail.warnings.map((w, i) => (
                    <div key={i}>{w.message}</div>
                  ))}
                </Alert>
              ) : null}

              {detail.items && detail.items.length > 0 ? (
                <TableContainer sx={{ borderRadius: "10px", border: "1px solid var(--admin-border)" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <AccountingTableCell>شرح</AccountingTableCell>
                        <AccountingTableCell>شناسه</AccountingTableCell>
                        <AccountingTableCell align="left">مقدار</AccountingTableCell>
                        <AccountingTableCell align="left">فی</AccountingTableCell>
                        <AccountingTableCell align="left">تخفیف</AccountingTableCell>
                        <AccountingTableCell align="left">نرخ</AccountingTableCell>
                        <AccountingTableCell align="left">مالیات</AccountingTableCell>
                        <AccountingTableCell align="left">جمع</AccountingTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detail.items.map((it) => (
                        <AccountingTableRow key={it.line_key}>
                          <AccountingTableCell>{it.sstt || "—"}</AccountingTableCell>
                          <AccountingTableCell sx={{ direction: "ltr", fontFamily: "monospace" }}>{it.sstid}</AccountingTableCell>
                          <AccountingTableCell align="left">{new Intl.NumberFormat("fa-IR").format(Number(it.am))}</AccountingTableCell>
                          <AccountingTableCell align="left">{formatRial(it.fee)}</AccountingTableCell>
                          <AccountingTableCell align="left">{formatRial(it.dis)}</AccountingTableCell>
                          <AccountingTableCell align="left">{new Intl.NumberFormat("fa-IR").format(Number(it.vra))}٪</AccountingTableCell>
                          <AccountingTableCell align="left">{formatRial(Number(it.vam) + Number(it.odam))}</AccountingTableCell>
                          <AccountingTableCell align="left">{formatRial(it.tsstam)}</AccountingTableCell>
                        </AccountingTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : detail.subject === 3 ? (
                <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)" }}>صورتحساب ابطالی ردیف ندارد.</Typography>
              ) : null}

              {detail.subject !== 3 ? (
                <Box sx={{ mt: 1.5, display: "flex", gap: 3, flexWrap: "wrap", fontSize: 13 }}>
                  <div>مبلغ پس از تخفیف: {formatRial(detail.tadis)} ریال</div>
                  <div>مالیات و عوارض: {formatRial(detail.tvam + detail.todam)} ریال</div>
                  <div>
                    <b>مبلغ کل: {formatRial(detail.tbill)} ریال</b>
                  </div>
                </Box>
              ) : null}
            </DialogContent>
            <DialogActions>
              {detail.can_retry ? (
                <Button variant="contained" startIcon={<ReplayIcon />} onClick={() => retry(detail.id)} disabled={busy} sx={accountingButtonSx}>
                  ارسال دوباره
                </Button>
              ) : null}
              <Button onClick={() => setDetail(null)} sx={{ color: "var(--admin-text)" }}>
                بستن
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>
    </Box>
  );
}
