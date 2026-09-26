"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress, Grid, IconButton, Tooltip, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import LanguageIcon from "@mui/icons-material/Language";
import CalculateIcon from "@mui/icons-material/Calculate";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { isSuperAdminUser } from "@/app/lib/superAdmin";
import { readSitePageStatsAction } from "@/app/lib/sitePageViewActions";
import type { SitePageKey, SitePageStat } from "@/app/lib/sitePageViews";
import { adminSurfaceCardSx } from "@/app/admin/theme/adminTheme";

const ICONS: Record<SitePageKey, ReactNode> = {
  landing: <LanguageIcon sx={{ color: "var(--admin-accent)" }} />,
  accounting: <CalculateIcon sx={{ color: "var(--admin-accent)" }} />,
  accounting_admin: <AdminPanelSettingsIcon sx={{ color: "var(--admin-accent)" }} />,
};

function formatCount(value: number) {
  return value.toLocaleString("fa-IR");
}

function formatDay(ymd: string) {
  const date = new Date(`${ymd}T12:00:00+03:30`);
  if (Number.isNaN(date.getTime())) return ymd;
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    timeZone: "Asia/Tehran",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function SiteStatsPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<SitePageStat[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPages(await readSitePageStatsAction());
    } catch {
      toast.error("آمار بازدید خوانده نشد");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSuperAdminUser()) {
      toast.error("دسترسی فقط برای ادمین سیستم");
      router.replace("/admin");
      return;
    }
    setAllowed(true);
    void load();
  }, [load, router]);

  if (!allowed) return null;

  return (
    <Box sx={{ p: { xs: 1.5, md: 2.5 }, direction: "rtl" }}>
      <ToastContainer position="top-center" rtl theme="dark" />
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: { xs: 18, md: 22 } }}>
            آمار بازدید سایت
          </Typography>
          <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 13, mt: 0.5 }}>
            هر بازدید آی‌پی دارد. اگر همان لحظه وارد حساب شده باشد، نامش هم ذخیره می‌شود.
          </Typography>
        </Box>
        <Tooltip title="بروزرسانی">
          <span>
            <IconButton onClick={() => void load()} disabled={loading} sx={{ color: "var(--admin-accent)" }} aria-label="بروزرسانی آمار">
              {loading ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Grid container spacing={1.5}>
        {pages.map((page) => (
          <Grid item xs={12} md={4} key={page.key}>
            <Box sx={{ ...adminSurfaceCardSx, p: 1.75, height: "100%" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                {ICONS[page.key]}
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{page.title}</Typography>
                  <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 12 }}>{page.hint}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
                <Box sx={{ flex: 1, borderRadius: "12px", bgcolor: "var(--admin-surface-alt, rgba(255,255,255,0.04))", p: 1.25 }}>
                  <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 12 }}>امروز</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: 22 }}>{formatCount(page.today)}</Typography>
                </Box>
                <Box sx={{ flex: 1, borderRadius: "12px", bgcolor: "var(--admin-surface-alt, rgba(255,255,255,0.04))", p: 1.25 }}>
                  <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 12 }}>جمع کل</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: 22 }}>{formatCount(page.total)}</Typography>
                </Box>
              </Box>
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 0.5 }}>آخرین بازدیدها</Typography>
              {page.visits.length === 0 ? (
                <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12 }}>هنوز بازدیدی ثبت نشده</Typography>
              ) : (
                page.visits.map((visit, index) => (
                  <Box key={`${visit.at}-${visit.ip}-${index}`} sx={{ py: 0.45, borderTop: "1px solid var(--admin-border)" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                      <Typography sx={{ fontSize: 13 }}>{visit.name || "مهمان"}</Typography>
                      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 12 }}>{formatWhen(visit.at)}</Typography>
                    </Box>
                    <Typography dir="ltr" sx={{ color: "var(--admin-text-secondary)", fontSize: 12, textAlign: "left" }}>
                      {visit.ip || "آی‌پی نامشخص"}
                    </Typography>
                  </Box>
                ))
              )}
              {page.days.length > 0 ? (
                <Box sx={{ mt: 1.25 }}>
                  <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mb: 0.25 }}>جمع روزانه</Typography>
                  {page.days.slice(0, 7).map((day) => (
                    <Box key={day.date} sx={{ display: "flex", justifyContent: "space-between", py: 0.2 }}>
                      <Typography sx={{ color: "var(--admin-text-secondary)", fontSize: 12 }}>{formatDay(day.date)}</Typography>
                      <Typography sx={{ fontSize: 12 }}>{formatCount(day.count)}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : null}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
