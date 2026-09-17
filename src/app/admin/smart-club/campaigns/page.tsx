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
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import {
  createSmartCampaign,
  deleteSmartCampaign,
  fetchSmartCampaigns,
  previewSmartCampaign,
  runSmartCampaign,
  toFaNum,
  updateSmartCampaign,
  type SmartCampaign,
} from "@/app/lib/smartCustomer";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";

const panelSx = {
  boxShadow: "none",
  bgcolor: "var(--admin-surface)",
  border: "1px solid var(--admin-border)",
  borderRadius: "12px",
  p: 2,
  mb: 1.5,
} as const;

const defaultForm = {
  name: "بازگشت مشتریان غیرفعال",
  status: "draft",
  cooldown_days: 4,
  max_recipients_per_run: 50,
  description: "",
  recency_days: 45,
  frequency: 3,
  credit: 100000,
  sms_message: "مدت‌هاست خرید نکرده‌اید؛ با اعتبار هدیه منتظر شما هستیم.",
};

export default function SmartClubCampaignsPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<SmartCampaign[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSmartCampaigns();
      setCampaigns(res.campaigns || []);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "خطا در دریافت کمپین‌ها"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onCreate = async () => {
    setBusy(true);
    try {
      await createSmartCampaign({
        name: form.name,
        status: form.status,
        cooldown_days: form.cooldown_days,
        max_recipients_per_run: form.max_recipients_per_run || null,
        description: form.description || null,
        conditions: {
          all: [
            { field: "recency_days", op: ">=", value: form.recency_days },
            { field: "frequency", op: ">=", value: form.frequency },
          ],
        },
        actions: [
          { type: "grant_credit", config: { amount: form.credit, mode: "add" } },
          { type: "send_sms", config: { message: form.sms_message } },
        ],
      });
      toast.success("کمپین ساخته شد");
      setForm(defaultForm);
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "ساخت کمپین ناموفق"));
    } finally {
      setBusy(false);
    }
  };

  const onPreview = async (id: number) => {
    try {
      const res = await previewSmartCampaign(id);
      toast.info(`تطبیق: ${toFaNum(res.matched)} نفر | ارزش تقریبی ${toFaNum(res.estimated_revenue)}`);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "پیش‌نمایش ناموفق"));
    }
  };

  const onRun = async (id: number) => {
    if (!confirm("اجرای کمپین اعتبار و پیامک واقعی ارسال می‌کند. ادامه؟")) return;
    setBusy(true);
    try {
      const res = (await runSmartCampaign(id)) as {
        ok?: boolean;
        message?: string;
        matched?: number;
        sent?: number;
        skipped?: number;
        failed?: number;
      };
      if (res.ok === false) {
        toast.error(res.message || "اجرا ناموفق");
      } else {
        toast.success(
          `اجرا شد — match:${res.matched} sent:${res.sent} skip:${res.skipped} fail:${res.failed}`,
        );
      }
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "اجرا ناموفق"));
    } finally {
      setBusy(false);
    }
  };

  const onToggleActive = async (c: SmartCampaign) => {
    try {
      await updateSmartCampaign(c.id, {
        status: c.status === "active" ? "paused" : "active",
      });
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "تغییر وضعیت ناموفق"));
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("حذف کمپین؟")) return;
    try {
      await deleteSmartCampaign(id);
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "حذف ناموفق"));
    }
  };

  return (
    <Box sx={adminPageSx}>
      <ToastContainer position="top-center" rtl />
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5" fontWeight={800}>
          کمپین‌ها
        </Typography>
        <Button component={Link} href="/admin/smart-club" variant="outlined">
          داشبورد
        </Button>
      </Box>

      <Box sx={panelSx}>
        <Typography fontWeight={700} mb={1}>
          کمپین جدید (فاز ۱: اجرای دستی)
        </Typography>
        <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          <TextField
            size="small"
            label="نام"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <TextField
            select
            size="small"
            label="وضعیت"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            <MenuItem value="draft">پیش‌نویس</MenuItem>
            <MenuItem value="active">فعال</MenuItem>
            <MenuItem value="paused">متوقف</MenuItem>
          </TextField>
          <TextField
            size="small"
            type="number"
            label="حداقل روز از آخرین خرید"
            value={form.recency_days}
            onChange={(e) => setForm((f) => ({ ...f, recency_days: Number(e.target.value) }))}
          />
          <TextField
            size="small"
            type="number"
            label="حداقل تعداد خرید"
            value={form.frequency}
            onChange={(e) => setForm((f) => ({ ...f, frequency: Number(e.target.value) }))}
          />
          <TextField
            size="small"
            type="number"
            label="اعتبار هدیه"
            value={form.credit}
            onChange={(e) => setForm((f) => ({ ...f, credit: Number(e.target.value) }))}
          />
          <TextField
            size="small"
            type="number"
            label="سقف هر اجرا"
            value={form.max_recipients_per_run}
            onChange={(e) =>
              setForm((f) => ({ ...f, max_recipients_per_run: Number(e.target.value) }))
            }
          />
          <TextField
            size="small"
            label="متن پیامک"
            value={form.sms_message}
            onChange={(e) => setForm((f) => ({ ...f, sms_message: e.target.value }))}
            sx={{ gridColumn: { md: "1 / -1" } }}
          />
        </Box>
        <Button
          sx={{ mt: 1.5, ...adminButtonStartIconSx }}
          variant="contained"
          disabled={busy}
          onClick={() => void onCreate()}
        >
          ذخیره کمپین
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        campaigns.map((c) => (
          <Box key={c.id} sx={panelSx}>
            <Typography fontWeight={700}>
              {c.name}{" "}
              <Typography component="span" variant="caption" color="text.secondary">
                ({c.status})
              </Typography>
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={1}>
              کول‌داون {c.cooldown_days} روز — قوانین:{" "}
              {(c.conditions?.all || [])
                .map((r) => `${r.field} ${r.op} ${String(r.value)}`)
                .join(" و ")}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button size="small" variant="outlined" onClick={() => void onPreview(c.id)}>
                پیش‌نمایش
              </Button>
              <Button
                size="small"
                variant="contained"
                disabled={busy || c.status !== "active"}
                onClick={() => void onRun(c.id)}
              >
                اجرای دستی
              </Button>
              <Button size="small" onClick={() => void onToggleActive(c)}>
                {c.status === "active" ? "توقف" : "فعال‌سازی"}
              </Button>
              <Button size="small" color="error" onClick={() => void onDelete(c.id)}>
                حذف
              </Button>
            </Box>
          </Box>
        ))
      )}
    </Box>
  );
}
