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
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiRequestError } from "@/app/lib/apiRequestError/client";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import tokenCode from "@/app/coponent/tokenCode";
import ShopAccountSelect from "@/app/admin/ShopAccountSelect";

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
};

type ProfitPreview = {
  period_from?: string | null;
  period_to?: string | null;
  period_from_jalali?: string | null;
  period_to_jalali?: string | null;
  last_settlement_at_jalali?: string | null;
  net_profit: number;
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

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [totalCapital, setTotalCapital] = useState(0);
  const [preview, setPreview] = useState<ProfitPreview | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settling, setSettling] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [capitalInput, setCapitalInput] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [settleOpen, setSettleOpen] = useState(false);
  const [shopAccountId, setShopAccountId] = useState<number | "">("");
  const [settleNotes, setSettleNotes] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    const token = tokenCode();
    try {
      const [partnersRes, previewRes, settlementsRes] = await Promise.all([
        apiRequestError("Get", {}, {}, "/api/shop-partners", true, true, token),
        apiRequestError("Get", {}, {}, "/api/shop-partners/profit-preview", true, true, token),
        apiRequestError("Get", {}, {}, "/api/shop-partners/settlements", true, true, token),
      ]);

      if (partnersRes?.hasError) {
        toast.error(getApiErrorMessage(partnersRes, "خطا در دریافت شرکا"));
      } else {
        const list = Array.isArray(partnersRes?.data) ? partnersRes.data : [];
        setPartners(list as Partner[]);
        setTotalCapital(Number(partnersRes?.total_capital) || 0);
      }

      if (!previewRes?.hasError) {
        setPreview(previewRes as ProfitPreview);
      }

      if (!settlementsRes?.hasError) {
        const list = Array.isArray(settlementsRes?.data) ? settlementsRes.data : [];
        setSettlements(list as Settlement[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

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

  const confirmSettle = async () => {
    if (shopAccountId === "") {
      toast.error("حساب برداشت را انتخاب کنید");
      return;
    }
    setSettling(true);
    const token = tokenCode();
    try {
      const res = await apiRequestError(
        "Post",
        {},
        {
          shop_account_id: Number(shopAccountId),
          notes: settleNotes.trim() || null,
        },
        "/api/shop-partners/settle",
        true,
        true,
        token,
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "ثبت تقسیم سود ناموفق بود"));
        return;
      }
      toast.success("تقسیم سود ثبت شد و از حساب برداشت شد");
      setSettleOpen(false);
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

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Card sx={{ mb: 2, bgcolor: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
              <CardContent>
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13, mb: 1 }}>
                  سود خالص قابل تقسیم ({periodLabel})
                </Typography>
                <Typography sx={{ color: "var(--admin-accent)", fontWeight: 800, fontSize: 28 }}>
                  {formatNumber(preview?.net_profit || 0)} تومان
                </Typography>
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mt: 0.5 }}>
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
                    {preview.partners.map((row) => (
                      <Box
                        key={row.id}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 1,
                          py: 0.75,
                          borderBottom: "1px solid var(--admin-border)",
                        }}
                      >
                        <Typography sx={{ color: "var(--admin-text)" }}>
                          {row.name} ({formatPercent(row.share_percent)}٪)
                        </Typography>
                        <Typography sx={{ color: "var(--admin-text)", fontWeight: 600 }}>
                          {formatNumber(row.share_amount)} تومان
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : null}
                <Button
                  sx={{ mt: 2 }}
                  variant="contained"
                  startIcon={<PaymentsIcon />}
                  disabled={!preview?.can_settle}
                  onClick={() => setSettleOpen(true)}
                >
                  برداشت و تقسیم سود
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
            <TableContainer component={Paper} sx={{ bgcolor: "var(--admin-surface)" }}>
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

      <Dialog open={settleOpen} onClose={() => setSettleOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>برداشت و تقسیم سود</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.5, pt: "12px !important" }}>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 13 }}>
            مبلغ {formatNumber(preview?.net_profit || 0)} تومان از حساب انتخابی برداشت و مطابق درصد
            سرمایه بین شرکا تقسیم می‌شود.
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
          <Button onClick={() => setSettleOpen(false)}>انصراف</Button>
          <Button variant="contained" disabled={settling} onClick={() => void confirmSettle()}>
            {settling ? "..." : "ثبت برداشت"}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer autoClose={3000} position="bottom-right" />
    </Box>
  );
}
