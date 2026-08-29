"use client";
import { Box, Typography, Card, CardContent, Divider } from "@mui/material";
import React from "react";
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import Link from "next/link";
import { formatBeneficiaryAmount, parseAsBeneficiary } from "@/app/lib/beneficiaries";

const formatNumber = (num: number | string) => {
  const numValue = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
  if (isNaN(numValue)) return '';
  return new Intl.NumberFormat('fa-IR').format(numValue);
};

const formatDate = (dateString: string) => {
  if (!dateString) return "بدون تاریخ";
  try {
    // Parse date string like "2025-12-07 07:11:44"
    const date = new Date(dateString.replace(' ', 'T'));
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
};

export default function CustomerCard({ props: gridProps }: { props: { data?: Record<string, unknown> } }) {
  const customer = gridProps?.data;
  const asBeneficiary = parseAsBeneficiary(customer);
  
  return (
    <Card
      sx={{
        backgroundColor: "var(--admin-surface)",
        borderRadius: "15px",
        border: "1px solid rgba(55, 84, 165, 0.3)",
        marginBottom: "12px",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }
      }}
    >
      <CardContent sx={{ padding: "16px" }}>
        {/* Header with Phone */}
        <Box sx={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <Box
            sx={{
              backgroundColor: "var(--admin-surface-alt)",
              borderRadius: "50%",
              width: "48px",
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PersonIcon sx={{ color: "var(--admin-accent)", fontSize: "24px" }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: "var(--admin-text)", fontSize: "18px", fontWeight: "600" }}>
              {(customer?.name as string) || (customer?.phone as string) || "بدون شماره"}
            </Typography>
            {customer?.name ? (
              <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                <PhoneIcon sx={{ fontSize: "16px", color: "var(--admin-accent)" }} />
                {(customer?.phone as string) || "بدون شماره"}
              </Typography>
            ) : null}
          </Box>
        </Box>

        <Divider sx={{ backgroundColor: "var(--admin-divider)", marginBottom: "16px" }} />

        {/* تعداد کل خریدها */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <ShoppingCartIcon sx={{ color: "var(--admin-accent)", fontSize: "20px" }} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px", marginBottom: "2px" }}>
              تعداد کل خریدها
            </Typography>
            <Typography sx={{ color: "var(--admin-text)", fontSize: "16px", fontWeight: "600" }}>
              {customer?.total_purchases ? formatNumber(customer.total_purchases) : "0"} عدد
            </Typography>
          </Box>
        </Box>

        {/* مجموع مبلغ خرید */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <AttachMoneyIcon sx={{ color: "var(--admin-accent)", fontSize: "20px" }} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px", marginBottom: "2px" }}>
              مجموع مبلغ خرید
            </Typography>
            <Typography sx={{ color: "var(--admin-text)", fontSize: "16px", fontWeight: "600" }}>
              {customer?.total_spent ? formatNumber(customer.total_spent) : "0"} تومان
            </Typography>
          </Box>
        </Box>

        {/* مجموع اعتبار کسب‌شده */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <CardGiftcardIcon sx={{ color: "var(--admin-accent)", fontSize: "20px" }} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px", marginBottom: "2px" }}>
              مجموع اعتبار کسب‌شده
            </Typography>
            <Typography sx={{ color: "var(--admin-text)", fontSize: "16px", fontWeight: "600" }}>
              {customer?.total_credit_earned ? formatNumber(customer.total_credit_earned) : "0"} تومان
            </Typography>
          </Box>
        </Box>

        {/* تاریخ آخرین خرید */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <CalendarTodayIcon sx={{ color: "var(--admin-accent)", fontSize: "20px" }} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px", marginBottom: "2px" }}>
              تاریخ آخرین خرید
            </Typography>
            <Typography sx={{ color: "var(--admin-text)", fontSize: "16px", fontWeight: "600" }}>
              {customer?.last_purchase_date ? formatDate(customer.last_purchase_date) : "بدون تاریخ"}
            </Typography>
          </Box>
        </Box>

        {/* اعتبار فعلی */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "8px",
          }}
        >
          <AccountBalanceWalletIcon sx={{ color: "var(--admin-accent)", fontSize: "20px" }} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px", marginBottom: "2px" }}>
              اعتبار فعلی
            </Typography>
            <Typography sx={{ color: "var(--admin-accent)", fontSize: "16px", fontWeight: "600" }}>
              {customer?.current_credit ? formatNumber(customer.current_credit) : "0"} تومان
            </Typography>
          </Box>
        </Box>

        {asBeneficiary ? (
          <Box
            sx={{
              mt: 1,
              pt: 1.5,
              borderTop: "1px solid var(--admin-divider)",
            }}
          >
            <Typography sx={{ color: "var(--admin-text-muted)", fontSize: "12px", mb: 0.75 }}>
              خرید از این طرف‌حساب (ذینفع)
            </Typography>
            <Typography sx={{ color: "var(--admin-text)", fontSize: "13px" }}>
              کل خرید {formatBeneficiaryAmount(asBeneficiary.purchased_total)} — بدهی{" "}
              {formatBeneficiaryAmount(asBeneficiary.unpaid_total)} تومان
            </Typography>
            {asBeneficiary.id ? (
              <Typography
                component={Link}
                href={`/admin/beneficiaries/${asBeneficiary.id}`}
                sx={{ color: "var(--admin-accent)", fontSize: "12px", display: "inline-block", mt: 0.5 }}
              >
                مشاهده جزئیات ذینفع
              </Typography>
            ) : null}
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
}

