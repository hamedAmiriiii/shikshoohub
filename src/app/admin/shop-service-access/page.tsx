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
import RoomServiceIcon from "@mui/icons-material/RoomService";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { isSuperAdminUser } from "@/app/lib/superAdmin";
import { adminPageSx } from "@/app/admin/theme/adminTheme";
import { extractRoomServicesEnabled } from "@/app/lib/shopServices";

type ShopRow = {
  atelier_id: number;
  shop_name?: string;
  shop_code?: string;
  phone?: string | null;
  owner_name?: string | null;
  room_services_enabled?: boolean;
};

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
  const [savingId, setSavingId] = useState<number | null>(null);
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

  const toggle = async (row: ShopRow, enabled: boolean) => {
    const token = tokenCode();
    if (!token) return;
    setSavingId(row.atelier_id);
    try {
      const res = await FetchWithJwtClient(
        "PUT",
        `/api/admin/shop-service-access/${row.atelier_id}`,
        token,
        {},
        { body: JSON.stringify({ enabled }) },
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "ذخیره دسترسی ناموفق بود"));
        return;
      }
      setRows((prev) =>
        prev.map((item) =>
          item.atelier_id === row.atelier_id ? { ...item, room_services_enabled: enabled } : item,
        ),
      );
      toast.success(typeof res.message === "string" ? res.message : "ذخیره شد");
    } finally {
      setSavingId(null);
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
        <RoomServiceIcon sx={{ color: "var(--admin-accent)" }} />
        <Typography sx={{ fontWeight: 800, fontSize: 18 }}>دسترسی خدمات فروشگاه</Typography>
      </Box>
      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 13, mb: 2 }}>
        فقط ادمین سامانه این دسترسی را می‌دهد. فروشگاه بعد از فعال‌شدن می‌تواند خدمت تعریف کند و مهمان از لینک اتاق درخواست بدهد.
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
        rows.map((row) => {
          const enabled = extractRoomServicesEnabled(row) || Boolean(row.room_services_enabled);
          return (
            <Card
              key={row.atelier_id}
              sx={{
                mb: 1,
                bgcolor: "var(--admin-surface)",
                border: "1px solid var(--admin-border)",
                borderRadius: "14px",
              }}
            >
              <CardContent sx={{ py: 1.2, px: 1.4, display: "flex", alignItems: "center", gap: 1, "&:last-child": { pb: 1.2 } }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{row.shop_name || "فروشگاه"}</Typography>
                  <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 12 }}>
                    {row.shop_code ? `/${row.shop_code}` : ""} {row.phone ? `· ${row.phone}` : ""}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 12, color: enabled ? "var(--admin-accent)" : "var(--admin-text-muted)", fontWeight: 700 }}>
                  {enabled ? "فعال" : "خاموش"}
                </Typography>
                <Switch
                  checked={enabled}
                  disabled={savingId === row.atelier_id}
                  onChange={(_, checked) => void toggle(row, checked)}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": { color: "var(--admin-accent)" },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "var(--admin-accent)" },
                  }}
                />
              </CardContent>
            </Card>
          );
        })
      )}
      <ToastContainer position="bottom-center" autoClose={2500} />
    </Box>
  );
}
