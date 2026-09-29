"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Tab, Tabs, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SendIcon from "@mui/icons-material/Send";
import { toast } from "react-toastify";
import { AccountingPageShell, accountingButtonSx } from "@/app/admin/accounting/ui";
import { fetchMoadianSummary, runMoadianNow, type MoadianSummary } from "@/app/lib/moadian";
import MoadianDocumentsTab from "./MoadianDocumentsTab";
import MoadianStuffTab from "./MoadianStuffTab";
import MoadianSettingsTab from "./MoadianSettingsTab";

const numberFa = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "danger" | "accent" }) {
  return (
    <Box
      sx={{
        flex: "1 1 140px",
        p: 1.5,
        borderRadius: "10px",
        border: "1px solid var(--admin-border)",
        bgcolor: "var(--admin-surface)",
      }}
    >
      <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>{label}</Typography>
      <Typography
        sx={{
          fontSize: 20,
          fontWeight: 700,
          color: tone === "danger" && value > 0 ? "#d32f2f" : tone === "accent" ? "var(--admin-accent)" : "var(--admin-text)",
        }}
      >
        {numberFa(value)}
      </Typography>
    </Box>
  );
}

export default function MoadianPage() {
  const [tab, setTab] = useState(0);
  const [summary, setSummary] = useState<MoadianSummary | null>(null);
  const [running, setRunning] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await fetchMoadianSummary());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در دریافت وضعیت");
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary, refreshKey]);

  const refreshAll = () => setRefreshKey((k) => k + 1);

  const runNow = async () => {
    setRunning(true);
    try {
      toast.success(await runMoadianNow());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "پردازش ناموفق بود");
    } finally {
      setRunning(false);
      refreshAll();
    }
  };

  return (
    <AccountingPageShell
      title="سامانه مؤدیان"
      subtitle={
        summary
          ? `${summary.enabled ? "فعال" : "غیرفعال"} · محیط ${summary.environment === "production" ? "اصلی" : "آزمایشی"}${
              summary.last_run_at ? ` · آخرین اجرا ${summary.last_run_at}` : ""
            }`
          : "ارسال خودکار صورتحساب‌های فروش به سازمان امور مالیاتی"
      }
      actions={
        <>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refreshAll}
            sx={{ color: "var(--admin-text)", borderColor: "var(--admin-border)" }}
          >
            بروزرسانی
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={runNow}
            disabled={running || !summary?.enabled}
            sx={accountingButtonSx}
          >
            {running ? "در حال ارسال…" : "ارسال اکنون"}
          </Button>
        </>
      }
    >
      {summary?.paused_reason ? (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          ارسال متوقف شده است: {summary.paused_reason}
          <br />
          پس از رفع مشکل، تنظیمات را ذخیره کنید یا «ارسال اکنون» را بزنید.
        </Alert>
      ) : null}
      {summary && summary.problems.length > 0 ? (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          {summary.problems.map((p) => (
            <div key={p}>{p}</div>
          ))}
        </Alert>
      ) : null}
      {summary && summary.products_missing_sstid > 0 ? (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          {numberFa(summary.products_missing_sstid)} کالا شناسه کالا/خدمت ندارد و شناسه پیش‌فرض هم تعیین نشده است؛ از زبانه «شناسه کالا» تعیین کنید.
        </Alert>
      ) : null}

      {summary ? (
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
          <StatCard label="ثبت‌شده در سامانه" value={summary.counts.success} tone="accent" />
          <StatCard label="در انتظار نتیجه" value={summary.counts.sent} />
          <StatCard label="در صف ارسال" value={summary.counts.queued} />
          <StatCard label="ناموفق" value={summary.counts.failed} tone="danger" />
        </Box>
      ) : null}

      <Box sx={{ borderBottom: "1px solid var(--admin-border)", mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_e, v) => setTab(v)}
          variant="scrollable"
          sx={{
            "& .MuiTab-root": { color: "var(--admin-text-muted)", fontSize: 13 },
            "& .Mui-selected": { color: "var(--admin-accent) !important", fontWeight: 700 },
            "& .MuiTabs-indicator": { backgroundColor: "var(--admin-accent)" },
          }}
        >
          <Tab label="صورتحساب‌ها" />
          <Tab label="شناسه کالا" />
          <Tab label="تنظیمات" />
        </Tabs>
      </Box>

      {tab === 0 ? <MoadianDocumentsTab refreshKey={refreshKey} onChanged={loadSummary} /> : null}
      {tab === 1 ? <MoadianStuffTab onChanged={loadSummary} /> : null}
      {tab === 2 ? <MoadianSettingsTab onSaved={refreshAll} /> : null}
    </AccountingPageShell>
  );
}
