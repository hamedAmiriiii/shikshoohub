"use client";

import { useEffect, useState } from "react";
import { Button, FormControlLabel, MenuItem, Stack, Switch, TextField } from "@mui/material";
import { toast } from "react-toastify";
import { isRepairError, repairApi, type RepairLocationMode, type RepairSettings } from "@/app/lib/repair/api";
import { Loader, Section, useRequireRole } from "../../ui";

export default function RepairSettingsPage() {
  const { allowed } = useRequireRole(["admin"]);
  const [settings, setSettings] = useState<RepairSettings | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!allowed) return;
    void repairApi.adminSettings().then((res) => {
      if (!isRepairError(res)) setSettings(res.settings);
    });
  }, [allowed]);

  if (!allowed || !settings) return <Loader />;

  const set = (key: keyof RepairSettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSettings({ ...settings, [key]: e.target.value });

  const save = async () => {
    setBusy(true);
    const res = await repairApi.adminSaveSettings({
      ...settings,
      online_payment_enabled: settings.online_payment_enabled === "1",
      card_payment_enabled: settings.card_payment_enabled === "1",
    });
    setBusy(false);
    if (isRepairError(res)) {
      toast.error(res.message);
      return;
    }
    toast.success(res.message);
    setSettings(res.settings);
  };

  return (
    <Stack spacing={2}>
      <Section title="عمومی">
        <Stack spacing={2}>
          <TextField label="نام برند" value={settings.brand_name} onChange={set("brand_name")} fullWidth size="small" />
          <TextField
            label="تلفن پشتیبانی"
            value={settings.support_phone}
            onChange={set("support_phone")}
            fullWidth
            size="small"
            slotProps={{ htmlInput: { dir: "ltr" } }}
          />
          <TextField
            label="نوع خدمات (هر خط یک مورد)"
            value={settings.categories}
            onChange={set("categories")}
            fullWidth
            size="small"
            multiline
            minRows={4}
          />
          <TextField
            label="درصد پیش‌فرض سهم تعمیرکار از اجرت"
            value={settings.default_labor_share_percent}
            onChange={set("default_labor_share_percent")}
            fullWidth
            size="small"
            inputMode="decimal"
          />
        </Stack>
      </Section>

      <Section title="ثبت درخواست">
        <TextField
          select
          label="انتخاب لوکیشن روی نقشه"
          value={settings.location_mode}
          onChange={(e) => setSettings({ ...settings, location_mode: e.target.value as RepairLocationMode })}
          fullWidth
          size="small"
          helperText="نقشهٔ نشان در فرم درخواست تعمیر؛ برای نمایش نقشه NESHAN_MAP_KEY باید روی سرور تنظیم شده باشد."
        >
          <MenuItem value="off">نمایش داده نشود</MenuItem>
          <MenuItem value="optional">اختیاری</MenuItem>
          <MenuItem value="required">الزامی</MenuItem>
        </TextField>
      </Section>

      <Section title="پرداخت مشتری">
        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.online_payment_enabled === "1"}
                onChange={(e) => setSettings({ ...settings, online_payment_enabled: e.target.checked ? "1" : "0" })}
              />
            }
            label="پرداخت آنلاین (درگاه)"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.card_payment_enabled === "1"}
                onChange={(e) => setSettings({ ...settings, card_payment_enabled: e.target.checked ? "1" : "0" })}
              />
            }
            label="کارت به کارت با ارسال رسید"
          />
          <TextField
            label="شماره کارت"
            value={settings.card_number}
            onChange={set("card_number")}
            fullWidth
            size="small"
            slotProps={{ htmlInput: { dir: "ltr" } }}
          />
          <TextField label="نام صاحب کارت" value={settings.card_holder} onChange={set("card_holder")} fullWidth size="small" />
          <TextField label="بانک" value={settings.bank_name} onChange={set("bank_name")} fullWidth size="small" />
        </Stack>
      </Section>

      <Button variant="contained" size="large" onClick={() => void save()} disabled={busy}>
        ذخیرهٔ تنظیمات
      </Button>
    </Stack>
  );
}
