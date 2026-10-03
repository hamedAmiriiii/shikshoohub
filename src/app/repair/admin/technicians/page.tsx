"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "react-toastify";
import { formatToman, isRepairError, repairApi, toLatinDigits, type RepairTechnician } from "@/app/lib/repair/api";
import { EmptyState, Loader, useRequireRole } from "../../ui";

type FormState = {
  id?: number;
  name: string;
  phone: string;
  specialty: string;
  labor_share_percent: string;
  card_number: string;
  notes: string;
  is_active: boolean;
};

const emptyForm = (share: number): FormState => ({
  name: "",
  phone: "",
  specialty: "",
  labor_share_percent: String(share),
  card_number: "",
  notes: "",
  is_active: true,
});

export default function RepairTechniciansPage() {
  const { allowed } = useRequireRole(["admin"]);
  const [rows, setRows] = useState<RepairTechnician[] | null>(null);
  const [defaultShare, setDefaultShare] = useState(70);
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await repairApi.adminTechnicians();
    if (isRepairError(res)) {
      setRows([]);
      return;
    }
    setRows(res.technicians);
    setDefaultShare(res.default_share_percent);
  }, []);

  useEffect(() => {
    if (allowed) void load();
  }, [allowed, load]);

  if (!allowed || rows === null) return <Loader />;

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => (f ? { ...f, [key]: e.target.value } : f));

  const save = async () => {
    if (!form) return;
    const body = {
      name: form.name.trim(),
      phone: toLatinDigits(form.phone).replace(/\D/g, ""),
      specialty: form.specialty.trim() || null,
      labor_share_percent: Number(toLatinDigits(form.labor_share_percent)) || 0,
      card_number: toLatinDigits(form.card_number).replace(/[^\d-]/g, "") || null,
      notes: form.notes.trim() || null,
      is_active: form.is_active,
    };
    if (!body.name || !/^09\d{9}$/.test(body.phone)) {
      toast.error("نام و شماره موبایل معتبر را وارد کنید.");
      return;
    }
    setBusy(true);
    const res = form.id ? await repairApi.adminUpdateTechnician(form.id, body) : await repairApi.adminCreateTechnician(body);
    setBusy(false);
    if (isRepairError(res)) {
      toast.error(res.message);
      return;
    }
    toast.success(res.message);
    setForm(null);
    void load();
  };

  const edit = (t: RepairTechnician) =>
    setForm({
      id: t.id,
      name: t.name || "",
      phone: t.phone,
      specialty: t.specialty || "",
      labor_share_percent: String(t.labor_share_percent),
      card_number: t.card_number || "",
      notes: t.notes || "",
      is_active: t.is_active,
    });

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" fontWeight={800}>
          تعمیرکاران
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setForm(emptyForm(defaultShare))}>
          تعمیرکار جدید
        </Button>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        تعمیرکار با همین شماره موبایل و کد پیامکی وارد پنل خودش می‌شود و هزینهٔ هر کار را ثبت می‌کند.
      </Typography>

      {rows.length === 0 ? (
        <EmptyState text="هنوز تعمیرکاری معرفی نکرده‌اید." />
      ) : (
        rows.map((t) => (
          <Paper key={t.id} variant="outlined" sx={{ p: 2, borderRadius: 3, opacity: t.is_active ? 1 : 0.6 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <div>
                <Typography fontWeight={700}>
                  {t.name} {t.specialty ? <Typography component="span" color="text.secondary">({t.specialty})</Typography> : null}
                </Typography>
                <Typography variant="body2" color="text.secondary" dir="ltr" sx={{ textAlign: "right" }}>
                  {t.phone}
                </Typography>
              </div>
              <Stack direction="row" spacing={1} alignItems="center">
                {!t.is_active && <Chip size="small" label="غیرفعال" />}
                <Button size="small" onClick={() => edit(t)}>
                  ویرایش
                </Button>
              </Stack>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", rowGap: 1 }}>
              <Chip size="small" variant="outlined" label={`سهم اجرت: ${t.labor_share_percent}٪`} />
              <Chip
                size="small"
                variant="outlined"
                component={Link}
                href={`/repair/admin/requests?technician_id=${t.id}`}
                clickable
                label={`${t.open_requests ?? 0} کار باز`}
              />
              <Chip
                size="small"
                color={(t.balance ?? 0) > 0 ? "success" : "default"}
                component={Link}
                href={`/repair/admin/payouts?technician_id=${t.id}`}
                clickable
                label={`مانده: ${formatToman(t.balance ?? 0)}`}
              />
            </Stack>
          </Paper>
        ))
      )}

      <Dialog open={form !== null} onClose={() => setForm(null)} fullWidth maxWidth="xs">
        <DialogTitle>{form?.id ? "ویرایش تعمیرکار" : "تعمیرکار جدید"}</DialogTitle>
        {form && (
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="نام و نام خانوادگی" value={form.name} onChange={set("name")} fullWidth size="small" />
              <TextField
                label="شماره موبایل"
                value={form.phone}
                onChange={set("phone")}
                fullWidth
                size="small"
                slotProps={{ htmlInput: { dir: "ltr", maxLength: 11 } }}
              />
              <TextField label="تخصص" placeholder="مثلاً: یخچال و لباسشویی" value={form.specialty} onChange={set("specialty")} fullWidth size="small" />
              <TextField
                label="درصد سهم از اجرت"
                helperText="کل هزینهٔ قطعات هم به تعمیرکار تعلق می‌گیرد."
                value={form.labor_share_percent}
                onChange={set("labor_share_percent")}
                fullWidth
                size="small"
                inputMode="decimal"
              />
              <TextField
                label="شماره کارت / شبا برای تسویه"
                value={form.card_number}
                onChange={set("card_number")}
                fullWidth
                size="small"
                slotProps={{ htmlInput: { dir: "ltr" } }}
              />
              <TextField label="یادداشت" value={form.notes} onChange={set("notes")} fullWidth size="small" multiline minRows={2} />
              <FormControlLabel
                control={<Switch checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />}
                label="فعال"
              />
            </Stack>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setForm(null)}>انصراف</Button>
          <Button variant="contained" onClick={() => void save()} disabled={busy}>
            ذخیره
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
