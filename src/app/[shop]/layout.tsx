"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useShopContext } from "../context/ShopContext";

export default function ShopLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { shopCode, shopLoading, shopError } = useShopContext();

  // هنگام hydrate ممکن است pathname خالی باشد؛ از location واقعی استفاده می‌کنیم
  // تا اسپینر فروشگاه روی /reserv و /room نپرد و اسکلتون صفحه بماند.
  const pathForGuard =
    pathname || (typeof window !== "undefined" ? window.location.pathname : "");
  const isReservPlace =
    pathForGuard.includes("/reserv/") || pathForGuard.includes("/room/");

  useEffect(() => {
    if (!shopLoading && shopError && shopCode) {
      if (shopError.includes("یافت نشد")) {
        // router.replace("/landing");
      }
    }
  }, [shopLoading, shopError, shopCode, router]);

  // صفحه سفارش میز/اتاق اسکلتون خودش را نشان می‌دهد؛ اسپینر اینجا باعث پرش اسکلتون→دایره→اسکلتون می‌شد
  if (shopLoading && !shopError && !isReservPlace) {
    return (
      <Box
        sx={{
          minHeight: "50vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress sx={{ color: "#78b568" }} />
        <Typography color="text.secondary">در حال بارگذاری فروشگاه...</Typography>
      </Box>
    );
  }

  if (shopError && shopError.includes("یافت نشد")) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="error">
          {shopError}
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
}