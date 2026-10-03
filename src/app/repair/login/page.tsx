"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { toast } from "react-toastify";
import { isRepairError, repairApi, repairHomeFor, toLatinDigits } from "@/app/lib/repair/api";
import { useRepairAuth } from "../RepairAuth";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, ready, login } = useRepairAuth();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);

  const next = params.get("next");

  useEffect(() => {
    if (ready && user) {
      router.replace(next && next.startsWith("/repair") ? next : repairHomeFor(user.role));
    }
  }, [ready, user, next, router]);

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
    setIsNew(res.is_new);
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
    const res = await repairApi.verify(phone, normalizedCode, name.trim() || undefined);
    setBusy(false);
    if (isRepairError(res)) {
      toast.error(res.message);
      return;
    }
    login(res.token, res.user);
    router.replace(next && next.startsWith("/repair") ? next : repairHomeFor(res.user.role));
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, maxWidth: 420, mx: "auto", mt: { xs: 2, sm: 6 } }}>
      <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
        ورود / ثبت‌نام
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      با شمارهٔ موبایل وارد می‌شوند.
      </Typography>

      {step === "phone" ? (
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
        </Stack>
      ) : (
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
          {isNew && (
            <TextField label="نام و نام خانوادگی" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          )}
          <Button type="submit" variant="contained" size="large" disabled={busy}>
            ورود
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
    </Paper>
  );
}

export default function RepairLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
