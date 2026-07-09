"use client";

import Box from "@mui/material/Box";
import AdminThemeProvider from "@/app/admin/theme/AdminThemeProvider";

export default function ReferralsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminThemeProvider>
      <Box
        className="admin-app"
        sx={{
          minHeight: "100vh",
          color: "var(--admin-text)",
          fontFamily: "var(--app-font-family)",
        }}
      >
        {children}
      </Box>
    </AdminThemeProvider>
  );
}
