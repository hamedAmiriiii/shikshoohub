"use client";

import AddIcon from "@mui/icons-material/Add";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import HistoryIcon from "@mui/icons-material/History";
import LanguageIcon from "@mui/icons-material/Language";
import LightModeIcon from "@mui/icons-material/LightMode";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import RemoveIcon from "@mui/icons-material/Remove";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import RoomServiceIcon from "@mui/icons-material/RoomService";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import { Badge, Box, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import { useState, type MouseEvent, type ReactNode } from "react";
import { APP_FONT_FAMILY } from "@/app/lib/appFont";
import type { ReservMenuBackgroundType, ReservMenuThemeId } from "@/app/lib/reservMenuThemes";
import { THEMES, type CategoryChip, type ReservTheme, type ReservThemeMode } from "./ReservOrderingParts";
import { RESERV_LOCALES, useReservI18n } from "./reservI18n";

export type ReservMenuItem = {
  key: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image: string;
  categoryIds: string[];
  outOfStock: boolean;
};

type ItemActions = {
  qtyOf: (key: string) => number;
  onAdd: (key: string) => void;
  onRemove: (key: string) => void;
  onOpen: (key: string) => void;
};

export type ReservShowcaseToolbarProps = {
  guestLabel: string;
  themeMode: ReservThemeMode;
  currentOrderCount: number;
  currentServiceCount?: number;
  showServiceShortcut?: boolean;
  showLanguageSwitch?: boolean;
  showThemeToggle?: boolean;
  onLogin: () => void;
  onToggleTheme: () => void;
  onCurrentOrders: () => void;
  onCurrentServices?: () => void;
  onHistory: () => void;
  onPager?: () => void;
  pagerPending?: boolean;
  pagerBusy?: boolean;
};

export type ReservMenuLayoutProps = ItemActions & {
  themeId: ReservMenuThemeId;
  items: ReservMenuItem[];
  categories: CategoryChip[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  searchActive: boolean;
  palette: ReservTheme;
  themeMode: ReservThemeMode;
  /** پیش‌نمایش داخل قاب موبایل: چیدمان همیشه موبایلی و بدون position: fixed */
  compact?: boolean;
  /** اکشن‌های هدر برای تم ویترین طلایی — ستون سمت راست */
  showcaseToolbar?: ReservShowcaseToolbarProps | null;
};

const motionSafe = {
  "@media (prefers-reduced-motion: reduce)": {
    transition: "none !important",
    animation: "none !important",
  },
} as const;

const SOFT_LIGHT: ReservTheme = {
  BG: "#ececee",
  BG_GRADIENT: "none",
  SURFACE: "#ffffff",
  SURFACE_ALT: "#f4f4f5",
  TEXT: "#18181b",
  MUTED: "#71717a",
  BORDER: "#e4e4e7",
  HEADER_BG: "rgba(236,236,238,0.92)",
  CART_BAR_BG: "#18181b",
  CART_BAR_TEXT: "#ffffff",
  SHADOW: "0 8px 24px rgba(0,0,0,0.08)",
};

const SOFT_DARK: ReservTheme = {
  BG: "#111113",
  BG_GRADIENT: "none",
  SURFACE: "#1c1c1f",
  SURFACE_ALT: "#27272a",
  TEXT: "#fafafa",
  MUTED: "#a1a1aa",
  BORDER: "rgba(161,161,170,0.18)",
  HEADER_BG: "rgba(17,17,19,0.92)",
  CART_BAR_BG: "#fafafa",
  CART_BAR_TEXT: "#18181b",
  SHADOW: "0 8px 24px rgba(0,0,0,0.4)",
};

const INK = "#c45c26";

const CLASSIC_LIGHT: ReservTheme = {
  BG: "#f7f0e6",
  BG_GRADIENT: "none",
  SURFACE: "#fffdf8",
  SURFACE_ALT: "#efe6d8",
  TEXT: "#1c1410",
  MUTED: "#7a6a5c",
  BORDER: "rgba(28,20,16,0.14)",
  HEADER_BG: "#1c1410",
  CART_BAR_BG: "#1c1410",
  CART_BAR_TEXT: "#f4ece4",
  SHADOW: "0 10px 28px rgba(28,20,16,0.12)",
};

const CLASSIC_DARK: ReservTheme = {
  BG: "#16110e",
  BG_GRADIENT: "none",
  SURFACE: "#221a16",
  SURFACE_ALT: "#2c241f",
  TEXT: "#f4ece4",
  MUTED: "#b5a394",
  BORDER: "rgba(244,236,228,0.14)",
  HEADER_BG: "#1c1410",
  CART_BAR_BG: "#c45c26",
  CART_BAR_TEXT: "#fff7f0",
  SHADOW: "0 10px 28px rgba(0,0,0,0.4)",
};

const GOLD = "#edc531";
const GOLD_DEEP = "#c9a61a";
const GOLD_SOFT = "#f5e07a";
const GOLD_INK = "#2b2116";
const GOLD_GRADIENT = `linear-gradient(135deg, ${GOLD_SOFT} 0%, ${GOLD} 48%, ${GOLD_DEEP} 100%)`;

const SHOWCASE_LIGHT: ReservTheme = {
  BG: "#f7f3e6",
  BG_GRADIENT: "linear-gradient(180deg, #fbf8ee 0%, #f0e8d0 100%)",
  SURFACE: "#fffdf6",
  SURFACE_ALT: "#f3ebd4",
  TEXT: GOLD_INK,
  MUTED: "#8a7a63",
  BORDER: "rgba(237,197,49,0.35)",
  HEADER_BG: "rgba(251,248,238,0.94)",
  CART_BAR_BG: GOLD_GRADIENT,
  CART_BAR_TEXT: GOLD_INK,
  SHADOW: "0 8px 24px rgba(201,166,26,0.18)",
};

const SHOWCASE_DARK: ReservTheme = {
  BG: "#15110b",
  BG_GRADIENT: "linear-gradient(180deg, #1b150d 0%, #110d08 100%)",
  SURFACE: "#211a11",
  SURFACE_ALT: "#2c2317",
  TEXT: "#f5ead6",
  MUTED: "#b8a586",
  BORDER: "rgba(237,197,49,0.28)",
  HEADER_BG: "rgba(21,17,11,0.92)",
  CART_BAR_BG: GOLD_GRADIENT,
  CART_BAR_TEXT: GOLD_INK,
  SHADOW: "0 8px 24px rgba(0,0,0,0.45)",
};

const MOTION_PALETTE: ReservTheme = {
  BG: "#070712",
  BG_GRADIENT: "none",
  SURFACE: "#151528",
  SURFACE_ALT: "#1f1f3a",
  TEXT: "#f5f5ff",
  MUTED: "#a5a6c8",
  BORDER: "rgba(165,166,200,0.18)",
  HEADER_BG: "rgba(7,7,18,0.72)",
  CART_BAR_BG: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
  CART_BAR_TEXT: "#ffffff",
  SHADOW: "0 12px 32px rgba(0,0,0,0.5)",
};

const VIDEO_PALETTE: ReservTheme = {
  BG: "#050505",
  BG_GRADIENT: "none",
  SURFACE: "#16181d",
  SURFACE_ALT: "#22252c",
  TEXT: "#ffffff",
  MUTED: "rgba(255,255,255,0.72)",
  BORDER: "rgba(255,255,255,0.16)",
  HEADER_BG: "rgba(0,0,0,0.38)",
  CART_BAR_BG: "rgba(255,255,255,0.94)",
  CART_BAR_TEXT: "#111111",
  SHADOW: "0 12px 32px rgba(0,0,0,0.5)",
};

/** تم‌هایی که همیشه تیره‌اند و دکمهٔ روشن/تیره ندارند */
export function reservThemeForcedMode(themeId: ReservMenuThemeId): ReservThemeMode | null {
  return themeId === "motion" || themeId === "video" ? "dark" : null;
}

export function reservPaletteFor(themeId: ReservMenuThemeId, mode: ReservThemeMode): ReservTheme {
  switch (themeId) {
    case "classic":
      return mode === "dark" ? CLASSIC_DARK : CLASSIC_LIGHT;
    case "list":
    case "grid":
    case "cover":
      return mode === "dark" ? SOFT_DARK : SOFT_LIGHT;
    case "showcase":
      return mode === "dark" ? SHOWCASE_DARK : SHOWCASE_LIGHT;
    case "motion":
      return MOTION_PALETTE;
    case "video":
      return VIDEO_PALETTE;
    default:
      return THEMES[mode];
  }
}

function discountPercent(item: ReservMenuItem): number {
  const original = Number(item.originalPrice) || 0;
  if (original <= item.price || original <= 0) return 0;
  return Math.round(((original - item.price) / original) * 100);
}

function isPlaceholderImage(url: string) {
  return !url || /noimageshop/i.test(url);
}

/** عکس کاور صفحهٔ خوش‌آمد: عکس اولین دسته، وگرنه اولین عکس واقعی کالا */
export function pickReservCoverImage(items: ReservMenuItem[], categories: CategoryChip[]): string | null {
  const fromCategory = categories.find((cat) => cat.id !== "all" && cat.image)?.image;
  if (fromCategory) return fromCategory;
  return items.find((item) => !isPlaceholderImage(item.image))?.image || null;
}

export function pickReservOfferItem(items: ReservMenuItem[]): ReservMenuItem | null {
  const available = items.filter((item) => !item.outOfStock);
  return (
    available.find((item) => discountPercent(item) > 0) ||
    available.find((item) => !isPlaceholderImage(item.image)) ||
    available[0] ||
    null
  );
}

type Section = { id: string; title: string; items: ReservMenuItem[] };

function buildSections(
  items: ReservMenuItem[],
  categories: CategoryChip[],
  selected: string,
  searchActive: boolean,
  otherLabel: string,
): Section[] {
  if (searchActive) return [{ id: "search", title: "", items }];
  if (selected !== "all") {
    const cat = categories.find((c) => c.id === selected);
    return [{ id: selected, title: cat?.name || "", items }];
  }
  const real = categories.filter((c) => c.id !== "all");
  const buckets = new Map<string, ReservMenuItem[]>(real.map((c) => [c.id, []]));
  const rest: ReservMenuItem[] = [];
  for (const item of items) {
    const home = item.categoryIds.find((id) => buckets.has(id));
    if (home) buckets.get(home)!.push(item);
    else rest.push(item);
  }
  const sections: Section[] = real
    .filter((c) => (buckets.get(c.id) || []).length > 0)
    .map((c) => ({ id: c.id, title: c.name, items: buckets.get(c.id)! }));
  if (rest.length) sections.push({ id: "__rest", title: sections.length ? otherLabel : "", items: rest });
  return sections;
}

const stop = (fn: () => void) => (event: MouseEvent) => {
  event.stopPropagation();
  fn();
};

type QtyTone = { bg: string; fg: string; pillBg: string; pillFg: string; ring?: string; shadow?: string };

function QtyControl({
  name,
  quantity,
  outOfStock,
  onAdd,
  onRemove,
  tone,
  size = 32,
}: {
  name: string;
  quantity: number;
  outOfStock: boolean;
  onAdd: () => void;
  onRemove: () => void;
  tone: QtyTone;
  size?: number;
}) {
  const { t, formatNumber } = useReservI18n();
  const canAdd = !outOfStock;
  const addSx = {
    bgcolor: tone.bg,
    background: tone.bg,
    color: tone.fg,
    boxShadow: canAdd ? tone.shadow : "none",
    transition: "transform 120ms ease",
    "&:hover": { bgcolor: tone.bg, background: tone.bg, filter: "brightness(1.08)" },
    "&:active": { transform: "scale(0.9)" },
    "&.Mui-disabled": { color: tone.fg, opacity: 0.4 },
    ...motionSafe,
  } as const;

  if (quantity <= 0) {
    return (
      <IconButton
        aria-label={t("addItem", { name })}
        onClick={stop(onAdd)}
        disabled={!canAdd}
        sx={{ ...addSx, width: size, height: size, flexShrink: 0 }}
      >
        <AddIcon sx={{ fontSize: Math.round(size * 0.55) }} />
      </IconButton>
    );
  }
  const inner = size - 6;
  return (
    <Box
      onClick={(event) => event.stopPropagation()}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.4,
        p: "3px",
        flexShrink: 0,
        borderRadius: 999,
        bgcolor: tone.pillBg,
        color: tone.pillFg,
        border: tone.ring ? `1px solid ${tone.ring}` : "none",
      }}
    >
      <IconButton
        aria-label={t("decrease", { name })}
        onClick={onRemove}
        sx={{ width: inner, height: inner, color: tone.pillFg }}
      >
        <RemoveIcon sx={{ fontSize: Math.round(inner * 0.55) }} />
      </IconButton>
      <Typography aria-live="polite" sx={{ minWidth: 16, textAlign: "center", fontWeight: 800, fontSize: 13 }}>
        {formatNumber(quantity)}
      </Typography>
      <IconButton
        aria-label={t("increase", { name })}
        onClick={onAdd}
        disabled={!canAdd}
        sx={{ ...addSx, width: inner, height: inner }}
      >
        <AddIcon sx={{ fontSize: Math.round(inner * 0.55) }} />
      </IconButton>
    </Box>
  );
}

function Price({
  item,
  color,
  muted,
  size = 16,
  gradient,
}: {
  item: ReservMenuItem;
  color: string;
  muted: string;
  size?: number;
  gradient?: string;
}) {
  const { t, formatNumber } = useReservI18n();
  const off = discountPercent(item);
  return (
    <Box sx={{ lineHeight: 1.15, minWidth: 0 }}>
      {off > 0 ? (
        <Typography
          component="span"
          sx={{ display: "block", fontSize: Math.round(size * 0.72), color: muted, textDecoration: "line-through" }}
        >
          {formatNumber(Number(item.originalPrice) || 0)}
        </Typography>
      ) : null}
      <Typography
        component="span"
        sx={{
          fontWeight: 800,
          fontSize: size,
          color,
          ...(gradient
            ? { background: gradient, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }
            : {}),
        }}
      >
        {formatNumber(item.price)}
      </Typography>
      <Typography
        component="span"
        sx={{ fontSize: Math.round(size * 0.66), fontWeight: 600, color: muted, marginInlineStart: 0.5 }}
      >
        {t("toman")}
      </Typography>
    </Box>
  );
}

function ItemImage({ item, sx }: { item: ReservMenuItem; sx?: Record<string, unknown> }) {
  return (
    <Box
      component="img"
      src={item.image}
      alt={item.name}
      loading="lazy"
      decoding="async"
      sx={{
        display: "block",
        objectFit: "cover",
        filter: item.outOfStock ? "grayscale(0.75)" : "none",
        opacity: item.outOfStock ? 0.6 : 1,
        ...sx,
      }}
    />
  );
}

function OutOfStockTag({ color, bg }: { color: string; bg: string }) {
  const { t } = useReservI18n();
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        marginInlineStart: 0.75,
        fontSize: 10.5,
        fontWeight: 800,
        color,
        bgcolor: bg,
        px: 0.75,
        py: 0.1,
        borderRadius: "8px",
        verticalAlign: "middle",
      }}
    >
      {t("outOfStock")}
    </Box>
  );
}

type BarVariant = "soft" | "gold" | "glass" | "neon";

function ThemeCategoryBar({
  categories,
  selectedId,
  onSelect,
  variant,
  palette,
  dimmed,
  sticky,
}: {
  categories: CategoryChip[];
  selectedId: string;
  onSelect: (id: string) => void;
  variant: BarVariant;
  palette: ReservTheme;
  dimmed?: boolean;
  sticky?: boolean;
}) {
  const { t } = useReservI18n();
  if (categories.length <= 1) return null;

  const chipSx = (active: boolean) => {
    switch (variant) {
      case "gold":
        return {
          bgcolor: active ? GOLD_INK : "rgba(255,255,255,0.28)",
          color: active ? GOLD : GOLD_INK,
          border: "none",
          boxShadow: active ? "0 6px 14px rgba(43,33,22,0.35)" : "none",
        };
      case "glass":
        return {
          bgcolor: active ? "rgba(255,255,255,0.94)" : "rgba(255,255,255,0.12)",
          color: active ? "#111" : "#fff",
          border: "1px solid rgba(255,255,255,0.22)",
          backdropFilter: "blur(10px)",
        };
      case "neon":
        return active
          ? {
              background: "linear-gradient(90deg, #7c3aed, #ec4899, #f59e0b, #7c3aed)",
              backgroundSize: "300% 100%",
              animation: "reservNeonShift 4s linear infinite",
              color: "#fff",
              border: "none",
              boxShadow: "0 8px 22px rgba(236,72,153,0.35)",
            }
          : { bgcolor: "rgba(255,255,255,0.06)", color: "#d4d4f5", border: "1px solid rgba(165,166,200,0.2)" };
      default:
        return {
          bgcolor: active ? palette.TEXT : palette.SURFACE,
          color: active ? palette.BG : palette.TEXT,
          border: `1px solid ${active ? palette.TEXT : palette.BORDER}`,
        };
    }
  };

  return (
    <Box
      sx={{
        ...(sticky ? { position: "sticky", top: 66, zIndex: 20 } : {}),
        mb: 1.75,
        ...(variant === "gold"
          ? {
              background: GOLD_GRADIENT,
              borderRadius: "26px",
              p: 0.75,
              boxShadow: "0 10px 26px rgba(201,166,26,0.35)",
            }
          : {}),
      }}
    >
      <Box
        role="tablist"
        aria-label={t("categoriesAria")}
        sx={{
          display: "flex",
          gap: 0.8,
          overflowX: "auto",
          pb: variant === "gold" ? 0 : 0.5,
          opacity: dimmed ? 0.45 : 1,
          pointerEvents: dimmed ? "none" : "auto",
          transition: "opacity 180ms ease",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          "@keyframes reservNeonShift": {
            from: { backgroundPosition: "0% 50%" },
            to: { backgroundPosition: "300% 50%" },
          },
          ...motionSafe,
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
                cursor: "pointer",
                px: 1.7,
                minHeight: 40,
                borderRadius: "999px",
                fontSize: 13.5,
                fontWeight: active ? 800 : 600,
                fontFamily: APP_FONT_FAMILY,
                transition: "background-color 160ms ease, color 160ms ease",
                ...chipSx(active),
                ...motionSafe,
              }}
            >
              {cat.name}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function SectionTitle({
  title,
  count,
  color,
  muted,
  align = "center",
  accent,
  shadow,
}: {
  title: string;
  count?: number;
  color: string;
  muted: string;
  align?: "center" | "start";
  accent?: string;
  shadow?: boolean;
}) {
  const { t, formatNumber } = useReservI18n();
  if (!title) return null;
  return (
    <Box
      sx={{
        textAlign: align,
        mb: 1.25,
        mt: 0.5,
        display: align === "start" ? "flex" : "block",
        alignItems: "center",
        gap: 1,
      }}
    >
      {align === "start" && accent ? (
        <Box sx={{ width: 5, height: 22, borderRadius: 4, background: accent, flexShrink: 0 }} />
      ) : null}
      <Box>
        <Typography
          component="h2"
          sx={{
            fontWeight: 800,
            fontSize: 18,
            color,
            lineHeight: 1.4,
            textShadow: shadow ? "0 2px 10px rgba(0,0,0,0.45)" : "none",
          }}
        >
          {title}
        </Typography>
        {count != null ? (
          <Typography sx={{ fontSize: 11.5, color: muted, mt: 0.15 }}>
            {t("itemsCount", { n: formatNumber(count) })}
          </Typography>
        ) : null}
        {align === "center" && accent ? (
          <Box sx={{ width: 36, height: 3, borderRadius: 3, background: accent, mx: "auto", mt: 0.6 }} />
        ) : null}
      </Box>
    </Box>
  );
}

type CardVariant = "list" | "showcase" | "cover";

function HorizontalCard({
  item,
  actions,
  palette,
  mode,
  variant,
  highlight,
}: {
  item: ReservMenuItem;
  actions: ItemActions;
  palette: ReservTheme;
  mode: ReservThemeMode;
  variant: CardVariant;
  highlight?: boolean;
}) {
  const dark = mode === "dark";
  const off = discountPercent(item);
  const background =
    variant === "showcase"
      ? dark
        ? "linear-gradient(135deg, #2a2218 0%, #1d1811 100%)"
        : "linear-gradient(135deg, #f3eee6 0%, #ddd4c6 100%)"
      : variant === "list"
        ? dark
          ? "linear-gradient(135deg, #26262a 0%, #1c1c1f 100%)"
          : "linear-gradient(135deg, #f7f7f8 0%, #e2e2e6 100%)"
        : palette.SURFACE;
  const tone: QtyTone =
    variant === "showcase"
      ? { bg: GOLD_GRADIENT, fg: GOLD_INK, pillBg: dark ? "#2c2317" : "#fffdf6", pillFg: palette.TEXT, ring: palette.BORDER }
      : { bg: palette.TEXT, fg: palette.BG, pillBg: palette.SURFACE_ALT, pillFg: palette.TEXT, ring: palette.BORDER };

  return (
    <Box
      component="article"
      onClick={() => actions.onOpen(item.key)}
      sx={{
        display: "flex",
        gap: 1.25,
        p: 1.1,
        minHeight: 120,
        borderRadius: "22px",
        cursor: "pointer",
        background,
        border: highlight
          ? `2px solid ${GOLD}`
          : variant === "cover"
            ? `1px solid ${palette.BORDER}`
            : "1px solid transparent",
        boxShadow: highlight
          ? "0 10px 28px rgba(237,197,49,0.4)"
          : variant === "cover"
            ? "0 8px 22px rgba(0,0,0,0.06)"
            : "0 1px 2px rgba(0,0,0,0.04)",
        transition: "transform 160ms ease",
        "&:active": { transform: "scale(0.985)" },
        ...motionSafe,
      }}
    >
      <Box sx={{ position: "relative", flexShrink: 0, width: 108, height: 108 }}>
        <ItemImage
          item={item}
          sx={{
            width: 108,
            height: 108,
            borderRadius: "18px",
            bgcolor: palette.SURFACE_ALT,
            boxShadow: "0 8px 18px rgba(0,0,0,0.14)",
          }}
        />
        {off > 0 ? (
          <Box
            sx={{
              position: "absolute",
              bottom: 6,
              insetInlineEnd: -8,
              transform: "rotate(-12deg)",
              px: 0.8,
              py: 0.2,
              borderRadius: "8px",
              fontSize: 11,
              fontWeight: 900,
              bgcolor: variant === "showcase" ? GOLD : "#ef4444",
              color: variant === "showcase" ? GOLD_INK : "#fff",
              border: variant === "showcase" ? `1.5px dashed ${GOLD_DEEP}` : "none",
              boxShadow: "0 4px 10px rgba(0,0,0,0.18)",
            }}
          >
            {`٪${off}`}
          </Box>
        ) : null}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", py: 0.25 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 15.5, color: palette.TEXT, lineHeight: 1.4 }}>
          {item.name}
          {item.outOfStock ? <OutOfStockTag color={palette.MUTED} bg={palette.SURFACE_ALT} /> : null}
        </Typography>
        {item.description ? (
          <Typography
            sx={{
              mt: 0.3,
              fontSize: 11.5,
              lineHeight: 1.6,
              color: palette.MUTED,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.description}
          </Typography>
        ) : null}
        <Box sx={{ mt: "auto", pt: 0.75, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 1 }}>
          <Price item={item} color={palette.TEXT} muted={palette.MUTED} size={16} />
          <QtyControl
            name={item.name}
            quantity={actions.qtyOf(item.key)}
            outOfStock={item.outOfStock}
            onAdd={() => actions.onAdd(item.key)}
            onRemove={() => actions.onRemove(item.key)}
            tone={tone}
          />
        </Box>
      </Box>
    </Box>
  );
}

function twoColumns(compact?: boolean) {
  return compact ? "1fr" : { xs: "1fr", lg: "1fr 1fr" };
}

function ClassicLayout(props: ReservMenuLayoutProps) {
  const { t, formatNumber } = useReservI18n();
  const { palette, items, categories, selectedCategory, searchActive } = props;
  const featured = !searchActive ? pickReservOfferItem(items) : null;
  const rest = featured ? items.filter((item) => item.key !== featured.key) : items;
  const qtyTone: QtyTone = {
    bg: INK,
    fg: "#fff7f0",
    pillBg: palette.SURFACE_ALT,
    pillFg: palette.TEXT,
    ring: palette.BORDER,
  };

  return (
    <Box>
      {categories.length > 1 ? (
        <Box
          role="tablist"
          aria-label={t("categoriesAria")}
          sx={{
            display: "flex",
            gap: 0,
            overflowX: "auto",
            mb: 2,
            borderBottom: `1px solid ${palette.BORDER}`,
            opacity: searchActive ? 0.45 : 1,
            pointerEvents: searchActive ? "none" : "auto",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <Box
                key={cat.id}
                component="button"
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => props.onSelectCategory(cat.id)}
                sx={{
                  appearance: "none",
                  flexShrink: 0,
                  border: 0,
                  bgcolor: "transparent",
                  cursor: "pointer",
                  px: 1.5,
                  py: 1.1,
                  fontFamily: APP_FONT_FAMILY,
                  fontSize: 14,
                  fontWeight: active ? 900 : 600,
                  color: active ? INK : palette.MUTED,
                  borderBottom: active ? `2.5px solid ${INK}` : "2.5px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                {cat.name}
              </Box>
            );
          })}
        </Box>
      ) : null}

      {featured ? (
        <Box
          component="article"
          onClick={() => props.onOpen(featured.key)}
          sx={{
            position: "relative",
            mb: 2.5,
            overflow: "hidden",
            borderRadius: "6px",
            cursor: "pointer",
            minHeight: 210,
            bgcolor: palette.SURFACE_ALT,
          }}
        >
          <ItemImage
            item={featured}
            sx={{ width: "100%", height: 230, objectFit: "cover" }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(28,20,16,0.05) 30%, rgba(28,20,16,0.82) 100%)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              insetInline: 0,
              bottom: 0,
              p: 1.5,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: INK, letterSpacing: "0.12em", mb: 0.4 }}>
                {t("specialOffer")}
              </Typography>
              <Typography sx={{ fontWeight: 900, fontSize: 20, color: "#fff7f0", lineHeight: 1.35 }}>
                {featured.name}
              </Typography>
              <Typography sx={{ mt: 0.4, fontWeight: 800, fontSize: 15, color: "#fff7f0" }}>
                {t("amountToman", { amount: formatNumber(featured.price) })}
              </Typography>
            </Box>
            <QtyControl
              name={featured.name}
              quantity={props.qtyOf(featured.key)}
              outOfStock={featured.outOfStock}
              onAdd={() => props.onAdd(featured.key)}
              onRemove={() => props.onRemove(featured.key)}
              tone={qtyTone}
              size={36}
            />
          </Box>
        </Box>
      ) : null}

      {rest.length > 0 ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            mb: 1.25,
            color: palette.MUTED,
          }}
        >
          <Box sx={{ flex: 1, height: 1, bgcolor: palette.BORDER }} />
          <Typography sx={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.18em" }}>{t("menu")}</Typography>
          <Box sx={{ flex: 1, height: 1, bgcolor: palette.BORDER }} />
        </Box>
      ) : null}

      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {rest.map((item) => (
          <Box
            key={item.key}
            component="article"
            onClick={() => props.onOpen(item.key)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.1,
              py: 1.15,
              borderBottom: `1px dashed ${palette.BORDER}`,
              cursor: "pointer",
            }}
          >
            <ItemImage
              item={item}
              sx={{
                width: 58,
                height: 58,
                borderRadius: "50%",
                flexShrink: 0,
                bgcolor: palette.SURFACE_ALT,
                border: `2px solid ${palette.SURFACE}`,
                boxShadow: "0 2px 8px rgba(28,20,16,0.12)",
              }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 14.5, color: palette.TEXT, lineHeight: 1.4 }}>
                {item.name}
                {item.outOfStock ? <OutOfStockTag color={palette.MUTED} bg={palette.SURFACE_ALT} /> : null}
              </Typography>
              {item.description ? (
                <Typography
                  sx={{
                    fontSize: 11,
                    color: palette.MUTED,
                    display: "-webkit-box",
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {item.description}
                </Typography>
              ) : null}
            </Box>
            <Box
              sx={{
                flex: "0 1 28px",
                alignSelf: "center",
                borderBottom: `1px dotted ${palette.BORDER}`,
                minWidth: 12,
                height: 0,
                display: { xs: "none", sm: "block" },
              }}
            />
            <Box sx={{ textAlign: "end", flexShrink: 0 }}>
              <Price item={item} color={INK} muted={palette.MUTED} size={14} />
            </Box>
            <QtyControl
              name={item.name}
              quantity={props.qtyOf(item.key)}
              outOfStock={item.outOfStock}
              onAdd={() => props.onAdd(item.key)}
              onRemove={() => props.onRemove(item.key)}
              tone={qtyTone}
              size={30}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function ListLayout(props: ReservMenuLayoutProps) {
  const { t } = useReservI18n();
  const { palette, themeMode, items, categories, selectedCategory, searchActive } = props;
  const sections = buildSections(items, categories, selectedCategory, searchActive, t("otherItems"));
  return (
    <Box>
      <ThemeCategoryBar
        categories={categories}
        selectedId={selectedCategory}
        onSelect={props.onSelectCategory}
        variant="soft"
        palette={palette}
        dimmed={searchActive}
      />
      {sections.map((section) => (
        <Box key={section.id} component="section" sx={{ mb: 2.5 }}>
          <SectionTitle title={section.title} color={palette.TEXT} muted={palette.MUTED} align="start" accent={palette.TEXT} />
          <Box sx={{ display: "grid", gridTemplateColumns: twoColumns(props.compact), gap: 1.25 }}>
            {section.items.map((item) => (
              <HorizontalCard key={item.key} item={item} actions={props} palette={palette} mode={themeMode} variant="list" />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function ShowcaseToolbar({
  toolbar,
  palette,
}: {
  toolbar: ReservShowcaseToolbarProps;
  palette: ReservTheme;
}) {
  const { t, locale, setLocale } = useReservI18n();
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);
  const langOpen = Boolean(langAnchor);
  const btnSx = {
    width: "100%",
    minWidth: 0,
    height: 36,
    borderRadius: "10px",
    color: palette.TEXT,
    bgcolor: palette.SURFACE,
    border: `1px solid ${palette.BORDER}`,
    "&:hover": { bgcolor: palette.SURFACE_ALT },
  } as const;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.45, mb: 0.65 }}>
      {toolbar.onPager ? (
        <IconButton
          onClick={toolbar.onPager}
          disabled={toolbar.pagerBusy}
          aria-label={toolbar.pagerPending ? t("pagerWaiting") : t("pager")}
          title={toolbar.pagerPending ? t("pagerWaiting") : t("pager")}
          sx={{
            ...btnSx,
            color: toolbar.pagerPending ? "#92400e" : palette.TEXT,
            bgcolor: toolbar.pagerPending ? "rgba(245, 158, 11, 0.22)" : palette.SURFACE,
            border: toolbar.pagerPending ? "1px solid rgba(217, 119, 6, 0.45)" : `1px solid ${palette.BORDER}`,
          }}
        >
          <NotificationsActiveIcon sx={{ fontSize: 18 }} />
        </IconButton>
      ) : null}
      <IconButton onClick={toolbar.onLogin} aria-label={t("signInAria")} title={toolbar.guestLabel} sx={btnSx}>
        <PersonOutlineIcon sx={{ fontSize: 18 }} />
      </IconButton>
      {toolbar.showThemeToggle !== false ? (
        <IconButton
          onClick={toolbar.onToggleTheme}
          aria-label={toolbar.themeMode === "dark" ? t("themeLight") : t("themeDark")}
          title={toolbar.themeMode === "dark" ? t("themeLight") : t("themeDark")}
          sx={btnSx}
        >
          {toolbar.themeMode === "dark" ? <LightModeIcon sx={{ fontSize: 17 }} /> : <DarkModeIcon sx={{ fontSize: 17 }} />}
        </IconButton>
      ) : null}
      <IconButton onClick={toolbar.onCurrentOrders} aria-label={t("foodOrdersAria")} title={t("foodOrdersAria")} sx={btnSx}>
        <Badge
          badgeContent={toolbar.currentOrderCount}
          color="error"
          max={9}
          sx={{ "& .MuiBadge-badge": { fontSize: "0.5rem", minWidth: 12, height: 12 } }}
        >
          <RestaurantMenuIcon sx={{ fontSize: 17 }} />
        </Badge>
      </IconButton>
      {toolbar.showServiceShortcut && toolbar.onCurrentServices ? (
        <IconButton
          onClick={toolbar.onCurrentServices}
          aria-label={t("roomServicesAria")}
          title={t("roomServicesAria")}
          sx={btnSx}
        >
          <Badge
            badgeContent={toolbar.currentServiceCount || 0}
            color="error"
            max={9}
            sx={{ "& .MuiBadge-badge": { fontSize: "0.5rem", minWidth: 12, height: 12 } }}
          >
            <RoomServiceIcon sx={{ fontSize: 17 }} />
          </Badge>
        </IconButton>
      ) : null}
      <IconButton onClick={toolbar.onHistory} aria-label={t("pastOrdersAria")} title={t("pastOrdersAria")} sx={btnSx}>
        <HistoryIcon sx={{ fontSize: 17 }} />
      </IconButton>
      {toolbar.showLanguageSwitch ? (
        <>
          <IconButton
            onClick={(e) => setLangAnchor(e.currentTarget)}
            aria-label="Language"
            aria-haspopup="menu"
            aria-expanded={langOpen}
            title="Language"
            sx={btnSx}
          >
            <LanguageIcon sx={{ fontSize: 17 }} />
          </IconButton>
          <Menu
            anchorEl={langAnchor}
            open={langOpen}
            onClose={() => setLangAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            {RESERV_LOCALES.map((item) => (
              <MenuItem
                key={item.id}
                selected={locale === item.id}
                onClick={() => {
                  setLocale(item.id);
                  setLangAnchor(null);
                }}
                sx={{ fontFamily: APP_FONT_FAMILY, fontWeight: 700, fontSize: 13 }}
              >
                {t(item.id === "fa" ? "langFa" : item.id === "en" ? "langEn" : "langAr")}
              </MenuItem>
            ))}
          </Menu>
        </>
      ) : null}
    </Box>
  );
}

function ShowcaseSideRail({
  categories,
  selectedId,
  onSelect,
  dimmed,
  toolbar,
  palette,
}: {
  categories: CategoryChip[];
  selectedId: string;
  onSelect: (id: string) => void;
  dimmed?: boolean;
  toolbar?: ReservShowcaseToolbarProps | null;
  palette: ReservTheme;
}) {
  const { t } = useReservI18n();
  const hasCats = categories.length > 1;

  return (
    <Box
      sx={{
        width: "20%",
        flex: "0 0 20%",
        alignSelf: "stretch",
        maxHeight: "100%",
        overflowY: "auto",
        overscrollBehavior: "contain",
        display: "flex",
        flexDirection: "column",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {toolbar ? <ShowcaseToolbar toolbar={toolbar} palette={palette} /> : null}
      {hasCats ? (
        <Box
          role="tablist"
          aria-label={t("categoriesAria")}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.55,
            p: 0.5,
            borderRadius: "16px",
            background: GOLD_GRADIENT,
            boxShadow: "0 10px 26px rgba(201,166,26,0.32)",
            opacity: dimmed ? 0.45 : 1,
            pointerEvents: dimmed ? "none" : "auto",
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
                  appearance: "none",
                  cursor: "pointer",
                  width: "100%",
                  minHeight: 40,
                  px: 0.35,
                  py: 0.65,
                  border: "none",
                  borderRadius: "12px",
                  fontFamily: APP_FONT_FAMILY,
                  fontSize: 11,
                  fontWeight: active ? 800 : 600,
                  lineHeight: 1.35,
                  textAlign: "center",
                  color: active ? GOLD : GOLD_INK,
                  bgcolor: active ? GOLD_INK : "rgba(255,255,255,0.32)",
                  boxShadow: active ? "0 4px 10px rgba(43,33,22,0.28)" : "none",
                  wordBreak: "break-word",
                  transition: "background-color 160ms ease, color 160ms ease",
                  ...motionSafe,
                }}
              >
                {cat.name}
              </Box>
            );
          })}
        </Box>
      ) : null}
    </Box>
  );
}

function ShowcaseLayout(props: ReservMenuLayoutProps) {
  const { t } = useReservI18n();
  const { palette, themeMode, items, categories, selectedCategory, searchActive } = props;
  const sections = buildSections(items, categories, selectedCategory, searchActive, t("otherItems"));
  const discounted = !searchActive && selectedCategory === "all" ? items.filter((item) => discountPercent(item) > 0) : [];
  const all: Section[] = discounted.length
    ? [{ id: "__discount", title: t("discountedItems"), items: discounted }, ...sections]
    : sections;
  const compact = Boolean(props.compact);
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "stretch",
        gap: 1,
        overflow: "hidden",
        // ستون راست ثابت؛ فقط ستون کارت‌ها اسکرول می‌شود
        height: compact ? 560 : "calc(100dvh - 148px)",
        maxHeight: compact ? 560 : "calc(100dvh - 148px)",
        minHeight: compact ? 420 : 280,
      }}
    >
      <ShowcaseSideRail
        categories={categories}
        selectedId={selectedCategory}
        onSelect={props.onSelectCategory}
        dimmed={searchActive}
        toolbar={props.showcaseToolbar}
        palette={palette}
      />
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          height: "100%",
          overflowY: "auto",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "thin",
          pr: 0.25,
          pb: 1.5,
        }}
      >
        {all.map((section, sectionIndex) => (
          <Box key={section.id} component="section" sx={{ mb: 2.5 }}>
            {sectionIndex > 0 ? (
              <SectionTitle
                title={section.title}
                count={section.items.length}
                color={palette.TEXT}
                muted={palette.MUTED}
                accent={GOLD_GRADIENT}
              />
            ) : null}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
              {section.items.map((item, index) => (
                <HorizontalCard
                  key={`${section.id}-${item.key}`}
                  item={item}
                  actions={props}
                  palette={palette}
                  mode={themeMode}
                  variant="showcase"
                  highlight={section.id === "__discount" && index === 0}
                />
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function GridCard({
  item,
  actions,
  palette,
  mode,
}: {
  item: ReservMenuItem;
  actions: ItemActions;
  palette: ReservTheme;
  mode: ReservThemeMode;
}) {
  const off = discountPercent(item);
  return (
    <Box
      component="article"
      onClick={() => actions.onOpen(item.key)}
      sx={{
        display: "flex",
        flexDirection: "column",
        p: 0.9,
        borderRadius: "22px",
        cursor: "pointer",
        bgcolor: mode === "dark" ? "#1f1f22" : "#e6e6e9",
        transition: "transform 160ms ease",
        "&:active": { transform: "scale(0.98)" },
        ...motionSafe,
      }}
    >
      <Box sx={{ position: "relative" }}>
        <ItemImage
          item={item}
          sx={{
            width: "100%",
            aspectRatio: "1 / 1",
            height: "auto",
            borderRadius: "18px",
            bgcolor: palette.SURFACE_ALT,
          }}
        />
        {off > 0 ? (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              insetInlineStart: 8,
              px: 0.8,
              py: 0.15,
              borderRadius: "999px",
              bgcolor: "#ef4444",
              color: "#fff",
              fontSize: 11,
              fontWeight: 900,
            }}
          >
            {`٪${off}`}
          </Box>
        ) : null}
      </Box>
      <Box sx={{ px: 0.4, pt: 0.9, display: "flex", flexDirection: "column", flex: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 14, color: palette.TEXT, lineHeight: 1.45 }}>
          {item.name}
          {item.outOfStock ? <OutOfStockTag color={palette.MUTED} bg={palette.SURFACE} /> : null}
        </Typography>
        {item.description ? (
          <Typography
            sx={{
              mt: 0.25,
              fontSize: 11,
              lineHeight: 1.6,
              color: palette.MUTED,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.description}
          </Typography>
        ) : null}
        <Box sx={{ mt: "auto", pt: 0.9, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 0.5 }}>
          <Price item={item} color={palette.TEXT} muted={palette.MUTED} size={14} />
          <QtyControl
            name={item.name}
            quantity={actions.qtyOf(item.key)}
            outOfStock={item.outOfStock}
            onAdd={() => actions.onAdd(item.key)}
            onRemove={() => actions.onRemove(item.key)}
            tone={{ bg: palette.TEXT, fg: palette.BG, pillBg: palette.SURFACE, pillFg: palette.TEXT }}
            size={30}
          />
        </Box>
      </Box>
    </Box>
  );
}

function GridLayout(props: ReservMenuLayoutProps) {
  const { t } = useReservI18n();
  const { palette, themeMode, items, categories, selectedCategory, searchActive } = props;
  const sections = buildSections(items, categories, selectedCategory, searchActive, t("otherItems"));
  return (
    <Box>
      <ThemeCategoryBar
        categories={categories}
        selectedId={selectedCategory}
        onSelect={props.onSelectCategory}
        variant="soft"
        palette={palette}
        dimmed={searchActive}
      />
      {sections.map((section) => (
        <Box key={section.id} component="section" sx={{ mb: 2.75 }}>
          <SectionTitle title={section.title} color={palette.MUTED} muted={palette.MUTED} />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: props.compact
                ? "repeat(2, minmax(0, 1fr))"
                : { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
              gap: 1.1,
            }}
          >
            {section.items.map((item) => (
              <GridCard key={item.key} item={item} actions={props} palette={palette} mode={themeMode} />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function CategoryTiles({
  categories,
  selectedId,
  onSelect,
  palette,
  dimmed,
}: {
  categories: CategoryChip[];
  selectedId: string;
  onSelect: (id: string) => void;
  palette: ReservTheme;
  dimmed?: boolean;
}) {
  const { t } = useReservI18n();
  if (categories.length <= 1) return null;
  return (
    <Box
      role="tablist"
      aria-label={t("categoriesAria")}
      sx={{
        display: "flex",
        gap: 1.5,
        overflowX: "auto",
        pb: 1,
        mb: 1.5,
        opacity: dimmed ? 0.45 : 1,
        pointerEvents: dimmed ? "none" : "auto",
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
              all: "unset",
              cursor: "pointer",
              flexShrink: 0,
              width: 74,
              textAlign: "center",
              fontFamily: APP_FONT_FAMILY,
            }}
          >
            <Box
              sx={{
                width: 66,
                height: 66,
                mx: "auto",
                borderRadius: "50%",
                p: "3px",
                background: active ? "linear-gradient(135deg, #f59e0b, #ea580c)" : palette.BORDER,
                transition: "background 160ms ease",
              }}
            >
              {cat.image ? (
                <Box
                  component="img"
                  src={cat.image}
                  alt=""
                  loading="lazy"
                  sx={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", display: "block", border: `2px solid ${palette.BG}` }}
                />
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    border: `2px solid ${palette.BG}`,
                    bgcolor: palette.SURFACE,
                    color: palette.TEXT,
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                    fontSize: 20,
                  }}
                >
                  {cat.id === "all" ? "★" : cat.name.trim().slice(0, 1)}
                </Box>
              )}
            </Box>
            <Typography
              sx={{
                mt: 0.6,
                fontSize: 12,
                fontWeight: active ? 800 : 600,
                color: active ? palette.TEXT : palette.MUTED,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {cat.name}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function CoverLayout(props: ReservMenuLayoutProps) {
  const { t } = useReservI18n();
  const { palette, themeMode, items, categories, selectedCategory, searchActive } = props;
  const sections = buildSections(items, categories, selectedCategory, searchActive, t("otherItems"));
  return (
    <Box>
      <CategoryTiles
        categories={categories}
        selectedId={selectedCategory}
        onSelect={props.onSelectCategory}
        palette={palette}
        dimmed={searchActive}
      />
      {sections.map((section) => (
        <Box key={section.id} component="section" sx={{ mb: 2.5 }}>
          <SectionTitle
            title={section.title}
            color={palette.TEXT}
            muted={palette.MUTED}
            align="start"
            accent="linear-gradient(180deg, #f59e0b, #ea580c)"
          />
          <Box sx={{ display: "grid", gridTemplateColumns: twoColumns(props.compact), gap: 1.25 }}>
            {section.items.map((item) => (
              <HorizontalCard key={item.key} item={item} actions={props} palette={palette} mode={themeMode} variant="cover" />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function MotionCard({
  item,
  actions,
  index,
  fill,
}: {
  item: ReservMenuItem;
  actions: ItemActions;
  index: number;
  fill?: boolean;
}) {
  const off = discountPercent(item);
  const qty = actions.qtyOf(item.key);
  return (
    <Box
      component="article"
      onClick={() => actions.onOpen(item.key)}
      sx={{
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        borderRadius: "26px",
        aspectRatio: "3 / 4",
        width: fill ? "100%" : undefined,
        bgcolor: "#151528",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
        animation: "reservRise 560ms cubic-bezier(.2,.8,.2,1) both",
        animationDelay: `${Math.min(index, 8) * 70}ms`,
        transition: "transform 220ms ease",
        "&:hover": { transform: "translateY(-4px)" },
        "&:hover img": { transform: "scale(1.12)" },
        "@keyframes reservRise": {
          from: { opacity: 0, transform: "translateY(26px) scale(0.96)" },
          to: { opacity: 1, transform: "translateY(0) scale(1)" },
        },
        "@keyframes reservKen": {
          from: { transform: "scale(1)" },
          to: { transform: "scale(1.08)" },
        },
        "@keyframes reservPop": {
          "0%": { opacity: 0.9, transform: "scale(0.6)" },
          "100%": { opacity: 0, transform: "scale(1.6)" },
        },
        ...motionSafe,
      }}
    >
      <ItemImage
        item={item}
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          animation: "reservKen 12s ease-in-out infinite alternate",
          transition: "transform 600ms ease",
          ...motionSafe,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(7,7,18,0) 30%, rgba(7,7,18,0.55) 60%, rgba(7,7,18,0.95) 100%)",
        }}
      />
      {off > 0 ? (
        <Box
          sx={{
            position: "absolute",
            top: 12,
            insetInlineStart: 12,
            px: 1,
            py: 0.25,
            borderRadius: "999px",
            background: "linear-gradient(90deg, #f59e0b, #ef4444)",
            color: "#fff",
            fontSize: 11.5,
            fontWeight: 900,
            boxShadow: "0 6px 16px rgba(239,68,68,0.4)",
          }}
        >
          {`٪${off}`}
        </Box>
      ) : null}
      <Box sx={{ position: "absolute", top: 10, insetInlineEnd: 10 }}>
        {qty > 0 ? (
          <Box
            key={qty}
            sx={{
              position: "absolute",
              inset: 0,
              borderRadius: 999,
              border: "2px solid #f9a8d4",
              animation: "reservPop 520ms ease-out forwards",
              pointerEvents: "none",
              ...motionSafe,
            }}
          />
        ) : null}
        <QtyControl
          name={item.name}
          quantity={qty}
          outOfStock={item.outOfStock}
          onAdd={() => actions.onAdd(item.key)}
          onRemove={() => actions.onRemove(item.key)}
          tone={{
            bg: "linear-gradient(135deg, #7c3aed, #ec4899)",
            fg: "#fff",
            pillBg: "rgba(10,10,25,0.6)",
            pillFg: "#fff",
            ring: "rgba(255,255,255,0.18)",
            shadow: "0 8px 20px rgba(236,72,153,0.45)",
          }}
          size={34}
        />
      </Box>
      <Box sx={{ position: "absolute", insetInline: 0, bottom: 0, p: 1.5 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 15.5, color: "#fff", lineHeight: 1.4 }}>
          {item.name}
          {item.outOfStock ? <OutOfStockTag color="#fff" bg="rgba(255,255,255,0.18)" /> : null}
        </Typography>
        {item.description ? (
          <Typography
            sx={{
              mt: 0.2,
              fontSize: 11,
              color: "rgba(229,229,255,0.75)",
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.description}
          </Typography>
        ) : null}
        <Box sx={{ mt: 0.6 }}>
          <Price
            item={item}
            color="#fff"
            muted="rgba(229,229,255,0.7)"
            size={16}
            gradient="linear-gradient(90deg, #c4b5fd, #f9a8d4)"
          />
        </Box>
      </Box>
    </Box>
  );
}

function MotionLayout(props: ReservMenuLayoutProps) {
  const { t, formatNumber } = useReservI18n();
  const { palette, items, categories, selectedCategory, searchActive, compact } = props;
  const carousel = !searchActive && selectedCategory === "all";
  const sections = buildSections(items, categories, selectedCategory, searchActive, t("otherItems"));
  return (
    <Box>
      <ThemeCategoryBar
        categories={categories}
        selectedId={selectedCategory}
        onSelect={props.onSelectCategory}
        variant="neon"
        palette={palette}
        dimmed={searchActive}
      />
      {sections.map((section) => (
        <Box key={section.id} component="section" sx={{ mb: 3 }}>
          {section.title ? (
            <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 1.25 }}>
              <Typography
                component="h2"
                sx={{
                  fontWeight: 900,
                  fontSize: 20,
                  background: "linear-gradient(90deg, #ffffff, #c4b5fd)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {section.title}
              </Typography>
              <Typography sx={{ fontSize: 12, color: palette.MUTED }}>
                {t("itemsCount", { n: formatNumber(section.items.length) })}
              </Typography>
            </Box>
          ) : null}
          {carousel ? (
            <Box
              sx={{
                display: "flex",
                gap: 1.25,
                overflowX: "auto",
                scrollSnapType: "x mandatory",
                pb: 1.5,
                mx: compact ? -1.5 : { xs: -1.5, md: 0 },
                px: compact ? 1.5 : { xs: 1.5, md: 0 },
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {section.items.map((item, index) => (
                <Box
                  key={item.key}
                  sx={{ flex: "0 0 auto", width: compact ? 170 : { xs: "58%", sm: 220 }, scrollSnapAlign: "start" }}
                >
                  <MotionCard item={item} actions={props} index={index} fill />
                </Box>
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: compact
                  ? "repeat(2, minmax(0, 1fr))"
                  : { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" },
                gap: 1.25,
              }}
            >
              {section.items.map((item, index) => (
                <MotionCard key={item.key} item={item} actions={props} index={index} fill />
              ))}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}

function GlassCard({ item, actions }: { item: ReservMenuItem; actions: ItemActions }) {
  return (
    <Box
      component="article"
      onClick={() => actions.onOpen(item.key)}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        p: 1,
        borderRadius: "24px",
        cursor: "pointer",
        bgcolor: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(16px) saturate(140%)",
        WebkitBackdropFilter: "blur(16px) saturate(140%)",
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        transition: "background-color 160ms ease",
        "&:hover": { bgcolor: "rgba(255,255,255,0.16)" },
        ...motionSafe,
      }}
    >
      <ItemImage
        item={item}
        sx={{
          width: 84,
          height: 84,
          flexShrink: 0,
          borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.25)",
        }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 15, color: "#fff", lineHeight: 1.4, textShadow: "0 1px 6px rgba(0,0,0,0.35)" }}>
          {item.name}
          {item.outOfStock ? <OutOfStockTag color="#fff" bg="rgba(255,255,255,0.2)" /> : null}
        </Typography>
        {item.description ? (
          <Typography
            sx={{
              mt: 0.2,
              fontSize: 11.5,
              color: "rgba(255,255,255,0.78)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.description}
          </Typography>
        ) : null}
        <Box sx={{ mt: 0.6, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 1 }}>
          <Price item={item} color="#fff" muted="rgba(255,255,255,0.7)" size={15} />
          <QtyControl
            name={item.name}
            quantity={actions.qtyOf(item.key)}
            outOfStock={item.outOfStock}
            onAdd={() => actions.onAdd(item.key)}
            onRemove={() => actions.onRemove(item.key)}
            tone={{ bg: "#ffffff", fg: "#111", pillBg: "rgba(0,0,0,0.35)", pillFg: "#fff", ring: "rgba(255,255,255,0.25)" }}
          />
        </Box>
      </Box>
    </Box>
  );
}

function VideoLayout(props: ReservMenuLayoutProps) {
  const { t } = useReservI18n();
  const { palette, items, categories, selectedCategory, searchActive } = props;
  const sections = buildSections(items, categories, selectedCategory, searchActive, t("otherItems"));
  return (
    <Box>
      <ThemeCategoryBar
        categories={categories}
        selectedId={selectedCategory}
        onSelect={props.onSelectCategory}
        variant="glass"
        palette={palette}
        dimmed={searchActive}
      />
      {sections.map((section) => (
        <Box key={section.id} component="section" sx={{ mb: 2.75 }}>
          <SectionTitle title={section.title} color="#fff" muted="rgba(255,255,255,0.75)" shadow accent="rgba(255,255,255,0.85)" />
          <Box sx={{ display: "grid", gridTemplateColumns: twoColumns(props.compact), gap: 1.1 }}>
            {section.items.map((item) => (
              <GlassCard key={item.key} item={item} actions={props} />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export function ReservMenuLayout(props: ReservMenuLayoutProps) {
  switch (props.themeId) {
    case "classic":
      return <ClassicLayout {...props} />;
    case "list":
      return <ListLayout {...props} />;
    case "showcase":
      return <ShowcaseLayout {...props} />;
    case "grid":
      return <GridLayout {...props} />;
    case "cover":
      return <CoverLayout {...props} />;
    case "motion":
      return <MotionLayout {...props} />;
    case "video":
      return <VideoLayout {...props} />;
    default:
      return null;
  }
}

function AuroraBackdrop({ contained }: { contained?: boolean }) {
  const blob = (color: string, size: string, top: string, left: string, duration: number, delay = 0) => ({
    position: "absolute" as const,
    width: size,
    height: size,
    top,
    left,
    borderRadius: "50%",
    background: color,
    filter: "blur(70px)",
    opacity: 0.55,
    animation: `reservAurora ${duration}s ease-in-out ${delay}s infinite alternate`,
    ...motionSafe,
  });
  return (
    <Box
      aria-hidden
      sx={{
        position: contained ? "absolute" : "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
        bgcolor: "#070712",
        "@keyframes reservAurora": {
          "0%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(12%, 8%, 0) scale(1.15)" },
          "100%": { transform: "translate3d(-10%, 14%, 0) scale(0.95)" },
        },
      }}
    >
      <Box sx={blob("#7c3aed", "60vmax", "-20%", "-15%", 16)} />
      <Box sx={blob("#ec4899", "50vmax", "30%", "45%", 19, 2)} />
      <Box sx={blob("#0ea5e9", "45vmax", "65%", "-10%", 22, 4)} />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
    </Box>
  );
}

function MediaBackdrop({
  url,
  type,
  contained,
}: {
  url: string | null;
  type: ReservMenuBackgroundType | null;
  contained?: boolean;
}) {
  if (!url) return <AuroraBackdrop contained={contained} />;
  const mediaSx = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" } as const;
  return (
    <Box
      aria-hidden
      sx={{
        position: contained ? "absolute" : "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
        bgcolor: "#000",
      }}
    >
      {type === "image" ? (
        <Box component="img" src={url} alt="" sx={mediaSx} />
      ) : (
        <Box component="video" src={url} autoPlay muted loop playsInline preload="auto" sx={mediaSx} />
      )}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0.72) 100%)",
        }}
      />
    </Box>
  );
}

export function ReservThemeBackdrop({
  themeId,
  backgroundUrl,
  backgroundType,
  contained,
}: {
  themeId: ReservMenuThemeId;
  backgroundUrl?: string | null;
  backgroundType?: ReservMenuBackgroundType | null;
  contained?: boolean;
}) {
  if (themeId === "motion") return <AuroraBackdrop contained={contained} />;
  if (themeId === "video") {
    return <MediaBackdrop url={backgroundUrl || null} type={backgroundType || null} contained={contained} />;
  }
  return null;
}

export function ReservCoverHero({
  shopTitle,
  tableLabel,
  palette,
  coverImage,
  offer,
  onViewMenu,
  onOpenOffer,
  compact,
  topActions,
}: {
  shopTitle: string;
  tableLabel: string;
  palette: ReservTheme;
  coverImage: string | null;
  offer: ReservMenuItem | null;
  onViewMenu: () => void;
  onOpenOffer: (key: string) => void;
  compact?: boolean;
  topActions?: ReactNode;
}) {
  const { t, formatNumber } = useReservI18n();
  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        overflow: "hidden",
        minHeight: compact ? 600 : "100svh",
        display: "flex",
        flexDirection: "column",
        px: 2,
        pt: compact ? 2 : "max(16px, env(safe-area-inset-top))",
        pb: 2,
        color: "#fff",
        bgcolor: "#1c1917",
      }}
    >
      {coverImage ? (
        <Box
          component="img"
          src={coverImage}
          alt=""
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(4px) brightness(0.8)",
            transform: "scale(1.08)",
          }}
        />
      ) : null}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.35) 75%, ${palette.BG} 100%)`,
        }}
      />

      <Box sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
              fontSize: 18,
              color: "#1c1917",
              bgcolor: "#fff",
              boxShadow: "0 6px 18px rgba(0,0,0,0.3)",
              flexShrink: 0,
            }}
          >
            {shopTitle.trim().slice(0, 1) || "م"}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900, fontSize: 18, lineHeight: 1.3, textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}>
              {shopTitle}
            </Typography>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, opacity: 0.9 }}>
              <TableRestaurantIcon sx={{ fontSize: 14 }} />
              <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{tableLabel}</Typography>
            </Box>
          </Box>
        </Box>
        {topActions}
      </Box>

      <Box sx={{ position: "relative", mt: 3 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, opacity: 0.85 }}>{t("welcome")}</Typography>
        <Typography sx={{ fontSize: 26, fontWeight: 900, lineHeight: 1.35, textShadow: "0 2px 14px rgba(0,0,0,0.45)" }}>
          {shopTitle}
        </Typography>
      </Box>

      {offer ? (
        <Box
          component="button"
          type="button"
          onClick={() => onOpenOffer(offer.key)}
          sx={{
            all: "unset",
            position: "relative",
            mt: 2.5,
            cursor: "pointer",
            borderRadius: "26px",
            overflow: "hidden",
            minHeight: 150,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 2,
            background: "linear-gradient(135deg, #fb923c 0%, #f97316 45%, #ea580c 100%)",
            boxShadow: "0 18px 40px rgba(234,88,12,0.4)",
            fontFamily: APP_FONT_FAMILY,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 800, opacity: 0.9 }}>{t("specialOffer")}</Typography>
            <Typography sx={{ fontSize: 20, fontWeight: 900, lineHeight: 1.4, mt: 0.4 }}>{offer.name}</Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 800, mt: 0.75 }}>
              {t("amountToman", { amount: formatNumber(offer.price) })}
            </Typography>
          </Box>
          <Box
            component="img"
            src={offer.image}
            alt=""
            sx={{
              width: 112,
              height: 112,
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
              border: "4px solid rgba(255,255,255,0.85)",
              boxShadow: "0 12px 28px rgba(0,0,0,0.3)",
            }}
          />
        </Box>
      ) : null}

      <Box sx={{ flex: 1 }} />

      <Box
        component="button"
        type="button"
        onClick={onViewMenu}
        sx={{
          all: "unset",
          position: "relative",
          cursor: "pointer",
          alignSelf: "center",
          textAlign: "center",
          mt: 3,
          color: palette.TEXT,
          fontFamily: APP_FONT_FAMILY,
          "@keyframes reservBounce": {
            "0%, 100%": { transform: "translateY(0)" },
            "50%": { transform: "translateY(-8px)" },
          },
        }}
      >
        <KeyboardArrowUpRoundedIcon
          sx={{ fontSize: 34, display: "block", mx: "auto", animation: "reservBounce 1.6s ease-in-out infinite", ...motionSafe }}
        />
        <Typography sx={{ fontWeight: 900, fontSize: 18 }}>{t("viewMenu")}</Typography>
        <Typography sx={{ fontSize: 12, color: palette.MUTED }}>{t("viewMenuHint")}</Typography>
      </Box>
    </Box>
  );
}
