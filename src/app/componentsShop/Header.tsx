"use client";
import { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Menu, MenuItem, Container, Button } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import AssessmentIcon from '@mui/icons-material/Assessment';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PeopleIcon from '@mui/icons-material/People';
import UndoIcon from '@mui/icons-material/Undo';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SmsIcon from '@mui/icons-material/Sms';
import SettingsIcon from '@mui/icons-material/Settings';
import CategoryIcon from '@mui/icons-material/Category';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FactoryIcon from '@mui/icons-material/Factory';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Divider from '@mui/material/Divider';
import { useRouter, usePathname } from 'next/navigation';
import { isSuperAdminUser } from '@/app/lib/superAdmin';
import {
  getShopAccessFromUser,
  getAccessMenuSummary,
  readStoredShopAccessExpired,
  isShopAccessExpiredInfo,
  SHOP_ACCESS_EXPIRED_EVENT,
  SHOP_ACCESS_CLEARED_EVENT,
  SHOP_SUBSCRIPTION_URL,
  formatAccessEndDate,
} from '@/app/lib/shopAccess';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import StorefrontIcon from '@mui/icons-material/Storefront';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CardMembershipIcon from '@mui/icons-material/CardMembership';

interface HeaderProps {
  title?: string;
  rightAction?: React.ReactNode;
  showBack?: boolean;
  backUrl?: string;
}

export default function Header({ title, rightAction, showBack = false, backUrl = "/admin" }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [financialMenuAnchor, setFinancialMenuAnchor] = useState<null | HTMLElement>(null);
  const [productManagementMenuAnchor, setProductManagementMenuAnchor] = useState<null | HTMLElement>(null);
  const [adminMenuAnchor, setAdminMenuAnchor] = useState<null | HTMLElement>(null);
  const [smsMenuAnchor, setSmsMenuAnchor] = useState<null | HTMLElement>(null);
  const [user, setUser] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [shopAccessExpired, setShopAccessExpired] = useState(false);
  const [expiredAccessInfo, setExpiredAccessInfo] = useState<ReturnType<typeof getShopAccessFromUser>>(null);

  const syncAccessState = () => {
    const userData = localStorage.getItem('user');
    let parsedUser: Record<string, unknown> | null = null;
    if (userData) {
      try {
        parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('خطا در خواندن اطلاعات کاربر:', error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setIsSuperAdmin(isSuperAdminUser());

    const storedExpired = readStoredShopAccessExpired();
    const access = storedExpired ?? getShopAccessFromUser(parsedUser);
    const expired = !isSuperAdminUser() && (!!storedExpired || isShopAccessExpiredInfo(access));
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

  const handleBuySubscription = () => {
    handleMenuClose();
    window.open(SHOP_SUBSCRIPTION_URL, "_self");
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('shop_access_expired');
    router.push('/admin/login');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    loadUser();
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setFinancialMenuAnchor(null);
    setProductManagementMenuAnchor(null);
    setAdminMenuAnchor(null);
    setSmsMenuAnchor(null);
  };

  const handleMenuClick = (path: string) => {
    router.push(path);
    handleMenuClose();
  };

  const handleFinancialMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFinancialMenuAnchor(event.currentTarget);
  };

  const handleFinancialMenuClose = () => {
    setFinancialMenuAnchor(null);
  };

  const handleProductManagementMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProductManagementMenuAnchor(event.currentTarget);
  };

  const handleProductManagementMenuClose = () => {
    setProductManagementMenuAnchor(null);
  };

  const handleAdminMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAdminMenuAnchor(event.currentTarget);
  };

  const handleAdminMenuClose = () => {
    setAdminMenuAnchor(null);
  };

  const handleSmsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSmsMenuAnchor(event.currentTarget);
  };

  const handleSmsMenuClose = () => {
    setSmsMenuAnchor(null);
  };

  // اگر در صفحه لاگین یا print هستیم، هدر را نمایش نده
  if (pathname?.includes('/login') || pathname?.includes('/print')) {
    return null;
  }

  return (
    <Box sx={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backgroundColor: "#1a1d2e",
      paddingTop: { xs: '12px', md: '16px' },
      paddingBottom: { xs: '12px', md: '16px' },
      marginBottom: { xs: '12px', md: '16px' }
    }}>
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
                    color: "#fff",
                    lineHeight: 1.5,
                  }}
                >
                  اعتبار فروشگاه تمام شده است
                </Typography>
                {expiredAccessInfo?.shop_access_ends_at && (
                  <Typography
                    sx={{
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.85)",
                      mt: 0.5,
                      lineHeight: 1.5,
                      wordBreak: "break-word",
                    }}
                  >
                    پایان اعتبار: {formatAccessEndDate(expiredAccessInfo.shop_access_ends_at)}
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
        <Box sx={{
          backgroundColor: "#2b3143",
          color: "#fff",
          padding: { xs: "12px 16px", md: "16px 24px" },
          borderRadius: { xs: "12px", md: "16px" },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          border: "1px solid rgba(55, 84, 165, 0.3)",
          gap: { xs: "12px", md: "16px" }
        }}>
          {/* Menu and Back Button */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: "8px", md: "12px" } }}>
            {/* Hamburger Menu - Always visible */}
            <IconButton
              onClick={handleMenuOpen}
              sx={{
                color: "#fff",
                backgroundColor: "rgba(255,255,255,0.1)",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.2)",
                },
                width: { xs: "40px", md: "48px" },
                height: { xs: "40px", md: "48px" },
                flexShrink: 0
              }}
            >
              <MenuIcon sx={{ fontSize: { xs: "24px", md: "28px" } }} />
            </IconButton>
            
            {/* Back Button - Only when showBack is true */}
            {showBack && (
              <IconButton
                onClick={() => router.push(backUrl)}
                sx={{
                  color: "#fff",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.2)",
                  },
                  width: { xs: "40px", md: "48px" },
                  height: { xs: "40px", md: "48px" },
                  flexShrink: 0
                }}
              >
                <ArrowBackIcon sx={{ fontSize: { xs: "24px", md: "28px" } }} />
              </IconButton>
            )}
          </Box>

          {/* Title or Shikshoo */}
          {title ? (
            <Box sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              padding: { xs: "6px 12px", md: "8px 20px" },
              borderRadius: { xs: "10px", md: "14px" },
              flexShrink: 0
            }}>
              <Typography sx={{
                fontWeight: "700",
                fontSize: { xs: "14px", md: "18px" },
                color: "#fff",
                textShadow: "0 2px 4px rgba(0,0,0,0.2)"
              }}>
                {title}
              </Typography>
            </Box>
          ) : (
            <Box sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              padding: { xs: "8px 16px", md: "12px 24px" },
              borderRadius: { xs: "12px", md: "16px" },
              flexShrink: 0
            }}>
              <Typography sx={{
                fontWeight: "700",
                fontSize: { xs: "16px", md: "20px" },
                color: "#fff",
                textShadow: "0 2px 4px rgba(0,0,0,0.2)"
              }}>
          {user?.atelier?.name || "فروشگاه"}
              </Typography>
            </Box>
          )}

          {/* Right Action or User Info */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: "8px", md: "12px" }, flex: 1, justifyContent: "flex-end" }}>
            {rightAction && (
              <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {rightAction}
              </Box>
            )}
            {user && (
              <>
                <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: { xs: "8px", md: "12px" } }}>
                  <PersonIcon sx={{ fontSize: { xs: "20px", md: "28px" }, color: "#667eea" }} />
                  <Box>
                    <Typography sx={{
                      fontSize: { xs: "14px", md: "18px" },
                      fontWeight: "700",
                      color: "#fff"
                    }}>
                      {user.name || user.username || "کاربر"}
                    </Typography>
                    {user.phone && (
                      <Typography sx={{
                        fontSize: { xs: "11px", md: "13px" },
                        color: "rgba(255,255,255,0.7)",
                        marginTop: "2px"
                      }}>
                        {user.phone}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <IconButton
                  onClick={handleLogout}
                  sx={{
                    color: "#ff4444",
                    backgroundColor: "rgba(255, 68, 68, 0.1)",
                    padding: { xs: "6px", md: "8px" },
                    flexShrink: 0,
                    "&:hover": {
                      backgroundColor: "rgba(255, 68, 68, 0.2)",
                    }
                  }}
                >
                  <LogoutIcon sx={{ fontSize: { xs: "18px", md: "24px" } }} />
                </IconButton>
              </>
            )}
            {!user && !rightAction && <Box sx={{ flex: 1 }} />}
          </Box>
        </Box>

        {/* Hamburger Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          sx={{
            "& .MuiPaper-root": {
              backgroundColor: "#2b3143",
              borderRadius: "16px",
              border: "1px solid rgba(120, 181, 104, 0.2)",
              minWidth: "220px",
              padding: "8px 0",
            }
          }}
        >
          {shopAccessExpired && !isSuperAdmin ? (
            <>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  mx: 1,
                  mb: 0.5,
                  borderRadius: "10px",
                  backgroundColor: "rgba(244, 67, 54, 0.12)",
                  border: "1px solid rgba(244, 67, 54, 0.35)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <WarningAmberIcon sx={{ color: "#ff5252", fontSize: 20 }} />
                  <Typography sx={{ color: "#fff", fontSize: "13px", fontWeight: 700 }}>
                    اعتبار فروشگاه تمام شده
                  </Typography>
                </Box>
                <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: "12px", lineHeight: 1.6 }}>
                  {expiredAccessInfo?.shop_access_ends_at
                    ? `پایان اعتبار: ${formatAccessEndDate(expiredAccessInfo.shop_access_ends_at)}`
                    : "برای ادامه استفاده، اشتراک تهیه کنید."}
                </Typography>
              </Box>
              <MenuItem
                onClick={handleBuySubscription}
                sx={{
                  color: "#fff",
                  fontSize: "15px",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  margin: "4px 8px",
                  backgroundColor: "rgba(255, 152, 0, 0.15)",
                  "&:hover": {
                    backgroundColor: "rgba(255, 152, 0, 0.28)",
                    transform: "translateX(-4px)",
                  },
                }}
              >
                <CardMembershipIcon sx={{ color: "#ff9800", fontSize: 22, ml: 1 }} />
                خرید اشتراک
              </MenuItem>
              <Divider sx={{ backgroundColor: "rgba(255, 255, 255, 0.1)", margin: "8px 0" }} />
            </>
          ) : (
            shopAccessSummary && (
              <>
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    mx: 1,
                    mb: 0.5,
                    borderRadius: "10px",
                    backgroundColor: "rgba(33, 150, 243, 0.12)",
                    border: "1px solid rgba(33, 150, 243, 0.25)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <EventAvailableIcon sx={{ color: "#2196f3", fontSize: 20 }} />
                    <Typography sx={{ color: "#fff", fontSize: "13px", fontWeight: 700 }}>
                      اعتبار کاربری
                    </Typography>
                  </Box>
                  <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: "12px", lineHeight: 1.6 }}>
                    {shopAccessSummary}
                  </Typography>
                </Box>
                <Divider sx={{ backgroundColor: "rgba(255, 255, 255, 0.1)", margin: "8px 0" }} />
              </>
            )
          )}
          {/* Financial Submenu */}
          <MenuItem
            onClick={handleFinancialMenuOpen}
            sx={{
              color: "#fff",
              fontSize: "15px",
              padding: "12px 20px",
              borderRadius: "8px",
              margin: "4px 8px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              "&:hover": {
                backgroundColor: "rgba(120, 181, 104, 0.15)",
                transform: "translateX(-4px)",
              }
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <AccountBalanceIcon sx={{ color: "#78b568", fontSize: "22px" }} />
              مالی
            </Box>
            <ChevronLeftIcon sx={{ fontSize: "20px" }} />
          </MenuItem>
          
          <MenuItem
            onClick={() => handleMenuClick("/admin/customers")}
            sx={{
              color: "#fff",
              fontSize: "15px",
              padding: "12px 20px",
              borderRadius: "8px",
              margin: "4px 8px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              "&:hover": {
                backgroundColor: "rgba(120, 181, 104, 0.15)",
                transform: "translateX(-4px)",
              }
            }}
          >
            <PeopleIcon sx={{ color: "#78b568", fontSize: "22px" }} />
            خریداران
          </MenuItem>
          <MenuItem
            onClick={() => handleMenuClick("/admin/orders")}
            sx={{
              color: "#fff",
              fontSize: "15px",
              padding: "12px 20px",
              borderRadius: "8px",
              margin: "4px 8px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              "&:hover": {
                backgroundColor: "rgba(120, 181, 104, 0.15)",
                transform: "translateX(-4px)",
              }
            }}
          >
            <ShoppingBagIcon sx={{ color: "#667eea", fontSize: "22px" }} />
            سفارشات
          </MenuItem>
          {/* Product Management Submenu */}
          <MenuItem
            onClick={handleProductManagementMenuOpen}
            sx={{
              color: "#fff",
              fontSize: "15px",
              padding: "12px 20px",
              borderRadius: "8px",
              margin: "4px 8px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              "&:hover": {
                backgroundColor: "rgba(120, 181, 104, 0.15)",
                transform: "translateX(-4px)",
              }
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <InventoryIcon sx={{ color: "#78b568", fontSize: "22px" }} />
              مدیریت کالا
            </Box>
            <ChevronLeftIcon sx={{ fontSize: "20px" }} />
          </MenuItem>
          <MenuItem
            onClick={handleSmsMenuOpen}
            sx={{
              color: "#fff",
              fontSize: "15px",
              padding: "12px 20px",
              borderRadius: "8px",
              margin: "4px 8px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              "&:hover": {
                backgroundColor: "rgba(120, 181, 104, 0.15)",
                transform: "translateX(-4px)",
              }
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <SmsIcon sx={{ color: "#78b568", fontSize: "22px" }} />
              پیامک
            </Box>
            <ChevronLeftIcon sx={{ fontSize: "20px" }} />
          </MenuItem>
          {isSuperAdmin && (
            <MenuItem
              onClick={handleAdminMenuOpen}
              sx={{
                color: "#fff",
                fontSize: "15px",
                padding: "12px 20px",
                borderRadius: "8px",
                margin: "4px 8px",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                "&:hover": {
                  backgroundColor: "rgba(255, 152, 0, 0.12)",
                  transform: "translateX(-4px)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <AdminPanelSettingsIcon sx={{ color: "#ff9800", fontSize: "22px" }} />
                ادمین
              </Box>
              <ChevronLeftIcon sx={{ fontSize: "20px" }} />
            </MenuItem>
          )}
          <Divider sx={{ backgroundColor: "rgba(255, 255, 255, 0.1)", margin: "8px 0" }} />
          <MenuItem
            onClick={() => handleMenuClick("/admin/settings")}
            sx={{
              color: "#fff",
              fontSize: "15px",
              padding: "12px 20px",
              borderRadius: "8px",
              margin: "4px 8px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              "&:hover": {
                backgroundColor: "rgba(120, 181, 104, 0.15)",
                transform: "translateX(-4px)",
              }
            }}
          >
            <SettingsIcon sx={{ color: "#78b568", fontSize: "22px" }} />
            تنظیمات
          </MenuItem>
        </Menu>

        {/* Financial Submenu */}
        <Menu
          anchorEl={financialMenuAnchor}
          open={Boolean(financialMenuAnchor)}
          onClose={handleFinancialMenuClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          sx={{
            "& .MuiPaper-root": {
              backgroundColor: "#2b3143",
              borderRadius: "16px",
              border: "1px solid rgba(120, 181, 104, 0.2)",
              minWidth: "220px",
              padding: "8px 0",
            }
          }}
        >
          <MenuItem
            onClick={() => handleMenuClick("/admin/reports")}
            sx={{
              color: "#fff",
              fontSize: "15px",
              padding: "12px 20px",
              borderRadius: "8px",
              margin: "4px 8px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              "&:hover": {
                backgroundColor: "rgba(120, 181, 104, 0.15)",
                transform: "translateX(-4px)",
              }
            }}
          >
            <AssessmentIcon sx={{ color: "#78b568", fontSize: "22px" }} />
            گزارشات
          </MenuItem>
          <MenuItem
            onClick={() => handleMenuClick("/admin/inventory")}
            sx={{
              color: "#fff",
              fontSize: "15px",
              padding: "12px 20px",
              borderRadius: "8px",
              margin: "4px 8px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              "&:hover": {
                backgroundColor: "rgba(120, 181, 104, 0.15)",
                transform: "translateX(-4px)",
              }
            }}
          >
            <InventoryIcon sx={{ color: "#78b568", fontSize: "22px" }} />
            موجودی انبار
          </MenuItem>
          <MenuItem
            onClick={() => handleMenuClick("/admin/expenses")}
            sx={{
              color: "#fff",
              fontSize: "15px",
              padding: "12px 20px",
              borderRadius: "8px",
              margin: "4px 8px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              "&:hover": {
                backgroundColor: "rgba(120, 181, 104, 0.15)",
                transform: "translateX(-4px)",
              }
            }}
          >
            <AttachMoneyIcon sx={{ color: "#78b568", fontSize: "22px" }} />
            هزینه‌ها
          </MenuItem>
          <MenuItem
            onClick={() => handleMenuClick("/admin/installments")}
            sx={{
              color: "#fff",
              fontSize: "15px",
              padding: "12px 20px",
              borderRadius: "8px",
              margin: "4px 8px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              "&:hover": {
                backgroundColor: "rgba(120, 181, 104, 0.15)",
                transform: "translateX(-4px)",
              }
            }}
          >
            <CreditCardIcon sx={{ color: "#ff9800", fontSize: "22px" }} />
            اقساط
          </MenuItem>
          <MenuItem
            onClick={() => handleMenuClick("/admin/installment-credits")}
            sx={{
              color: "#fff",
              fontSize: "15px",
              padding: "12px 20px",
              borderRadius: "8px",
              margin: "4px 8px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              "&:hover": {
                backgroundColor: "rgba(120, 181, 104, 0.15)",
                transform: "translateX(-4px)",
              }
            }}
          >
            <CreditCardIcon sx={{ color: "#2196f3", fontSize: "22px" }} />
            اعتبار اقساطی
          </MenuItem>
          <MenuItem
            onClick={() => handleMenuClick("/admin/expenses-statistics")}
            sx={{
              color: "#fff",
              fontSize: "15px",
              padding: "12px 20px",
              borderRadius: "8px",
              margin: "4px 8px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              "&:hover": {
                backgroundColor: "rgba(120, 181, 104, 0.15)",
                transform: "translateX(-4px)",
              }
            }}
          >
            <ReceiptIcon sx={{ color: "#78b568", fontSize: "22px" }} />
            گزارش هزینه‌ها
          </MenuItem>
          <MenuItem
            onClick={() => handleMenuClick("/admin/returned-products")}
            sx={{
              color: "#fff",
              fontSize: "15px",
              padding: "12px 20px",
              borderRadius: "8px",
              margin: "4px 8px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              "&:hover": {
                backgroundColor: "rgba(120, 181, 104, 0.15)",
                transform: "translateX(-4px)",
              }
            }}
          >
            <UndoIcon sx={{ color: "#78b568", fontSize: "22px" }} />
            برگشت خرید
          </MenuItem>
          <MenuItem
            onClick={() => handleMenuClick("/admin/profit-loss")}
            sx={{
              color: "#fff",
              fontSize: "15px",
              padding: "12px 20px",
              borderRadius: "8px",
              margin: "4px 8px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              "&:hover": {
                backgroundColor: "rgba(120, 181, 104, 0.15)",
                transform: "translateX(-4px)",
              }
            }}
          >
            <TrendingUpIcon sx={{ color: "#78b568", fontSize: "22px" }} />
            سود و ضرر
          </MenuItem>
        </Menu>

        {/* Product Management Submenu */}
        <Menu
          anchorEl={productManagementMenuAnchor}
          open={Boolean(productManagementMenuAnchor)}
          onClose={handleProductManagementMenuClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          sx={{
            "& .MuiPaper-root": {
              backgroundColor: "#2b3143",
              borderRadius: "16px",
              border: "1px solid rgba(120, 181, 104, 0.2)",
              minWidth: "220px",
              padding: "8px 0",
            }
          }}
        >
          <MenuItem
            onClick={() => handleMenuClick("/admin/best-selling")}
            sx={{
              color: "#fff",
              fontSize: "15px",
              padding: "12px 20px",
              borderRadius: "8px",
              margin: "4px 8px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              "&:hover": {
                backgroundColor: "rgba(120, 181, 104, 0.15)",
                transform: "translateX(-4px)",
              }
            }}
          >
            <TrendingUpIcon sx={{ color: "#ff9100", fontSize: "22px" }} />
            محصولات پرفروش
          </MenuItem>
          <MenuItem
            onClick={() => handleMenuClick("/admin/manufacturers")}
            sx={{
              color: "#fff",
              fontSize: "15px",
              padding: "12px 20px",
              borderRadius: "8px",
              margin: "4px 8px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              "&:hover": {
                backgroundColor: "rgba(120, 181, 104, 0.15)",
                transform: "translateX(-4px)",
              }
            }}
          >
            <FactoryIcon sx={{ color: "#9c27b0", fontSize: "22px" }} />
            تولیدکنندگان
          </MenuItem>
          <MenuItem
            onClick={() => handleMenuClick("/admin/invoices")}
            sx={{
              color: "#fff",
              fontSize: "15px",
              padding: "12px 20px",
              borderRadius: "8px",
              margin: "4px 8px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              "&:hover": {
                backgroundColor: "rgba(120, 181, 104, 0.15)",
                transform: "translateX(-4px)",
              }
            }}
          >
            <ReceiptIcon sx={{ color: "#2196f3", fontSize: "22px" }} />
            فاکتورها
          </MenuItem>
          <MenuItem
            onClick={() => handleMenuClick("/admin/categories")}
            sx={{
              color: "#fff",
              fontSize: "15px",
              padding: "12px 20px",
              borderRadius: "8px",
              margin: "4px 8px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              "&:hover": {
                backgroundColor: "rgba(120, 181, 104, 0.15)",
                transform: "translateX(-4px)",
              }
            }}
          >
            <CategoryIcon sx={{ color: "#9c27b0", fontSize: "22px" }} />
            دسته‌بندی
          </MenuItem>
          <MenuItem
            onClick={() => handleMenuClick("/admin/bulk-discount")}
            sx={{
              color: "#fff",
              fontSize: "15px",
              padding: "12px 20px",
              borderRadius: "8px",
              margin: "4px 8px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              "&:hover": {
                backgroundColor: "rgba(120, 181, 104, 0.15)",
                transform: "translateX(-4px)",
              }
            }}
          >
            <LocalOfferIcon sx={{ color: "#ff9100", fontSize: "22px" }} />
            تخفیف دسته جمعی
          </MenuItem>
        </Menu>

        {/* SMS Submenu */}
        <Menu
          anchorEl={smsMenuAnchor}
          open={Boolean(smsMenuAnchor)}
          onClose={handleSmsMenuClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          sx={{
            "& .MuiPaper-root": {
              backgroundColor: "#2b3143",
              borderRadius: "16px",
              border: "1px solid rgba(120, 181, 104, 0.2)",
              minWidth: "220px",
              padding: "8px 0",
            }
          }}
        >
          <MenuItem
            onClick={() => handleMenuClick("/admin/shop-sms-logs")}
            sx={{
              color: "#fff",
              fontSize: "15px",
              padding: "12px 20px",
              borderRadius: "8px",
              margin: "4px 8px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              "&:hover": {
                backgroundColor: "rgba(120, 181, 104, 0.15)",
                transform: "translateX(-4px)",
              }
            }}
          >
            <SmsIcon sx={{ color: "#78b568", fontSize: "22px" }} />
            پیامک‌های فروشگاه
          </MenuItem>
          <MenuItem
            onClick={() => handleMenuClick("/admin/broadcast-sms")}
            sx={{
              color: "#fff",
              fontSize: "15px",
              padding: "12px 20px",
              borderRadius: "8px",
              margin: "4px 8px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              "&:hover": {
                backgroundColor: "rgba(120, 181, 104, 0.15)",
                transform: "translateX(-4px)",
              }
            }}
          >
            <SmsIcon sx={{ color: "#2196f3", fontSize: "22px" }} />
            ارسال پیامک
          </MenuItem>
        </Menu>

        {/* Admin submenu — فقط شماره 09399166196 */}
        <Menu
          anchorEl={adminMenuAnchor}
          open={Boolean(adminMenuAnchor)}
          onClose={handleAdminMenuClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{
            "& .MuiPaper-root": {
              backgroundColor: "#2b3143",
              borderRadius: "16px",
              border: "1px solid rgba(255, 152, 0, 0.35)",
              minWidth: "240px",
              padding: "8px 0",
            },
          }}
        >
          <MenuItem
            onClick={() => handleMenuClick("/admin/shop-sms-quota")}
            sx={{
              color: "#fff",
              fontSize: "15px",
              padding: "12px 20px",
              borderRadius: "8px",
              margin: "4px 8px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              "&:hover": {
                backgroundColor: "rgba(255, 152, 0, 0.12)",
                transform: "translateX(-4px)",
              },
            }}
          >
            <StorefrontIcon sx={{ color: "#ff9800", fontSize: "22px" }} />
            مدیریت فروشگاه‌ها
          </MenuItem>
        </Menu>
      </Container>
    </Box>
  );
}

