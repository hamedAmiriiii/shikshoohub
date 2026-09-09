"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { isSuperAdminUser } from "@/app/lib/superAdmin";
import { adminPageSx } from "@/app/admin/theme/adminTheme";
import type { ShopFeatures } from "@/app/lib/shopFeatures";

type FeatureKey = keyof ShopFeatures;

type ShopRow = {
  atelier_id: number;
  shop_name?: string;
  shop_code?: string;
  phone?: string | null;
  owner_name?: string | null;
} & Partial<ShopFeatures>;

const FEATURE_SWITCHES: { key: FeatureKey; label: string }[] = [
  { key: "restaurant_cafe_enabled", label: "سفارش حضوری" },
  { key: "room_services_enabled", label: "خدمات اتاق" },
  { key: "produced_goods_enabled", label: "کالای تولیدی" },
  { key: "accounting_enabled", label: "حسابداری" },
];

function extractRows(res: unknown): ShopRow[] {
  if (Array.isArray(res)) return res as ShopRow[];
  if (res && typeof res === "object") {
    const obj = res as { data?: unknown };
    if (Array.isArray(obj.data)) return obj.data as ShopRow[];
  }
  return [];
}

export default function ShopServiceAccessPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<ShopRow[]>([]);

  useEffect(() => {
    if (!isSuperAdminUser()) {
      toast.error("دسترسی فقط برای ادمین سیستم");
      router.replace("/admin");
      return;
    }
    setAllowed(true);
  }, [router]);

  const load = useCallback(async () => {
    const token = tokenCode();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const query = new URLSearchParams({ per_page: "100" });
      if (search.trim()) query.set("search", search.trim());
      const res = await FetchWithJwtClient("GET", `/api/admin/shop-service-access?${query.toString()}`, token);
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "دریافت فروشگاه‌ها ناموفق بود"));
        return;
      }
      setRows(extractRows(res));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (!allowed) return;
    const timer = window.setTimeout(() => {
      void load();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [allowed, load]);

  const toggle = async (row: ShopRow, feature: FeatureKey, enabled: boolean) => {
    const token = tokenCode();
    if (!token) return;
    const saveKey = `${row.atelier_id}:${feature}`;
    setSaving(saveKey);
    try {
      const res = await FetchWithJwtClient(
        "PUT",
        `/api/admin/shop-service-access/${row.atelier_id}`,
        token,
        {},
        { body: JSON.stringify({ feature, enabled: enabled ? 1 : 0 }) },
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "ذخیره دسترسی ناموفق بود"));
        return;
      }
      const saved = Boolean(res?.[feature]);
      setRows((prev) =>
        prev.map((item) =>
          item.atelier_id === row.atelier_id
            ? {
                ...item,
                restaurant_cafe_enabled: Boolean(res.restaurant_cafe_enabled),
                room_services_enabled: Boolean(res.room_services_enabled),
                produced_goods_enabled: Boolean(res.produced_goods_enabled),
                accounting_enabled: Boolean(res.accounting_enabled),
                [feature]: saved,
              }
            : item,
        ),
      );
      if (saved !== enabled) {
        toast.error("روی این فروشگاه ذخیره نشد. ایندکس settings را در دیتابیس اصلاح کنید.");
        return;
      }
      toast.success(typeof res.message === "string" ? res.message : "ذخیره شد");
    } finally {
      setSaving(null);
    }
  };

  if (!allowed) {
    return (
      <Box sx={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "var(--admin-accent)" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ ...adminPageSx, p: 2, pb: 12 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.6 }}>
        <AdminPanelSettingsIcon sx={{ color: "var(--admin-accent)" }} />
        <Typography sx={{ fontWeight: 800, fontSize: 18 }}>دسترسی فروشگاه</Typography>
      </Box>
      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 13, mb: 2 }}>
        همه خاموش‌اند تا ادمین سامانه روشن کند. بعد از ورود بعدی، فروشگاه همان بخش‌ها را در منو می‌بیند.
      </Typography>
      <TextField
        size="small"
        fullWidth
        placeholder="جستجوی نام، کد یا تلفن فروشگاه"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{
          mb: 2,
          "& .MuiOutlinedInput-root": {
            color: "var(--admin-text)",
            backgroundColor: "var(--admin-surface)",
            "& fieldset": { borderColor: "var(--admin-border)" },
          },
        }}
      />
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : rows.length === 0 ? (
        <Typography sx={{ color: "var(--admin-text-muted)", textAlign: "center", py: 5 }}>
          فروشگاهی پیدا نشد
        </Typography>
      ) : (
        rows.map((row) => (
          <Card
            key={row.atelier_id}
            sx={{
              mb: 1,
              bgcolor: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
              borderRadius: "14px",
            }}
          >
            <CardContent sx={{ py: 1.2, px: 1.4, "&:last-child": { pb: 1.2 } }}>
              <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{row.shop_name || "فروشگاه"}</Typography>
              <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 12, mb: 1 }}>
                {row.shop_code ? `/${row.shop_code}` : ""} {row.phone ? `· ${row.phone}` : ""}
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, minmax(0, 1fr))" }, gap: 0.75 }}>
                {FEATURE_SWITCHES.map((item) => {
                  const enabled = Boolean(row[item.key]);
                  const busy = saving === `${row.atelier_id}:${item.key}`;
                  return (
                    <Box
                      key={item.key}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 0.5,
                        px: 0.75,
                        py: 0.35,
                        borderRadius: "10px",
                        border: "1px solid var(--admin-border)",
                      }}
                    >
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: enabled ? "var(--admin-accent)" : "var(--admin-text-muted)" }}>
                        {item.label}
                      </Typography>
                      <Switch
                        size="small"
                        checked={enabled}
                        disabled={busy}
                        onChange={(_, checked) => void toggle(row, item.key, checked)}
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": { color: "var(--admin-accent)" },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "var(--admin-accent)" },
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        ))
      )}
      <ToastContainer position="bottom-center" autoClose={2500} />
    </Box>
  );
}
