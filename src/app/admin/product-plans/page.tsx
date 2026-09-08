"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import GroupsIcon from "@mui/icons-material/Groups";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { isSuperAdminUser } from "@/app/lib/superAdmin";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import { formatYadinoToman, groupYadinoTiers, type YadinoPlan } from "@/app/landing/yadinoPlans";

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

type PlanForm = {
  name: string;
  max_users: string;
  max_videos: string;
  duration_days: string;
  duration_label: string;
  price_toman: string;
  features: string;
  is_active: boolean;
};

const emptyForm: PlanForm = {
  name: "",
  max_users: "5",
  max_videos: "4",
  duration_days: "180",
  duration_label: "شش‌ماهه",
  price_toman: "",
  features: [
    "تا ۵ کاربر همزمان",
    "زمان برگزاری نامحدود",
    "تا ۴ ویدئو همزمان",
    "پیام‌رسان اختصاصی",
    "ایجاد چند کلاس و جلسه همزمان",
    "اشتراک‌گذاری تصویر",
    "اشتراک‌گذاری تخته",
  ].join("\n"),
  is_active: true,
};

function toForm(plan: YadinoPlan | null): PlanForm {
  if (!plan) return emptyForm;
  return {
    name: plan.name,
    max_users: String(plan.max_users || ""),
    max_videos: String(plan.max_videos || 4),
    duration_days: String(plan.duration_days || ""),
    duration_label: plan.duration_label || "",
    price_toman: plan.price_toman ? String(plan.price_toman) : "",
    features: (plan.features || []).join("\n"),
    is_active: plan.is_active !== false,
  };
}

function parseAdminPlans(res: unknown): YadinoPlan[] {
  const obj = res && typeof res === "object" ? (res as Record<string, unknown>) : null;
  const list = Array.isArray(obj?.data) ? obj.data : Array.isArray(res) ? res : [];
  return list
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      const features = Array.isArray(item.features) ? item.features.map(String) : [];
      return {
        id: Number(item.id) || 0,
        product: String(item.product ?? "class"),
        name: String(item.name ?? ""),
        max_users: Number(item.max_users) || 0,
        max_videos: Number(item.max_videos) || 4,
        duration_days: Number(item.duration_days) || 0,
        duration_label: String(item.duration_label ?? ""),
        price_toman:
          Number(item.price_toman) ||
          (Number(item.price_rial) ? Math.round(Number(item.price_rial) / 10) : 0),
        features,
        description: typeof item.description === "string" ? item.description : null,
        is_active: item.is_active !== false,
        sort_order: Number(item.sort_order) || 0,
      } satisfies YadinoPlan;
    })
    .filter((row): row is YadinoPlan => Boolean(row && row.id));
}

export default function AdminProductPlansPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<YadinoPlan[]>([]);
  const [editing, setEditing] = useState<YadinoPlan | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isSuperAdminUser()) {
      toast.error("دسترسی فقط برای ادمین سیستم");
      router.replace("/admin");
      return;
    }
    setAllowed(true);
  }, [router]);

  const loadPlans = useCallback(async () => {
    const token = tokenCode();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await FetchWithJwtClient("GET", "/api/admin/product-plans", token, {
        product: "class",
        include_inactive: 1,
      });
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت پلن‌ها"));
        return;
      }
      setPlans(parseAdminPlans(res));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!allowed) return;
    void loadPlans();
  }, [allowed, loadPlans]);

  const tiers = useMemo(() => groupYadinoTiers(plans.map((p) => ({ ...p, is_active: true }))), [plans]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setCreating(true);
  };

  const openEdit = (plan: YadinoPlan) => {
    setCreating(false);
    setEditing(plan);
    setForm(toForm(plan));
  };

  const closeDialog = () => {
    if (saving) return;
    setEditing(null);
    setCreating(false);
  };

  const handleSave = async () => {
    const token = tokenCode();
    if (!token) return;
    const name = form.name.trim();
    const price = Number(form.price_toman.replace(/,/g, ""));
    const days = Number(form.duration_days.replace(/,/g, ""));
    const users = Number(form.max_users.replace(/,/g, ""));
    const videos = Number(form.max_videos.replace(/,/g, ""));
    if (!name) {
      toast.error("نام پلن را وارد کنید");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      toast.error("قیمت معتبر نیست");
      return;
    }
    if (!Number.isFinite(days) || days < 1) {
      toast.error("مدت معتبر نیست");
      return;
    }
    setSaving(true);
    const features = form.features
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const body = {
      product: "class",
      name,
      max_users: Number.isFinite(users) && users > 0 ? users : 1,
      max_videos: Number.isFinite(videos) && videos > 0 ? videos : 4,
      duration_days: days,
      duration_label: form.duration_label.trim() || undefined,
      price_toman: price,
      features,
      description: features.join("، "),
      is_active: form.is_active,
    };
    try {
      const res = editing?.id
        ? await FetchWithJwtClient(
            "PUT",
            `/api/admin/product-plans/${editing.id}`,
            token,
            {},
            { body: JSON.stringify(body) },
          )
        : await FetchWithJwtClient(
            "POST",
            "/api/admin/product-plans",
            token,
            {},
            { body: JSON.stringify(body) },
          );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "ذخیره پلن انجام نشد"));
        return;
      }
      toast.success(editing ? "پلن به‌روز شد" : "پلن ساخته شد");
      setEditing(null);
      setCreating(false);
      await loadPlans();
    } finally {
      setSaving(false);
    }
  };

  if (!allowed) return null;

  const dialogOpen = creating || Boolean(editing);

  return (
    <Box sx={{ ...adminPageSx, p: 2, pb: 12 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, mb: 2 }}>
        <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px" }}>
          پلن‌های یادینو را اینجا ببینید و قیمت یا امکانات را ویرایش کنید.
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
          <Button
            onClick={() => router.push("/admin/product-plans/orders")}
            sx={{ color: "var(--admin-accent)" }}
          >
            خریداران
          </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{
            ...adminButtonStartIconSx,
            bgcolor: "var(--admin-accent)",
            "&:hover": { bgcolor: "var(--admin-accent-hover)" },
            flexShrink: 0,
          }}
        >
          پلن جدید
        </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : plans.length === 0 ? (
        <Card sx={{ backgroundColor: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
          <CardContent sx={{ py: 4, textAlign: "center" }}>
            <GroupsIcon sx={{ fontSize: 40, color: "var(--admin-text-muted)", mb: 1 }} />
            <Typography sx={{ color: "var(--admin-text-secondary)" }}>پلنی ثبت نشده است</Typography>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px", mt: 1 }}>
              فایل SQL یادینو را در دیتابیس اجرا کنید.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {tiers.map((tier) => (
            <Card
              key={tier.max_users}
              sx={{
                backgroundColor: "var(--admin-surface)",
                border: "1px solid var(--admin-border)",
                borderRadius: "12px",
              }}
            >
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, mb: 1 }}>
                  {tier.name}
                </Typography>
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px", mb: 1.25 }}>
                  {tier.features.slice(0, 4).join(" · ")}
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                  {tier.plans.map((plan) => {
                    const live = plans.find((p) => p.id === plan.id) ?? plan;
                    return (
                      <Box
                        key={live.id ?? `${live.max_users}-${live.duration_days}`}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 1,
                          py: 0.5,
                          borderTop: "1px solid var(--admin-border)",
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ color: "var(--admin-text)", fontSize: "14px" }}>
                            {live.duration_label || `${live.duration_days} روز`}
                            {live.is_active === false ? " — غیرفعال" : ""}
                          </Typography>
                          <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700, fontSize: "13px" }}>
                            {formatYadinoToman(live.price_toman)}
                          </Typography>
                        </Box>
                        <Button size="small" onClick={() => openEdit(live)} sx={{ color: "var(--admin-accent)" }}>
                          ویرایش
                        </Button>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="xs">
        <DialogTitle sx={{ color: "var(--admin-text)" }}>
          {editing ? "ویرایش پلن یادینو" : "پلن جدید یادینو"}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 1 }}>
          <TextField
            label="نام"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            sx={fieldSx}
            fullWidth
          />
          <TextField
            label="حداکثر کاربر"
            value={form.max_users}
            onChange={(e) => setForm((prev) => ({ ...prev, max_users: e.target.value.replace(/[^\d]/g, "") }))}
            sx={fieldSx}
            fullWidth
            inputMode="numeric"
          />
          <TextField
            label="حداکثر ویدئو همزمان"
            value={form.max_videos}
            onChange={(e) => setForm((prev) => ({ ...prev, max_videos: e.target.value.replace(/[^\d]/g, "") }))}
            sx={fieldSx}
            fullWidth
            inputMode="numeric"
          />
          <TextField
            label="مدت (روز)"
            value={form.duration_days}
            onChange={(e) => setForm((prev) => ({ ...prev, duration_days: e.target.value.replace(/[^\d]/g, "") }))}
            sx={fieldSx}
            fullWidth
            inputMode="numeric"
          />
          <TextField
            label="برچسب مدت"
            value={form.duration_label}
            onChange={(e) => setForm((prev) => ({ ...prev, duration_label: e.target.value }))}
            sx={fieldSx}
            fullWidth
          />
          <TextField
            label="قیمت (تومان)"
            value={form.price_toman}
            onChange={(e) => setForm((prev) => ({ ...prev, price_toman: e.target.value.replace(/[^\d]/g, "") }))}
            sx={fieldSx}
            fullWidth
            inputMode="numeric"
          />
          <TextField
            label="امکانات (هر خط یک مورد)"
            value={form.features}
            onChange={(e) => setForm((prev) => ({ ...prev, features: e.target.value }))}
            sx={fieldSx}
            fullWidth
            multiline
            minRows={6}
          />
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography sx={{ color: "var(--admin-text)", fontSize: "14px" }}>فعال</Typography>
            <Switch
              checked={form.is_active}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: "var(--admin-accent)" },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "var(--admin-accent)",
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} disabled={saving}>
            انصراف
          </Button>
          <Button
            variant="contained"
            disabled={saving}
            onClick={() => void handleSave()}
            sx={{ bgcolor: "var(--admin-accent)", "&:hover": { bgcolor: "var(--admin-accent-hover)" } }}
          >
            {saving ? "…" : "ذخیره"}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer position="bottom-right" rtl autoClose={3000} style={{ marginBottom: "76px" }} />
    </Box>
  );
}
