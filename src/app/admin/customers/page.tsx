"use client";
import React, { Suspense } from "react";
import { Box } from "@mui/material";
import CustomersList from "./CustomersList";
import { formatBeneficiaryAmount, parseAsBeneficiary } from "@/app/lib/beneficiaries";

export default function CustomersPage() {
  const searchBoxList = [
    { fieldName: "phone", fieldOperation: "MATCH" as const, fieldValue: "", nextConditionOperator: "OR" as const },
    { fieldName: "name", fieldOperation: "MATCH" as const, fieldValue: "", nextConditionOperator: "OR" as const },
  ];

  const formatNumber = (num: number | string) => {
    const numValue = typeof num === "string" ? parseFloat(num.replace(/,/g, "")) : num;
    if (isNaN(numValue)) return "";
    return new Intl.NumberFormat("fa-IR").format(numValue);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "بدون تاریخ";
    try {
      const date = new Date(dateString.replace(" ", "T"));
      if (isNaN(date.getTime())) return dateString;
      return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const desktopColumns = [
    {
      label: "نام",
      field: (item: { name?: string | null }) => item?.name?.trim() || "—",
    },
    {
      label: "شماره تلفن",
      field: (item: { phone?: string }) => item?.phone || "بدون شماره",
    },
    {
      label: "تعداد کل خریدها",
      field: (item: { total_purchases?: number }) =>
        item?.total_purchases ? `${formatNumber(item.total_purchases)} عدد` : "0 عدد",
    },
    {
      label: "مجموع مبلغ خرید",
      field: (item: { total_spent?: number }) =>
        item?.total_spent ? `${formatNumber(item.total_spent)} تومان` : "0 تومان",
    },
    {
      label: "مجموع اعتبار کسب‌شده",
      field: (item: { total_credit_earned?: number }) =>
        item?.total_credit_earned ? `${formatNumber(item.total_credit_earned)} تومان` : "0 تومان",
    },
    {
      label: "تاریخ آخرین خرید",
      field: (item: { last_purchase_date?: string }) =>
        item?.last_purchase_date ? formatDate(item.last_purchase_date) : "بدون تاریخ",
    },
    {
      label: "اعتبار فعلی",
      field: (item: { current_credit?: number }) =>
        item?.current_credit ? `${formatNumber(item.current_credit)} تومان` : "0 تومان",
    },
    {
      label: "خرید از او (ذینفع)",
      field: (item: unknown) => {
        const asBeneficiary = parseAsBeneficiary(item);
        if (!asBeneficiary) return "—";
        return `خرید ${formatBeneficiaryAmount(asBeneficiary.purchased_total)} / بدهی ${formatBeneficiaryAmount(asBeneficiary.unpaid_total)}`;
      },
    },
  ];

  return (
    <Suspense fallback={<div>در حال بارگذاری...</div>}>
      <Box
        sx={{
          width: "100%",
          direction: "rtl",
          padding: "16px",
          paddingBottom: "100px",
          minHeight: "100vh",
          background: "var(--admin-bg-gradient)",
        }}
      >
        <CustomersList
          disableFilter
          searchBoxList={searchBoxList}
          filterBoxList={[]}
          url="/api/customers"
          showTotal
          textTotal={["مشتری", ""]}
          rows={20}
          desktopColumns={desktopColumns}
        />
      </Box>
    </Suspense>
  );
}
