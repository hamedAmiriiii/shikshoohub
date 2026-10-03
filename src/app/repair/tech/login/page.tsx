"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EngineeringIcon from "@mui/icons-material/Engineering";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import { toast } from "react-toastify";
import { isRepairError, repairApi, toLatinDigits, type RepairServiceOption } from "@/app/lib/repair/api";
import { useRepairAuth } from "../../RepairAuth";
import { TechInstallBanner } from "../../RepairInstall";

type Step = "phone" | "code" | "register" | "pending" | "rejected";

function TechLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, ready, login, config } = useRepairAuth();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [registrationToken, setRegistrationToken] = useState("");
  const [services, setServices] = useState<RepairServiceOption[]>([]);
  const [form, setForm] = useState({ name: "", specialty: "", card_number: "", address: "", service_ids: [] as number[] });

  const next = params.get("next");
  const target = next && next.startsWith("/repair/tech") && !next.startsWith("/repair/tech/login") ? next : "/repair/tech";

  useEffect(() => {
    if (ready && user?.role === "technician") router.replace(target);
  }, [ready, user, target, router]);

  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  const sendCode = async () => {
    const normalized = toLatinDigits(phone).replace(/\D/g, "");
    if (!/^09\d{9}$/.test(normalized)) {
      toast.error("شماره موبایل را درست وارد کنید (مثل ۰۹۱۲۱۲۳۴۵۶۷).");
      return;
    }
    setBusy(true);
    const res = await repairApi.sendCode(normalized);
    setBusy(false);
    if (isRepairError(res)) {
      toast.error(res.message);
      if (res.retry_after_seconds) setWait(res.retry_after_seconds);
      return;
    }
    setPhone(normalized);
    setWait(res.retry_after_seconds || 90);
    setStep("code");
    toast.success(res.message);
  };

  const verify = async () => {
    const normalizedCode = toLatinDigits(code).replace(/\D/g, "");
    if (normalizedCode.length < 4) {
      toast.error("کد پیامک‌شده را وارد کنید.");
      return;
    }
    setBusy(true);
    const res = await repairApi.techVerify(phone, normalizedCode);
    setBusy(false);
    if (isRepairError(res)) {
      toast.error(res.message);
      return;
    }
    if (res.status === "ok") {
      login(res.token, res.user);
      router.replace(target);
      return;
    }
    if (res.status === "needs_registration") {
      setRegistrationToken(res.registration_token);
      setServices(res.services.filter((s) => s.id > 0));
      setStep("register");
      return;
    }
    setStatusMessage(res.message);
    setStep(res.status);
  };

  const register = async () => {
    if (!form.name.trim()) {
      toast.error("نام و نام خانوادگی را وارد کنید.");
      return;
    }
    if (services.length > 0 && form.service_ids.length === 0) {
      toast.error("حداقل یک نوع خدمت را انتخاب کنید.");
      return;
    }
    setBusy(true);
    const res = await repairApi.techRegister({
      registration_token: registrationToken,
      name: form.name.trim(),
      specialty: form.specialty.trim() || undefined,
      service_ids: form.service_ids,
      card_number: toLatinDigits(form.card_number).replace(/[^\d-]/g, "") || undefined,
      address: form.address.trim() || undefined,
    });
    setBusy(false);
    if (isRepairError(res)) {
      toast.error(res.message);
      return;
    }
    setStatusMessage(res.message);
    setStep("pending");
  };

  const toggleService = (id: number, checked: boolean) =>
    setForm((f) => ({ ...f, service_ids: checked ? [...f.service_ids, id] : f.service_ids.filter((x) => x !== id) }));

  return (
    <Stack spacing={2} sx={{ maxWidth: 460, mx: "auto", mt: { xs: 1, sm: 4 } }}>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <Box sx={{ bgcolor: "primary.main", color: "#fff", borderRadius: 2, p: 1, display: "flex" }}>
            <EngineeringIcon />
          </Box>
          <div>
            <Typography variant="h6" fontWeight={800}>
              ورود و ثبت‌نام تعمیرکاران
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {config?.brand_name || "تعمیرکار"}
            </Typography>
          </div>
        </Stack>

        {step === "phone" && (
          <Stack spacing={2} component="form" onSubmit={(e) => { e.preventDefault(); void sendCode(); }}>
            <TextField
              label="شماره موبایل"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoFocus
              fullWidth
              slotProps={{ htmlInput: { dir: "ltr", maxLength: 11 } }}
            />
            <Button type="submit" variant="contained" size="large" disabled={busy || wait > 0}>
              {wait > 0 ? `ارسال مجدد تا ${wait} ثانیه` : "دریافت کد"}
            </Button>
            <Typography variant="caption" color="text.secondary">
              اگر قبلاً ثبت‌نام نکرده‌اید، بعد از تأیید شماره فرم ثبت‌نام نمایش داده می‌شود.
            </Typography>
          </Stack>
        )}

        {step === "code" && (
          <Stack spacing={2} component="form" onSubmit={(e) => { e.preventDefault(); void verify(); }}>
            <Typography variant="body2">
              کد ارسال‌شده به <b dir="ltr">{phone}</b> را وارد کنید.
            </Typography>
            <TextField
              label="کد تأیید"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoFocus
              fullWidth
              slotProps={{ htmlInput: { dir: "ltr", maxLength: 6, autoComplete: "one-time-code" } }}
            />
            <Button type="submit" variant="contained" size="large" disabled={busy}>
              ادامه
            </Button>
            <Stack direction="row" justifyContent="space-between">
              <Button size="small" onClick={() => setStep("phone")}>
                تغییر شماره
              </Button>
              <Button size="small" disabled={busy || wait > 0} onClick={() => void sendCode()}>
                {wait > 0 ? `ارسال مجدد (${wait})` : "ارسال مجدد کد"}
              </Button>
            </Stack>
          </Stack>
        )}

        {step === "register" && (
          <Stack spacing={2} component="form" onSubmit={(e) => { e.preventDefault(); void register(); }}>
            <Alert severity="info">این شماره هنوز ثبت‌نام نشده است. فرم زیر را کامل کنید تا مدیر بررسی و تأیید کند.</Alert>
            <TextField
              label="نام و نام خانوادگی"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
              required
            />
            {services.length > 0 && (
              <Box>
                <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                  چه خدماتی انجام می‌دهید؟
                </Typography>
                <FormGroup>
                  {services.map((s) => (
                    <FormControlLabel
                      key={s.id}
                      control={
                        <Checkbox checked={form.service_ids.includes(s.id)} onChange={(e) => toggleService(s.id, e.target.checked)} />
                      }
                      label={s.name}
                    />
                  ))}
                </FormGroup>
              </Box>
            )}
            <TextField
              label="تخصص و سابقه (اختیاری)"
              placeholder="مثلاً: ۱۰ سال تعمیر یخچال ساید"
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              fullWidth
            />
            <TextField
              label="محدودهٔ فعالیت / آدرس (اختیاری)"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="شماره کارت یا شبا برای تسویه (اختیاری)"
              value={form.card_number}
              onChange={(e) => setForm({ ...form, card_number: e.target.value })}
              fullWidth
              slotProps={{ htmlInput: { dir: "ltr" } }}
            />
            <Button type="submit" variant="contained" size="large" disabled={busy}>
              ثبت‌نام
            </Button>
          </Stack>
        )}

        {(step === "pending" || step === "rejected") && (
          <Stack spacing={2} alignItems="center" sx={{ textAlign: "center", py: 2 }}>
            <HourglassTopIcon color={step === "pending" ? "warning" : "error"} sx={{ fontSize: 48 }} />
            <Typography fontWeight={700}>{step === "pending" ? "در انتظار تأیید مدیر" : "ثبت‌نام تأیید نشد"}</Typography>
            <Typography variant="body2" color="text.secondary">
              {statusMessage}
            </Typography>
            {step === "pending" && (
              <Typography variant="caption" color="text.secondary">
                پس از تأیید، پیامک ورود برایتان ارسال می‌شود و با همین شماره وارد می‌شوید.
              </Typography>
            )}
            <Button onClick={() => { setStep("phone"); setCode(""); }}>بازگشت</Button>
          </Stack>
        )}
      </Paper>

      <TechInstallBanner />
    </Stack>
  );
}

export default function TechLoginPage() {
  return (
    <Suspense fallback={null}>
      <TechLoginForm />
    </Suspense>
  );
}
