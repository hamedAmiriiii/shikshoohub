"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Container,
  IconButton,
  Paper,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import BuildIcon from "@mui/icons-material/Build";
import EngineeringIcon from "@mui/icons-material/Engineering";
import HomeIcon from "@mui/icons-material/HomeOutlined";
import ListAltIcon from "@mui/icons-material/ListAlt";
import AddCircleIcon from "@mui/icons-material/AddCircleOutline";
import PersonIcon from "@mui/icons-material/PersonOutline";
import NewReleasesIcon from "@mui/icons-material/NewReleasesOutlined";
import AssignmentIcon from "@mui/icons-material/AssignmentOutlined";
import PaymentsIcon from "@mui/icons-material/PaymentsOutlined";
import { useRepairAuth } from "./RepairAuth";
import { RepairInstallIconButton, useRepairPwa } from "./RepairInstall";
import { isTechAppPath, repairLoginPathFor, type RepairRole } from "@/app/lib/repair/api";

type NavItem = { href: string; label: string; icon?: React.ReactNode };

const NAV: Record<RepairRole, NavItem[]> = {
  customer: [
    { href: "/repair", label: "خانه", icon: <HomeIcon /> },
    { href: "/repair/requests", label: "درخواست‌ها", icon: <ListAltIcon /> },
    { href: "/repair/requests/new", label: "درخواست جدید", icon: <AddCircleIcon /> },
    { href: "/repair/profile", label: "پروفایل", icon: <PersonIcon /> },
  ],
  technician: [
    { href: "/repair/tech/new", label: "درخواست جدید", icon: <NewReleasesIcon /> },
    { href: "/repair/tech", label: "درخواست‌ها", icon: <AssignmentIcon /> },
    { href: "/repair/tech/wallet", label: "پرداختی‌ها", icon: <PaymentsIcon /> },
    { href: "/repair/tech/profile", label: "پروفایل", icon: <PersonIcon /> },
  ],
  admin: [
    { href: "/repair/admin", label: "داشبورد" },
    { href: "/repair/admin/requests", label: "درخواست‌ها" },
    { href: "/repair/admin/technicians", label: "تعمیرکاران" },
    { href: "/repair/admin/services", label: "نوع خدمات" },
    { href: "/repair/admin/payouts", label: "سهم و تسویه" },
    { href: "/repair/admin/sms", label: "پیامک‌ها" },
    { href: "/repair/admin/settings", label: "تنظیمات" },
  ],
};

/** طولانی‌ترین مسیری که با آدرس فعلی می‌خواند فعال است. */
function activeHref(items: NavItem[], pathname: string) {
  const matches = items.filter(
    (item) => pathname === item.href || (item.href !== "/repair" && pathname.startsWith(`${item.href}/`)),
  );
  return matches.sort((a, b) => b.href.length - a.href.length)[0]?.href ?? "";
}

export default function RepairShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/repair";
  const router = useRouter();
  const { user, config, logout } = useRepairAuth();
  const techApp = isTechAppPath(pathname);
  const brand = config?.brand_name || "تعمیرکار";
  const title = techApp ? `پنل تعمیرکاران ${brand}` : brand;
  const homeHref = techApp ? "/repair/tech" : "/repair";
  const loginHref = repairLoginPathFor(pathname);
  const nav = user ? NAV[user.role] : [];
  const current = activeHref(nav, pathname);
  const bottomNav = Boolean(user) && user?.role !== "admin" && nav.length > 0;
  useRepairPwa(pathname);

  const handleLogout = async () => {
    await logout();
    router.replace(techApp ? "/repair/tech/login" : "/repair");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6fb", color: "text.primary" }}>
      <AppBar position="sticky" elevation={0} color="inherit" sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
        <Toolbar sx={{ gap: 1 }}>
          <Box
            component={Link}
            href={homeHref}
            sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main", textDecoration: "none", flexGrow: 1, minWidth: 0 }}
          >
            {techApp ? <EngineeringIcon /> : <BuildIcon />}
            <Typography fontWeight={800} noWrap>
              {title}
            </Typography>
          </Box>
          <RepairInstallIconButton />
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
            pathname !== loginHref && (
              <Button component={Link} href={loginHref} variant="outlined" size="small">
                ورود
              </Button>
            )
          )}
        </Toolbar>
        {nav.length > 0 && (
          <Stack
            direction="row"
            spacing={0.5}
            sx={{ px: 1, pb: 1, overflowX: "auto", display: bottomNav ? { xs: "none", md: "flex" } : "flex" }}
          >
            {nav.map((item) => (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                size="small"
                startIcon={item.icon}
                variant={current === item.href ? "contained" : "text"}
                disableElevation
                sx={{ flexShrink: 0, borderRadius: 5, "& .MuiButton-startIcon": { ml: 0.5, mr: 0 } }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
        )}
      </AppBar>
      <Container maxWidth="md" sx={{ py: 2.5, pb: bottomNav ? { xs: "calc(88px + env(safe-area-inset-bottom))", md: 2.5 } : 2.5 }}>
        {children}
      </Container>
      {bottomNav && (
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            insetInline: 0,
            bottom: 0,
            zIndex: (theme) => theme.zIndex.appBar,
            display: { xs: "block", md: "none" },
            pb: "env(safe-area-inset-bottom)",
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <BottomNavigation showLabels value={current} sx={{ height: 64 }}>
            {nav.map((item) => (
              <BottomNavigationAction
                key={item.href}
                component={Link}
                href={item.href}
                value={item.href}
                label={item.label}
                icon={item.icon}
                sx={{ minWidth: 0, px: 0.5, "& .MuiBottomNavigationAction-label": { fontSize: 11, whiteSpace: "nowrap" } }}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
}
