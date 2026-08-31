"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from "@mui/material";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import BalanceIcon from "@mui/icons-material/Balance";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DateObject from "react-date-object";
import { toast } from "react-toastify";
import {
  fetchAccountingVouchers,
  jalaliYmd,
  postAccountingOpening,
  todayJalaliYmd,
} from "@/app/lib/accounting";
import { todayJalaliDateObject } from "@/app/lib/cheques";
import {
  AccountingJalaliDateField,
  AccountingPageShell,
  accountingButtonSx,
} from "@/app/admin/accounting/ui";

const LINKS = [
  { href: "/admin/accounting/accounts", title: "درخت حساب", desc: "کدینگ گروه / کل / معین / تفصیلی", icon: <AccountTreeIcon /> },
  { href: "/admin/accounting/vouchers", title: "اسناد", desc: "لیست، جزئیات، سند دستی و برگشت", icon: <ReceiptLongIcon /> },
  { href: "/admin/accounting/trial-balance", title: "تراز آزمایشی", desc: "گردش و مانده حساب‌ها", icon: <BalanceIcon /> },
  { href: "/admin/accounting/ledger", title: "دفتر حساب", desc: "آرتیکل‌های یک حساب با مانده جاری", icon: <MenuBookIcon /> },
  { href: "/admin/accounting/profit-loss", title: "سود و زیان دفتر", desc: "مبنای تعهدی از آرتیکل سند", icon: <TrendingUpIcon /> },
  { href: "/admin/accounting/balance-sheet", title: "ترازنامه", desc: "دارایی، بدهی، سرمایه و تطبیق نقد", icon: <AccountBalanceIcon /> },
];

export default function AccountingHomePage() {
  const router = useRouter();
  const [openingPosted, setOpeningPosted] = useState(false);
  const [checkingOpening, setCheckingOpening] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [openingDate, setOpeningDate] = useState<DateObject | null>(() => todayJalaliDateObject());
  const [saving, setSaving] = useState(false);

  const checkOpening = useCallback(async () => {
    setCheckingOpening(true);
    try {
      const list = await fetchAccountingVouchers({ sourceType: "opening", perPage: 1 });
      setOpeningPosted(list.total > 0 || list.data.length > 0);
    } catch {
      setOpeningPosted(false);
    } finally {
      setCheckingOpening(false);
    }
  }, []);

  useEffect(() => {
    checkOpening();
  }, [checkOpening]);

  const handleOpening = async () => {
    setSaving(true);
    try {
      const result = await postAccountingOpening(jalaliYmd(openingDate) || todayJalaliYmd());
      toast.success(result.message);
      setOpeningPosted(true);
      setDialogOpen(false);
      if (result.data?.id) router.push(`/admin/accounting/vouchers/${result.data.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در ثبت افتتاحیه");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountingPageShell
      title="حسابداری"
      subtitle="دفتر کل فروشگاه. فروش و تطبیق روزانه خودشان سند می‌سازند؛ این بخش فقط مشاهده و سند دستی است."
      actions={
        checkingOpening ? (
          <CircularProgress size={22} sx={{ color: "var(--admin-accent)" }} />
        ) : openingPosted ? null : (
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={() => setDialogOpen(true)}
            sx={accountingButtonSx}
          >
            ثبت افتتاحیه
          </Button>
        )
      }
    >
      {openingPosted ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          سند افتتاحیه قبلاً ثبت شده است. رویدادهای بعدی خودشان سند می‌سازند.
        </Alert>
      ) : (
        <Alert severity="warning" sx={{ mb: 2 }}>
          بعد از فعال‌سازی حسابداری، یک‌بار افتتاحیه بزنید تا ماندهٔ حساب‌های نقد با دفتر یکی شود. تاریخچهٔ فروش بازسازی نمی‌شود.
        </Alert>
      )}

      <Grid container spacing={1.5}>
        {LINKS.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.href}>
            <Card sx={{ bgcolor: "var(--admin-surface)", border: "1px solid var(--admin-border)", height: "100%" }}>
              <CardActionArea onClick={() => router.push(item.href)} sx={{ height: "100%" }}>
                <CardContent>
                  <Box sx={{ color: "var(--admin-accent)", mb: 1 }}>{item.icon}</Box>
                  <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: 15 }}>
                    {item.title}
                  </Typography>
                  <Typography sx={{ color: "var(--admin-text-muted)", fontSize: 12, mt: 0.5 }}>
                    {item.desc}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>ثبت سند افتتاحیه</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13, color: "var(--admin-text-muted)", mb: 2 }}>
            فقط اختلاف ماندهٔ عملیاتی حساب‌ها با دفتر سند می‌شود (دِ نقد / یِ سرمایه). صندوق فروش در افتتاحیه نیست.
          </Typography>
          <AccountingJalaliDateField
            value={openingDate}
            onChange={setOpeningDate}
            placeholder="تاریخ افتتاحیه"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>انصراف</Button>
          <Button onClick={handleOpening} disabled={saving} sx={accountingButtonSx}>
            {saving ? "در حال ثبت…" : "تأیید و ثبت"}
          </Button>
        </DialogActions>
      </Dialog>
    </AccountingPageShell>
  );
}
