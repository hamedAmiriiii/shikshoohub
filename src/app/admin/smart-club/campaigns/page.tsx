"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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

const STATUS_LABEL: Record<string, string> = {
  draft: "پیش‌نویس — هنوز اجرا نمی‌شود",
  active: "فعال — می‌توانی اجرا کنی",
  paused: "متوقف",
};

const STATUS_SHORT: Record<string, string> = {
  draft: "پیش‌نویس",
  active: "فعال",
  paused: "متوقف",
};

const FIELD_PHRASE: Record<string, (op: string, value: string) => string> = {
  recency_days: (op, value) =>
    op === "<=" || op === "<"
      ? `حداکثر ${value} روز از آخرین خرید گذشته باشد`
      : `حداقل ${value} روز از آخرین خرید گذشته باشد`,
  frequency: (op, value) =>
    op === "<=" || op === "<"
      ? `حداکثر ${value} بار خرید کرده باشند`
      : `حداقل ${value} بار از فروشگاه خرید کرده باشند`,
  monetary: (_op, value) => `جمع خریدشان حداقل ${value} تومان باشد`,
  avg_days_between: (_op, value) => `فاصله معمول بین خریدهایشان حدود ${value} روز باشد`,
  avg_order_value: (_op, value) => `میانگین هر فاکتورشان حداقل ${value} تومان باشد`,
  purchase_count_30d: (_op, value) => `در ۳۰ روز اخیر حداقل ${value} بار خرید کرده باشند`,
  purchase_count_90d: (_op, value) => `در ۹۰ روز اخیر حداقل ${value} بار خرید کرده باشند`,
};

const ACTION_LABEL: Record<string, string> = {
  grant_credit: "اعتبار هدیه به کیف پول",
  send_sms: "ارسال پیامک",
};

function formatValue(value: unknown) {
  if (typeof value === "number" || (typeof value === "string" && value !== "" && !Number.isNaN(Number(value)))) {
    return toFaNum(value);
  }
  return String(value ?? "—");
}

function formatRule(rule: { field: string; op: string; value: unknown }) {
  const value = formatValue(rule.value);
  const builder = FIELD_PHRASE[rule.field];
  if (builder) return builder(rule.op, value);
  const op =
    rule.op === ">="
      ? "حداقل"
      : rule.op === "<="
        ? "حداکثر"
        : rule.op === ">"
          ? "بیشتر از"
          : rule.op === "<"
            ? "کمتر از"
            : "برابر";
  return `${rule.field} ${op} ${value}`;
}

function formatActions(actions: SmartCampaign["actions"]) {
  if (!actions?.length) return "هنوز اقدامی تعریف نشده";
  return actions
    .map((a) => {
      const base = ACTION_LABEL[a.type] || a.type;
      const amount = a.config?.amount;
      if (a.type === "grant_credit" && amount != null) {
        const days = Number(a.config?.expires_days);
        const until = typeof a.config?.expires_at === "string" ? a.config.expires_at : "";
        let extra = "";
        if (Number.isFinite(days) && days > 0) {
          extra = ` — مهلت استفاده ${toFaNum(days)} روز`;
        } else if (until) {
          extra = ` — تا ${until} قابل استفاده`;
        }
        return `${base} (${toFaNum(amount)} تومان)${extra}`;
      }
      return base;
    })
    .join(" و ");
}

const defaultForm = {
  name: "بازگشت مشتریان غیرفعال",
  status: "draft",
  cooldown_days: 4,
  max_recipients_per_run: 50,
  description: "",
  recency_days: 45,
  frequency: 3,
  credit: 100000,
  credit_expires_days: 14,
  sms_message: "مدت‌هاست خرید نکرده‌اید؛ با اعتبار هدیه منتظر شما هستیم.",
};

export default function SmartClubCampaignsPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<SmartCampaign[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [busy, setBusy] = useState(false);
  const [runTarget, setRunTarget] = useState<SmartCampaign | null>(null);

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
          { type: "grant_credit", config: { amount: form.credit, mode: "add", expires_days: form.credit_expires_days } },
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
      toast.info(
        `${toFaNum(res.matched)} مشتری با این شرایط جور می‌شوند` +
          (res.estimated_revenue
            ? ` — ارزش تقریبی خرید برگشتی ${toFaNum(res.estimated_revenue)} تومان`
            : ""),
      );
    } catch (e) {
      toast.error(getApiErrorMessage(e, "پیش‌نمایش ناموفق"));
    }
  };

  const onRun = async (id: number) => {
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
          `انجام شد: ${toFaNum(res.matched)} مشتری انتخاب شد، ${toFaNum(res.sent)} پیام/اعتبار رفت` +
            ((res.skipped || 0) > 0 ? `، ${toFaNum(res.skipped)} نفر به‌خاطر فاصله زمانی رد شدند` : "") +
            ((res.failed || 0) > 0 ? `، ${toFaNum(res.failed)} ناموفق` : ""),
        );
      }
      setRunTarget(null);
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
        <Typography fontWeight={700} mb={0.5}>
          کمپین جدید
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={1.5}>
          مشتریانی را انتخاب می‌کنی که مدتی خرید نکرده‌اند؛ بعد خودت دکمه اجرا را می‌زنی تا اعتبار و پیامک برود.
        </Typography>
        <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          <TextField
            size="small"
            label="نام کمپین"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <TextField
            select
            size="small"
            label="وضعیت"
            helperText="پیش‌نویس یعنی ذخیره شود ولی اجرا نشود"
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
            label="چند روز از آخرین خرید گذشته باشد"
            helperText="مثلاً ۴۵ یعنی حداقل یک ماه و نیم خرید نکرده"
            value={form.recency_days}
            onChange={(e) => setForm((f) => ({ ...f, recency_days: Number(e.target.value) }))}
          />
          <TextField
            size="small"
            type="number"
            label="حداقل چند بار قبلاً خرید کرده باشد"
            helperText="تا مشتری تازه‌وارد بی‌دلیل پیام نگیرد"
            value={form.frequency}
            onChange={(e) => setForm((f) => ({ ...f, frequency: Number(e.target.value) }))}
          />
          <TextField
            size="small"
            type="number"
            label="اعتبار هدیه (تومان)"
            value={form.credit}
            onChange={(e) => setForm((f) => ({ ...f, credit: Number(e.target.value) }))}
          />
          <TextField
            size="small"
            type="number"
            label="مهلت استفاده اعتبار (روز)"
            helperText="بعد از این مدت اگر خرید نکند، این اعتبار دیگر تعلق نمی‌گیرد"
            value={form.credit_expires_days}
            onChange={(e) => setForm((f) => ({ ...f, credit_expires_days: Number(e.target.value) }))}
          />
          <TextField
            size="small"
            type="number"
            label="حداکثر نفر در هر اجرا"
            value={form.max_recipients_per_run}
            onChange={(e) =>
              setForm((f) => ({ ...f, max_recipients_per_run: Number(e.target.value) }))
            }
          />
          <TextField
            size="small"
            type="number"
            label="فاصله زمانی بین دو پیام به یک مشتری (روز)"
            helperText="اگر اخیراً پیام گرفته، تا این تعداد روز دوباره برایش اجرا نمی‌شود"
            value={form.cooldown_days}
            onChange={(e) => setForm((f) => ({ ...f, cooldown_days: Number(e.target.value) }))}
            sx={{ gridColumn: { md: "1 / -1" } }}
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
      ) : campaigns.length === 0 ? (
        <Box sx={panelSx}>
          <Typography color="text.secondary">هنوز کمپینی نساختی.</Typography>
        </Box>
      ) : (
        campaigns.map((c) => {
          const rules = (c.conditions?.all || []).map(formatRule);
          return (
            <Box key={c.id} sx={panelSx}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start", mb: 0.75 }}>
                <Typography fontWeight={700}>{c.name}</Typography>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    px: 1,
                    py: 0.25,
                    borderRadius: "8px",
                    bgcolor: "var(--admin-surface-alt)",
                    color: "var(--admin-text-secondary)",
                  }}
                >
                  {STATUS_LABEL[c.status] || STATUS_SHORT[c.status] || c.status}
                </Typography>
              </Box>
              {c.description ? (
                <Typography variant="body2" color="text.secondary" mb={0.75}>
                  {c.description}
                </Typography>
              ) : null}
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                این کمپین برای مشتریانی است که:
              </Typography>
              <Box component="ul" sx={{ m: 0, mb: 1, pr: 2.5 }}>
                {rules.length ? (
                  rules.map((rule) => (
                    <Typography component="li" key={rule} variant="body2" color="text.secondary">
                      {rule}
                    </Typography>
                  ))
                ) : (
                  <Typography component="li" variant="body2" color="text.secondary">
                    شرط خاصی ندارد
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" mb={0.35}>
                کار کمپین: {formatActions(c.actions)}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={0.35}>
                فاصله بین دو پیام به یک نفر: {toFaNum(c.cooldown_days)} روز
              </Typography>
              {c.max_recipients_per_run ? (
                <Typography variant="body2" color="text.secondary" mb={1}>
                  در هر اجرا حداکثر {toFaNum(c.max_recipients_per_run)} نفر
                </Typography>
              ) : (
                <Box mb={1} />
              )}
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button size="small" variant="outlined" onClick={() => void onPreview(c.id)}>
                  چند نفر جور می‌شوند؟
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disabled={busy || c.status !== "active"}
                  onClick={() => setRunTarget(c)}
                >
                  اجرا کن
                </Button>
                <Button size="small" onClick={() => void onToggleActive(c)}>
                  {c.status === "active" ? "متوقف کن" : "فعال کن"}
                </Button>
                <Button size="small" color="error" onClick={() => void onDelete(c.id)}>
                  حذف
                </Button>
              </Box>
              {c.status !== "active" ? (
                <Typography variant="caption" color="text.secondary" display="block" mt={0.75}>
                  برای اجرا، اول «فعال کن» را بزن. پیش‌نویس یعنی فقط ذخیره شده.
                </Typography>
              ) : null}
            </Box>
          );
        })
      )}

      <Dialog
        open={Boolean(runTarget)}
        onClose={() => {
          if (!busy) setRunTarget(null);
        }}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            bgcolor: "var(--admin-surface)",
            color: "var(--admin-text)",
            border: "1px solid var(--admin-border)",
            borderRadius: "16px",
            direction: "rtl",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 18, pb: 1 }}>اجرای کمپین</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 15, lineHeight: 1.9 }}>
            از اجرای کمپین و ارسال پیامک اطمینان دارید؟
          </Typography>
          {runTarget ? (
            <Typography sx={{ mt: 1, fontSize: 13, color: "var(--admin-text-secondary)" }}>
              {runTarget.name}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1, justifyContent: "flex-start" }}>
          <Button
            onClick={() => setRunTarget(null)}
            disabled={busy}
            sx={{ color: "var(--admin-text-secondary)" }}
          >
            انصراف
          </Button>
          <Button
            variant="contained"
            disabled={busy || !runTarget}
            onClick={() => {
              if (runTarget) void onRun(runTarget.id);
            }}
            sx={{
              bgcolor: "var(--admin-accent)",
              "&:hover": { bgcolor: "var(--admin-accent-hover)" },
            }}
          >
            {busy ? "در حال اجرا..." : "بله، اجرا شود"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
