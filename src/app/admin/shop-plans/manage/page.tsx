"use client";

import { useCallback, useEffect, useState } from "react";
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
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { isSuperAdminUser } from "@/app/lib/superAdmin";
import { adminButtonStartIconSx, adminPageSx } from "@/app/admin/theme/adminTheme";
import {
  formatPlanDuration,
  formatToman,
  parseAdminShopPlans,
  type PaymentsCatalogItem,
} from "@/app/lib/atelierZarinpal";

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
  price_toman: string;
  duration_days: string;
  description: string;
  is_active: boolean;
};

const emptyForm: PlanForm = {
  name: "",
  price_toman: "",
  duration_days: "",
  description: "",
  is_active: true,
};

function toForm(plan: PaymentsCatalogItem | null): PlanForm {
  if (!plan) return emptyForm;
  return {
    name: plan.name,
    price_toman: plan.price_toman ? String(plan.price_toman) : "",
    duration_days: plan.duration_days
      ? String(plan.duration_days)
      : plan.duration_months
        ? String(plan.duration_months * 30)
        : "",
    description: plan.description || "",
    is_active: plan.is_active !== false,
  };
}

export default function AdminShopPlansManagePage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PaymentsCatalogItem[]>([]);
  const [editing, setEditing] = useState<PaymentsCatalogItem | null>(null);
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
      const res = await FetchWithJwtClient("GET", "/api/admin/shop-plans", token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت پلن‌ها"));
        return;
      }
      setPlans(parseAdminShopPlans(res));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!allowed) return;
    void loadPlans();
  }, [allowed, loadPlans]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setCreating(true);
  };

  const openEdit = (plan: PaymentsCatalogItem) => {
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
    if (!name) {
      toast.error("نام پلن را وارد کنید");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      toast.error("قیمت معتبر نیست");
      return;
    }
    setSaving(true);
    const body = {
      name,
      title: name,
      price,
      price_toman: price,
      duration_days: Number.isFinite(days) && days > 0 ? days : undefined,
      description: form.description.trim() || undefined,
      is_active: form.is_active,
    };
    try {
      const res = editing
        ? await FetchWithJwtClient(
            "PUT",
            `/api/admin/shop-plans/${editing.id}`,
            token,
            {},
            { body: JSON.stringify(body) },
          )
        : await FetchWithJwtClient(
            "POST",
            "/api/admin/shop-plans",
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
          قیمت پلن‌های اکانت فروشگاه را اینجا عوض کنید.
        </Typography>
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

      {loading ? (
        <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : plans.length === 0 ? (
        <Card sx={{ backgroundColor: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
          <CardContent sx={{ py: 4, textAlign: "center" }}>
            <CardMembershipIcon sx={{ fontSize: 40, color: "var(--admin-text-muted)", mb: 1 }} />
            <Typography sx={{ color: "var(--admin-text-secondary)" }}>پلنی ثبت نشده است</Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          {plans.map((plan) => (
            <Card
              key={plan.id}
              sx={{
                backgroundColor: "var(--admin-surface)",
                border: "1px solid var(--admin-border)",
                borderRadius: "12px",
              }}
            >
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
                  <Box>
                    <Typography sx={{ color: "var(--admin-text)", fontWeight: 700 }}>
                      {plan.name}
                      {plan.is_active === false ? " — غیرفعال" : ""}
                    </Typography>
                    <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700, mt: 0.25 }}>
                      {formatToman(plan.price_toman)}
                      {formatPlanDuration(plan) ? ` · ${formatPlanDuration(plan)}` : ""}
                    </Typography>
                    {plan.description ? (
                      <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px", mt: 0.5 }}>
                        {plan.description}
                      </Typography>
                    ) : null}
                  </Box>
                  <Button size="small" onClick={() => openEdit(plan)} sx={{ color: "var(--admin-accent)" }}>
                    ویرایش
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="xs">
        <DialogTitle sx={{ color: "var(--admin-text)" }}>
          {editing ? "ویرایش پلن" : "پلن جدید"}
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
            label="قیمت (تومان)"
            value={form.price_toman}
            onChange={(e) => setForm((prev) => ({ ...prev, price_toman: e.target.value.replace(/[^\d]/g, "") }))}
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
            label="توضیح"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            sx={fieldSx}
            fullWidth
            multiline
            minRows={2}
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
