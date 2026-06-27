"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Chip, CircularProgress, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import List from "@/app/coponent/grid/Grid";
import { isSuperAdminUser } from "@/app/lib/superAdmin";
import {
  formatSmsPackageOrderStatus,
  getOrderPackage,
  getOrderShopName,
  getOrderSmsCount,
  getSmsPackageName,
  type SmsPackageOrder,
} from "@/app/lib/smsPackages";
import SmsPackageOrderActions, {
  SmsPackageOrderMobileCard,
  SmsPackageOrderStatusChip,
} from "./SmsPackageOrderActions";

const formatNumber = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

const STATUS_FILTERS = [
  { value: "pending", label: "در انتظار" },
  { value: "approved", label: "تأیید شده" },
  { value: "rejected", label: "رد شده" },
  { value: "all", label: "همه" },
] as const;

function formatOrderDate(value?: string): string {
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

export default function AdminSmsPackageOrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [allowed, setAllowed] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  useEffect(() => {
    if (!isSuperAdminUser()) {
      toast.error("دسترسی فقط برای ادمین سیستم");
      router.replace("/admin");
      return;
    }
    setAllowed(true);
  }, [router]);

  const listUrl = useMemo(() => {
    if (statusFilter && statusFilter !== "all") {
      return `/api/admin/sms-package-orders?status=${statusFilter}`;
    }
    return "/api/admin/sms-package-orders";
  }, [statusFilter]);

  const refreshGrid = useCallback(() => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        if (key[0] === "datas-infinite" || key[0] === "datas-desktop") {
          const url = key[2];
          return typeof url === "string" && url.includes("/api/admin/sms-package-orders");
        }
        return false;
      },
    });
  }, [queryClient]);

  const searchBoxList = useMemo(
    () => [
      {
        fieldName: "shop_name",
        fieldOperation: "MATCH" as const,
        fieldValue: "",
        nextConditionOperator: "OR" as const,
      },
      {
        fieldName: "phone",
        fieldOperation: "MATCH" as const,
        fieldValue: "",
        nextConditionOperator: "OR" as const,
      },
      {
        fieldName: "status",
        fieldOperation: "MATCH" as const,
        fieldValue: "",
        nextConditionOperator: "OR" as const,
      },
    ],
    [],
  );

  const desktopColumns = useMemo(
    () => [
      {
        label: "فروشگاه",
        field: (item: SmsPackageOrder) => getOrderShopName(item),
        width: "18%",
      },
      {
        label: "تلفن",
        field: (item: SmsPackageOrder) => item.phone || "—",
        width: "12%",
      },
      {
        label: "بسته",
        field: (item: SmsPackageOrder) => getSmsPackageName(getOrderPackage(item)),
        width: "14%",
      },
      {
        label: "تعداد پیامک",
        field: (item: SmsPackageOrder) => formatNumber(getOrderSmsCount(item)),
        width: "10%",
        align: "center" as const,
      },
      {
        label: "تاریخ",
        field: (item: SmsPackageOrder) => formatOrderDate(item.created_at),
        width: "16%",
      },
      {
        label: "وضعیت",
        field: (item: SmsPackageOrder) => <SmsPackageOrderStatusChip status={item.status} />,
        width: "10%",
        align: "center" as const,
      },
      {
        label: "یادداشت",
        field: (item: SmsPackageOrder) => item.admin_note || "—",
        width: "14%",
      },
    ],
    [],
  );

  const MobileCard = useCallback(
    (props: { data: SmsPackageOrder }) => (
      <SmsPackageOrderMobileCard data={props.data} onSuccess={refreshGrid} />
    ),
    [refreshGrid],
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
          <ReceiptLongIcon sx={{ color: "#ff9800", fontSize: 32 }} />
          <Typography sx={{ color: "var(--admin-text)", fontWeight: 700, fontSize: "22px" }}>
            درخواست‌های خرید بسته پیامک
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {STATUS_FILTERS.map((filter) => (
            <Chip
              key={filter.value}
              label={filter.label}
              clickable
              onClick={() => setStatusFilter(filter.value)}
              color={statusFilter === filter.value ? "primary" : "default"}
              sx={{
                fontWeight: 600,
                ...(statusFilter === filter.value
                  ? {
                      bgcolor: "var(--admin-accent)",
                      color: "#fff",
                      "&:hover": { bgcolor: "var(--admin-accent-hover)" },
                    }
                  : {
                      bgcolor: "var(--admin-surface)",
                      color: "var(--admin-text)",
                      border: "1px solid var(--admin-border)",
                    }),
              }}
            />
          ))}
        </Box>

        <List
          key={listUrl}
          disableFilter
          searchBoxList={searchBoxList}
          filterBoxList={[]}
          filterComponent={<></>}
          url={listUrl}
          showTotal
          textTotal={["درخواست", ""]}
          rows={20}
          enablePagination
          desktopColumns={desktopColumns}
          renderRowActions={(item: SmsPackageOrder) => (
            <SmsPackageOrderActions item={item} onSuccess={refreshGrid} />
          )}
          CartComponent={MobileCard}
        />
      </Box>
      <ToastContainer position="bottom-right" rtl />
    </Box>
  );
}
