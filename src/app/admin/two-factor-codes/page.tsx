"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PasswordIcon from "@mui/icons-material/Password";
import List from "@/app/coponent/grid/Grid";
import { isSuperAdminUser } from "@/app/lib/superAdmin";

const BASE_URL = "/api/admin/log-sms";
const ROWS_PER_PAGE = 20;

type LogSmsItem = {
  id: number;
  text: string;
  number: string;
  receivers: string;
  created_at?: string;
  creator?: { id: number; name?: string } | null;
};

function formatDateTime(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LogSmsMobileCard({ data }: { data: LogSmsItem }) {
  return (
    <Box
      sx={{
        p: 1.5,
        mb: 1,
        borderRadius: "12px",
        border: "1px solid var(--admin-border)",
        bgcolor: "var(--admin-surface)",
        direction: "rtl",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 0.75 }}>
        <Typography dir="ltr" sx={{ color: "var(--admin-accent)", fontWeight: 700, fontSize: "14px" }}>
          {data.receivers || "—"}
        </Typography>
        <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "11px" }}>
          {formatDateTime(data.created_at)}
        </Typography>
      </Box>
      <Typography
        sx={{
          color: "var(--admin-text)",
          fontSize: "13px",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {data.text || "—"}
      </Typography>
    </Box>
  );
}

export default function AdminTwoFactorCodesPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!isSuperAdminUser()) {
      toast.error("دسترسی فقط برای ادمین سیستم");
      router.replace("/admin");
      return;
    }
    setAllowed(true);
  }, [router]);

  const searchBoxList = useMemo(
    () =>
      ["receivers", "text"].map((fieldName) => ({
        fieldName,
        fieldOperation: "MATCH" as const,
        fieldValue: "",
        nextConditionOperator: "OR" as const,
      })),
    [],
  );

  const desktopColumns = useMemo(
    () => [
      {
        label: "گیرنده",
        field: (item: LogSmsItem) => <span dir="ltr">{item.receivers || "—"}</span>,
      },
      {
        label: "متن پیام",
        width: "420px",
        field: (item: LogSmsItem) => (
          <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{item.text || "—"}</span>
        ),
      },
      { label: "ارسال‌کننده", field: (item: LogSmsItem) => item.creator?.name || "سیستم" },
      { label: "تاریخ و زمان", field: (item: LogSmsItem) => formatDateTime(item.created_at) },
    ],
    [],
  );

  if (!allowed) {
    return (
      <Box sx={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "var(--admin-accent)" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        background: "var(--admin-bg-gradient)",
        py: 3,
        px: { xs: 2, sm: 3, md: 4 },
        direction: "rtl",
        pb: 12,
        boxSizing: "border-box",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <PasswordIcon sx={{ color: "var(--admin-accent)", fontSize: 32 }} />
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: "22px" }}>
            کدهای دوعاملی
          </Typography>
        </Box>

        <List
          disableFilter
          searchBoxList={searchBoxList}
          filterBoxList={[]}
          filterComponent={<></>}
          url={`${BASE_URL}?per_page=${ROWS_PER_PAGE}`}
          showTotal
          textTotal={["پیامک", ""]}
          rows={ROWS_PER_PAGE}
          enablePagination
          desktopColumns={desktopColumns}
          CartComponent={LogSmsMobileCard}
        />
      </Box>
      <ToastContainer position="bottom-right" rtl autoClose={2500} style={{ marginBottom: "76px" }} />
    </Box>
  );
}
