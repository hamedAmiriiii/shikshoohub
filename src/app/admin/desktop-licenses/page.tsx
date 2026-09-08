"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { isSuperAdminUser } from "@/app/lib/superAdmin";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";

type DesktopLicense = {
  id: number;
  license_key: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  max_devices: number;
  starts_at?: string | null;
  expires_at?: string | null;
  status: string;
  notes?: string | null;
  activations_count?: number;
  active_activations_count?: number;
  activations?: Activation[];
};

type Activation = {
  id: number;
  machine_id: string;
  app_version?: string | null;
  platform?: string | null;
  activated_at?: string | null;
  last_seen_at?: string | null;
  revoked_at?: string | null;
};

type FormState = {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  max_devices: string;
  years: string;
  notes: string;
};

const emptyForm: FormState = {
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  max_devices: "1",
  years: "1",
  notes: "",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    "& fieldset": { borderColor: "var(--admin-border)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
} as const;

function statusChip(status: string) {
  const map: Record<string, { label: string; color: "success" | "warning" | "error" | "default" }> = {
    active: { label: "فعال", color: "success" },
    revoked: { label: "باطل", color: "error" },
    expired: { label: "منقضی", color: "warning" },
  };
  const s = map[status] || { label: status, color: "default" as const };
  return <Chip size="small" label={s.label} color={s.color} />;
}

function formatDate(v?: string | null) {
  if (!v) return "—";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(v));
  } catch {
    return v;
  }
}

export default function AdminDesktopLicensesPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DesktopLicense[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<DesktopLicense | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!isSuperAdminUser()) {
      toast.error("دسترسی فقط برای ادمین سیستم");
      router.replace("/admin");
      return;
    }
    setAllowed(true);
  }, [router]);

  const load = useCallback(async () => {
    const token = tokenCode();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const qs = new URLSearchParams({ per_page: "50" });
      if (search.trim()) qs.set("search", search.trim());
      if (statusFilter) qs.set("status", statusFilter);
      const res = await FetchWithJwtClient(
        "GET",
        `/api/admin/desktop-licenses?${qs.toString()}`,
        token,
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت لایسنس‌ها"));
        return;
      }
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setItems(list);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    if (!allowed) return;
    void load();
  }, [allowed, load]);

  const createLicense = async () => {
    const token = tokenCode();
    if (!token) return;
    const maxDevices = Number(form.max_devices);
    const years = Number(form.years);
    if (!Number.isFinite(maxDevices) || maxDevices < 1) {
      toast.error("تعداد دستگاه معتبر نیست");
      return;
    }
    setSaving(true);
    try {
      const res = await FetchWithJwtClient(
        "POST",
        "/api/admin/desktop-licenses",
        token,
        {},
        {
          body: JSON.stringify({
            customer_name: form.customer_name.trim() || null,
            customer_phone: form.customer_phone.trim() || null,
            customer_email: form.customer_email.trim() || null,
            max_devices: maxDevices,
            years: Number.isFinite(years) && years > 0 ? years : 1,
            notes: form.notes.trim() || null,
          }),
        },
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "ایجاد لایسنس ناموفق بود"));
        return;
      }
      const key = res?.data?.license_key;
      toast.success(key ? `لایسنس ایجاد شد: ${key}` : "لایسنس ایجاد شد");
      if (key && navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(key);
      }
      setCreating(false);
      setForm(emptyForm);
      void load();
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (id: number) => {
    const token = tokenCode();
    if (!token) return;
    setDetailLoading(true);
    try {
      const res = await FetchWithJwtClient("GET", `/api/admin/desktop-licenses/${id}`, token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "جزئیات لایسنس دریافت نشد"));
        return;
      }
      setDetail(res?.data || null);
    } finally {
      setDetailLoading(false);
    }
  };

  const setStatus = async (id: number, status: string) => {
    const token = tokenCode();
    if (!token) return;
    const res = await FetchWithJwtClient(
      "PUT",
      `/api/admin/desktop-licenses/${id}`,
      token,
      {},
      { body: JSON.stringify({ status }) },
    );
    if (res?.hasError) {
      toast.error(getApiErrorMessage(res, "بروزرسانی وضعیت ناموفق بود"));
      return;
    }
    toast.success("وضعیت بروزرسانی شد");
    void load();
    if (detail?.id === id) void openDetail(id);
  };

  const revokeActivation = async (activationId: number) => {
    const token = tokenCode();
    if (!token || !detail) return;
    const res = await FetchWithJwtClient(
      "POST",
      `/api/admin/desktop-license-activations/${activationId}/revoke`,
      token,
    );
    if (res?.hasError) {
      toast.error(getApiErrorMessage(res, "باطل‌سازی دستگاه ناموفق بود"));
      return;
    }
    toast.success("دستگاه باطل شد");
    void openDetail(detail.id);
    void load();
  };

  const copyKey = (key: string) => {
    void navigator.clipboard?.writeText(key);
    toast.info("کلید کپی شد");
  };

  if (!allowed) {
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ ...adminPageSx, direction: "rtl" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
        <VpnKeyIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
          لایسنس‌های دسکتاپ ویندوز
        </Typography>
        <Button
          variant="outlined"
          onClick={() => router.push("/admin/desktop-licenses/logs")}
        >
          لاگ اتصال
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon sx={adminButtonStartIconSx} />}
          onClick={() => {
            setForm(emptyForm);
            setCreating(true);
          }}
        >
          لایسنس جدید
        </Button>
        <IconButton onClick={() => void load()} aria-label="refresh">
          <RefreshIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
        <TextField
          size="small"
          label="جستجو"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ ...fieldSx, minWidth: 220 }}
        />
        <TextField
          select
          size="small"
          label="وضعیت"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ ...fieldSx, minWidth: 160 }}
        >
          <MenuItem value="">همه</MenuItem>
          <MenuItem value="active">فعال</MenuItem>
          <MenuItem value="revoked">باطل</MenuItem>
          <MenuItem value="expired">منقضی</MenuItem>
        </TextField>
      </Box>

      {loading ? (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ overflowX: "auto", border: "1px solid var(--admin-border)", borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>کلید</TableCell>
                <TableCell>مشتری</TableCell>
                <TableCell>دستگاه</TableCell>
                <TableCell>انقضا</TableCell>
                <TableCell>وضعیت</TableCell>
                <TableCell align="left">عملیات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell sx={{ fontFamily: "monospace", direction: "ltr" }}>
                    {item.license_key}
                    <IconButton size="small" onClick={() => copyKey(item.license_key)}>
                      <ContentCopyIcon fontSize="inherit" />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 14 }}>{item.customer_name || "—"}</Typography>
                    <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
                      {item.customer_phone || ""}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {(item.active_activations_count ?? 0)}/{item.max_devices}
                  </TableCell>
                  <TableCell>{formatDate(item.expires_at)}</TableCell>
                  <TableCell>{statusChip(item.status)}</TableCell>
                  <TableCell align="left">
                    <Button size="small" onClick={() => void openDetail(item.id)}>
                      جزئیات
                    </Button>
                    {item.status === "active" ? (
                      <Button size="small" color="error" onClick={() => void setStatus(item.id, "revoked")}>
                        باطل
                      </Button>
                    ) : (
                      <Button size="small" color="success" onClick={() => void setStatus(item.id, "active")}>
                        فعال
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    لایسنسی ثبت نشده است
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}

      <Dialog open={creating} onClose={() => !saving && setCreating(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ direction: "rtl" }}>ایجاد لایسنس سالانه</DialogTitle>
        <DialogContent sx={{ direction: "rtl", display: "grid", gap: 2, pt: 1 }}>
          <TextField
            label="نام مشتری"
            value={form.customer_name}
            onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
            sx={fieldSx}
            fullWidth
          />
          <TextField
            label="تلفن"
            value={form.customer_phone}
            onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))}
            sx={fieldSx}
            fullWidth
          />
          <TextField
            label="ایمیل"
            value={form.customer_email}
            onChange={(e) => setForm((f) => ({ ...f, customer_email: e.target.value }))}
            sx={fieldSx}
            fullWidth
          />
          <TextField
            label="حداکثر دستگاه"
            value={form.max_devices}
            onChange={(e) => setForm((f) => ({ ...f, max_devices: e.target.value }))}
            sx={fieldSx}
            fullWidth
          />
          <TextField
            label="مدت (سال)"
            value={form.years}
            onChange={(e) => setForm((f) => ({ ...f, years: e.target.value }))}
            sx={fieldSx}
            fullWidth
          />
          <TextField
            label="یادداشت"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            sx={fieldSx}
            fullWidth
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions sx={{ direction: "rtl", px: 3, pb: 2 }}>
          <Button onClick={() => setCreating(false)} disabled={saving}>
            انصراف
          </Button>
          <Button variant="contained" onClick={() => void createLicense()} disabled={saving}>
            {saving ? "..." : "ایجاد"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!detail || detailLoading} onClose={() => setDetail(null)} fullWidth maxWidth="md">
        <DialogTitle sx={{ direction: "rtl" }}>جزئیات لایسنس</DialogTitle>
        <DialogContent sx={{ direction: "rtl" }}>
          {detailLoading || !detail ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <Typography sx={{ fontFamily: "monospace", direction: "ltr" }}>{detail.license_key}</Typography>
              <Typography>مشتری: {detail.customer_name || "—"}</Typography>
              <Typography>انقضا: {formatDate(detail.expires_at)}</Typography>
              <Typography>وضعیت: {statusChip(detail.status)}</Typography>
              <Typography sx={{ mt: 1, fontWeight: 700 }}>دستگاه‌های فعال‌شده</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Machine ID</TableCell>
                    <TableCell>آخرین اتصال</TableCell>
                    <TableCell>وضعیت</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(detail.activations || []).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12, direction: "ltr" }}>
                        {a.machine_id}
                      </TableCell>
                      <TableCell>{formatDate(a.last_seen_at || a.activated_at)}</TableCell>
                      <TableCell>{a.revoked_at ? "باطل" : "فعال"}</TableCell>
                      <TableCell>
                        {!a.revoked_at && (
                          <Button size="small" color="error" onClick={() => void revokeActivation(a.id)}>
                            باطل دستگاه
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(detail.activations || []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        هنوز دستگاهی فعال نشده
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ direction: "rtl" }}>
          <Button onClick={() => setDetail(null)}>بستن</Button>
        </DialogActions>
      </Dialog>

      <ToastContainer position="bottom-right" autoClose={3000} />
    </Box>
  );
}
