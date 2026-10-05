"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import PaymentsIcon from "@mui/icons-material/Payments";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { isSuperAdminUser } from "@/app/lib/superAdmin";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import {
  formatFaDate,
  formatToman,
  marketingAdminApi,
  toFaNumber,
  toLatinDigits,
  type AdminMarketerRow,
  type MarketerDashboard,
  type MarketingSettings,
} from "@/app/lib/marketing";
import {
  PayoutsTable,
  ReferralsTable,
  StatCard,
  SummaryCards,
  cellSx,
  headCellSx,
  tableContainerSx,
} from "@/app/newuser/MarketerTables";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
  "& .MuiFormHelperText-root": { color: "var(--admin-text-muted)" },
} as const;

const primaryButtonSx = {
  bgcolor: "var(--admin-accent)",
  "&:hover": { bgcolor: "var(--admin-accent-hover)" },
} as const;

const switchSx = {
  "& .MuiSwitch-switchBase.Mui-checked": { color: "var(--admin-accent)" },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "var(--admin-accent)" },
} as const;

type SortKey =
  | "created_at"
  | "registered_count"
  | "paid_shops_count"
  | "total_sales_toman"
  | "total_commission_toman"
  | "balance_toman";

type EditForm = {
  phone: string;
  name: string;
  custom_commission_percent: string;
  is_active: boolean;
  admin_note: string;
  card_number: string;
  sheba: string;
};

function digitsOnly(value: string, allowDot = false): string {
  const latin = toLatinDigits(value);
  return allowDot ? latin.replace(/[^\d.]/g, "") : latin.replace(/\D/g, "");
}

function CopyText({ value }: { value: string | null | undefined }) {
  if (!value) return <span>—</span>;
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, direction: "ltr" }}>
      <span>{value}</span>
      <IconButton
        size="small"
        onClick={() => {
          void navigator.clipboard?.writeText(value);
          toast.success("کپی شد");
        }}
        sx={{ color: "var(--admin-text-muted)", p: 0.25 }}
      >
        <ContentCopyIcon sx={{ fontSize: 14 }} />
      </IconButton>
    </Box>
  );
}

export default function AdminMarketersPage() {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width:900px)");
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AdminMarketerRow[]>([]);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [settings, setSettings] = useState<MarketingSettings>({ default_commission_percent: 10, attribution_days: 60 });
  const [settingsForm, setSettingsForm] = useState({ percent: "10", days: "60" });
  const [savingSettings, setSavingSettings] = useState(false);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("balance_toman");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [editing, setEditing] = useState<AdminMarketerRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);

  const [settleRow, setSettleRow] = useState<AdminMarketerRow | null>(null);
  const [settleAmount, setSettleAmount] = useState("");
  const [settleNote, setSettleNote] = useState("");
  const [settling, setSettling] = useState(false);

  const [detailRow, setDetailRow] = useState<AdminMarketerRow | null>(null);
  const [detail, setDetail] = useState<MarketerDashboard | null>(null);
  const [detailTab, setDetailTab] = useState<"all" | "paid" | "payouts">("all");

  useEffect(() => {
    if (!isSuperAdminUser()) {
      toast.error("دسترسی فقط برای ادمین سیستم");
      router.replace("/admin");
      return;
    }
    setAllowed(true);
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await marketingAdminApi.list();
    setLoading(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    setRows(res.data.data);
    setTotals(res.data.totals);
    setSettings(res.data.settings);
    setSettingsForm({
      percent: String(res.data.settings.default_commission_percent),
      days: String(res.data.settings.attribution_days),
    });
  }, []);

  useEffect(() => {
    if (allowed) void load();
  }, [allowed, load]);

  const loadDetail = useCallback(async (row: AdminMarketerRow) => {
    setDetail(null);
    const res = await marketingAdminApi.show(row.id);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    setDetail(res.data);
  }, []);

  const visibleRows = useMemo(() => {
    const q = toLatinDigits(search.trim()).toLowerCase();
    const filtered = q
      ? rows.filter((r) =>
          [r.name, r.phone, r.code].some((v) => (v || "").toLowerCase().includes(q)),
        )
      : rows;
    const factor = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === "created_at") {
        return factor * (a.created_at || "").localeCompare(b.created_at || "");
      }
      return factor * ((a[sortKey] || 0) - (b[sortKey] || 0));
    });
  }, [rows, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const saveSettings = async () => {
    const percent = Number(digitsOnly(settingsForm.percent, true));
    const days = Number(digitsOnly(settingsForm.days));
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      toast.error("درصد باید بین ۰ تا ۱۰۰ باشد");
      return;
    }
    if (!Number.isFinite(days) || days < 1) {
      toast.error("تعداد روز معتبر نیست");
      return;
    }
    setSavingSettings(true);
    const res = await marketingAdminApi.saveSettings({ default_commission_percent: percent, attribution_days: days });
    setSavingSettings(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    toast.success("تنظیمات ذخیره شد");
    void load();
  };

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    setForm({ phone: "", name: "", custom_commission_percent: "", is_active: true, admin_note: "", card_number: "", sheba: "" });
  };

  const openEdit = (row: AdminMarketerRow) => {
    setCreating(false);
    setEditing(row);
    setForm({
      phone: row.phone,
      name: row.name || "",
      custom_commission_percent:
        row.custom_commission_percent !== null && row.custom_commission_percent !== undefined
          ? String(row.custom_commission_percent)
          : "",
      is_active: row.is_active,
      admin_note: row.admin_note || "",
      card_number: row.card_number || "",
      sheba: row.sheba || "",
    });
  };

  const closeEdit = () => {
    if (saving) return;
    setEditing(null);
    setCreating(false);
    setForm(null);
  };

  const saveMarketer = async () => {
    if (!form) return;
    const percentRaw = digitsOnly(form.custom_commission_percent, true);
    const percent = percentRaw === "" ? null : Number(percentRaw);
    if (percent !== null && (!Number.isFinite(percent) || percent < 0 || percent > 100)) {
      toast.error("درصد باید بین ۰ تا ۱۰۰ باشد");
      return;
    }
    const body: Record<string, unknown> = {
      name: form.name,
      custom_commission_percent: percent,
      is_active: form.is_active,
      admin_note: form.admin_note,
      card_number: digitsOnly(form.card_number),
      sheba: form.sheba,
    };
    setSaving(true);
    const res = editing
      ? await marketingAdminApi.update(editing.id, body)
      : await marketingAdminApi.create({ ...body, phone: digitsOnly(form.phone) });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    toast.success(editing ? "بازاریاب به‌روز شد" : "بازاریاب اضافه شد");
    setEditing(null);
    setCreating(false);
    setForm(null);
    void load();
  };

  const openSettle = (row: AdminMarketerRow) => {
    setSettleRow(row);
    setSettleAmount(row.balance_toman > 0 ? String(row.balance_toman) : "");
    setSettleNote("");
  };

  const submitSettle = async () => {
    if (!settleRow) return;
    const amount = Number(digitsOnly(settleAmount));
    if (!Number.isFinite(amount) || amount < 1) {
      toast.error("مبلغ تسویه را وارد کنید");
      return;
    }
    if (amount > settleRow.balance_toman) {
      toast.error("مبلغ از مانده بیشتر است");
      return;
    }
    setSettling(true);
    const res = await marketingAdminApi.payout(settleRow.id, { amount_toman: amount, note: settleNote.trim() || undefined });
    setSettling(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    toast.success("تسویه ثبت شد");
    const settled = settleRow;
    setSettleRow(null);
    void load();
    if (detailRow?.id === settled.id) void loadDetail(settled);
  };

  const openDetail = (row: AdminMarketerRow) => {
    setDetailRow(row);
    setDetailTab("all");
    void loadDetail(row);
  };

  const deletePayout = async (payoutId: number) => {
    if (!detailRow) return;
    if (!window.confirm("این تسویه حذف شود؟ مبلغ آن به مانده بازاریاب برمی‌گردد.")) return;
    const res = await marketingAdminApi.deletePayout(detailRow.id, payoutId);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    toast.success("تسویه حذف شد");
    void loadDetail(detailRow);
    void load();
  };

  if (!allowed) return null;

  const sortableHead = (key: SortKey, label: string) => (
    <TableCell sx={headCellSx} sortDirection={sortKey === key ? sortDir : false}>
      <TableSortLabel
        active={sortKey === key}
        direction={sortKey === key ? sortDir : "desc"}
        onClick={() => toggleSort(key)}
        sx={{ "&.Mui-active": { color: "var(--admin-accent)" }, "& .MuiTableSortLabel-icon": { color: "inherit !important" } }}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <Box sx={{ ...adminPageSx, p: 2, pb: 12, display: "flex", flexDirection: "column", gap: 2 }}>
      <Card sx={{ backgroundColor: "var(--admin-surface)", border: "1px solid var(--admin-border)", borderRadius: "12px" }}>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 700 }}>تنظیمات بازاریابی</Typography>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", lineHeight: 1.9 }}>
            پنل بازاریاب‌ها: <b dir="ltr">webinoo-plus.ir/newuser</b> — هر کس با شماره موبایل وارد شود، بازاریاب می‌شود و
            لینک اختصاصی می‌گیرد. درصد پیش‌فرض برای همه اعمال می‌شود، مگر برای بازاریابی که درصد اختصاصی داشته باشد. تغییر
            درصد فقط روی خریدهای بعدی اثر دارد.
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "flex-start" }}>
            <TextField
              label="درصد پیش‌فرض پورسانت"
              value={settingsForm.percent}
              onChange={(e) => setSettingsForm((p) => ({ ...p, percent: digitsOnly(e.target.value, true) }))}
              inputProps={{ inputMode: "decimal", dir: "ltr" }}
              sx={{ ...fieldSx, width: 200 }}
              size="small"
            />
            <TextField
              label="مهلت انتساب (روز)"
              value={settingsForm.days}
              onChange={(e) => setSettingsForm((p) => ({ ...p, days: digitsOnly(e.target.value) }))}
              inputProps={{ inputMode: "numeric", dir: "ltr" }}
              helperText="چند روز بعد از کلیک روی لینک، ثبت‌نام به نام بازاریاب ثبت شود"
              sx={{ ...fieldSx, width: 260 }}
              size="small"
            />
            <Button variant="contained" onClick={() => void saveSettings()} disabled={savingSettings} sx={primaryButtonSx}>
              {savingSettings ? "…" : "ذخیره تنظیمات"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={1.25}>
        <Grid item xs={6} md={2}>
          <StatCard label="بازاریاب‌ها" value={toFaNumber(totals.marketers_count)} />
        </Grid>
        <Grid item xs={6} md={2}>
          <StatCard label="ثبت‌نام‌ها" value={toFaNumber(totals.registered_count)} />
        </Grid>
        <Grid item xs={6} md={2}>
          <StatCard label="خرید اکانت پولی" value={toFaNumber(totals.paid_shops_count)} />
        </Grid>
        <Grid item xs={6} md={2}>
          <StatCard label="جمع فروش" value={formatToman(totals.total_sales_toman)} />
        </Grid>
        <Grid item xs={6} md={2}>
          <StatCard label="تسویه‌شده" value={formatToman(totals.total_paid_toman)} />
        </Grid>
        <Grid item xs={6} md={2}>
          <StatCard label="بدهی به بازاریاب‌ها" value={formatToman(totals.balance_toman)} accent />
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", gap: 1, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <TextField
          placeholder="جستجو: نام، موبایل یا کد"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ ...fieldSx, minWidth: 260 }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{ ...adminButtonStartIconSx, ...primaryButtonSx }}
        >
          بازاریاب جدید
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={tableContainerSx}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx}>بازاریاب</TableCell>
                <TableCell sx={headCellSx}>کد</TableCell>
                <TableCell sx={headCellSx}>درصد</TableCell>
                <TableCell sx={headCellSx}>بازدید</TableCell>
                {sortableHead("registered_count", "ثبت‌نام")}
                {sortableHead("paid_shops_count", "خرید پولی")}
                {sortableHead("total_sales_toman", "جمع فروش")}
                {sortableHead("total_commission_toman", "پورسانت")}
                <TableCell sx={headCellSx}>تسویه‌شده</TableCell>
                {sortableHead("balance_toman", "مانده")}
                <TableCell sx={headCellSx}>وضعیت</TableCell>
                <TableCell sx={headCellSx}>عملیات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} sx={{ ...cellSx, textAlign: "center", py: 4, color: "var(--admin-text-secondary)" }}>
                    {rows.length === 0 ? "هنوز بازاریابی ثبت نشده است." : "نتیجه‌ای پیدا نشد."}
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((row) => (
                  <TableRow key={row.id} hover sx={{ opacity: row.is_active ? 1 : 0.55 }}>
                    <TableCell sx={cellSx}>
                      <Typography sx={{ fontWeight: 700, fontSize: "14px" }}>{row.name || "بدون نام"}</Typography>
                      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px", direction: "ltr", textAlign: "right" }}>
                        {row.phone}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ ...cellSx, direction: "ltr" }}>{row.code}</TableCell>
                    <TableCell sx={cellSx}>
                      {toFaNumber(row.commission_percent)}٪
                      {row.custom_commission_percent !== null && row.custom_commission_percent !== undefined ? (
                        <Chip size="small" label="اختصاصی" sx={{ mr: 0.5, height: 18, fontSize: "10px" }} />
                      ) : null}
                    </TableCell>
                    <TableCell sx={cellSx}>{toFaNumber(row.visitors_count)}</TableCell>
                    <TableCell sx={cellSx}>{toFaNumber(row.registered_count)}</TableCell>
                    <TableCell sx={cellSx}>{toFaNumber(row.paid_shops_count)}</TableCell>
                    <TableCell sx={cellSx}>{formatToman(row.total_sales_toman)}</TableCell>
                    <TableCell sx={cellSx}>{formatToman(row.total_commission_toman)}</TableCell>
                    <TableCell sx={cellSx}>{formatToman(row.total_paid_toman)}</TableCell>
                    <TableCell sx={{ ...cellSx, fontWeight: 800, color: row.balance_toman > 0 ? "var(--admin-accent)" : "var(--admin-text)" }}>
                      {formatToman(row.balance_toman)}
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Chip
                        size="small"
                        label={row.is_active ? "فعال" : "غیرفعال"}
                        color={row.is_active ? "success" : "default"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Tooltip title="جزئیات و زیرمجموعه‌ها">
                        <IconButton size="small" onClick={() => openDetail(row)} sx={{ color: "var(--admin-text-secondary)" }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="تسویه">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => openSettle(row)}
                            disabled={row.balance_toman <= 0}
                            sx={{ color: "var(--admin-accent)" }}
                          >
                            <PaymentsIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="ویرایش / درصد اختصاصی">
                        <IconButton size="small" onClick={() => openEdit(row)} sx={{ color: "var(--admin-text-secondary)" }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={Boolean(form)} onClose={closeEdit} fullWidth maxWidth="xs">
        <DialogTitle sx={{ color: "var(--admin-text)" }}>{editing ? "ویرایش بازاریاب" : "بازاریاب جدید"}</DialogTitle>
        {form ? (
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: "8px !important" }}>
            <TextField
              label="شماره موبایل"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              disabled={!creating}
              inputProps={{ inputMode: "tel", dir: "ltr" }}
              sx={fieldSx}
            />
            <TextField label="نام" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} sx={fieldSx} />
            <TextField
              label="درصد اختصاصی پورسانت"
              value={form.custom_commission_percent}
              onChange={(e) => setForm({ ...form, custom_commission_percent: digitsOnly(e.target.value, true) })}
              helperText={`خالی = درصد پیش‌فرض (${toFaNumber(settings.default_commission_percent)}٪)`}
              inputProps={{ inputMode: "decimal", dir: "ltr" }}
              sx={fieldSx}
            />
            <TextField
              label="شماره کارت"
              value={form.card_number}
              onChange={(e) => setForm({ ...form, card_number: e.target.value })}
              inputProps={{ inputMode: "numeric", dir: "ltr" }}
              sx={fieldSx}
            />
            <TextField
              label="شماره شبا"
              value={form.sheba}
              onChange={(e) => setForm({ ...form, sheba: e.target.value })}
              inputProps={{ dir: "ltr" }}
              sx={fieldSx}
            />
            <TextField
              label="یادداشت ادمین"
              value={form.admin_note}
              onChange={(e) => setForm({ ...form, admin_note: e.target.value })}
              multiline
              minRows={2}
              sx={fieldSx}
            />
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ color: "var(--admin-text)", fontSize: "14px" }}>فعال</Typography>
              <Switch checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} sx={switchSx} />
            </Box>
          </DialogContent>
        ) : null}
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeEdit} disabled={saving}>
            انصراف
          </Button>
          <Button variant="contained" onClick={() => void saveMarketer()} disabled={saving} sx={primaryButtonSx}>
            {saving ? "…" : "ذخیره"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(settleRow)} onClose={() => !settling && setSettleRow(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ color: "var(--admin-text)" }}>تسویه با {settleRow?.name || settleRow?.phone}</DialogTitle>
        {settleRow ? (
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: "8px !important" }}>
            <Alert severity="info">مانده قابل تسویه: {formatToman(settleRow.balance_toman)}</Alert>
            <Box sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Box>
                شماره کارت: <CopyText value={settleRow.card_number} />
              </Box>
              <Box>
                شبا: <CopyText value={settleRow.sheba} />
              </Box>
            </Box>
            <TextField
              label="مبلغ واریزی (تومان)"
              value={settleAmount}
              onChange={(e) => setSettleAmount(digitsOnly(e.target.value))}
              helperText={settleAmount ? formatToman(Number(settleAmount)) : undefined}
              inputProps={{ inputMode: "numeric", dir: "ltr" }}
              sx={fieldSx}
            />
            <TextField
              label="توضیح (شماره پیگیری و...)"
              value={settleNote}
              onChange={(e) => setSettleNote(e.target.value)}
              sx={fieldSx}
            />
          </DialogContent>
        ) : null}
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSettleRow(null)} disabled={settling}>
            انصراف
          </Button>
          <Button variant="contained" onClick={() => void submitSettle()} disabled={settling} sx={primaryButtonSx}>
            {settling ? "…" : "ثبت تسویه"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(detailRow)}
        onClose={() => setDetailRow(null)}
        fullWidth
        maxWidth="lg"
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ color: "var(--admin-text)" }}>
          {detailRow?.name || "بازاریاب"}{" "}
          <Typography component="span" sx={{ color: "var(--admin-text-muted)", fontSize: "13px", direction: "ltr" }}>
            {detailRow?.phone} · {detailRow?.code}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {!detail ? (
            <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
              <CircularProgress sx={{ color: "var(--admin-accent)" }} />
            </Box>
          ) : (
            <>
              <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "12px" }}>
                عضویت: {formatFaDate(detail.marketer.created_at)} · آخرین ورود: {formatFaDate(detail.marketer.last_login_at, true)} ·
                لینک: <CopyText value={detail.marketer.referral_link} />
              </Typography>
              <SummaryCards summary={detail.summary} percent={detail.marketer.commission_percent} />
              <Tabs
                value={detailTab}
                onChange={(_, v) => setDetailTab(v)}
                sx={{
                  minHeight: 40,
                  "& .MuiTab-root": { color: "var(--admin-text-muted)", minHeight: 40 },
                  "& .Mui-selected": { color: "var(--admin-accent) !important" },
                  "& .MuiTabs-indicator": { backgroundColor: "var(--admin-accent)" },
                }}
              >
                <Tab value="all" label={`زیرمجموعه‌ها (${toFaNumber(detail.referrals.length)})`} />
                <Tab value="paid" label={`خریداران (${toFaNumber(detail.referrals.filter((r) => r.is_paid).length)})`} />
                <Tab value="payouts" label={`تسویه‌ها (${toFaNumber(detail.payouts.length)})`} />
              </Tabs>
              {detailTab === "all" ? (
                <ReferralsTable rows={detail.referrals} emptyText="زیرمجموعه‌ای ندارد." showShopCode />
              ) : null}
              {detailTab === "paid" ? (
                <ReferralsTable rows={detail.referrals.filter((r) => r.is_paid)} emptyText="خریداری ندارد." showShopCode />
              ) : null}
              {detailTab === "payouts" ? (
                <PayoutsTable rows={detail.payouts} onDelete={(p) => void deletePayout(p.id)} />
              ) : null}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {detailRow && (detail?.summary.balance_toman ?? 0) > 0 ? (
            <Button
              variant="contained"
              startIcon={<PaymentsIcon />}
              onClick={() => {
                const fresh = rows.find((r) => r.id === detailRow.id);
                if (fresh) openSettle(fresh);
              }}
              sx={{ ...adminButtonStartIconSx, ...primaryButtonSx }}
            >
              تسویه
            </Button>
          ) : null}
          <Button onClick={() => setDetailRow(null)}>بستن</Button>
        </DialogActions>
      </Dialog>

      <ToastContainer position="bottom-right" rtl autoClose={3000} style={{ marginBottom: "76px" }} />
    </Box>
  );
}
