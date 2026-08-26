"use client";

import { APP_FONT_FAMILY } from "@/app/lib/appFont";
import AddIcon from "@mui/icons-material/Add";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import HistoryIcon from "@mui/icons-material/History";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import RemoveIcon from "@mui/icons-material/Remove";
import RoomServiceIcon from "@mui/icons-material/RoomService";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import {
  Badge,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";

export type ReservThemeMode = "dark" | "light";

export const ACCENT = "#c9a227";
export const ACCENT_DARK = "#a8861f";
export const ACCENT_SOFT = "rgba(201,162,39,0.12)";

export const THEMES = {
  light: {
    BG: "#f7f5f1",
    SURFACE: "#ffffff",
    SURFACE_ALT: "#f0ece5",
    TEXT: "#1a1712",
    MUTED: "#6b655c",
    BORDER: "rgba(26,23,18,0.08)",
    HEADER_BG: "rgba(247,245,241,0.92)",
    CART_BAR_BG: "#1a1712",
    CART_BAR_TEXT: "#f7f5f1",
  },
  dark: {
    BG: "#0e0e0e",
    SURFACE: "#181818",
    SURFACE_ALT: "#222222",
    TEXT: "#f4efe4",
    MUTED: "#9a9488",
    BORDER: "rgba(244,239,228,0.08)",
    HEADER_BG: "rgba(14,14,14,0.92)",
    CART_BAR_BG: ACCENT,
    CART_BAR_TEXT: "#1a1712",
  },
} as const;

export type ReservTheme = (typeof THEMES)[ReservThemeMode];

export function formatNumber(num: number) {
  return new Intl.NumberFormat("fa-IR").format(num);
}

const motionSafe = {
  "@media (prefers-reduced-motion: reduce)": {
    transition: "none !important",
    animation: "none !important",
  },
} as const;

type HeaderProps = {
  shopTitle: string;
  tableLabel: string;
  guestLabel: string;
  themeMode: ReservThemeMode;
  theme: ReservTheme;
  currentOrderCount: number;
  onLogin: () => void;
  onToggleTheme: () => void;
  onCurrentOrders: () => void;
  onHistory: () => void;
};

export function ReservHeader({
  shopTitle,
  tableLabel,
  guestLabel,
  themeMode,
  theme,
  currentOrderCount,
  onLogin,
  onToggleTheme,
  onCurrentOrders,
  onHistory,
}: HeaderProps) {
  const iconBtn = {
    width: 44,
    height: 44,
    color: theme.TEXT,
    bgcolor: theme.SURFACE,
    border: `1px solid ${theme.BORDER}`,
    borderRadius: "14px",
    "&:hover": { bgcolor: theme.SURFACE_ALT },
  } as const;

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        bgcolor: theme.HEADER_BG,
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${theme.BORDER}`,
        px: { xs: 1.5, md: 2 },
        pt: "max(10px, env(safe-area-inset-top))",
        pb: 1.25,
        fontFamily: APP_FONT_FAMILY,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          maxWidth: 1100,
          mx: "auto",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              bgcolor: ACCENT_SOFT,
              color: ACCENT_DARK,
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: 15,
              flexShrink: 0,
              border: `1px solid rgba(201,162,39,0.28)`,
            }}
            aria-hidden
          >
            {shopTitle.trim().slice(0, 1) || "م"}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              component="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: 16, sm: 18 },
                color: theme.TEXT,
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {shopTitle}
            </Typography>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.4,
                mt: 0.15,
                color: ACCENT_DARK,
              }}
            >
              <TableRestaurantIcon sx={{ fontSize: 14 }} />
              <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{tableLabel}</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button
            onClick={onLogin}
            aria-label="ورود با شماره موبایل"
            sx={{
              minWidth: 44,
              minHeight: 40,
              px: 1.2,
              borderRadius: "12px",
              color: theme.TEXT,
              fontWeight: 700,
              fontSize: 12,
              bgcolor: theme.SURFACE,
              border: `1px solid ${theme.BORDER}`,
              "&:hover": { bgcolor: theme.SURFACE_ALT },
            }}
          >
            {guestLabel}
          </Button>
          <IconButton onClick={onToggleTheme} aria-label={themeMode === "dark" ? "حالت روشن" : "حالت تیره"} sx={{ ...iconBtn, width: 40, height: 40 }}>
            {themeMode === "dark" ? <LightModeIcon sx={{ fontSize: 18 }} /> : <DarkModeIcon sx={{ fontSize: 18 }} />}
          </IconButton>
          <IconButton onClick={onCurrentOrders} aria-label="سفارش جاری" sx={{ ...iconBtn, width: 40, height: 40 }}>
            <Badge
              badgeContent={currentOrderCount}
              color="error"
              max={9}
              sx={{ "& .MuiBadge-badge": { fontSize: "0.55rem", minWidth: 14, height: 14 } }}
            >
              <RoomServiceIcon sx={{ fontSize: 18 }} />
            </Badge>
          </IconButton>
          <IconButton onClick={onHistory} aria-label="سفارش‌های قبلی" sx={{ ...iconBtn, width: 40, height: 40 }}>
            <HistoryIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

type SearchProps = {
  value: string;
  onChange: (value: string) => void;
  theme: ReservTheme;
};

export function ReservSearchBar({ value, onChange, theme }: SearchProps) {
  return (
    <TextField
      size="small"
      fullWidth
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="جستجوی غذا، نوشیدنی و …"
      inputProps={{ "aria-label": "جستجوی منو" }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: theme.MUTED, fontSize: 22 }} />
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton
              size="small"
              aria-label="پاک کردن جستجو"
              onClick={() => onChange("")}
              sx={{ color: theme.MUTED, width: 36, height: 36 }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : undefined,
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: "16px",
          bgcolor: theme.SURFACE,
          color: theme.TEXT,
          fontSize: 15,
          minHeight: 48,
          boxShadow: "0 1px 2px rgba(26,23,18,0.04)",
          "& fieldset": { borderColor: theme.BORDER },
          "&:hover fieldset": { borderColor: "rgba(201,162,39,0.35)" },
          "&.Mui-focused fieldset": { borderColor: ACCENT },
        },
        "& .MuiInputBase-input::placeholder": { color: theme.MUTED, opacity: 1 },
      }}
    />
  );
}

export type CategoryChip = { id: string; name: string; image: string | null };

type CategoryProps = {
  categories: CategoryChip[];
  selectedId: string;
  onSelect: (id: string) => void;
  theme: ReservTheme;
  dimmed?: boolean;
};

export function ReservCategoryTabs({ categories, selectedId, onSelect, theme, dimmed }: CategoryProps) {
  return (
    <Box
      role="tablist"
      aria-label="دسته‌بندی منو"
      sx={{
        display: "flex",
        gap: 0.8,
        overflowX: "auto",
        pb: 0.5,
        mx: { xs: -1.5, md: 0 },
        px: { xs: 1.5, md: 0 },
        opacity: dimmed ? 0.45 : 1,
        pointerEvents: dimmed ? "none" : "auto",
        transition: "opacity 180ms ease",
        ...motionSafe,
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {categories.map((cat) => {
        const active = selectedId === cat.id;
        return (
          <Box
            key={cat.id}
            component="button"
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(cat.id)}
            sx={{
              flexShrink: 0,
              appearance: "none",
              border: active ? `1.5px solid ${ACCENT}` : `1px solid ${theme.BORDER}`,
              bgcolor: active ? ACCENT_SOFT : theme.SURFACE,
              color: active ? ACCENT_DARK : theme.TEXT,
              px: 1.6,
              py: 1,
              minHeight: 44,
              borderRadius: "999px",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: active ? 800 : 600,
              fontFamily: APP_FONT_FAMILY,
              boxShadow: active ? "none" : "0 1px 2px rgba(26,23,18,0.03)",
              transition: "background-color 150ms ease, border-color 150ms ease",
              ...motionSafe,
            }}
          >
            {cat.name}
          </Box>
        );
      })}
    </Box>
  );
}

type ProductCardProps = {
  name: string;
  description?: string;
  price: number;
  image: string;
  quantity: number;
  priority?: boolean;
  theme: ReservTheme;
  onAdd: () => void;
  onRemove: () => void;
  onOpen: () => void;
};

export function ReservProductCard({
  name,
  description,
  price,
  image,
  quantity,
  priority,
  theme,
  onAdd,
  onRemove,
  onOpen,
}: ProductCardProps) {
  return (
    <Box
      component="article"
      sx={{
        display: "flex",
        gap: 1.25,
        bgcolor: theme.SURFACE,
        borderRadius: "18px",
        p: 1.15,
        border: `1px solid ${theme.BORDER}`,
        boxShadow: "0 1px 3px rgba(26,23,18,0.04)",
        minHeight: 108,
      }}
    >
      <Box
        component="button"
        type="button"
        onClick={onOpen}
        aria-label={`جزئیات ${name}`}
        sx={{
          appearance: "none",
          border: 0,
          p: 0,
          m: 0,
          bgcolor: "transparent",
          cursor: "pointer",
          flexShrink: 0,
          borderRadius: "14px",
          overflow: "hidden",
          width: 96,
          height: 96,
        }}
      >
        <Box
          component="img"
          src={image}
          alt={name}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          width={96}
          height={96}
          sx={{
            width: 96,
            height: 96,
            objectFit: "cover",
            display: "block",
            bgcolor: theme.SURFACE_ALT,
          }}
        />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", py: 0.2 }}>
        <Typography
          component="button"
          type="button"
          onClick={onOpen}
          sx={{
            appearance: "none",
            border: 0,
            p: 0,
            m: 0,
            bgcolor: "transparent",
            cursor: "pointer",
            textAlign: "start",
            fontWeight: 700,
            fontSize: 16,
            color: theme.TEXT,
            lineHeight: 1.35,
            fontFamily: APP_FONT_FAMILY,
          }}
        >
          {name}
        </Typography>
        {description ? (
          <Typography
            sx={{
              mt: 0.35,
              color: theme.MUTED,
              fontSize: 13,
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {description}
          </Typography>
        ) : null}
        <Typography sx={{ mt: "auto", pt: 0.6, color: theme.TEXT, fontWeight: 800, fontSize: 15 }}>
          {formatNumber(price)}
          <Box component="span" sx={{ fontSize: 12, fontWeight: 600, color: theme.MUTED, ms: 0.5 }}>
            تومان
          </Box>
        </Typography>
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: quantity > 0 ? "space-between" : "flex-end",
          alignSelf: "stretch",
          minWidth: 44,
        }}
      >
        {quantity > 0 ? (
          <>
            <IconButton
              aria-label={`کاهش ${name}`}
              onClick={onRemove}
              sx={{
                width: 40,
                height: 40,
                bgcolor: theme.SURFACE_ALT,
                color: theme.TEXT,
                border: `1px solid ${theme.BORDER}`,
                "&:hover": { bgcolor: theme.SURFACE_ALT },
              }}
            >
              <RemoveIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <Typography aria-live="polite" sx={{ fontWeight: 800, fontSize: 14, color: theme.TEXT, lineHeight: 1 }}>
              {formatNumber(quantity)}
            </Typography>
          </>
        ) : null}
        <IconButton
          aria-label={quantity > 0 ? `افزایش ${name}` : `افزودن ${name}`}
          onClick={onAdd}
          sx={{
            width: 44,
            height: 44,
            bgcolor: ACCENT,
            color: "#1a1712",
            "&:hover": { bgcolor: ACCENT_DARK, color: "#1a1712" },
            boxShadow: "0 4px 12px rgba(201,162,39,0.28)",
            transition: "transform 120ms ease",
            "&:active": { transform: "scale(0.94)" },
            ...motionSafe,
          }}
        >
          <AddIcon sx={{ fontSize: 22 }} />
        </IconButton>
      </Box>
    </Box>
  );
}

type CartBarProps = {
  count: number;
  totalLabel: string;
  theme: ReservTheme;
  onOpen: () => void;
};

export function ReservCartBar({ count, totalLabel, theme, onOpen }: CartBarProps) {
  if (count <= 0) return null;
  return (
    <Box
      sx={{
        position: "fixed",
        insetInline: 12,
        bottom: "max(12px, env(safe-area-inset-bottom))",
        zIndex: 40,
        maxWidth: 520,
        mx: "auto",
        display: { xs: "block", md: "none" },
        animation: "reservCartIn 220ms ease",
        "@keyframes reservCartIn": {
          from: { opacity: 0, transform: "translateY(12px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        ...motionSafe,
      }}
    >
      <Button
        fullWidth
        variant="contained"
        onClick={onOpen}
        aria-label="مشاهده سبد خرید"
        sx={{
          py: 1.5,
          minHeight: 56,
          borderRadius: "18px",
          bgcolor: theme.CART_BAR_BG,
          color: theme.CART_BAR_TEXT,
          fontWeight: 800,
          fontSize: 15,
          boxShadow: "0 10px 28px rgba(26,23,18,0.22)",
          "&:hover": { bgcolor: theme.CART_BAR_BG, filter: "brightness(1.05)" },
        }}
      >
        <Box
          sx={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
            px: 0.5,
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <ShoppingBagOutlinedIcon sx={{ fontSize: 20 }} />
            <Box
              sx={{
                minWidth: 24,
                height: 24,
                px: 0.6,
                borderRadius: "8px",
                bgcolor: "rgba(255,255,255,0.14)",
                fontSize: 12,
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
              }}
            >
              {formatNumber(count)}
            </Box>
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: 15 }}>مشاهده سبد</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{totalLabel}</Typography>
        </Box>
      </Button>
    </Box>
  );
}

export function ReservCategorySkeleton({ theme }: { theme: ReservTheme }) {
  return (
    <Box sx={{ display: "flex", gap: 0.8, overflow: "hidden" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          width={72}
          height={44}
          sx={{ borderRadius: "999px", bgcolor: theme.SURFACE_ALT, flexShrink: 0 }}
        />
      ))}
    </Box>
  );
}

export function ReservProductSkeletonList({ theme }: { theme: ReservTheme }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.1 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Box
          key={i}
          sx={{
            display: "flex",
            gap: 1.25,
            p: 1.15,
            borderRadius: "18px",
            bgcolor: theme.SURFACE,
            border: `1px solid ${theme.BORDER}`,
          }}
        >
          <Skeleton variant="rounded" width={96} height={96} sx={{ borderRadius: "14px", bgcolor: theme.SURFACE_ALT }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="70%" height={22} sx={{ bgcolor: theme.SURFACE_ALT }} />
            <Skeleton width="90%" height={16} sx={{ mt: 1, bgcolor: theme.SURFACE_ALT }} />
            <Skeleton width="40%" height={18} sx={{ mt: 2, bgcolor: theme.SURFACE_ALT }} />
          </Box>
          <Skeleton variant="circular" width={44} height={44} sx={{ alignSelf: "flex-end", bgcolor: theme.SURFACE_ALT }} />
        </Box>
      ))}
    </Box>
  );
}

type EmptyProps = {
  title: string;
  theme: ReservTheme;
  action?: ReactNode;
};

export function ReservEmptyState({ title, theme, action }: EmptyProps) {
  return (
    <Box sx={{ textAlign: "center", py: 7, px: 2 }}>
      <Typography sx={{ color: theme.MUTED, fontSize: 15, lineHeight: 1.8 }}>{title}</Typography>
      {action ? <Box sx={{ mt: 2 }}>{action}</Box> : null}
    </Box>
  );
}

type DesktopCartProps = {
  theme: ReservTheme;
  lines: Array<{
    product_id: number;
    name: string;
    sale_price: number;
    quantity: number;
    image?: string;
  }>;
  total: number;
  onInc: (productId: number) => void;
  onDec: (productId: number) => void;
  onRemove: (productId: number) => void;
  onCheckout: () => void;
};

export function ReservDesktopCartPanel({
  theme,
  lines,
  total,
  onInc,
  onDec,
  onRemove,
  onCheckout,
}: DesktopCartProps) {
  return (
    <Box
      component="aside"
      sx={{
        display: { xs: "none", md: "block" },
        position: "sticky",
        top: 88,
        alignSelf: "start",
        bgcolor: theme.SURFACE,
        border: `1px solid ${theme.BORDER}`,
        borderRadius: "20px",
        p: 1.75,
        boxShadow: "0 2px 10px rgba(26,23,18,0.04)",
        maxHeight: "calc(100dvh - 112px)",
        overflow: "auto",
      }}
    >
      <Typography sx={{ fontWeight: 800, fontSize: 17, color: theme.TEXT, mb: 1.25 }}>سبد خرید</Typography>
      {lines.length === 0 ? (
        <Typography sx={{ color: theme.MUTED, fontSize: 13, lineHeight: 1.8 }}>
          هنوز چیزی اضافه نکرده‌اید. با دکمه + غذا را انتخاب کنید.
        </Typography>
      ) : (
        <>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {lines.map((line) => (
              <Box
                key={line.product_id}
                sx={{
                  display: "flex",
                  gap: 1,
                  p: 1,
                  borderRadius: "14px",
                  bgcolor: theme.SURFACE_ALT,
                }}
              >
                {line.image ? (
                  <Box
                    component="img"
                    src={line.image}
                    alt=""
                    width={48}
                    height={48}
                    loading="lazy"
                    sx={{ width: 48, height: 48, borderRadius: "10px", objectFit: "cover" }}
                  />
                ) : null}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 13, color: theme.TEXT }}>{line.name}</Typography>
                  <Typography sx={{ color: theme.MUTED, fontSize: 12, mt: 0.2 }}>
                    {formatNumber(line.sale_price)} تومان
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.6 }}>
                    <IconButton
                      size="small"
                      aria-label="کاهش"
                      onClick={() => onDec(line.product_id)}
                      sx={{ width: 32, height: 32, bgcolor: theme.SURFACE, border: `1px solid ${theme.BORDER}` }}
                    >
                      <RemoveIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <Typography sx={{ minWidth: 20, textAlign: "center", fontWeight: 800, fontSize: 13 }}>
                      {formatNumber(line.quantity)}
                    </Typography>
                    <IconButton
                      size="small"
                      aria-label="افزایش"
                      onClick={() => onInc(line.product_id)}
                      sx={{ width: 32, height: 32, bgcolor: ACCENT, color: "#1a1712" }}
                    >
                      <AddIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="حذف"
                      onClick={() => onRemove(line.product_id)}
                      sx={{ width: 32, height: 32, color: theme.MUTED, ms: "auto" }}
                    >
                      <CloseRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1.5, mb: 1.25 }}>
            <Typography sx={{ color: theme.MUTED, fontWeight: 700 }}>جمع</Typography>
            <Typography sx={{ fontWeight: 800, color: theme.TEXT }}>{formatNumber(total)} تومان</Typography>
          </Box>
          <Button
            fullWidth
            variant="contained"
            onClick={onCheckout}
            sx={{
              py: 1.35,
              borderRadius: "14px",
              bgcolor: ACCENT,
              color: "#1a1712",
              fontWeight: 800,
              "&:hover": { bgcolor: ACCENT_DARK, color: "#1a1712" },
            }}
          >
            ثبت سفارش
          </Button>
        </>
      )}
    </Box>
  );
}
