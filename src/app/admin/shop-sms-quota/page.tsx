"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { useQueryClient } from "@tanstack/react-query";
import List from "@/app/coponent/grid/Grid";
import { isSuperAdminUser } from "@/app/lib/superAdmin";
import { formatAccessEndDate } from "@/app/lib/shopAccess";
import ShopSmsQuotaActions, {
  ShopSmsQuotaMobileCard,
  ShopSmsQuotaRow,
  AccessStatusChip,
} from "./ShopSmsQuotaActions";

const formatNumber = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

function getBalance(item: ShopSmsQuotaRow): number {
  if (typeof item.balance === "number") return item.balance;
  if (typeof item.shop_sms_quota === "number") return item.shop_sms_quota;
  return 0;
}

function getShopName(item: ShopSmsQuotaRow): string {
  return item.shop_name || item.name || "—";
}

function formatAccessCell(item: ShopSmsQuotaRow): string {
  const end = formatAccessEndDate(item.shop_access_ends_at);
  if (item.shop_access_days_remaining != null) {
    return `${end} (${item.shop_access_days_remaining.toLocaleString("fa-IR")} روز)`;
  }
  return end;
}

export default function AdminShopSmsQuotaPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!isSuperAdminUser()) {
      toast.error("دسترسی فقط برای ادمین سیستم");
      router.replace("/admin");
      return;
    }
    setAllowed(true);
  }, [router]);

  const refreshGrid = useCallback(() => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        if (key[0] === "datas-infinite" || key[0] === "datas-desktop") {
          const url = key[2];
          return typeof url === "string" && url.includes("/api/admin/shops");
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
        fieldName: "atelier_id",
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
    ],
    [],
  );

  const desktopColumns = useMemo(
    () => [
      {
        label: "نام فروشگاه",
        field: (item: ShopSmsQuotaRow) => getShopName(item),
        width: "20%",
      },
      {
        label: "شناسه",
        field: (item: ShopSmsQuotaRow) => item.atelier_id ?? item.id ?? "—",
        width: "7%",
        align: "center" as const,
      },
      {
        label: "تلفن",
        field: "phone",
        width: "11%",
      },
      {
        label: "محصول",
        field: (item: ShopSmsQuotaRow) =>
          item.products_count != null ? formatNumber(item.products_count) : "—",
        width: "7%",
        align: "center" as const,
      },
      {
        label: "پایان اعتبار",
        field: (item: ShopSmsQuotaRow) => formatAccessCell(item),
        width: "16%",
      },
      {
        label: "وضعیت",
        field: (item: ShopSmsQuotaRow) => <AccessStatusChip item={item} />,
        width: "8%",
        align: "center" as const,
      },
      {
        label: "پیامک",
        field: (item: ShopSmsQuotaRow) => (
          <Typography component="span" sx={{ color: "#78b568", fontWeight: 700, fontSize: "14px" }}>
            {formatNumber(getBalance(item))}
          </Typography>
        ),
        width: "8%",
        align: "center" as const,
      },
    ],
    [],
  );

  const MobileCard = useCallback(
    (props: { data: ShopSmsQuotaRow }) => (
      <ShopSmsQuotaMobileCard data={props.data} onSuccess={refreshGrid} />
    ),
    [refreshGrid],
  );

  if (!allowed) {
    return (
      <Box
        sx={{
          minHeight: "50vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress sx={{ color: "#78b568" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        background: "linear-gradient(180deg, #1a1d2e 0%, #2b3143 100%)",
        py: 3,
        px: { xs: 2, sm: 3, md: 4 },
        direction: "rtl",
        pb: 12,
        boxSizing: "border-box",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <StorefrontIcon sx={{ color: "#ff9800", fontSize: 32 }} />
          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "22px" }}>
            مدیریت فروشگاه‌ها
          </Typography>
        </Box>

        <List
          disableFilter
          searchBoxList={searchBoxList}
          filterBoxList={[]}
          filterComponent={<></>}
          url="/api/admin/shops"
          showTotal
          textTotal={["فروشگاه", ""]}
          rows={20}
          enablePagination
          desktopColumns={desktopColumns}
          renderRowActions={(item: ShopSmsQuotaRow) => (
            <ShopSmsQuotaActions item={item} onSuccess={refreshGrid} />
          )}
          CartComponent={MobileCard}
        />
      </Box>
      <ToastContainer position="bottom-right" rtl />
    </Box>
  );
}
