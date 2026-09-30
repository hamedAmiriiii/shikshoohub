"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
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
import AddIcon from "@mui/icons-material/Add";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
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
  SMART_TAG_LABELS,
  smartSegmentLabel,
  toFaNum,
  updateSmartCampaign,
  type SmartCampaign,
} from "@/app/lib/smartCustomer";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import CampaignReportDialog from "./CampaignReportDialog";
import ProductCampaignDialog from "./ProductCampaignDialog";

const panelSx = {
  boxShadow: "none",
  bgcolor: "var(--admin-surface)",
  border: "1px solid var(--admin-border)",
  borderRadius: "12px",
  p: 1.25,
  mb: 1,
} as const;

const STATUS_SHORT: Record<string, string> = {
  draft: "پیش‌نویس",
  active: "فعال",
  paused: "متوقف",
};

const STATUS_SX: Record<string, { color: string; bg: string }> = {
  draft: { color: "var(--admin-text)", bg: "var(--admin-surface-alt)" },
  active: { color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  paused: { color: "#f59e0b", bg: "rgba(245,158,11,0.14)" },
};

const FIELD_CHIP: Record<string, (op: string, value: string) => string> = {
  recency_days: (_op, value) => `${value} روز بی‌خرید`,
  frequency: (_op, value) => `حداقل ${value} خرید`,
  monetary: (_op, value) => `خرید از ${value} تومان`,
  avg_days_between: (_op, value) => `فاصله خرید ${value} روز`,
  avg_order_value: (_op, value) => `فاکتور از ${value} تومان`,
  purchase_count_30d: (_op, value) => `${value} خرید در ۳۰ روز`,
  purchase_count_90d: (_op, value) => `${value} خرید در ۹۰ روز`,
};

const ACTION_LABEL: Record<string, string> = {
  grant_credit: "اعتبار هدیه",
  send_sms: "پیامک",
};

function formatValue(value: unknown) {
  if (typeof value === "number" || (typeof value === "string" && value !== "" && !Number.isNaN(Number(value)))) {
    return toFaNum(value);
  }
  return String(value ?? "—");
}

function formatRule(rule: { field: string; op: string; value: unknown }) {
  if (rule.field === "primary_segment") return `گروه: ${smartSegmentLabel(String(rule.value ?? ""))}`;
  if (rule.field === "tags") {
    const key = String(rule.value ?? "");
    return `وضعیت: ${SMART_TAG_LABELS[key] || key}`;
  }
  if (rule.field === "phone") {
    const count = Array.isArray(rule.value) ? rule.value.length : 1;
    return `${toFaNum(count)} مشتری انتخابی`;
  }
  const value = formatValue(rule.value);
  const builder = FIELD_CHIP[rule.field];
  if (builder) return builder(rule.op, value);
  return `${rule.field} ${value}`;
}

function actionChips(actions: SmartCampaign["actions"]) {
  if (!actions?.length) return ["اقدامی ندارد"];
  return actions.map((a) => {
    if (a.type === "grant_credit" && a.config?.amount != null) {
      const days = Number(a.config?.expires_days);
      const amount = `${toFaNum(a.config.amount)} تومان`;
      if (Number.isFinite(days) && days > 0) return `اعتبار ${amount} · ${toFaNum(days)} روز`;
      return `اعتبار ${amount}`;
    }
    const productNames = a.config?.product_names;
    if (a.type === "send_sms" && Array.isArray(productNames) && productNames.length) {
      const first = String(productNames[0]);
      return productNames.length > 1
        ? `پیامک کالایی: ${first} و ${toFaNum(productNames.length - 1)} کالا`
        : `پیامک کالایی: ${first}`;
    }
    return ACTION_LABEL[a.type] || a.type;
  });
}

function Chip({ children, tone }: { children: ReactNode; tone?: "status" | "muted" }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 0.85,
        py: 0.25,
        borderRadius: "8px",
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1.4,
        bgcolor: tone === "muted" ? "var(--admin-surface-alt)" : "rgba(120,181,104,0.12)",
        color: "var(--admin-text)",
        border: "1px solid var(--admin-border)",
      }}
    >
      {children}
    </Box>
  );
}

const defaultForm = {
  name: "بازگشت مشتریان غیرفعال",
  status: "draft",
  cooldown_days: 1000,
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
  const [createOpen, setCreateOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [runTarget, setRunTarget] = useState<SmartCampaign | null>(null);
  const [reportTarget, setReportTarget] = useState<SmartCampaign | null>(null);

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
      setCreateOpen(false);
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
    <Box sx={{ ...adminPageSx, p: 1.5, pb: 10, color: "var(--admin-text)" }}>
      <ToastContainer position="top-center" rtl />
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 17 }}>کمپین‌ها</Typography>
          <Typography sx={{ fontSize: 12, opacity: 0.7 }}>اعتبار و پیامک برای مشتری‌هایی که مدتی نیامده‌اند</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 0.75 }}>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={adminButtonStartIconSx}
          >
            ایجاد کمپین
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Inventory2OutlinedIcon />}
            onClick={() => setProductOpen(true)}
            sx={adminButtonStartIconSx}
          >
            کمپین کالایی
          </Button>
          <Button component={Link} href="/admin/smart-club" size="small" variant="outlined">
            داشبورد
          </Button>
        </Box>
      </Box>

      <Dialog
        open={createOpen}
        onClose={() => {
          if (!busy) setCreateOpen(false);
        }}
        fullWidth
        maxWidth="sm"
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
        <DialogTitle sx={{ fontWeight: 800, fontSize: 14, pb: 0.5 }}>کمپین جدید</DialogTitle>
        <DialogContent>
          {/* <Typography variant="body2" sx={{ color: "var(--admin-text-muted)", mb: 1.5 }}>
            مشتریانی را انتخاب می‌کنی که مدتی خرید نکرده‌اند؛ بعد خودت دکمه اجرا را می‌زنی تا اعتبار و پیامک برود.
          </Typography> */}
          <Box
            sx={{
              display: "grid",
              gap: 1,
              pt: 0.5,
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              "& .MuiInputBase-input": { fontSize: 12 },
              "& .MuiInputLabel-root": { fontSize: 12 },
              "& .MuiInputLabel-shrink": { fontSize: 13 },
              "& .MuiFormHelperText-root": { fontSize: 10.5 },
            }}
          >
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
              helperText=""
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              SelectProps={{
                MenuProps: { PaperProps: { sx: { "& .MuiMenuItem-root": { fontSize: 12 } } } },
              }}
            >
              <MenuItem value="draft">پیش‌نویس</MenuItem>
              <MenuItem value="active">فعال</MenuItem>
              <MenuItem value="paused">متوقف</MenuItem>
            </TextField>
            <TextField
              size="small"
              type="number"
              label="چند روز از آخرین خرید گذشته باشد"
              helperText=""
              value={form.recency_days}
              onChange={(e) => setForm((f) => ({ ...f, recency_days: Number(e.target.value) }))}
            />
            <TextField
              size="small"
              type="number"
              label="حداقل چند بار قبلاً خرید کرده باشد"
              helperText=""
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
              helperText=""
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
              label="متن پیامک"
              value={form.sms_message}
              onChange={(e) => setForm((f) => ({ ...f, sms_message: e.target.value }))}
              sx={{ gridColumn: { md: "1 / -1" } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1, justifyContent: "flex-start", "& .MuiButton-root": { fontSize: 12 } }}>
          <Button
            variant="contained"
            disabled={busy}
            onClick={() => void onCreate()}
            startIcon={busy ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            ذخیره کمپین
          </Button>
          <Button
            onClick={() => setCreateOpen(false)}
            disabled={busy}
            sx={{ color: "var(--admin-text-secondary)" }}
          >
            انصراف
          </Button>
        </DialogActions>
      </Dialog>

      {loading ? (
        <CircularProgress />
      ) : campaigns.length === 0 ? (
        <Box sx={panelSx}>
          <Typography color="text.secondary">هنوز کمپینی نساختی.</Typography>
        </Box>
      ) : (
        campaigns.map((c) => {
          const rules = (c.conditions?.all || []).map(formatRule);
          const actions = actionChips(c.actions);
          const status = STATUS_SX[c.status] || STATUS_SX.draft;
          return (
            <Box key={c.id} sx={panelSx}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center", mb: 1 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 14, lineHeight: 1.3 }}>{c.name}</Typography>
                <Box
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    px: 1,
                    py: 0.3,
                    borderRadius: "8px",
                    bgcolor: status.bg,
                    color: status.color,
                  }}
                >
                  {STATUS_SHORT[c.status] || c.status}
                </Box>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6, mb: 0.75 }}>
                {(rules.length ? rules : ["بدون شرط"]).map((rule) => (
                  <Chip key={rule} tone="muted">
                    {rule}
                  </Chip>
                ))}
                {actions.map((action) => (
                  <Chip key={action}>{action}</Chip>
                ))}
              </Box>
              {c.max_recipients_per_run ? (
                <Typography sx={{ fontSize: 11, opacity: 0.7, mb: 1 }}>
                  حداکثر {toFaNum(c.max_recipients_per_run)} نفر
                </Typography>
              ) : null}
              <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                <Button size="small" variant="outlined" onClick={() => void onPreview(c.id)} sx={{ fontSize: 12, py: 0.25 }}>
                  چند نفر؟
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disabled={busy || c.status !== "active"}
                  onClick={() => setRunTarget(c)}
                  sx={{ fontSize: 12, py: 0.25 }}
                >
                  اجرا
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setReportTarget(c)}
                  sx={{ fontSize: 12, py: 0.25 }}
                >
                  بررسی کمپین
                </Button>
                <Button size="small" onClick={() => void onToggleActive(c)} sx={{ fontSize: 12, py: 0.25 }}>
                  {c.status === "active" ? "توقف" : "فعال کن"}
                </Button>
                <Button size="small" color="error" onClick={() => void onDelete(c.id)} sx={{ fontSize: 12, py: 0.25 }}>
                  حذف
                </Button>
              </Box>
            </Box>
          );
        })
      )}

      <CampaignReportDialog campaign={reportTarget} onClose={() => setReportTarget(null)} />
      <ProductCampaignDialog open={productOpen} onClose={() => setProductOpen(false)} onCreated={() => void load()} />

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
