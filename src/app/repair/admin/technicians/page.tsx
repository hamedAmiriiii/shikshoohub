"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "react-toastify";
import {
  formatFaDate,
  formatToman,
  isRepairError,
  repairApi,
  toLatinDigits,
  type RepairAdminService,
  type RepairTechnician,
} from "@/app/lib/repair/api";
import { EmptyState, Loader, Section, useRequireRole } from "../../ui";
import { AppQrButton } from "../AppQr";
import { RatingBadge } from "../../Rating";
import { BankFields, SelfieInput, TechnicianPhoto, bankFieldsError, cardDigits, shebaDigits } from "../../TechIdentity";

type FormState = {
  id?: number;
  name: string;
  phone: string;
  specialty: string;
  labor_share_percent: string;
  card_number: string;
  sheba: string;
  photo_url?: string | null;
  notes: string;
  is_active: boolean;
  service_ids: number[];
};

type ApproveState = { technician: RepairTechnician; share: string; service_ids: number[] };

const emptyForm = (share: number): FormState => ({
  name: "",
  phone: "",
  specialty: "",
  labor_share_percent: String(share),
  card_number: "",
  sheba: "",
  notes: "",
  is_active: true,
  service_ids: [],
});

function ServiceCheckboxes({
  services,
  value,
  onChange,
}: {
  services: RepairAdminService[];
  value: number[];
  onChange: (ids: number[]) => void;
}) {
  if (services.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        ابتدا در بخش «نوع خدمات» خدمت تعریف کنید.
      </Typography>
    );
  }
  return (
    <Box>
      <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
        خدماتی که انجام می‌دهد
      </Typography>
      <FormGroup row>
        {services.map((s) => (
          <FormControlLabel
            key={s.id}
            control={
              <Checkbox
                size="small"
                checked={value.includes(s.id)}
                onChange={(e) => onChange(e.target.checked ? [...value, s.id] : value.filter((id) => id !== s.id))}
              />
            }
            label={s.name + (s.is_active ? "" : " (غیرفعال)")}
          />
        ))}
      </FormGroup>
    </Box>
  );
}

export default function RepairTechniciansPage() {
  const { allowed } = useRequireRole(["admin"]);
  const [rows, setRows] = useState<RepairTechnician[] | null>(null);
  const [services, setServices] = useState<RepairAdminService[]>([]);
  const [defaultShare, setDefaultShare] = useState(70);
  const [form, setForm] = useState<FormState | null>(null);
  const [approve, setApprove] = useState<ApproveState | null>(null);
  const [reject, setReject] = useState<{ technician: RepairTechnician; reason: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [res, svc] = await Promise.all([repairApi.adminTechnicians(), repairApi.adminServices()]);
    if (!isRepairError(svc)) setServices(svc.services);
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

  const pending = rows.filter((t) => t.approval_status === "pending");
  const others = rows.filter((t) => t.approval_status !== "pending");

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => (f ? { ...f, [key]: e.target.value } : f));

  const save = async () => {
    if (!form) return;
    const body = {
      name: form.name.trim(),
      phone: toLatinDigits(form.phone).replace(/\D/g, ""),
      specialty: form.specialty.trim() || null,
      labor_share_percent: Number(toLatinDigits(form.labor_share_percent)) || 0,
      card_number: cardDigits(form.card_number) || null,
      sheba: shebaDigits(form.sheba) || null,
      notes: form.notes.trim() || null,
      is_active: form.is_active,
      service_ids: form.service_ids,
    };
    if (!body.name || !/^09\d{9}$/.test(body.phone)) {
      toast.error("نام و شماره موبایل معتبر را وارد کنید.");
      return;
    }
    const bankError = bankFieldsError(form.card_number, form.sheba);
    if (bankError) {
      toast.error(bankError);
      return;
    }
    setBusy(true);
    const res = form.id ? await repairApi.adminUpdateTechnician(form.id, body) : await repairApi.adminCreateTechnician(body);
    setBusy(false);
    if (isRepairError(res)) return void toast.error(res.message);
    toast.success(res.message);
    setForm(null);
    void load();
  };

  const uploadPhoto = async (dataUrl: string) => {
    if (!form?.id) return;
    setBusy(true);
    const res = await repairApi.adminTechnicianPhoto(form.id, dataUrl);
    setBusy(false);
    if (isRepairError(res)) return void toast.error(res.message);
    toast.success(res.message);
    setForm((f) => (f ? { ...f, photo_url: res.technician.photo_url } : f));
    void load();
  };

  const submitApprove = async () => {
    if (!approve) return;
    setBusy(true);
    const res = await repairApi.adminApproveTechnician(approve.technician.id, {
      labor_share_percent: Number(toLatinDigits(approve.share)) || 0,
      service_ids: approve.service_ids,
    });
    setBusy(false);
    if (isRepairError(res)) return void toast.error(res.message);
    toast.success(res.message);
    setApprove(null);
    void load();
  };

  const submitReject = async () => {
    if (!reject) return;
    setBusy(true);
    const res = await repairApi.adminRejectTechnician(reject.technician.id, reject.reason.trim() || undefined);
    setBusy(false);
    if (isRepairError(res)) return void toast.error(res.message);
    toast.success(res.message);
    setReject(null);
    void load();
  };

  const edit = (t: RepairTechnician) =>
    setForm({
      id: t.id,
      name: t.name || "",
      phone: t.phone,
      specialty: t.specialty || "",
      labor_share_percent: String(t.labor_share_percent),
      card_number: cardDigits(t.card_number || ""),
      sheba: shebaDigits(t.sheba || ""),
      photo_url: t.photo_url,
      notes: t.notes || "",
      is_active: t.is_active,
      service_ids: t.service_ids || [],
    });

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap spacing={1}>
        <Typography variant="h6" fontWeight={800}>
          تعمیرکاران
        </Typography>
        <Stack direction="row" spacing={1}>
          <AppQrButton kind="technician" label="QR ثبت‌نام تعمیرکار" />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setForm(emptyForm(defaultShare))}>
            تعمیرکار جدید
          </Button>
        </Stack>
      </Stack>

      {pending.length > 0 && (
        <Section title={`در انتظار تأیید (${pending.length})`}>
          <Stack spacing={1.5}>
            {pending.map((t) => (
              <Paper key={t.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: "warning.main" }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
                  <TechnicianPhoto name={t.name} photoUrl={t.photo_url} size={64} />
                  <Box>
                    <Typography fontWeight={700}>{t.name}</Typography>
                    <Typography variant="body2" color="text.secondary" dir="ltr" sx={{ textAlign: "right" }}>
                      {t.phone}
                    </Typography>
                    {!t.photo_url && <Chip size="small" color="warning" variant="outlined" label="بدون عکس سلفی" sx={{ mt: 0.5 }} />}
                  </Box>
                </Stack>
                {t.specialty && <Typography variant="body2">تخصص: {t.specialty}</Typography>}
                {t.address && (
                  <Typography variant="body2" color="text.secondary">
                    {t.address}
                  </Typography>
                )}
                <Stack direction="row" spacing={0.5} sx={{ my: 1, flexWrap: "wrap", rowGap: 0.5 }}>
                  {t.services.map((name) => (
                    <Chip key={name} size="small" label={name} />
                  ))}
                </Stack>
                <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>
                  ثبت‌نام: {formatFaDate(t.created_at)}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={() => setApprove({ technician: t, share: String(t.labor_share_percent || defaultShare), service_ids: t.service_ids })}
                  >
                    تأیید
                  </Button>
                  <Button size="small" color="error" onClick={() => setReject({ technician: t, reason: "" })}>
                    رد
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Section>
      )}

      {others.length === 0 ? (
        <EmptyState text="هنوز تعمیرکاری ندارید. QR ثبت‌نام را به تعمیرکاران بدهید یا خودتان اضافه کنید." />
      ) : (
        others.map((t) => (
          <Paper key={t.id} variant="outlined" sx={{ p: 2, borderRadius: 3, opacity: t.is_active && t.approval_status === "approved" ? 1 : 0.6 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                <TechnicianPhoto name={t.name} photoUrl={t.photo_url} size={48} />
                <div>
                  <Typography fontWeight={700}>
                    {t.name} {t.specialty ? <Typography component="span" color="text.secondary">({t.specialty})</Typography> : null}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" dir="ltr" sx={{ textAlign: "right" }}>
                    {t.phone}
                  </Typography>
                </div>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                {t.approval_status === "rejected" && <Chip size="small" color="error" variant="outlined" label="ردشده" />}
                {!t.is_active && <Chip size="small" label="غیرفعال" />}
                {t.approval_status === "rejected" ? (
                  <Button
                    size="small"
                    onClick={() => setApprove({ technician: t, share: String(t.labor_share_percent || defaultShare), service_ids: t.service_ids })}
                  >
                    تأیید
                  </Button>
                ) : (
                  <Button size="small" onClick={() => edit(t)}>
                    ویرایش
                  </Button>
                )}
              </Stack>
            </Stack>
            {t.services.length > 0 && (
              <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: "wrap", rowGap: 0.5 }}>
                {t.services.map((name) => (
                  <Chip key={name} size="small" color="primary" variant="outlined" label={name} />
                ))}
              </Stack>
            )}
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", rowGap: 1 }}>
              <Chip size="small" variant="outlined" label={<RatingBadge avg={t.rating_avg} count={t.rating_count} />} />
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
              {form.id && (
                <SelfieInput value={form.photo_url || null} onChange={(dataUrl) => void uploadPhoto(dataUrl)} busy={busy} />
              )}
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
              <ServiceCheckboxes services={services} value={form.service_ids} onChange={(service_ids) => setForm({ ...form, service_ids })} />
              <TextField
                label="درصد سهم از اجرت"
                helperText="کل هزینهٔ قطعات هم به تعمیرکار تعلق می‌گیرد."
                value={form.labor_share_percent}
                onChange={set("labor_share_percent")}
                fullWidth
                size="small"
                inputMode="decimal"
              />
              <BankFields
                card={form.card_number}
                sheba={form.sheba}
                onChange={({ card, sheba }) => setForm({ ...form, card_number: card, sheba })}
                size="small"
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

      <Dialog open={approve !== null} onClose={() => setApprove(null)} fullWidth maxWidth="xs">
        <DialogTitle>تأیید {approve?.technician.name}</DialogTitle>
        {approve && (
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="درصد سهم از اجرت"
                value={approve.share}
                onChange={(e) => setApprove({ ...approve, share: e.target.value })}
                fullWidth
                size="small"
                inputMode="decimal"
              />
              <ServiceCheckboxes
                services={services}
                value={approve.service_ids}
                onChange={(service_ids) => setApprove({ ...approve, service_ids })}
              />
              <Alert severity="info">پس از تأیید، پیامک ورود به پنل برای تعمیرکار ارسال می‌شود.</Alert>
            </Stack>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setApprove(null)}>انصراف</Button>
          <Button variant="contained" color="success" onClick={() => void submitApprove()} disabled={busy}>
            تأیید
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={reject !== null} onClose={() => setReject(null)} fullWidth maxWidth="xs">
        <DialogTitle>رد ثبت‌نام {reject?.technician.name}</DialogTitle>
        {reject && (
          <DialogContent>
            <TextField
              label="علت (برای تعمیرکار پیامک می‌شود)"
              value={reject.reason}
              onChange={(e) => setReject({ ...reject, reason: e.target.value })}
              fullWidth
              size="small"
              sx={{ mt: 1 }}
            />
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setReject(null)}>انصراف</Button>
          <Button variant="contained" color="error" onClick={() => void submitReject()} disabled={busy}>
            رد
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
