"use client";

import { Box } from "@mui/material";
import { usePathname } from "next/navigation";
import ShopHeader from "./componentsShop/ShopHeader";
import { ShopProvider, useShopContext } from "./context/ShopContext";
import { isCustomerAuthPath, isTableReservPath } from "./lib/shopStorefront";

function isOilPath(pathname: string | null) {
  return pathname === "/oil" || Boolean(pathname?.startsWith("/oil/"));
}

function isOilPublicPath(pathname: string | null) {
  return (
    pathname === "/oilservice" || Boolean(pathname?.startsWith("/oilservice/"))
  );
}

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { searchQuery, setSearchQuery } = useShopContext();
  const pathname = usePathname();

  const isAdminPage = pathname?.startsWith("/admin");
  const isLandingPage = pathname === "/" || pathname?.startsWith("/landing");
  const isAgencyRequest = pathname?.startsWith("/agency-request");
  const isCustomerAuth = isCustomerAuthPath(pathname);
  const isReferralPage = pathname?.startsWith("/referrals");
  const isTableReserv = isTableReservPath(pathname);
  const isOilApp = isOilPath(pathname);
  const isOilPublic = isOilPublicPath(pathname);

  if (
    isAdminPage ||
    isLandingPage ||
    isAgencyRequest ||
    isCustomerAuth ||
    isReferralPage ||
    isTableReserv ||
    isOilApp ||
    isOilPublic
  ) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f5f5", direction: "rtl" }}>
      <ShopHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <Box component="main">{children}</Box>
    </Box>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isOilPath(pathname) || isOilPublicPath(pathname)) {
    return <>{children}</>;
  }
  return (
    <ShopProvider>
      <AppShellContent>{children}</AppShellContent>
    </ShopProvider>
  );
}
