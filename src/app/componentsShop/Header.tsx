"use client";
import { useState, useEffect } from "react";
import { Badge, Box, Typography, IconButton, Container, Button, Drawer } from "@mui/material";
import { useTableOrdersPending } from "@/app/admin/table-orders/TableOrdersPendingProvider";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import ShareIcon from "@mui/icons-material/Share";
import { useRouter, usePathname } from "next/navigation";
import { isSuperAdminUser, getUserPhoneFromRecord } from "@/app/lib/superAdmin";
import { hasShopPermission } from "@/app/lib/shopPermissions";
import {
  getShopAccessFromUser,
  getAccessMenuSummary,
  readStoredShopAccessExpired,
  isShopAccessExpiredInfo,
  SHOP_ACCESS_EXPIRED_EVENT,
  SHOP_ACCESS_CLEARED_EVENT,
  SHOP_SUBSCRIPTION_URL,
  formatAccessEndDate,
} from "@/app/lib/shopAccess";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import AdminHamburgerSidebar, {
  ADMIN_SIDEBAR_WIDTH,
} from "@/app/admin/AdminHamburgerSidebar";
import { ADMIN_MENU_CART_WIDTH_VAR } from "@/app/admin/adminMenuCartLayout";
import { useAdminTheme } from "@/app/admin/theme/useAdminTheme";

interface HeaderProps {
  title?: string;
  rightAction?: React.ReactNode;
  showBack?: boolean;
  backUrl?: string;
}

export default function Header({
  title,
  rightAction,
  showBack = false,
  backUrl = "/admin",
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { mode, setMode } = useAdminTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const { count: pendingTableOrders } = useTableOrdersPending();
  const [user, setUser] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [shopAccessExpired, setShopAccessExpired] = useState(false);
  const [expiredAccessInfo, setExpiredAccessInfo] =
    useState<ReturnType<typeof getShopAccessFromUser>>(null);

  const syncAccessState = () => {
    const userData = localStorage.getItem("user");
    let parsedUser: Record<string, unknown> | null = null;
    if (userData) {
      try {
        parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("خطا در خواندن اطلاعات کاربر:", error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setIsSuperAdmin(isSuperAdminUser());

    const storedExpired = readStoredShopAccessExpired();
    const access = storedExpired ?? getShopAccessFromUser(parsedUser);
    const expired =
      !isSuperAdminUser() && (!!storedExpired || isShopAccessExpiredInfo(access));
    setShopAccessExpired(expired);
    setExpiredAccessInfo(expired ? access : null);
  };

  useEffect(() => {
    syncAccessState();

    const onExpired = () => syncAccessState();
    const onCleared = () => syncAccessState();

    window.addEventListener(SHOP_ACCESS_EXPIRED_EVENT, onExpired);
    window.addEventListener(SHOP_ACCESS_CLEARED_EVENT, onCleared);
    return () => {
      window.removeEventListener(SHOP_ACCESS_EXPIRED_EVENT, onExpired);
      window.removeEventListener(SHOP_ACCESS_CLEARED_EVENT, onCleared);
    };
  }, []);

  const loadUser = () => {
    syncAccessState();
  };

  const shopAccess = user ? getShopAccessFromUser(user) : null;
  const shopAccessSummary =
    !shopAccessExpired && user ? getAccessMenuSummary(shopAccess) : null;

  const displayPhone = user
    ? getUserPhoneFromRecord(user as Record<string, unknown>)
    : "";
  const hasShop = Boolean(
    (user as any)?.atelier || (user as any)?.atelier_id || (user as any)?.shop_code,
  );

  const shopDisplayName =
    user?.atelier?.name ||
    user?.atelier_name ||
    user?.shop_name ||
    user?.name ||
    "فروشگاه";

  const copyReferralLink = async () => {
    handleMenuClose();
    router.push("/admin/referral");
  };

  const handleBuySubscription = () => {
    handleMenuClose();
    window.open(SHOP_SUBSCRIPTION_URL, "_self");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("shop_access_expired");
    router.push("/admin/login");
  };

  const handleMenuOpen = () => {
    loadUser();
    setMenuOpen(true);
  };

  const handleMenuClose = () => {
    setMenuOpen(false);
  };

  const handleMenuClick = (path: string) => {
    router.push(path);
    handleMenuClose();
  };

  if (pathname?.includes("/login") || pathname?.includes("/print")) {
    return null;
  }

  const sidebarContent = (
    <AdminHamburgerSidebar
      pathname={pathname}
      shopName={shopDisplayName}
      isSuperAdmin={isSuperAdmin}
      onNavigate={handleMenuClick}
      accessBanner={
        shopAccessExpired && !isSuperAdmin ? (
          <Box>
            <Box
              sx={{
                px: 1.25,
                py: 1,
                mb: 0.5,
                borderRadius: "8px",
                backgroundColor: "rgba(244, 67, 54, 0.12)",
                border: "1px solid rgba(244, 67, 54, 0.35)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                <WarningAmberIcon sx={{ color: "#ff5252", fontSize: 16 }} />
                <Typography
                  sx={{ color: "var(--admin-text)", fontSize: "11px", fontWeight: 700 }}
                >
                  اعتبار فروشگاه تمام شده
                </Typography>
              </Box>
              <Typography
                sx={{ color: "var(--admin-text-muted)", fontSize: "10px", lineHeight: 1.5 }}
              >
                {expiredAccessInfo?.shop_access_ends_at
                  ? `پایان اعتبار: ${formatAccessEndDate(expiredAccessInfo.shop_access_ends_at)}`
                  : "برای ادامه استفاده، اشتراک تهیه کنید."}
              </Typography>
            </Box>
            <Button
              fullWidth
              size="small"
              onClick={handleBuySubscription}
              startIcon={<CardMembershipIcon sx={{ fontSize: 16 }} />}
              sx={{
                mb: 0.5,
                color: "var(--admin-text)",
                fontSize: "11px",
                backgroundColor: "rgba(255, 152, 0, 0.15)",
                "&:hover": { backgroundColor: "rgba(255, 152, 0, 0.28)" },
              }}
            >
              خرید اشتراک
            </Button>
          </Box>
        ) : shopAccessSummary ? (
          <Box
            sx={{
              px: 1.25,
              py: 1,
              mb: 0.5,
              borderRadius: "8px",
              backgroundColor: "var(--admin-info-bg)",
              border: "1px solid var(--admin-info-border)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
              <EventAvailableIcon sx={{ color: "var(--admin-info-icon)", fontSize: 16 }} />
              <Typography
                sx={{ color: "var(--admin-text)", fontSize: "11px", fontWeight: 700 }}
              >
                اعتبار کاربری
              </Typography>
            </Box>
            <Typography
              sx={{ color: "var(--admin-text-muted)", fontSize: "10px", lineHeight: 1.5 }}
            >
              {shopAccessSummary}
            </Typography>
          </Box>
        ) : null
      }
    />
  );

  const drawerPaperSx = {
    width: ADMIN_SIDEBAR_WIDTH,
    backgroundColor: "var(--admin-surface)",
    borderLeft: "1px solid var(--admin-accent-border)",
    borderRight: "none",
    borderRadius: 0,
    boxSizing: "border-box",
    height: "100%",
    overflow: "hidden",
  } as const;

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        backgroundColor: "var(--admin-header-bg)",
        paddingTop: { xs: "12px", md: "16px" },
        paddingBottom: { xs: "12px", md: "16px" },
        marginBottom: { xs: "12px", md: "16px" },
        // وقتی سبد حالت منو باز است، هدر کنار سبد می‌ماند (مثل فاصله با منوی راست)
        pl: `var(${ADMIN_MENU_CART_WIDTH_VAR}, 0px)`,
        pr: { md: `${ADMIN_SIDEBAR_WIDTH}px` },
      }}
    >
      {/* Desktop: fixed right sidebar */}
      <Drawer
        variant="permanent"
        anchor="right"
        open
        sx={{
          display: { xs: "none", md: "block" },
          width: ADMIN_SIDEBAR_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            ...drawerPaperSx,
            position: "fixed",
            right: 0,
            left: "auto",
            top: 0,
            zIndex: (theme) => theme.zIndex.drawer,
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* Mobile: temporary right drawer */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={menuOpen}
        onClose={handleMenuClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          zIndex: (theme) => theme.zIndex.modal + 1,
          "& .MuiDrawer-paper": drawerPaperSx,
        }}
      >
        {sidebarContent}
      </Drawer>

      <Container maxWidth="xl">
        {shopAccessExpired && !isSuperAdmin && (
          <Box
            sx={{
              mb: 1.5,
              p: { xs: 1.5, md: 2 },
              borderRadius: "12px",
              backgroundColor: "rgba(244, 67, 54, 0.15)",
              border: "1px solid rgba(244, 67, 54, 0.45)",
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "stretch", sm: "center" },
              gap: { xs: 1.25, sm: 2 },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
                flex: 1,
                minWidth: 0,
              }}
            >
              <WarningAmberIcon
                sx={{ color: "#ff5252", fontSize: 22, mt: 0.25, flexShrink: 0 }}
              />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "13px", md: "15px" },
                    color: "var(--admin-text)",
                    lineHeight: 1.5,
                  }}
                >
                  اعتبار فروشگاه تمام شده است
                </Typography>
                {expiredAccessInfo?.shop_access_ends_at && (
                  <Typography
                    sx={{
                      fontSize: "12px",
                      color: "var(--admin-text-muted)",
                      mt: 0.5,
                      lineHeight: 1.5,
                      wordBreak: "break-word",
                    }}
                  >
                    پایان اعتبار:{" "}
                    {formatAccessEndDate(expiredAccessInfo.shop_access_ends_at)}
                    {expiredAccessInfo.shop_access_days_remaining != null &&
                      ` — ${expiredAccessInfo.shop_access_days_remaining.toLocaleString("fa-IR")} روز`}
                  </Typography>
                )}
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<CardMembershipIcon />}
              onClick={handleBuySubscription}
              sx={{
                flexShrink: 0,
                width: { xs: "100%", sm: "auto" },
                backgroundColor: "#ff9800",
                fontWeight: 700,
                fontSize: { xs: "13px", md: "14px" },
                py: { xs: 1, sm: 0.75 },
                px: 2,
                whiteSpace: "nowrap",
                "&:hover": { backgroundColor: "#f57c00" },
              }}
            >
              خرید اشتراک
            </Button>
          </Box>
        )}

        <Box
          sx={{
            backgroundColor: "var(--admin-surface)",
            color: "var(--admin-text)",
            padding: { xs: "12px 16px", md: "16px 24px" },
            borderRadius: { xs: "12px", md: "16px" },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "1px solid var(--admin-header-bar-border)",
            gap: { xs: "12px", md: "16px" },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: "8px", md: "12px" } }}>
            <IconButton
              data-admin-tour="menu"
              onClick={handleMenuOpen}
              sx={{
                display: { xs: "inline-flex", md: "none" },
                color: "var(--admin-text)",
                backgroundColor: "var(--admin-icon-bg)",
                "&:hover": {
                  backgroundColor: "var(--admin-icon-bg-hover)",
                },
                width: { xs: "40px", md: "48px" },
                height: { xs: "40px", md: "48px" },
                flexShrink: 0,
              }}
            >
              <Badge
                badgeContent={pendingTableOrders}
                color="error"
                max={99}
                invisible={pendingTableOrders <= 0}
                sx={{ "& .MuiBadge-badge": { fontSize: "0.65rem", minWidth: 16, height: 16 } }}
              >
                <MenuIcon sx={{ fontSize: { xs: "24px", md: "28px" } }} />
              </Badge>
            </IconButton>

            {showBack && (
              <IconButton
                onClick={() => router.push(backUrl)}
                sx={{
                  color: "var(--admin-text)",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.2)",
                  },
                  width: { xs: "40px", md: "48px" },
                  height: { xs: "40px", md: "48px" },
                  flexShrink: 0,
                }}
              >
                <ArrowBackIcon sx={{ fontSize: { xs: "24px", md: "28px" } }} />
              </IconButton>
            )}
          </Box>

          {title ? (
            <Box
              sx={{
                padding: { xs: "6px 12px", md: "8px 20px" },
                borderRadius: { xs: "10px", md: "14px" },
                flexShrink: 0,
              }}
            >
              <Typography
                sx={{
                  fontWeight: "700",
                  fontSize: { xs: "14px", md: "18px" },
                  color: "var(--admin-text)",
                  textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              >
                {title}
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                background: "var(--admin-title-gradient)",
                padding: { xs: "8px 16px", md: "12px 24px" },
                borderRadius: { xs: "12px", md: "16px" },
                flexShrink: 0,
              }}
            >
              <Typography
                sx={{
                  fontWeight: "700",
                  fontSize: { xs: "16px", md: "20px" },
                  color: "var(--admin-text)",
                  textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              >
                {user?.atelier?.name || "فروشگاه"}
              </Typography>
            </Box>
          )}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: "8px", md: "12px" },
              flex: 1,
              justifyContent: "flex-end",
            }}
          >
            {rightAction && (
              <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {rightAction}
              </Box>
            )}
            {hasShop && hasShopPermission("referral") && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => void copyReferralLink()}
                startIcon={<ShareIcon sx={{ fontSize: { xs: 18, md: 20 } }} />}
                sx={{
                  borderColor: "#26a69a",
                  color: "#26a69a",
                  minWidth: { xs: 36, md: "auto" },
                  px: { xs: 0.8, md: 1.4 },
                  py: { xs: 0.45, md: 0.65 },
                  "&:hover": {
                    borderColor: "#00897b",
                    backgroundColor: "rgba(38,166,154,0.08)",
                  },
                }}
              >
                <Box
                  component="span"
                  sx={{ display: { xs: "none", md: "inline" }, whiteSpace: "nowrap" }}
                >
                  معرفی دوستان
                </Box>
              </Button>
            )}
            {user && (
              <>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: { xs: "6px", md: "12px" },
                    minWidth: 0,
                  }}
                >
                  <PersonIcon
                    sx={{
                      fontSize: { xs: "20px", md: "28px" },
                      color: "var(--admin-accent)",
                      flexShrink: 0,
                      display: { xs: "none", sm: "block" },
                    }}
                  />
                  <Box sx={{ minWidth: 0, textAlign: "right" }}>
                    <Typography
                      sx={{
                        fontSize: { xs: "12px", md: "18px" },
                        fontWeight: "700",
                        color: "var(--admin-text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: { xs: "100px", sm: "180px", md: "none" },
                      }}
                    >
                      {user.name || user.fullName || "کاربر"}
                    </Typography>
                    {displayPhone && (
                      <Typography
                        component="span"
                        dir="ltr"
                        sx={{
                          display: "block",
                          fontSize: { xs: "11px", md: "13px" },
                          color: "var(--admin-text-muted)",
                          marginTop: "2px",
                          letterSpacing: "0.02em",
                          unicodeBidi: "plaintext",
                        }}
                      >
                        {displayPhone}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <IconButton
                  onClick={() => setMode(mode === "light" ? "dark" : "light")}
                  aria-label={mode === "light" ? "حالت تیره" : "حالت روشن"}
                  sx={{
                    color: "var(--admin-accent)",
                    backgroundColor: "var(--admin-icon-bg)",
                    padding: { xs: "6px", md: "8px" },
                    flexShrink: 0,
                    "&:hover": {
                      backgroundColor: "var(--admin-icon-bg-hover)",
                    },
                  }}
                >
                  {mode === "light" ? (
                    <DarkModeIcon sx={{ fontSize: { xs: "18px", md: "24px" } }} />
                  ) : (
                    <LightModeIcon sx={{ fontSize: { xs: "18px", md: "24px" } }} />
                  )}
                </IconButton>
                <IconButton
                  onClick={handleLogout}
                  sx={{
                    color: "#ff4444",
                    backgroundColor: "rgba(255, 68, 68, 0.1)",
                    padding: { xs: "6px", md: "8px" },
                    flexShrink: 0,
                    "&:hover": {
                      backgroundColor: "rgba(255, 68, 68, 0.2)",
                    },
                  }}
                >
                  <LogoutIcon sx={{ fontSize: { xs: "18px", md: "24px" } }} />
                </IconButton>
              </>
            )}
            {!user && !rightAction && <Box sx={{ flex: 1 }} />}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
