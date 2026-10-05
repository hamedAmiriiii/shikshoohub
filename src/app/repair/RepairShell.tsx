"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/DashboardOutlined";
import CategoryIcon from "@mui/icons-material/CategoryOutlined";
import SmsIcon from "@mui/icons-material/SmsOutlined";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
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
    { href: "/repair/admin", label: "داشبورد", icon: <DashboardIcon /> },
    { href: "/repair/admin/requests", label: "درخواست‌ها", icon: <ListAltIcon /> },
    { href: "/repair/admin/technicians", label: "تعمیرکاران", icon: <EngineeringIcon /> },
    { href: "/repair/admin/services", label: "نوع خدمات", icon: <CategoryIcon /> },
    { href: "/repair/admin/payouts", label: "سهم و تسویه", icon: <PaymentsIcon /> },
    { href: "/repair/admin/sms", label: "پیامک‌ها", icon: <SmsIcon /> },
    { href: "/repair/admin/settings", label: "تنظیمات", icon: <SettingsIcon /> },
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
  const [menuOpen, setMenuOpen] = useState(false);
  useRepairPwa(pathname);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.replace(techApp ? "/repair/tech/login" : "/repair");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6fb", color: "text.primary" }}>
      <AppBar position="sticky" elevation={0} color="inherit" sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
        <Toolbar sx={{ gap: 1 }}>
          {nav.length > 0 && (
            <IconButton edge="start" onClick={() => setMenuOpen(true)} aria-label="منو">
              <MenuIcon />
            </IconButton>
          )}
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
      </AppBar>
      <Drawer anchor="left" open={menuOpen && nav.length > 0} onClose={() => setMenuOpen(false)}>
        <Box sx={{ width: 260, display: "flex", flexDirection: "column", height: "100%" }}>
          <Box sx={{ px: 2, py: 2 }}>
            <Typography fontWeight={800} noWrap color="primary.main">
              {title}
            </Typography>
            {user && (
              <Typography variant="body2" color="text.secondary" noWrap>
                {user.name || user.phone}
              </Typography>
            )}
          </Box>
          <Divider />
          <List sx={{ flexGrow: 1, py: 1 }}>
            {nav.map((item) => (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                selected={current === item.href}
                onClick={() => setMenuOpen(false)}
                sx={{ mx: 1, borderRadius: 2 }}
              >
                {item.icon && <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>}
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
          {user && (
            <>
              <Divider />
              <List sx={{ py: 1 }}>
                <ListItemButton onClick={() => void handleLogout()} sx={{ mx: 1, borderRadius: 2, color: "error.main" }}>
                  <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText primary="خروج" />
                </ListItemButton>
              </List>
            </>
          )}
        </Box>
      </Drawer>
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
