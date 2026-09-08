"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { isSuperAdminUser } from "@/app/lib/superAdmin";
import { adminPageSx } from "@/app/admin/theme/adminTheme";
import { formatYadinoToman } from "@/app/landing/yadinoPlans";

type OrderRow = {
  id: number;
  plan_name: string;
  duration_label?: string | null;
  max_users?: number | null;
  email: string;
  phone: string;
  amount_toman: number;
  status: string;
  ref_id?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "در انتظار پرداخت",
  paid: "پرداخت شده",
  failed: "ناموفق",
  canceled: "لغو شده",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    "& fieldset": { borderColor: "var(--admin-border)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
} as const;

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function AdminYadinoOrdersPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("paid");

  useEffect(() => {
    if (!isSuperAdminUser()) {
      toast.error("دسترسی فقط برای ادمین سیستم");
      router.replace("/admin");
      return;
    }
    setAllowed(true);
  }, [router]);

  const loadOrders = useCallback(async () => {
    const token = tokenCode();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await FetchWithJwtClient("GET", "/api/admin/product-plan-orders", token, {
        status: status === "all" ? "" : status,
        q: query.trim(),
      });
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت خریدها"));
        return;
      }
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setOrders(list as OrderRow[]);
    } finally {
      setLoading(false);
    }
  }, [query, status]);

  useEffect(() => {
    if (!allowed) return;
    void loadOrders();
  }, [allowed, loadOrders]);

  if (!allowed) return null;

  return (
    <Box sx={{ ...adminPageSx, p: 2, pb: 12 }}>
      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", mb: 2 }}>
        خریداران یادینو بعد از پرداخت موفق اینجا دیده می‌شوند.
      </Typography>
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        {(["paid", "pending", "failed", "canceled", "all"] as const).map((key) => (
          <Box
            key={key}
            component="button"
            onClick={() => setStatus(key)}
            sx={{
              border: "1px solid var(--admin-border)",
              bgcolor: status === key ? "var(--admin-accent)" : "var(--admin-surface)",
              color: status === key ? "#fff" : "var(--admin-text)",
              borderRadius: "999px",
              px: 1.5,
              py: 0.5,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {key === "all" ? "همه" : STATUS_LABEL[key]}
          </Box>
        ))}
      </Box>
      <TextField
        label="جستجوی ایمیل یا موبایل"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ ...fieldSx, mb: 2 }}
        fullWidth
      />

      {loading ? (
        <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
          <CircularProgress sx={{ color: "var(--admin-accent)" }} />
        </Box>
      ) : orders.length === 0 ? (
        <Card sx={{ backgroundColor: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
          <CardContent sx={{ py: 4, textAlign: "center" }}>
            <ReceiptLongIcon sx={{ fontSize: 40, color: "var(--admin-text-muted)", mb: 1 }} />
            <Typography sx={{ color: "var(--admin-text-secondary)" }}>خریداری ثبت نشده است</Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          {orders.map((order) => (
            <Card
              key={order.id}
              sx={{
                backgroundColor: "var(--admin-surface)",
                border: "1px solid var(--admin-border)",
                borderRadius: "12px",
              }}
            >
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Typography sx={{ color: "var(--admin-text)", fontWeight: 700 }}>
                  {order.plan_name}
                  {order.duration_label ? ` — ${order.duration_label}` : ""}
                </Typography>
                <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: "13px", mt: 0.5 }} dir="ltr">
                  {order.phone} · {order.email}
                </Typography>
                <Typography sx={{ color: "var(--admin-accent)", fontWeight: 700, mt: 0.5 }}>
                  {formatYadinoToman(order.amount_toman)}
                </Typography>
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px", mt: 0.5 }}>
                  {STATUS_LABEL[order.status] || order.status}
                  {" · "}
                  {formatDate(order.paid_at || order.created_at)}
                  {order.ref_id ? ` · رسید ${order.ref_id}` : ""}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
      <ToastContainer position="bottom-right" rtl autoClose={3000} style={{ marginBottom: "76px" }} />
    </Box>
  );
}
