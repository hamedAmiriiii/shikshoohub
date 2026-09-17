"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import {
  fetchSmartThresholds,
  updateSmartThresholds,
  type SmartThresholds,
} from "@/app/lib/smartCustomer";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";

const FIELDS: { key: string; label: string; type?: "number" | "select"; options?: string[] }[] = [
  { key: "metrics_window", label: "پنجره RFM", type: "select", options: ["all", "90", "180", "365"] },
  { key: "vip_max_recency_days", label: "VIP: حداکثر روز از خرید" },
  { key: "vip_min_frequency", label: "VIP: حداقل تعداد خرید" },
  { key: "vip_min_monetary", label: "VIP: حداقل مبلغ" },
  { key: "loyal_max_recency_days", label: "وفادار: حداکثر روز" },
  { key: "loyal_min_frequency", label: "وفادار: حداقل خرید" },
  { key: "new_max_days_since_first", label: "جدید: حداکثر روز از اولین خرید" },
  { key: "new_max_frequency", label: "جدید: حداکثر تعداد خرید" },
  { key: "growing_min_purchases_90d", label: "در حال رشد: حداقل خرید ۹۰ روز" },
  { key: "at_risk_recency_multiplier", label: "ریزش: ضریب میانگین فاصله" },
  { key: "at_risk_min_recency_days", label: "ریزش: حداقل روز" },
  { key: "at_risk_min_frequency", label: "ریزش: حداقل سابقه خرید" },
  { key: "inactive_min_recency_days", label: "غیرفعال: حداقل روز" },
  { key: "churned_min_recency_days", label: "از دست رفته: حداقل روز" },
  { key: "high_value_min_monetary", label: "پرارزش: حداقل مبلغ" },
  { key: "low_value_max_monetary", label: "کم‌ارزش: حداکثر مبلغ" },
  { key: "near_vip_frequency_gap", label: "نزدیک VIP: فاصله تعداد خرید" },
  { key: "action_cooldown_days", label: "کول‌داون پیشنهاد (روز)" },
  { key: "winback_credit_amount", label: "اعتبار پیشنهادی بازگشت" },
  { key: "winback_revenue_factor", label: "ضریب ارزش تقریبی" },
];

export default function SmartClubThresholdsPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<SmartThresholds>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSmartThresholds();
      setForm((res.thresholds || {}) as SmartThresholds);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "خطا در دریافت آستانه‌ها"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onSave = async () => {
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const f of FIELDS) {
        if (form[f.key] !== undefined) payload[f.key] = form[f.key];
      }
      await updateSmartThresholds(payload);
      toast.success("ذخیره شد — برای اعمال، از داشبورد «محاسبه دوباره» بزنید");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "ذخیره ناموفق"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={adminPageSx}>
      <ToastContainer position="top-center" rtl />
      <Typography variant="h5" fontWeight={800} mb={1}>
        آستانه‌های سگمنت
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        رفتار رستوران با فروشگاه فرق دارد — این اعداد را برای کسب‌وکار خود تنظیم کنید.
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            {FIELDS.map((f) =>
              f.type === "select" ? (
                <TextField
                  key={f.key}
                  select
                  size="small"
                  label={f.label}
                  value={String(form[f.key] ?? "all")}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                >
                  {(f.options || []).map((o) => (
                    <MenuItem key={o} value={o}>
                      {o === "all" ? "همه عمر" : `${o} روز`}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  key={f.key}
                  size="small"
                  type="number"
                  label={f.label}
                  value={form[f.key] ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [f.key]: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                />
              ),
            )}
          </Box>
          <Button
            sx={{ mt: 2, ...adminButtonStartIconSx }}
            variant="contained"
            disabled={busy}
            onClick={() => void onSave()}
          >
            ذخیره آستانه‌ها
          </Button>
        </>
      )}
    </Box>
  );
}
