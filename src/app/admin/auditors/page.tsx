"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
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
  TextField,
  Typography,
} from "@mui/material";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { adminPageSx } from "@/app/admin/theme/adminTheme";
import PayrollConfirmDialog from "@/app/admin/payroll/PayrollConfirmDialog";

type Auditor = {
  id: number;
  name: string | null;
  phone: string | null;
  is_active: boolean;
  note: string | null;
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    "& fieldset": { borderColor: "var(--admin-border)" },
    "&:hover fieldset": { borderColor: "var(--admin-accent)" },
    "&.Mui-focused fieldset": { borderColor: "var(--admin-accent)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
} as const;

function digitsOnly(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/\D/g, "");
}

export default function ShopAuditorsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [auditors, setAuditors] = useState<Auditor[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Auditor | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [toDelete, setToDelete] = useState<Auditor | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await FetchWithJwtClient("GET", "/api/shop-auditors", tokenCode());
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت حسابرس‌ها"));
        return;
      }
      setAuditors(Array.isArray(res?.data) ? (res.data as Auditor[]) : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setPhone("");
    setPassword("");
    setNote("");
    setDialogOpen(true);
  };

  const openEdit = (auditor: Auditor) => {
    setEditing(auditor);
    setName(auditor.name || "");
    setPhone(auditor.phone || "");
    setPassword("");
    setNote(auditor.note || "");
    setDialogOpen(true);
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error("نام حسابرس الزامی است");
      return;
    }
    if (!editing) {
      const digits = digitsOnly(phone);
      if (digits.length !== 11 || !digits.startsWith("09")) {
        toast.error("شماره موبایل ۱۱ رقمی حسابرس را وارد کنید");
        return;
      }
      if (password.trim() && password.trim().length < 6) {
        toast.error("رمز ورود حداقل ۶ کاراکتر است");
        return;
      }
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        note: note.trim() || null,
      };
      if (!editing) {
        body.phone = digitsOnly(phone);
        if (password.trim()) body.password = password.trim();
      }
      const res = await FetchWithJwtClient(
        editing ? "PUT" : "POST",
        editing ? `/api/shop-auditors/${editing.id}` : "/api/shop-auditors",
        tokenCode(),
        {},
        { body: JSON.stringify(body) },
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در ذخیره حسابرس"));
        return;
      }
      toast.success(editing ? "حسابرس ویرایش شد" : "حسابرس اضافه شد");
      setDialogOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const setActive = async (auditor: Auditor, isActive: boolean) => {
    const res = await FetchWithJwtClient("PUT", `/api/shop-auditors/${auditor.id}`, tokenCode(), {}, {
      body: JSON.stringify({ is_active: isActive }),
    });
    if (res?.hasError) {
      toast.error(getApiErrorMessage(res, "خطا در تغییر وضعیت"));
      return;
    }
    setAuditors((prev) => prev.map((a) => (a.id === auditor.id ? { ...a, is_active: isActive } : a)));
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setSaving(true);
    try {
      const res = await FetchWithJwtClient("DELETE", `/api/shop-auditors/${toDelete.id}`, tokenCode());
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در حذف حسابرس"));
        return;
      }
      toast.success("حسابرس از فروشگاه حذف شد");
      setToDelete(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ ...adminPageSx, p: 2, pb: 12 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <FactCheckIcon sx={{ color: "var(--admin-accent)", fontSize: 30 }} />
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: "20px" }}>
            حسابرس‌ها
          </Typography>
        </Box>
        <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={openCreate} disabled={loading}>
          افزودن حسابرس
        </Button>
      </Box>
      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 2, lineHeight: 1.8 }}>
        حسابرس با شمارهٔ موبایل خودش وارد می‌شود و در این فروشگاه همهٔ کارهای صاحب فروشگاه را می‌تواند انجام دهد.
        یک حسابرس می‌تواند به چند فروشگاه وصل باشد و بعد از ورود، فروشگاه را انتخاب می‌کند.
      </Typography>

      <Card sx={{ border: "1px solid var(--admin-border)" }}>
        <CardContent>
          {loading ? (
            <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={26} />
            </Box>
          ) : auditors.length === 0 ? (
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13 }}>حسابرسی اضافه نشده</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>نام</TableCell>
                    <TableCell>موبایل (نام کاربری)</TableCell>
                    <TableCell>توضیح</TableCell>
                    <TableCell align="center">فعال</TableCell>
                    <TableCell align="center">عملیات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditors.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.name || "—"}</TableCell>
                      <TableCell sx={{ direction: "ltr" }}>{a.phone || "—"}</TableCell>
                      <TableCell sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>{a.note || "—"}</TableCell>
                      <TableCell align="center">
                        <Switch size="small" checked={a.is_active} onChange={(e) => setActive(a, e.target.checked)} />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => openEdit(a)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setToDelete(a)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? "ویرایش حسابرس" : "افزودن حسابرس"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 1 }}>
            <TextField size="small" label="نام" value={name} onChange={(e) => setName(e.target.value)} sx={fieldSx} />
            <TextField
              size="small"
              label="شماره موبایل (نام کاربری)"
              value={phone}
              disabled={Boolean(editing)}
              onChange={(e) => setPhone(digitsOnly(e.target.value).slice(0, 11))}
              sx={fieldSx}
              inputProps={{ inputMode: "numeric", style: { direction: "ltr", textAlign: "right" } }}
            />
            {!editing ? (
              <TextField
                size="small"
                type="password"
                label="رمز ورود"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={fieldSx}
                autoComplete="new-password"
                helperText="برای حسابرس جدید لازم است (حداقل ۶ کاراکتر). اگر این شماره قبلاً حسابرس فروشگاه دیگری بوده، با همان رمز قبلی خودش وارد می‌شود."
              />
            ) : null}
            <TextField
              size="small"
              label="توضیح (اختیاری)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              sx={fieldSx}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            انصراف
          </Button>
          <Button variant="contained" onClick={save} disabled={saving}>
            ذخیره
          </Button>
        </DialogActions>
      </Dialog>

      <PayrollConfirmDialog
        open={Boolean(toDelete)}
        title="حذف حسابرس"
        message={toDelete ? `دسترسی «${toDelete.name || toDelete.phone}» به این فروشگاه حذف شود؟` : ""}
        confirmLabel="حذف"
        confirmColor="error"
        loading={saving}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />

      <ToastContainer position="bottom-right" rtl autoClose={3000} style={{ marginBottom: "76px" }} />
    </Box>
  );
}
