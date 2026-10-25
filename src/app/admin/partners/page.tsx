"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Typography,
  FormControlLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import PaymentsIcon from "@mui/icons-material/Payments";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "react-multi-date-picker/styles/layouts/mobile.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import tokenCode from "@/app/coponent/tokenCode";
import ShopAccountSelect from "@/app/admin/ShopAccountSelect";
import { gregorianApiDateFromDateObject } from "@/app/lib/shopAccess";

type Partner = {
  id: number;
  name: string;
  phone?: string | null;
  capital_amount: number;
  share_percent: number;
  is_active: boolean;
  notes?: string | null;
};

type ProfitShare = {
  id: number;
  name: string;
  capital_amount: number;
  share_percent: number;
  share_amount: number;
  gross_share_amount?: number;
  paid_amount?: number;
  can_pay?: boolean;
};

type ProfitPreview = {
  period_from?: string | null;
  period_to?: string | null;
  period_from_jalali?: string | null;
  period_to_jalali?: string | null;
  period_locked?: boolean;
  last_settlement_at_jalali?: string | null;
  net_profit: number;
  remaining_to_distribute?: number;
  total_capital: number;
  can_settle: boolean;
  partners: ProfitShare[];
};

type SettlementLine = {
  id: number;
  partner_name: string;
  capital_amount: number;
  share_percent: number;
  amount: number;
};

type Settlement = {
  id: number;
  settled_at_jalali?: string | null;
  period_from_jalali?: string | null;
  period_to_jalali?: string | null;
  net_profit: number;
  total_distributed: number;
  shop_account?: { id: number; name: string } | null;
  user_name?: string | null;
  notes?: string | null;
  lines: SettlementLine[];
};

type ActivityLog = {
  id: number;
  action: string;
  action_label: string;
  partner_id?: number | null;
  settlement_id?: number | null;
  user_name?: string | null;
  message?: string | null;
  payload?: Record<string, unknown> | null;
  created_at?: string | null;
};

type PayTarget =
  | { mode: "all" }
  | { mode: "partner"; partner: ProfitShare };

const formatNumber = (num: number) =>
  new Intl.NumberFormat("fa-IR").format(Math.round(num || 0));

const formatPercent = (num: number) =>
  new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(num || 0);

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

function parseAmount(value: string): number {
  const normalized = value
    .replace(/[۰-۹]/g, (c) => String(PERSIAN_DIGITS.indexOf(c)))
    .replace(/[,٬\s]/g, "")
    .replace(/\D/g, "");
  if (!normalized) return 0;
  const n = parseInt(normalized, 10);
  return Number.isNaN(n) ? 0 : n;
}

function formatAmountInput(value: string): string {
  const raw = value
    .replace(/[۰-۹]/g, (c) => String(PERSIAN_DIGITS.indexOf(c)))
    .replace(/[,٬\s]/g, "")
    .replace(/\D/g, "");
  if (!raw) return "";
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) return "";
  return new Intl.NumberFormat("fa-IR").format(parsed);
}

function todayJalaliDateObject(): DateObject {
  return new DateObject({ calendar: persian, locale: persian_fa });
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [totalCapital, setTotalCapital] = useState(0);
  const [preview, setPreview] = useState<ProfitPreview | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settling, setSettling] = useState(false);
  const [periodTo, setPeriodTo] = useState<DateObject | null>(() => todayJalaliDateObject());

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [capitalInput, setCapitalInput] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [settleOpen, setSettleOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<PayTarget | null>(null);
  const [shopAccountId, setShopAccountId] = useState<number | "">("");
  const [settleNotes, setSettleNotes] = useState("");
  const [logDetail, setLogDetail] = useState<ActivityLog | null>(null);

  const periodToApi = useMemo(
    () => (periodTo ? gregorianApiDateFromDateObject(periodTo) : ""),
    [periodTo],
  );

  const loadPartnersAndSettlements = useCallback(async () => {
    const token = tokenCode();
    const [partnersRes, settlementsRes, activityRes] = await Promise.all([
      apiRequestError("Get", {}, {}, "/api/shop-partners", true, true, token),
      apiRequestError("Get", {}, {}, "/api/shop-partners/settlements", true, true, token),
      apiRequestError("Get", {}, {}, "/api/shop-partners/activity-log?limit=100", true, true, token),
    ]);

    if (partnersRes?.hasError) {
      toast.error(getApiErrorMessage(partnersRes, "خطا در دریافت شرکا"));
    } else {
      const list = Array.isArray(partnersRes?.data) ? partnersRes.data : [];
      setPartners(list as Partner[]);
      setTotalCapital(Number(partnersRes?.total_capital) || 0);
    }

    if (!settlementsRes?.hasError) {
      const list = Array.isArray(settlementsRes?.data) ? settlementsRes.data : [];
      setSettlements(list as Settlement[]);
    }

    if (!activityRes?.hasError) {
      const list = Array.isArray(activityRes?.data) ? activityRes.data : [];
      setActivityLogs(list as ActivityLog[]);
    }
  }, []);

  const loadPreview = useCallback(async (toYmd: string) => {
    const token = tokenCode();
    const qs = toYmd ? `?to=${encodeURIComponent(toYmd)}` : "";
    const previewRes = await apiRequestError(
      "Get",
      {},
      {},
      `/api/shop-partners/profit-preview${qs}`,
      true,
      true,
      token,
    );
    if (previewRes?.hasError) {
      toast.error(getApiErrorMessage(previewRes, "خطا در محاسبه سود"));
      return;
    }
    setPreview(previewRes as ProfitPreview);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadPartnersAndSettlements(), loadPreview(periodToApi)]);
    } finally {
      setLoading(false);
    }
  }, [loadPartnersAndSettlements, loadPreview, periodToApi]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setPhone("");
    setCapitalInput("");
    setNotes("");
    setIsActive(true);
    setFormOpen(true);
  };

  const openEdit = (partner: Partner) => {
    setEditing(partner);
    setName(partner.name);
    setPhone(partner.phone || "");
    setCapitalInput(formatAmountInput(String(Math.round(partner.capital_amount || 0))));
    setNotes(partner.notes || "");
    setIsActive(partner.is_active);
    setFormOpen(true);
  };

  const savePartner = async () => {
    if (!name.trim()) {
      toast.error("نام شریک را وارد کنید");
      return;
    }
    setSaving(true);
    const token = tokenCode();
    const body = {
      name: name.trim(),
      phone: phone.trim() || null,
      capital_amount: parseAmount(capitalInput),
      is_active: isActive,
      notes: notes.trim() || null,
    };
    try {
      const res = editing
        ? await apiRequestError("Put", {}, body, `/api/shop-partners/${editing.id}`, true, true, token)
        : await apiRequestError("Post", {}, body, "/api/shop-partners", true, true, token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "ذخیره شریک ناموفق بود"));
        return;
      }
      toast.success(editing ? "شریک به‌روز شد" : "شریک ثبت شد");
      setFormOpen(false);
      await loadAll();
    } finally {
      setSaving(false);
    }
  };

  const deletePartner = async (partner: Partner) => {
    if (!window.confirm(`شریک «${partner.name}» حذف شود؟`)) return;
    const token = tokenCode();
    const res = await apiRequestError(
      "Delete",
      {},
      {},
      `/api/shop-partners/${partner.id}`,
      true,
      true,
      token,
    );
    if (res?.hasError) {
      toast.error(getApiErrorMessage(res, "حذف ناموفق بود"));
      return;
    }
    toast.success("شریک حذف شد");
    await loadAll();
  };

  const openPayDialog = (target: PayTarget) => {
    setPayTarget(target);
    setShopAccountId("");
    setSettleNotes("");
    setSettleOpen(true);
  };

  const payAmount = useMemo(() => {
    if (!payTarget) return 0;
    if (payTarget.mode === "all") {
      return Number(preview?.remaining_to_distribute ?? preview?.net_profit ?? 0);
    }
    return Number(payTarget.partner.share_amount || 0);
  }, [payTarget, preview]);

  const confirmSettle = async () => {
    if (!payTarget) return;
    if (shopAccountId === "") {
      toast.error("حساب برداشت را انتخاب کنید");
      return;
    }
    setSettling(true);
    const token = tokenCode();
    const body = {
      shop_account_id: Number(shopAccountId),
      to: periodToApi || null,
      notes: settleNotes.trim() || null,
    };
    try {
      const url =
        payTarget.mode === "partner"
          ? `/api/shop-partners/${payTarget.partner.id}/settle-profit`
          : "/api/shop-partners/settle";
      const res = await apiRequestError("Post", {}, body, url, true, true, token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "ثبت پرداخت سود ناموفق بود"));
        return;
      }
      toast.success(
        payTarget.mode === "partner"
          ? `پرداخت سود «${payTarget.partner.name}» ثبت شد`
          : "تقسیم سود ثبت شد و از حساب برداشت شد",
      );
      setSettleOpen(false);
      setPayTarget(null);
      setShopAccountId("");
      setSettleNotes("");
      await loadAll();
    } finally {
      setSettling(false);
    }
  };

  const deleteSettlement = async (row: Settlement) => {
    if (!window.confirm("این تقسیم سود حذف و سند حسابداری برگشت بخورد؟")) return;
    const token = tokenCode();
    const res = await apiRequestError(
      "Delete",
      {},
      {},
      `/api/shop-partners/settlements/${row.id}`,
      true,
      true,
      token,
    );
    if (res?.hasError) {
      toast.error(getApiErrorMessage(res, "حذف تسویه ناموفق بود"));
      return;
    }
    toast.success("تسویه حذف شد");
    await loadAll();
  };

  const periodLabel = useMemo(() => {
    if (!preview) return "—";
    const from = preview.period_from_jalali || "ابتدا";
    const to = preview.period_to_jalali || "امروز";
    return `${from} تا ${to}`;
  }, [preview]);

  return (
    <Box sx={{ minHeight: "100vh", background: "var(--admin-bg-gradient)", direction: "rtl" }}>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 }, pb: { xs: 12, md: 4 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: { xs: 18, md: 22 }, color: "var(--admin-text)" }}>
            شرکا و تقسیم سود
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton onClick={() => void loadAll()} sx={{ color: "var(--admin-text)" }}>
              <RefreshIcon />
            </IconButton>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              شریک جدید
            </Button>
          </Box>
        </Box>

        {loading && !preview ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Card sx={{ mb: 2, bgcolor: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1.5,
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    mb: 1.5,
                  }}
                >
                  <Box>
                    <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13, mb: 0.5 }}>
                      سود خالص قابل تقسیم ({periodLabel})
                    </Typography>
                    <Typography sx={{ color: "var(--admin-accent)", fontWeight: 800, fontSize: 28 }}>
                      {formatNumber(preview?.net_profit || 0)} تومان
                    </Typography>
                    {preview?.remaining_to_distribute != null &&
                    Math.round(preview.remaining_to_distribute) !== Math.round(preview.net_profit || 0) ? (
                      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 13, mt: 0.5 }}>
                        باقی‌مانده برای پرداخت: {formatNumber(preview.remaining_to_distribute)} تومان
                      </Typography>
                    ) : null}
                  </Box>
                  <Box sx={{ minWidth: 180 }}>
                    <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 0.5 }}>
                      بستن دوره تا تاریخ
                    </Typography>
                    <DatePicker
                      value={periodTo}
                      onChange={(v) => {
                        if (preview?.period_locked) {
                          toast.info("تا وقتی پرداخت همه شرکای این دوره تمام نشود، تاریخ قفل است");
                          return;
                        }
                        setPeriodTo(v as DateObject | null);
                      }}
                      calendar={persian}
                      locale={persian_fa}
                      calendarPosition="bottom-right"
                      containerStyle={{ width: "100%" }}
                      inputClass="rmdp-input"
                      style={{
                        width: "100%",
                        height: 40,
                        borderRadius: 8,
                        border: "1px solid var(--admin-border)",
                        background: "var(--admin-surface-alt)",
                        color: "var(--admin-text)",
                        padding: "0 12px",
                        direction: "rtl",
                      }}
                      editable={!preview?.period_locked}
                    />
                    {preview?.period_locked ? (
                      <Typography sx={{ color: "var(--admin-warning-strong, #ef6c00)", fontSize: 11, mt: 0.5 }}>
                        دوره باز است؛ اول سهم همه شرکا را بپردازید
                      </Typography>
                    ) : (
                      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11, mt: 0.5 }}>
                        سود از فردای آخرین تسویه تا این روز حساب می‌شود
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>
                  همان سود خالص گزارش سود و ضرر فروشگاه در این بازه
                </Typography>
                <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 13, mt: 1 }}>
                  جمع سرمایه: {formatNumber(preview?.total_capital || totalCapital)} تومان
                  {preview?.last_settlement_at_jalali
                    ? ` · آخرین تسویه: ${preview.last_settlement_at_jalali}`
                    : " · هنوز تسویه‌ای ثبت نشده"}
                </Typography>

                {preview?.partners?.length ? (
                  <Box sx={{ mt: 2, display: "grid", gap: 1 }}>
                    {preview.partners.map((row) => {
                      const canPay = Boolean(row.can_pay ?? row.share_amount >= 0.01);
                      const paid = Number(row.paid_amount || 0);
                      return (
                        <Box
                          key={row.id}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 1,
                            py: 0.75,
                            borderBottom: "1px solid var(--admin-border)",
                            flexWrap: "wrap",
                          }}
                        >
                          <Box sx={{ minWidth: 140 }}>
                            <Typography sx={{ color: "var(--admin-text)" }}>
                              {row.name} ({formatPercent(row.share_percent)}٪)
                            </Typography>
                            {paid > 0 ? (
                              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 11 }}>
                                پرداخت‌شده: {formatNumber(paid)} · باقی: {formatNumber(row.share_amount)}
                              </Typography>
                            ) : null}
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography sx={{ color: "var(--admin-text)", fontWeight: 600 }}>
                              {formatNumber(row.share_amount)} تومان
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<PaymentsIcon />}
                              disabled={!canPay}
                              onClick={() => openPayDialog({ mode: "partner", partner: row })}
                              sx={{ textTransform: "none", whiteSpace: "nowrap" }}
                            >
                              پرداخت سود
                            </Button>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                ) : null}

                <Button
                  sx={{ mt: 2 }}
                  variant="contained"
                  startIcon={<PaymentsIcon />}
                  disabled={!preview?.can_settle}
                  onClick={() => openPayDialog({ mode: "all" })}
                >
                  پرداخت باقی‌مانده همه شرکا
                </Button>
              </CardContent>
            </Card>

            <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, mb: 1 }}>لیست شرکا</Typography>
            <TableContainer component={Paper} sx={{ mb: 3, bgcolor: "var(--admin-surface)" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "var(--admin-surface-alt)" }}>
                    <TableCell align="right">نام</TableCell>
                    <TableCell align="right">سرمایه</TableCell>
                    <TableCell align="right">درصد</TableCell>
                    <TableCell align="right">وضعیت</TableCell>
                    <TableCell align="right">عملیات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {partners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell align="right">{partner.name}</TableCell>
                      <TableCell align="right">{formatNumber(partner.capital_amount)}</TableCell>
                      <TableCell align="right">{formatPercent(partner.share_percent)}٪</TableCell>
                      <TableCell align="right">
                        <Chip
                          size="small"
                          label={partner.is_active ? "فعال" : "غیرفعال"}
                          color={partner.is_active ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => openEdit(partner)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => void deletePartner(partner)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {partners.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        شریکی ثبت نشده است
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, mb: 1 }}>
              تاریخچه تقسیم سود
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 3, bgcolor: "var(--admin-surface)" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "var(--admin-surface-alt)" }}>
                    <TableCell align="right">تاریخ</TableCell>
                    <TableCell align="right">بازه</TableCell>
                    <TableCell align="right">سود</TableCell>
                    <TableCell align="right">حساب</TableCell>
                    <TableCell align="right">عملیات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {settlements.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell align="right">{row.settled_at_jalali || "—"}</TableCell>
                      <TableCell align="right">
                        {(row.period_from_jalali || "ابتدا") + " تا " + (row.period_to_jalali || "—")}
                        {row.lines?.length ? (
                          <Typography sx={{ fontSize: 11, color: "var(--admin-text-muted)", mt: 0.5 }}>
                            {row.lines
                              .map((l) => `${l.partner_name}: ${formatNumber(l.amount)}`)
                              .join(" · ")}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell align="right">{formatNumber(row.total_distributed)}</TableCell>
                      <TableCell align="right">{row.shop_account?.name || "—"}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="error" onClick={() => void deleteSettlement(row)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {settlements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        هنوز تقسیم سودی ثبت نشده
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, mb: 1 }}>
              تاریخچه تغییرات سهم و پرداخت‌ها
            </Typography>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 1 }}>
              ثبت، ویرایش سرمایه، فعال/غیرفعال، پرداخت و حذف تسویه — برای جزئیات روی ردیف کلیک کنید
            </Typography>
            <TableContainer component={Paper} sx={{ bgcolor: "var(--admin-surface)" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "var(--admin-surface-alt)" }}>
                    <TableCell align="right">زمان</TableCell>
                    <TableCell align="right">نوع</TableCell>
                    <TableCell align="right">شرح</TableCell>
                    <TableCell align="right">کاربر</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activityLogs.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => setLogDetail(row)}
                    >
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        {row.created_at || "—"}
                      </TableCell>
                      <TableCell align="right">
                        <Chip size="small" label={row.action_label || row.action} />
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontSize: 13, color: "var(--admin-text)" }}>
                          {row.message || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{row.user_name || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {activityLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        هنوز لاگی ثبت نشده
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Container>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editing ? "ویرایش شریک" : "ثبت شریک"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.5, pt: "12px !important" }}>
          <TextField label="نام" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <TextField label="موبایل (اختیاری)" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
          <TextField
            label="مبلغ سرمایه"
            value={capitalInput}
            onChange={(e) => setCapitalInput(formatAmountInput(e.target.value))}
            fullWidth
          />
          <TextField
            label="یادداشت"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
          <FormControlLabel
            control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
            label="فعال"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>انصراف</Button>
          <Button variant="contained" disabled={saving} onClick={() => void savePartner()}>
            {saving ? "..." : "ذخیره"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={settleOpen}
        onClose={() => {
          setSettleOpen(false);
          setPayTarget(null);
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {payTarget?.mode === "partner"
            ? `پرداخت سود — ${payTarget.partner.name}`
            : "پرداخت باقی‌مانده همه شرکا"}
        </DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.5, pt: "12px !important" }}>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 13 }}>
            مبلغ {formatNumber(payAmount)} تومان از حساب انتخابی برای بازه {periodLabel} برداشت می‌شود.
          </Typography>
          <ShopAccountSelect
            value={shopAccountId}
            onChange={setShopAccountId}
            label="حساب برداشت"
            required
            excludeTill
            helperText="حساب بانکی یا تنخواه"
          />
          <TextField
            label="یادداشت"
            value={settleNotes}
            onChange={(e) => setSettleNotes(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSettleOpen(false);
              setPayTarget(null);
            }}
          >
            انصراف
          </Button>
          <Button variant="contained" disabled={settling} onClick={() => void confirmSettle()}>
            {settling ? "..." : "ثبت پرداخت"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(logDetail)} onClose={() => setLogDetail(null)} fullWidth maxWidth="sm">
        <DialogTitle>{logDetail?.action_label || "جزئیات لاگ"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.5, pt: "12px !important" }}>
          <Typography sx={{ fontSize: 13, color: "var(--admin-text-secondary)" }}>
            {logDetail?.created_at || "—"}
            {logDetail?.user_name ? ` · ${logDetail.user_name}` : ""}
          </Typography>
          <Typography sx={{ color: "var(--admin-text)" }}>{logDetail?.message || "—"}</Typography>
          {(() => {
            const payload = (logDetail?.payload || {}) as {
              shares_after?: {
                partners?: Array<{
                  name: string;
                  capital_amount: number;
                  share_percent: number;
                  is_active: boolean;
                }>;
              };
              lines?: Array<{ partner_name: string; amount: number; share_percent: number }>;
              settlement?: { lines?: Array<{ partner_name: string; amount: number }> };
            };
            const shareRows = payload.shares_after?.partners || [];
            const payLines = payload.lines || [];
            const deletedLines = payload.settlement?.lines || [];
            return (
              <>
                {shareRows.length > 0 ? (
                  <Box>
                    <Typography sx={{ fontWeight: 600, mb: 0.5, fontSize: 13 }}>
                      وضعیت سهم‌ها بعد از تغییر
                    </Typography>
                    {shareRows.map((p, idx) => (
                      <Typography key={idx} sx={{ fontSize: 12, color: "var(--admin-text-secondary)" }}>
                        {p.name}: {formatNumber(p.capital_amount)} تومان · {formatPercent(p.share_percent)}٪
                        {!p.is_active ? " (غیرفعال)" : ""}
                      </Typography>
                    ))}
                  </Box>
                ) : null}
                {payLines.length > 0 ? (
                  <Box>
                    <Typography sx={{ fontWeight: 600, mb: 0.5, fontSize: 13 }}>خطوط پرداخت</Typography>
                    {payLines.map((l, idx) => (
                      <Typography key={idx} sx={{ fontSize: 12, color: "var(--admin-text-secondary)" }}>
                        {l.partner_name}: {formatNumber(l.amount)} تومان ({formatPercent(l.share_percent)}٪)
                      </Typography>
                    ))}
                  </Box>
                ) : null}
                {deletedLines.length > 0 ? (
                  <Box>
                    <Typography sx={{ fontWeight: 600, mb: 0.5, fontSize: 13 }}>تسویه حذف‌شده</Typography>
                    {deletedLines.map((l, idx) => (
                      <Typography key={idx} sx={{ fontSize: 12, color: "var(--admin-text-secondary)" }}>
                        {l.partner_name}: {formatNumber(l.amount)} تومان
                      </Typography>
                    ))}
                  </Box>
                ) : null}
              </>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogDetail(null)}>بستن</Button>
        </DialogActions>
      </Dialog>

      <ToastContainer autoClose={3000} position="bottom-right" />
    </Box>
  );
}
