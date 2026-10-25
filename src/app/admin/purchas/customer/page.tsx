"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Container, Paper, Typography } from "@mui/material";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BeneficiarySelect from "@/app/admin/BeneficiarySelect";
import { adminPageSx } from "@/app/admin/theme/adminTheme";
import { isIranMobile, normalizeIranMobile } from "@/app/lib/purchaseReturns";
import type { Beneficiary } from "@/app/lib/beneficiaries";

export default function CustomerLedgerLookupPage() {
  const router = useRouter();
  const [beneficiaryId, setBeneficiaryId] = useState<number | "">("");

  const openHistory = (option: Beneficiary | null) => {
    if (!option) return;
    const phone = normalizeIranMobile(String(option.phone || ""));
    if (!isIranMobile(phone)) {
      toast.error("این طرف‌حساب شماره موبایل معتبر ندارد");
      return;
    }
    router.push(`/admin/purchas/customer/${phone}`);
  };

  return (
    <Box sx={{ ...adminPageSx, pt: { xs: 1.5, md: 2.5 }, pb: { xs: "100px", md: 4 } }}>
      <Container maxWidth="sm" sx={{ px: { xs: 1.25, md: 2 } }}>
        <ToastContainer autoClose={3000} position="bottom-right" rtl />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <PersonSearchIcon sx={{ color: "var(--admin-accent)", fontSize: 28 }} />
          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: "var(--admin-text)" }}>
              سابقه مشتری
            </Typography>
            <Typography sx={{ fontSize: 12, color: "var(--admin-text-muted)" }}>
              مشتری را پیدا کنید و گردش فروش، فاکتور و هزینه را ببینید
            </Typography>
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <BeneficiarySelect
            value={beneficiaryId}
            onChange={(id, option) => {
              setBeneficiaryId(id);
              openHistory(option);
            }}
            label="جستجو با نام یا طرف‌حساب"
            helperText="فقط نام یا شماره را تایپ کنید"
            allowRegister={false}
          />
        </Paper>
      </Container>
    </Box>
  );
}
