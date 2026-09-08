"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import WifiIcon from "@mui/icons-material/Wifi";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tokenCode from "@/app/coponent/tokenCode";
import { FetchWithJwtClient } from "@/app/coponent/fetchWithJwtClient";
import { getApiErrorMessage } from "@/app/lib/apiErrorMessage";
import { isSuperAdminUser } from "@/app/lib/superAdmin";
import { adminPageSx } from "@/app/admin/theme/adminTheme";

type ConnLog = {
  id: number;
  license_key?: string | null;
  machine_id: string;
  event: string;
  app_version?: string | null;
  platform?: string | null;
  ip?: string | null;
  created_at?: string;
  license?: { id: number; license_key: string; customer_name?: string | null } | null;
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "var(--admin-surface-alt)",
    color: "var(--admin-text)",
    "& fieldset": { borderColor: "var(--admin-border)" },
  },
  "& .MuiInputLabel-root": { color: "var(--admin-text-muted)" },
} as const;

const eventLabel: Record<string, string> = {
  activate: "فعال‌سازی",
  validate: "اعتبارسنجی",
  heartbeat: "اتصال اینترنت",
};

function formatDate(v?: string | null) {
  if (!v) return "—";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "medium",
      timeStyle: "medium",
    }).format(new Date(v));
  } catch {
    return v;
  }
}

export default function AdminDesktopLicenseLogsPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ConnLog[]>([]);
  const [licenseKey, setLicenseKey] = useState("");
  const [machineId, setMachineId] = useState("");
  const [event, setEvent] = useState("");

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
      const qs = new URLSearchParams({ per_page: "50" });
      if (licenseKey.trim()) qs.set("license_key", licenseKey.trim());
      if (machineId.trim()) qs.set("machine_id", machineId.trim());
      if (event) qs.set("event", event);
      const res = await FetchWithJwtClient(
        "GET",
        `/api/admin/desktop-licenses/connection-logs?${qs.toString()}`,
        token,
      );
      if (res?.hasError) {
        toast.error(getApiErrorMessage(res, "خطا در دریافت لاگ‌ها"));
        return;
      }
      const list = Array.isArray(res?.data) ? res.data : [];
      setItems(list);
    } finally {
      setLoading(false);
    }
  }, [licenseKey, machineId, event]);

  useEffect(() => {
    if (!allowed) return;
    void load();
  }, [allowed, load]);

  if (!allowed) {
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ ...adminPageSx, direction: "rtl" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
        <IconButton onClick={() => router.push("/admin/desktop-licenses")}>
          <ArrowBackIcon />
        </IconButton>
        <WifiIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
          لاگ اتصال دسکتاپ به اینترنت
        </Typography>
        <IconButton onClick={() => void load()}>
          <RefreshIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
        <TextField
          size="small"
          label="کلید لایسنس"
          value={licenseKey}
          onChange={(e) => setLicenseKey(e.target.value)}
          sx={{ ...fieldSx, minWidth: 200 }}
        />
        <TextField
          size="small"
          label="Machine ID"
          value={machineId}
          onChange={(e) => setMachineId(e.target.value)}
          sx={{ ...fieldSx, minWidth: 200 }}
        />
        <TextField
          select
          size="small"
          label="رویداد"
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          sx={{ ...fieldSx, minWidth: 160 }}
        >
          <MenuItem value="">همه</MenuItem>
          <MenuItem value="heartbeat">اتصال اینترنت</MenuItem>
          <MenuItem value="activate">فعال‌سازی</MenuItem>
          <MenuItem value="validate">اعتبارسنجی</MenuItem>
        </TextField>
        <Button variant="outlined" onClick={() => void load()}>
          اعمال فیلتر
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ overflowX: "auto", border: "1px solid var(--admin-border)", borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>زمان</TableCell>
                <TableCell>رویداد</TableCell>
                <TableCell>مشتری / کلید</TableCell>
                <TableCell>Machine ID</TableCell>
                <TableCell>IP</TableCell>
                <TableCell>نسخه</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{formatDate(row.created_at)}</TableCell>
                  <TableCell>{eventLabel[row.event] || row.event}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13 }}>
                      {row.license?.customer_name || "—"}
                    </Typography>
                    <Typography sx={{ fontSize: 11, fontFamily: "monospace", direction: "ltr" }}>
                      {row.license_key || row.license?.license_key || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 11, direction: "ltr" }}>
                    {row.machine_id}
                  </TableCell>
                  <TableCell sx={{ direction: "ltr" }}>{row.ip || "—"}</TableCell>
                  <TableCell>
                    {row.app_version || "—"}
                    {row.platform ? ` / ${row.platform}` : ""}
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    لاگی یافت نشد
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}

      <ToastContainer position="bottom-right" autoClose={3000} />
    </Box>
  );
}
