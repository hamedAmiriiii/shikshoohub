"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { toast } from "react-toastify";
import { isRepairError, repairApi, toLatinDigits, type LatLng } from "@/app/lib/repair/api";
import { LocationPicker, mapSourceFrom } from "../../NeshanMap";
import { useRepairAuth } from "../../RepairAuth";
import { Loader, Section, useRequireRole } from "../../ui";

export default function NewRepairRequestPage() {
  const router = useRouter();
  const { allowed, user } = useRequireRole(["customer"]);
  const { config } = useRepairAuth();
  const [form, setForm] = useState({
    service_id: "",
    description: "",
    address: "",
    contact_name: "",
    contact_phone: "",
    preferred_time: "",
  });
  const [location, setLocation] = useState<LatLng | null>(null);
  const [busy, setBusy] = useState(false);
  const locationMode = config?.location_mode || "off";
  const realServices = (config?.services || []).filter((s) => s.id > 0);
  const useServiceIds = realServices.length > 0;
  const serviceOptions = useServiceIds
    ? realServices.map((s) => ({ value: String(s.id), label: s.name }))
    : (config?.categories || []).map((name) => ({ value: name, label: name }));

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      contact_name: f.contact_name || user.name || "",
      contact_phone: f.contact_phone || user.phone || "",
      address: f.address || user.address || "",
    }));
  }, [user]);

  if (!allowed) return <Loader />;

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    if (serviceOptions.length > 0 && !form.service_id) {
      toast.error("نوع خدمت را انتخاب کنید.");
      return;
    }
    if (form.description.trim().length < 5) {
      toast.error("مشکل را کمی کامل‌تر توضیح دهید.");
      return;
    }
    if (form.address.trim().length < 5) {
      toast.error("آدرس را وارد کنید.");
      return;
    }
    if (locationMode === "required" && !location) {
      toast.error("موقعیت را روی نقشه انتخاب کنید.");
      return;
    }
    setBusy(true);
    const withLocation = locationMode !== "off" && location;
    const res = await repairApi.createRequest({
      service_id: useServiceIds && form.service_id ? Number(form.service_id) : undefined,
      category: !useServiceIds && form.service_id ? form.service_id : undefined,
      description: form.description.trim(),
      address: form.address.trim(),
      latitude: withLocation ? location.lat : undefined,
      longitude: withLocation ? location.lng : undefined,
      contact_name: form.contact_name.trim() || undefined,
      contact_phone: toLatinDigits(form.contact_phone).replace(/\D/g, "") || undefined,
      preferred_time: form.preferred_time.trim() || undefined,
    });
    setBusy(false);
    if (isRepairError(res)) {
      toast.error(res.message);
      return;
    }
    toast.success(res.message);
    router.replace(`/repair/requests/${res.request.id}`);
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight={800}>
        درخواست تعمیرکار
      </Typography>
      <Section>
        <Stack spacing={2}>
          {serviceOptions.length > 0 && (
            <TextField select label="نوع خدمت" value={form.service_id} onChange={set("service_id")} fullWidth required>
              {serviceOptions.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            label="شرح مشکل"
            placeholder="مثلاً: لباسشویی آب را تخلیه نمی‌کند"
            value={form.description}
            onChange={set("description")}
            multiline
            minRows={3}
            fullWidth
            required
          />
          {locationMode !== "off" && config && (
            <LocationPicker
              source={mapSourceFrom(config)}
              value={location}
              onChange={setLocation}
              required={locationMode === "required"}
              onAddress={(address) => setForm((f) => ({ ...f, address: f.address.trim() ? `${address}، ${f.address.trim()}` : address }))}
            />
          )}
          <TextField
            label="آدرس"
            placeholder="آدرس دقیق، پلاک، واحد"
            value={form.address}
            onChange={set("address")}
            multiline
            minRows={2}
            fullWidth
            required
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label="نام" value={form.contact_name} onChange={set("contact_name")} fullWidth />
            <TextField
              label="شماره تماس"
              value={form.contact_phone}
              onChange={set("contact_phone")}
              fullWidth
              inputMode="tel"
              slotProps={{ htmlInput: { dir: "ltr" } }}
            />
          </Stack>
          <TextField
            label="زمان مناسب مراجعه (اختیاری)"
            placeholder="مثلاً: فردا عصر"
            value={form.preferred_time}
            onChange={set("preferred_time")}
            fullWidth
          />
          <Button variant="contained" size="large" onClick={() => void submit()} disabled={busy}>
            ثبت درخواست
          </Button>
        </Stack>
      </Section>
    </Stack>
  );
}
