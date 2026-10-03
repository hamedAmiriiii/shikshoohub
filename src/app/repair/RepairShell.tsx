"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AppBar, Box, Button, Container, IconButton, Stack, Toolbar, Tooltip, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import BuildIcon from "@mui/icons-material/Build";
import { useRepairAuth } from "./RepairAuth";
import type { RepairRole } from "@/app/lib/repair/api";

const NAV: Record<RepairRole, { href: string; label: string }[]> = {
  customer: [
    { href: "/repair/requests", label: "درخواست‌های من" },
    { href: "/repair/requests/new", label: "درخواست جدید" },
  ],
  technician: [
    { href: "/repair/tech", label: "کارهای من" },
    { href: "/repair/tech/wallet", label: "کیف پول" },
  ],
  admin: [
    { href: "/repair/admin", label: "داشبورد" },
    { href: "/repair/admin/requests", label: "درخواست‌ها" },
    { href: "/repair/admin/technicians", label: "تعمیرکاران" },
    { href: "/repair/admin/payouts", label: "سهم و تسویه" },
    { href: "/repair/admin/settings", label: "تنظیمات" },
  ],
};

const ROOTS = ["/repair/admin", "/repair/tech", "/repair/requests"];

function isActive(href: string, pathname: string) {
  if (ROOTS.includes(href)) {
    if (href === "/repair/requests") {
      return pathname === href || (/^\/repair\/requests\/\d+/.test(pathname));
    }
    return pathname === href || (href === "/repair/tech" && pathname.startsWith("/repair/tech/requests"));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function RepairShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/repair";
  const router = useRouter();
  const { user, config, logout } = useRepairAuth();
  const brand = config?.brand_name || "تعمیرکار";
  const nav = user ? NAV[user.role] : [];

  const handleLogout = async () => {
    await logout();
    router.replace("/repair");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6fb" }}>
      <AppBar position="sticky" elevation={0} color="inherit" sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
        <Toolbar sx={{ gap: 1 }}>
          <Box
            component={Link}
            href="/repair"
            sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main", textDecoration: "none", flexGrow: 1 }}
          >
            <BuildIcon />
            <Typography fontWeight={800}>{brand}</Typography>
          </Box>
          {user ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
                {user.name || user.phone}
              </Typography>
              <Tooltip title="خروج">
                <IconButton onClick={() => void handleLogout()} size="small">
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            pathname !== "/repair/login" && (
              <Button component={Link} href="/repair/login" variant="outlined" size="small">
                ورود
              </Button>
            )
          )}
        </Toolbar>
        {nav.length > 0 && (
          <Stack direction="row" spacing={0.5} sx={{ px: 1, pb: 1, overflowX: "auto" }}>
            {nav.map((item) => (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                size="small"
                variant={isActive(item.href, pathname) ? "contained" : "text"}
                disableElevation
                sx={{ flexShrink: 0, borderRadius: 5 }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
        )}
      </AppBar>
      <Container maxWidth="md" sx={{ py: 2.5 }}>
        {children}
      </Container>
    </Box>
  );
}
