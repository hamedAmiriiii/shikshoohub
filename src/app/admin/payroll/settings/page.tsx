"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { adminPageSx } from "@/app/admin/theme/adminTheme";
import { extractSettings, type PayrollSettings } from "@/app/lib/payroll";
import { formatAmountNumber, parseAmountInput } from "@/app/lib/amountInput";

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

export default function PayrollSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PayrollSettings>({
    salary_hourly_wage: 0,
    salary_monthly_work_hours: 0,
  });

  const loadSettings = useCallback(async () => {
    const token = tokenCode();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await FetchWithJwtClient("GET", "/api/settings/payroll", token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت تنظیمات حقوق"));
        return;
      }
      setSettings(extractSettings(res));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async () => {
    setSaving(true);
    const token = tokenCode();
    const body = {
      salary_hourly_wage: Number(settings.salary_hourly_wage) || 0,
      salary_monthly_work_hours: Number(settings.salary_monthly_work_hours) || 0,
    };
    try {
      let res = await FetchWithJwtClient(
        "POST",
        "/api/settings/payroll",
        token,
        {},
        { body: JSON.stringify(body) },
      );
      if (res?.hasError) {
        res = await FetchWithJwtClient(
          "PUT",
          "/api/settings/payroll",
          token,
          {},
          { body: JSON.stringify(body) },
        );
      }
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در ذخیره تنظیمات حقوق"));
        return;
      }
      toast.success("تنظیمات حقوق ذخیره شد");
      await loadSettings();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ ...adminPageSx, p: 2, pb: 12 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <SettingsIcon sx={{ color: "var(--admin-accent)", fontSize: 30 }} />
        <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: "20px" }}>
          تنظیمات حقوق
        </Typography>
      </Box>

      <Card sx={{ border: "1px solid var(--admin-border)" }}>
        <CardContent>
          {loading ? (
            <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={26} />
            </Box>
          ) : (
            <>
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 13, mb: 2 }}>
                این مقادیر فقط پیش‌فرض فرم ثبت کارمند جدید هستند. حقوق هر فرد از پایه حقوق و ساعات همان کارمند محاسبه می‌شود.
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="حقوق پایه ساعتی (تومان)"
                    type="text"
                    inputMode="numeric"
                    value={settings.salary_hourly_wage ? formatAmountNumber(settings.salary_hourly_wage) : ""}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        salary_hourly_wage: parseAmountInput(e.target.value),
                      }))
                    }
                    sx={fieldSx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="ساعات کاری ماه"
                    type="number"
                    value={settings.salary_monthly_work_hours}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        salary_monthly_work_hours: Number(e.target.value) || 0,
                      }))
                    }
                    sx={fieldSx}
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                <Button variant="contained" onClick={saveSettings} disabled={saving}>
                  {saving ? "..." : "ذخیره تنظیمات"}
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      <ToastContainer position="bottom-right" rtl autoClose={3000} style={{ marginBottom: "76px" }} />
    </Box>
  );
}
