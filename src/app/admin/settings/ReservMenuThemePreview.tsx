"use client";

import { useState } from "react";
import { Box, Typography } from "@mui/material";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import { APP_FONT_FAMILY } from "@/app/lib/appFont";
import type { ReservMenuBackgroundType, ReservMenuThemeId } from "@/app/lib/reservMenuThemes";
import {
  ReservCoverHero,
  ReservMenuLayout,
  ReservThemeBackdrop,
  pickReservCoverImage,
  pickReservOfferItem,
  reservPaletteFor,
  reservThemeForcedMode,
  type ReservMenuItem,
} from "@/app/[shop]/reserv/[table]/ReservMenuLayouts";
import {
  type CategoryChip,
} from "@/app/[shop]/reserv/[table]/ReservOrderingParts";
import { ReservI18nProvider } from "@/app/[shop]/reserv/[table]/reservI18n";

const FRAME_WIDTH = 360;

const SAMPLE_PHOTOS = [
  "/pic/menu-preview/1.webp",
  "/pic/menu-preview/2.webp",
  "/pic/menu-preview/3.webp",
  "/pic/menu-preview/4.webp",
  "/pic/menu-preview/5.webp",
] as const;

const SAMPLE_CATEGORIES: CategoryChip[] = [
  { id: "all", name: "همه", image: null },
  { id: "kebab", name: "کباب", image: SAMPLE_PHOTOS[1] },
  { id: "salad", name: "سالاد", image: SAMPLE_PHOTOS[4] },
];

const SAMPLE_ITEMS: ReservMenuItem[] = [
  {
    key: "s1",
    name: "چلو کباب مخلوط",
    description: "کباب برگ و جوجه، برنج ایرانی و زرشک",
    price: 595000,
    originalPrice: 700000,
    image: SAMPLE_PHOTOS[0],
    categoryIds: ["kebab"],
    outOfStock: false,
  },
  {
    key: "s2",
    name: "چلو برگ و کوبیده",
    description: "یک سیخ برگ، یک سیخ کوبیده، گوجه و لیمو",
    price: 480000,
    image: SAMPLE_PHOTOS[1],
    categoryIds: ["kebab"],
    outOfStock: false,
  },
  {
    key: "s3",
    name: "کوبیده روی نان",
    description: "دو سیخ کوبیده، نان سنگک، گوجه و فلفل کبابی",
    price: 420000,
    image: SAMPLE_PHOTOS[2],
    categoryIds: ["kebab"],
    outOfStock: false,
  },
  {
    key: "s4",
    name: "جوجه کباب مخصوص",
    description: "سینه مرغ زعفرانی با برنج و کره",
    price: 390000,
    originalPrice: 450000,
    image: SAMPLE_PHOTOS[3],
    categoryIds: ["kebab"],
    outOfStock: false,
  },
  {
    key: "s5",
    name: "سالاد فصل",
    description: "کاهو، ذرت، زیتون، گوجه گیلاسی و سس",
    price: 187000,
    image: SAMPLE_PHOTOS[4],
    categoryIds: ["salad"],
    outOfStock: false,
  },
];

export function ReservMenuThemePreview({
  themeId,
  backgroundUrl,
  backgroundType,
  scale = 0.5,
  height = 680,
  scrollable = false,
}: {
  themeId: ReservMenuThemeId;
  backgroundUrl?: string | null;
  backgroundType?: ReservMenuBackgroundType | null;
  scale?: number;
  height?: number;
  scrollable?: boolean;
}) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState("all");
  const mode = reservThemeForcedMode(themeId) ?? "light";
  const palette = reservPaletteFor(themeId, mode);
  const items =
    selectedCategory === "all"
      ? SAMPLE_ITEMS
      : SAMPLE_ITEMS.filter((item) => item.categoryIds.includes(selectedCategory));

  const actions = {
    qtyOf: (key: string) => qty[key] || 0,
    onAdd: (key: string) => setQty((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 })),
    onRemove: (key: string) => setQty((prev) => ({ ...prev, [key]: Math.max(0, (prev[key] || 0) - 1) })),
    onOpen: () => {},
  };

  const content = (
    <ReservI18nProvider>
    <Box
      sx={{
        position: "relative",
        width: FRAME_WIDTH,
        minHeight: height,
        direction: "rtl",
        overflow: "hidden",
        bgcolor: palette.BG,
        backgroundImage: palette.BG_GRADIENT,
        color: palette.TEXT,
        fontFamily: APP_FONT_FAMILY,
      }}
    >
      <ReservThemeBackdrop
        themeId={themeId}
        backgroundUrl={backgroundUrl}
        backgroundType={backgroundType}
        contained
      />
      {themeId === "cover" ? (
        <ReservCoverHero
          shopTitle="رستوران نمونه"
          tableLabel="میز ۴"
          palette={palette}
          coverImage={pickReservCoverImage(SAMPLE_ITEMS, SAMPLE_CATEGORIES)}
          offer={pickReservOfferItem(SAMPLE_ITEMS)}
          onViewMenu={() => {}}
          onOpenOffer={() => {}}
          compact
        />
      ) : null}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: themeId === "classic" ? 1.35 : 1.25,
          bgcolor: themeId === "classic" ? "#1c1410" : palette.HEADER_BG,
          borderBottom: themeId === "classic" ? "3px solid #c45c26" : `1px solid ${palette.BORDER}`,
          backdropFilter: themeId === "classic" ? "none" : "blur(12px)",
        }}
      >
        {themeId === "classic" ? (
          <Box sx={{ width: 4, alignSelf: "stretch", minHeight: 32, bgcolor: "#c45c26", borderRadius: 1 }} />
        ) : (
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "12px",
            display: "grid",
            placeItems: "center",
            fontWeight: 800,
            background: palette.CART_BAR_BG,
            color: palette.CART_BAR_TEXT,
          }}
        >
          ر
        </Box>
        )}
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: themeId === "classic" ? 16 : 15, color: themeId === "classic" ? "#f4ece4" : palette.TEXT, lineHeight: 1.3 }}>رستوران نمونه</Typography>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, color: themeId === "classic" ? "#c45c26" : palette.MUTED }}>
            <TableRestaurantIcon sx={{ fontSize: 13 }} />
            <Typography sx={{ fontSize: 11, fontWeight: 700 }}>میز ۴</Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{ position: "relative", zIndex: 1, px: 1.5, pt: 1.5, pb: 3 }}>
          <ReservMenuLayout
            themeId={themeId}
            items={items}
            categories={SAMPLE_CATEGORIES}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchActive={false}
            palette={palette}
            themeMode={mode}
            compact
            showcaseToolbar={
              themeId === "showcase"
                ? {
                    guestLabel: "ورود",
                    themeMode: mode,
                    currentOrderCount: 1,
                    showThemeToggle: true,
                    onLogin: () => {},
                    onToggleTheme: () => {},
                    onCurrentOrders: () => {},
                    onHistory: () => {},
                    onPager: () => {},
                  }
                : null
            }
            {...actions}
          />
      </Box>
    </Box>
    </ReservI18nProvider>
  );

  if (scrollable) {
    return (
      <Box
        sx={{
          width: FRAME_WIDTH,
          height,
          overflowY: "auto",
          borderRadius: "28px",
          border: "8px solid #111",
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          mx: "auto",
        }}
      >
        {content}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: FRAME_WIDTH * scale,
        height: height * scale,
        overflow: "hidden",
        borderRadius: "18px",
        border: "4px solid #111",
        mx: "auto",
        pointerEvents: "none",
        bgcolor: palette.BG,
      }}
    >
      <Box sx={{ position: "absolute", top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {content}
      </Box>
    </Box>
  );
}
