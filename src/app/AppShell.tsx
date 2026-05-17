"use client";

import { Box } from "@mui/material";
import { usePathname } from "next/navigation";
import ShopHeader from "./componentsShop/ShopHeader";
import { ShopProvider, useShopContext } from "./context/ShopContext";

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { searchQuery, setSearchQuery } = useShopContext();
  const pathname = usePathname();

  const isAdminPage = pathname?.startsWith("/admin");

  if (isAdminPage) {
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
  return (
    <ShopProvider>
      <AppShellContent>{children}</AppShellContent>
    </ShopProvider>
  );
}
