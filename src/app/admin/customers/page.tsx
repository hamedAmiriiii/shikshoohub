"use client";
import List from "@/app/coponent/grid/Grid";
import React, { useState, Suspense } from "react";
import { Box, Typography } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from "next/navigation";
import CustomerCard from "./customerCard";

export default function CustomersPage() {
  const router = useRouter();
  const [dataFilter, setDataFilter] = useState([]);

  let searchBoxList: any = [
    { fieldName: "phone", fieldOperation: "MATCH", fieldValue: "", nextConditionOperator: "OR" },
  ];

  const FilterComponent = () => <h1>ggggggggg</h1>;

  const formatNumber = (num: number | string) => {
    const numValue = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
    if (isNaN(numValue)) return '';
    return new Intl.NumberFormat('fa-IR').format(numValue);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "بدون تاریخ";
    try {
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

  const desktopColumns = [
    { 
      label: "شماره تلفن", 
      field: (item: any) => item?.phone || "بدون شماره",
      width: "150px"
    },
    { 
      label: "تعداد کل خریدها", 
      field: (item: any) => item?.total_purchases ? `${formatNumber(item.total_purchases)} عدد` : "0 عدد"
    },
    { 
      label: "مجموع مبلغ خرید", 
      field: (item: any) => item?.total_spent ? `${formatNumber(item.total_spent)} تومان` : "0 تومان"
    },
    { 
      label: "مجموع اعتبار کسب‌شده", 
      field: (item: any) => item?.total_credit_earned ? `${formatNumber(item.total_credit_earned)} تومان` : "0 تومان"
    },
    { 
      label: "تاریخ آخرین خرید", 
      field: (item: any) => item?.last_purchase_date ? formatDate(item.last_purchase_date) : "بدون تاریخ",
      width: "200px"
    },
    { 
      label: "اعتبار فعلی", 
      field: (item: any) => item?.current_credit ? `${formatNumber(item.current_credit)} تومان` : "0 تومان"
    },
  ];

  return (
    <Suspense fallback={<div>در حال بارگذاری...</div>}>
      <Box sx={{ width: "100%", direction: "rtl", padding: "16px", minHeight: "100vh", paddingBottom: "100px", background: "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)" }}>
       
        {/* List Section */}
        <div style={{ width: "100%", direction: "rtl" }} className="flex-col items-center justify-center">
          <List
            disableFilter={true}
            searchBoxList={searchBoxList}
            filterBoxList={dataFilter}
            CartComponent={(props: any) => <CustomerCard props={props} />}
            url="/api/customers"
            filterComponent={<FilterComponent />}
            showTotal={true}
            desktopColumns={desktopColumns}
          />
        </div>
      </Box>
    </Suspense>
  );
}

