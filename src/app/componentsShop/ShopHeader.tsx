"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Avatar,
  Paper,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  InputBase,
  Divider,
  Popover,
} from "@mui/material";
import { useRouter, usePathname } from "next/navigation";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CloseIcon from "@mui/icons-material/Close";
import CategoryIcon from "@mui/icons-material/Category";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import { getCartItemCount } from "../liberari/cart";
import { useShopContext } from "../context/ShopContext";
import {
  customerDataStorageKey,
  getCustomerToken,
  getShopCodeFromPathname,
} from "../lib/shopStorefront";
import {
  getActiveRootCategories,
  resolveCategoryImageUrl,
  type ShopCategory,
} from "../lib/shopCategories";
import { resolveMediaUrl } from "../lib/onlineStorefront";

type CustomerSession = {
  name?: string;
  phone?: string;
};

interface ShopHeaderProps {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

function CategoryAvatar({ category, size = 32 }: { category: ShopCategory; size?: number }) {
  const src = resolveCategoryImageUrl(category);
  if (!src) return null;
  return (
    <Avatar
      src={src}
      alt={category.name}
      sx={{ width: size, height: size, flexShrink: 0 }}
    />
  );
}

function MobileCategoryTree({
  categories,
  onNavigate,
}: {
  categories: ShopCategory[];
  onNavigate: (id: number) => void;
}) {
  const active = categories.filter((cat) => cat.is_active !== false);

  if (!active.length) {
    return (
      <Box sx={{ textAlign: "center", py: 5, px: 2 }}>
        <CategoryIcon sx={{ fontSize: 48, color: "#ddd", mb: 1.5 }} />
        <Typography sx={{ color: "#999", fontSize: 14 }}>دسته‌بندی‌ای یافت نشد</Typography>
      </Box>
    );
  }

  return (
    <List sx={{ p: 0 }}>
      {active.map((category) => {
        const children = (category.children ?? []).filter((c) => c.is_active !== false);
        const hasChildren = children.length > 0;

        if (!hasChildren) {
          return (
            <ListItem key={category.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => onNavigate(category.id)}
                sx={{
                  borderRadius: 2,
                  py: 1.25,
                  px: 2,
                  gap: 1.5,
                  "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                }}
              >
                <CategoryAvatar category={category} />
                <ListItemText
                  primary={category.name}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: 600, color: "#3f4064" }}
                />
                <KeyboardArrowLeftIcon sx={{ color: "#a1a3a8", fontSize: 20 }} />
              </ListItemButton>
            </ListItem>
          );
        }

        return (
          <Accordion
            key={category.id}
            disableGutters
            elevation={0}
            sx={{
              mb: 0.5,
              bgcolor: "#f5f5f5",
              borderRadius: "12px !important",
              overflow: "hidden",
              "&:before": { display: "none" },
              "&.Mui-expanded": { mb: 0.5 },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: "var(--shop-primary)" }} />}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest(".MuiAccordionSummary-expandIconWrapper")) return;
                e.preventDefault();
                e.stopPropagation();
                onNavigate(category.id);
              }}
              sx={{
                minHeight: 52,
                px: 2,
                cursor: "pointer",
                "& .MuiAccordionSummary-content": { my: 1, gap: 1.5, alignItems: "center" },
              }}
            >
              <CategoryAvatar category={category} />
              <Typography sx={{ fontWeight: 600, fontSize: 14, color: "#3f4064", flex: 1 }}>
                {category.name}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, pb: 1.5, px: 1.5 }}>
              <List dense disablePadding>
                {children.map((sub) => (
                  <ListItem key={sub.id} disablePadding sx={{ mb: 0.25 }}>
                    <ListItemButton
                      onClick={() => onNavigate(sub.id)}
                      sx={{
                        borderRadius: 1.5,
                        py: 1,
                        px: 1.5,
                        bgcolor: "#fff",
                        gap: 1,
                      }}
                    >
                      <CategoryAvatar category={sub} size={28} />
                      <ListItemText
                        primary={sub.name}
                        primaryTypographyProps={{ fontSize: 13, fontWeight: 500, color: "#62666d" }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </List>
  );
}

export default function ShopHeader({ searchQuery = "", onSearchChange }: ShopHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    shopCode: ctxShopCode,
    shopPath,
    shopDisplayName,
    logoUrl,
    visibleCategories,
    categoriesLoading,
    storefront,
    clearCustomerSession,
  } = useShopContext();
  const showHeaderCategories = storefront.show_header_categories !== false;

  const shopCode = ctxShopCode ?? getShopCodeFromPathname(pathname);
  const hideSearch = pathname?.includes("/cart") || pathname?.includes("/orders");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [accountAnchor, setAccountAnchor] = useState<null | HTMLElement>(null);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [isScrolled, setIsScrolled] = useState(false);
  const [categoryPopover, setCategoryPopover] = useState<{
    anchor: HTMLElement;
    category: ShopCategory;
  } | null>(null);
  const closePopoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rootCategories = useMemo(
    () => getActiveRootCategories(visibleCategories),
    [visibleCategories],
  );

  const logoSrc = logoUrl ? resolveMediaUrl(logoUrl) : "";
  const primary = "var(--shop-primary)";

  const homeHref = shopCode ? shopPath() : "/";
  const loginHref = shopCode ? shopPath("/login") : "/login";
  const registerHref = shopCode ? shopPath("/register") : "/register";
  const cartHref = shopCode ? shopPath("/cart") : "/cart";
  const ordersHref = shopCode ? shopPath("/orders") : "/orders";

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearchChange && localSearchQuery !== searchQuery) {
        onSearchChange(localSearchQuery);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [localSearchQuery, onSearchChange, searchQuery]);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const updateCartCount = () => setCartItemCount(getCartItemCount(shopCode));
    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("cartUpdated", updateCartCount);
    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, [shopCode]);

  useEffect(() => {
    const loadCustomer = () => {
      if (!shopCode) {
        setCustomer(null);
        return;
      }
      const token = getCustomerToken(shopCode);
      const data = localStorage.getItem(customerDataStorageKey(shopCode));
      if (token && data) {
        try {
          setCustomer(JSON.parse(data) as CustomerSession);
        } catch {
          setCustomer(null);
        }
      } else {
        setCustomer(null);
      }
    };
    loadCustomer();
    window.addEventListener("storage", loadCustomer);
    window.addEventListener("focus", loadCustomer);
    window.addEventListener("customerLogin", loadCustomer);
    return () => {
      window.removeEventListener("storage", loadCustomer);
      window.removeEventListener("focus", loadCustomer);
      window.removeEventListener("customerLogin", loadCustomer);
    };
  }, [shopCode]);

  const handleCategoryNavigation = useCallback(
    (categoryId: number) => {
      router.push(shopCode ? shopPath(`/category/${categoryId}`) : `/category/${categoryId}`);
      setDrawerOpen(false);
      setCategoryPopover(null);
    },
    [router, shopCode, shopPath],
  );

  const handleLogout = () => {
    setAccountAnchor(null);
    clearCustomerSession();
    setCustomer(null);
    router.push(homeHref);
  };

  const openCategoryPopover = (anchor: HTMLElement, category: ShopCategory) => {
    if (closePopoverTimer.current) clearTimeout(closePopoverTimer.current);
    setCategoryPopover({ anchor, category });
  };

  const scheduleClosePopover = () => {
    closePopoverTimer.current = setTimeout(() => setCategoryPopover(null), 180);
  };

  const cancelClosePopover = () => {
    if (closePopoverTimer.current) clearTimeout(closePopoverTimer.current);
  };

  const searchField = (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        px: 1.5,
        py: 0.75,
        bgcolor: "#f0f0f1",
        borderRadius: 2,
        border: "1px solid transparent",
        transition: "border-color 0.2s",
        "&:focus-within": {
          borderColor: primary,
          bgcolor: "#fff",
        },
      }}
    >
      <SearchIcon sx={{ color: "#a1a3a8", ml: 0.5, fontSize: 22 }} />
      <InputBase
        placeholder={`جستجو در ${shopDisplayName}`}
        value={localSearchQuery}
        onChange={(e) => setLocalSearchQuery(e.target.value)}
        sx={{
          flex: 1,
          "& .MuiInputBase-input": {
            color: "#3f4064",
            fontSize: 14,
            direction: "rtl",
            py: 0.5,
            "&::placeholder": { color: "#a1a3a8", opacity: 1 },
          },
        }}
      />
      {localSearchQuery ? (
        <IconButton size="small" onClick={() => setLocalSearchQuery("")} sx={{ color: "#a1a3a8" }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      ) : null}
    </Paper>
  );

  return (
    <>
      <Box
        component="header"
        dir="rtl"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1300,
          bgcolor: "#fff",
          borderBottom: "1px solid #e0e0e2",
          boxShadow: isScrolled ? "0 1px 8px rgba(0,0,0,0.06)" : "none",
          transition: "box-shadow 0.2s ease",
        }}
      >
        {/* Top bar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 1, md: 2 },
            px: { xs: 1.5, md: 3 },
            py: { xs: 1.25, md: 1.5 },
            maxWidth: 1440,
            mx: "auto",
            width: "100%",
          }}
        >
          <IconButton
            onClick={() => setDrawerOpen(true)}
            aria-label="منوی دسته‌بندی"
            sx={{
              display: { xs: "flex", md: "none" },
              color: "#3f4064",
              border: "1px solid #e0e0e2",
              borderRadius: 2,
              p: 1,
            }}
          >
            <MenuIcon />
          </IconButton>

          <Box
            onClick={() => router.push(homeHref)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              cursor: "pointer",
              flexShrink: 0,
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                width: { xs: 40, md: 48 },
                height: { xs: 40, md: 48 },
                borderRadius: 1.5,
                border: logoSrc ? "1px solid #eee" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                bgcolor: logoSrc ? "#fff" : `${primary}14`,
              }}
            >
              {logoSrc ? (
                <Image
                  src={logoSrc}
                  alt={shopDisplayName}
                  width={48}
                  height={48}
                  unoptimized
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : (
                <StorefrontIcon sx={{ color: primary, fontSize: { xs: 22, md: 26 } }} />
              )}
            </Box>
            <Typography
              noWrap
              sx={{
                fontWeight: 800,
                fontSize: { xs: 16, md: 20 },
                color: primary,
                display: { xs: "none", sm: "block" },
                maxWidth: { sm: 140, md: 220 },
              }}
            >
              {shopDisplayName}
            </Typography>
          </Box>

          {onSearchChange && !hideSearch ? (
            <Box sx={{ display: { xs: "none", md: "flex" }, flex: 1, maxWidth: 560, mx: 2 }}>
              {searchField}
            </Box>
          ) : (
            <Box sx={{ flex: 1, display: { xs: "none", md: "block" } }} />
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, md: 1 }, flexShrink: 0 }}>
            {customer ? (
              <>
                <Button
                  onClick={(e) => setAccountAnchor(e.currentTarget)}
                  sx={{
                    textTransform: "none",
                    color: "#3f4064",
                    gap: 1,
                    px: { xs: 0.75, md: 1.5 },
                    borderRadius: 2,
                    border: "1px solid #e0e0e2",
                    minWidth: 0,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: primary,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {(customer.name || customer.phone || "U").charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography
                    noWrap
                    sx={{
                      fontSize: 13,
                      fontWeight: 500,
                      display: { xs: "none", sm: "block" },
                      maxWidth: 96,
                    }}
                  >
                    {customer.name || customer.phone}
                  </Typography>
                  <ExpandMoreIcon sx={{ fontSize: 18, display: { xs: "none", sm: "block" } }} />
                </Button>
                <Menu
                  anchorEl={accountAnchor}
                  open={Boolean(accountAnchor)}
                  onClose={() => setAccountAnchor(null)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                  transformOrigin={{ vertical: "top", horizontal: "left" }}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      minWidth: 220,
                      borderRadius: 2,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid #f0f0f0" }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#3f4064" }}>
                      {customer.name || "کاربر"}
                    </Typography>
                    {customer.phone ? (
                      <Typography sx={{ fontSize: 12, color: "#81858b" }}>{customer.phone}</Typography>
                    ) : null}
                  </Box>
                  <MenuItem
                    onClick={() => {
                      setAccountAnchor(null);
                      router.push(ordersHref);
                    }}
                    sx={{ gap: 1.5, py: 1.25 }}
                  >
                    <ShoppingBagIcon sx={{ color: primary, fontSize: 20 }} />
                    <Typography sx={{ fontSize: 14 }}>سفارشات من</Typography>
                  </MenuItem>
                  <MenuItem onClick={handleLogout} sx={{ gap: 1.5, py: 1.25, color: "#d32f2f" }}>
                    <LogoutIcon sx={{ fontSize: 20 }} />
                    <Typography sx={{ fontSize: 14 }}>خروج از حساب</Typography>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button
                  onClick={() => router.push(loginHref)}
                  startIcon={<PersonOutlineIcon sx={{ fontSize: 20 }} />}
                  sx={{
                    textTransform: "none",
                    color: "#3f4064",
                    fontSize: 13,
                    px: { xs: 1, md: 1.5 },
                    borderRadius: 2,
                    border: "1px solid #e0e0e2",
                  }}
                >
                  <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                    ورود
                  </Box>
                </Button>
                <Button
                  variant="contained"
                  onClick={() => router.push(registerHref)}
                  disableElevation
                  sx={{
                    textTransform: "none",
                    bgcolor: primary,
                    fontSize: 13,
                    fontWeight: 700,
                    px: { xs: 1.25, md: 2 },
                    borderRadius: 2,
                    "&:hover": { bgcolor: primary, filter: "brightness(0.92)" },
                  }}
                >
                  ثبت‌نام
                </Button>
              </>
            )}

            <IconButton
              onClick={() => router.push(cartHref)}
              aria-label="سبد خرید"
              sx={{
                border: "1px solid #e0e0e2",
                borderRadius: 2,
                p: 1,
              }}
            >
              <Badge
                badgeContent={cartItemCount}
                color="error"
                sx={{
                  "& .MuiBadge-badge": {
                    bgcolor: primary,
                    fontWeight: 700,
                    fontSize: 10,
                    minWidth: 16,
                    height: 16,
                  },
                }}
              >
                <ShoppingCartIcon sx={{ color: "#3f4064", fontSize: 24 }} />
              </Badge>
            </IconButton>
          </Box>
        </Box>

        {onSearchChange && !hideSearch ? (
          <Box sx={{ display: { xs: "block", md: "none" }, px: 1.5, pb: 1.25 }}>
            {searchField}
          </Box>
        ) : null}

        {/* Desktop category row */}
        {showHeaderCategories ? (
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            borderTop: "1px solid #f0f0f1",
            bgcolor: "#fafafa",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: 3,
              py: 0.75,
              maxWidth: 1440,
              mx: "auto",
              overflowX: "auto",
              scrollbarWidth: "thin",
            }}
          >
            <Button
              startIcon={<MenuIcon sx={{ fontSize: 20 }} />}
              onClick={() => setDrawerOpen(true)}
              sx={{
                textTransform: "none",
                color: "#3f4064",
                fontWeight: 700,
                fontSize: 13,
                flexShrink: 0,
                borderRadius: 2,
                px: 1.5,
                "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
              }}
            >
              دسته‌بندی کالاها
            </Button>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: "#e0e0e2" }} />
            {categoriesLoading ? (
              <CircularProgress size={22} sx={{ color: primary, mx: 2 }} />
            ) : (
              rootCategories.map((cat) => {
                const children = (cat.children ?? []).filter((c) => c.is_active !== false);
                const hasChildren = children.length > 0;
                return (
                  <Button
                    key={cat.id}
                    onClick={() => !hasChildren && handleCategoryNavigation(cat.id)}
                    onMouseEnter={(e) => {
                      if (hasChildren) openCategoryPopover(e.currentTarget, cat);
                    }}
                    onMouseLeave={() => hasChildren && scheduleClosePopover()}
                    sx={{
                      textTransform: "none",
                      color: "#62666d",
                      fontSize: 13,
                      fontWeight: 500,
                      flexShrink: 0,
                      px: 1.25,
                      py: 0.75,
                      borderRadius: 2,
                      gap: 0.75,
                      "&:hover": { color: primary, bgcolor: "transparent" },
                    }}
                  >
                    {resolveCategoryImageUrl(cat) ? (
                      <CategoryAvatar category={cat} size={24} />
                    ) : null}
                    {cat.name}
                    {hasChildren ? <ExpandMoreIcon sx={{ fontSize: 16, opacity: 0.6 }} /> : null}
                  </Button>
                );
              })
            )}
          </Box>
        </Box>
        ) : null}
      </Box>

      <Popover
        open={Boolean(categoryPopover)}
        anchorEl={categoryPopover?.anchor ?? null}
        onClose={() => setCategoryPopover(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        disableRestoreFocus
        sx={{ pointerEvents: "none" }}
        slotProps={{
          paper: {
            onMouseEnter: cancelClosePopover,
            onMouseLeave: scheduleClosePopover,
            sx: {
              pointerEvents: "auto",
              mt: 0.5,
              minWidth: 220,
              borderRadius: 2,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              p: 1,
            },
          },
        }}
      >
        {categoryPopover?.category.children?.filter((c) => c.is_active !== false).map((sub) => (
          <MenuItem
            key={sub.id}
            onClick={() => handleCategoryNavigation(sub.id)}
            sx={{ gap: 1.25, borderRadius: 1.5, py: 1 }}
          >
            <CategoryAvatar category={sub} size={28} />
            <Typography sx={{ fontSize: 13 }}>{sub.name}</Typography>
          </MenuItem>
        ))}
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => handleCategoryNavigation(categoryPopover!.category.id)}
          sx={{ color: primary, fontWeight: 600, fontSize: 13, justifyContent: "center" }}
        >
          همه محصولات {categoryPopover?.category.name}
        </MenuItem>
      </Popover>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: 300, sm: 340 },
            borderRadius: "16px 0 0 16px",
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #eee",
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: 17, color: "#3f4064" }}>
            دسته‌بندی‌ها
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", p: 1.5 }}>
          {categoriesLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress sx={{ color: primary }} />
            </Box>
          ) : (
            <MobileCategoryTree
              categories={visibleCategories}
              onNavigate={handleCategoryNavigation}
            />
          )}
        </Box>

        <Box sx={{ p: 2, borderTop: "1px solid #eee", bgcolor: "#fafafa" }}>
          <Button
            fullWidth
            variant="contained"
            disableElevation
            onClick={() => {
              setDrawerOpen(false);
              router.push(homeHref);
            }}
            startIcon={<StorefrontIcon />}
            sx={{
              bgcolor: primary,
              textTransform: "none",
              fontWeight: 700,
              py: 1.25,
              borderRadius: 2,
              "&:hover": { bgcolor: primary, filter: "brightness(0.92)" },
            }}
          >
            صفحه اصلی فروشگاه
          </Button>
        </Box>
      </Drawer>
    </>
  );
}
