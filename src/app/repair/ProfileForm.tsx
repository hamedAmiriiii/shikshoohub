"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Avatar, Button, Stack, TextField, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { toast } from "react-toastify";
import { isRepairError, repairApi, type RepairRole } from "@/app/lib/repair/api";
import { useRepairAuth } from "./RepairAuth";
import { BankFields, SelfieInput, bankFieldsError, cardDigits, shebaDigits } from "./TechIdentity";
import { Loader, Section, useRequireRole } from "./ui";

export default function ProfileForm({ role }: { role: Extract<RepairRole, "customer" | "technician"> }) {
  const router = useRouter();
  const { allowed, user } = useRequireRole([role]);
  const { setUser, logout } = useRepairAuth();
  const isTech = role === "technician";
  const [form, setForm] = useState({ name: "", address: "", specialty: "", card_number: "", sheba: "" });
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || "",
      address: user.address || "",
      specialty: user.specialty || "",
      card_number: cardDigits(user.card_number || ""),
      sheba: shebaDigits(user.sheba || ""),
    });
  }, [user]);

  if (!allowed || !user) return <Loader />;

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("نام را وارد کنید.");
      return;
    }
    const bankError = isTech ? bankFieldsError(form.card_number, form.sheba) : null;
    if (bankError) {
      toast.error(bankError);
      return;
    }
    setBusy(true);
    const res = await repairApi.updateProfile({
      name: form.name.trim(),
      address: form.address.trim() || null,
      ...(isTech
        ? {
            specialty: form.specialty.trim() || null,
            card_number: cardDigits(form.card_number) || null,
            sheba: shebaDigits(form.sheba) || null,
          }
        : {}),
    });
    setBusy(false);
    if (isRepairError(res)) {
      toast.error(res.message);
      return;
    }
    setUser(res.user);
    toast.success("پروفایل ذخیره شد.");
  };

  const savePhoto = async (dataUrl: string) => {
    setPhotoBusy(true);
    const res = await repairApi.updatePhoto(dataUrl);
    setPhotoBusy(false);
    if (isRepairError(res)) {
      toast.error(res.message);
      return;
    }
    setUser(res.user);
    toast.success(res.message);
  };

  const handleLogout = async () => {
    await logout();
    router.replace(isTech ? "/repair/tech/login" : "/repair");
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Avatar src={user.photo_url || undefined} sx={{ bgcolor: "primary.main", width: 52, height: 52 }}>
          {(user.name || "؟").trim().charAt(0)}
        </Avatar>
        <div>
          <Typography fontWeight={800}>{user.name || "کاربر"}</Typography>
          <Typography variant="body2" color="text.secondary" dir="ltr" sx={{ textAlign: "right" }}>
            {user.phone}
          </Typography>
        </div>
      </Stack>

      {isTech && (
        <Section title="عکس سلفی">
          {!user.photo_url && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              برای امنیت مشتریان، عکس سلفی خود را ثبت کنید. این عکس هنگام ارجاع کار به مشتری نمایش داده می‌شود.
            </Alert>
          )}
          <SelfieInput value={user.photo_url || null} onChange={(dataUrl) => void savePhoto(dataUrl)} required busy={photoBusy} />
        </Section>
      )}

      <Section title="اطلاعات حساب">
        <Stack spacing={2}>
          <TextField label="نام و نام خانوادگی" value={form.name} onChange={set("name")} fullWidth required />
          <TextField
            label="شماره موبایل"
            value={user.phone}
            fullWidth
            disabled
            helperText="شماره موبایل قابل تغییر نیست."
            slotProps={{ htmlInput: { dir: "ltr" } }}
          />
          {isTech && (
            <TextField label="تخصص و سابقه" value={form.specialty} onChange={set("specialty")} fullWidth />
          )}
          <TextField
            label={isTech ? "محدودهٔ فعالیت / آدرس" : "آدرس پیش‌فرض"}
            value={form.address}
            onChange={set("address")}
            fullWidth
            multiline
            minRows={2}
          />
          {isTech && (
            <>
              <Typography variant="body2" fontWeight={700}>
                اطلاعات حساب برای تسویه
              </Typography>
              <BankFields
                card={form.card_number}
                sheba={form.sheba}
                onChange={({ card, sheba }) => setForm((f) => ({ ...f, card_number: card, sheba }))}
              />
            </>
          )}
          <Button variant="contained" size="large" onClick={() => void save()} disabled={busy}>
            ذخیره
          </Button>
        </Stack>
      </Section>

      <Button color="error" variant="outlined" startIcon={<LogoutIcon />} onClick={() => void handleLogout()}>
        خروج از حساب
      </Button>
    </Stack>
  );
}
