"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, FormControlLabel, MenuItem, Stack, Switch, TextField } from "@mui/material";
import { toast } from "react-toastify";
import { isRepairError, repairApi, type RepairLocationMode, type RepairMapProviderSetting, type RepairSettings } from "@/app/lib/repair/api";
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
          <Button component={Link} href="/repair/admin/services" variant="outlined" sx={{ alignSelf: "flex-start" }}>
            مدیریت نوع خدمات
          </Button>
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
          helperText="نمایش نقشه در فرم درخواست تعمیر برای انتخاب محل دقیق."
        >
          <MenuItem value="off">نمایش داده نشود</MenuItem>
          <MenuItem value="optional">اختیاری</MenuItem>
          <MenuItem value="required">الزامی</MenuItem>
        </TextField>
        <TextField
          select
          label="سرویس نقشه"
          value={settings.map_provider || "auto"}
          onChange={(e) => setSettings({ ...settings, map_provider: e.target.value as RepairMapProviderSetting })}
          fullWidth
          size="small"
          sx={{ mt: 2 }}
          helperText="نشان دقیق‌تر است و کلید می‌خواهد (NESHAN_MAP_KEY روی سرور). OpenStreetMap رایگان و بدون کلید است و خیابان‌ها را فارسی نشان می‌دهد."
        >
          <MenuItem value="auto">خودکار (نشان اگر کلید داشت، وگرنه OpenStreetMap)</MenuItem>
          <MenuItem value="neshan">نشان</MenuItem>
          <MenuItem value="osm">OpenStreetMap (رایگان)</MenuItem>
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
