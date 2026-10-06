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
  ReservCategoryTabs,
  ReservProductCard,
  type CategoryChip,
} from "@/app/[shop]/reserv/[table]/ReservOrderingParts";
import { ReservI18nProvider } from "@/app/[shop]/reserv/[table]/reservI18n";

const FRAME_WIDTH = 360;

function sampleImage(emoji: string, from: string, to: string) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/></linearGradient></defs><rect width='240' height='240' fill='url(#g)'/><text x='50%' y='55%' font-size='112' text-anchor='middle' dominant-baseline='middle'>${emoji}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const SAMPLE_CATEGORIES: CategoryChip[] = [
  { id: "all", name: "همه", image: null },
  { id: "breakfast", name: "صبحانه", image: sampleImage("🥞", "#fde68a", "#f59e0b") },
  { id: "main", name: "غذای اصلی", image: sampleImage("🍝", "#fecaca", "#ef4444") },
  { id: "drink", name: "نوشیدنی", image: sampleImage("☕", "#d6d3d1", "#78716c") },
];

const SAMPLE_ITEMS: ReservMenuItem[] = [
  {
    key: "s1",
    name: "چیزکیک لیمو و بلوبری",
    description: "کیک پنیر خامه‌ای با سس بلوبری تازه",
    price: 595000,
    originalPrice: 700000,
    image: sampleImage("🍰", "#e0e7ff", "#a5b4fc"),
    categoryIds: ["breakfast"],
    outOfStock: false,
  },
  {
    key: "s2",
    name: "پنکیک عسل و کره",
    description: "سه لایه پنکیک گرم با عسل طبیعی",
    price: 420000,
    image: sampleImage("🥞", "#fef3c7", "#fbbf24"),
    categoryIds: ["breakfast"],
    outOfStock: false,
  },
  {
    key: "s3",
    name: "شریمپ ریزوتو",
    description: "میگو، ریزوتو، سس سیر و کره",
    price: 2700000,
    image: sampleImage("🍤", "#ffedd5", "#fb923c"),
    categoryIds: ["main"],
    outOfStock: false,
  },
  {
    key: "s4",
    name: "پاستا آلفردو",
    description: "پنه، مرغ گریل، سس قارچ و پارمزان",
    price: 1450000,
    originalPrice: 1650000,
    image: sampleImage("🍝", "#fee2e2", "#f87171"),
    categoryIds: ["main"],
    outOfStock: false,
  },
  {
    key: "s5",
    name: "ماچا لته",
    description: "شیر، چای ماچا، وانیل",
    price: 187000,
    image: sampleImage("🍵", "#dcfce7", "#4ade80"),
    categoryIds: ["drink"],
    outOfStock: false,
  },
  {
    key: "s6",
    name: "اسپرسو دبل",
    description: "۱۰۰٪ عربیکا",
    price: 145000,
    image: sampleImage("☕", "#e7e5e4", "#a8a29e"),
    categoryIds: ["drink"],
    outOfStock: true,
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
          shopTitle="کافه نمونه"
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
          py: 1.25,
          bgcolor: palette.HEADER_BG,
          borderBottom: `1px solid ${palette.BORDER}`,
          backdropFilter: "blur(12px)",
        }}
      >
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
          ک
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 15, color: palette.TEXT, lineHeight: 1.3 }}>کافه نمونه</Typography>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, color: palette.MUTED }}>
            <TableRestaurantIcon sx={{ fontSize: 13 }} />
            <Typography sx={{ fontSize: 11, fontWeight: 700 }}>میز ۴</Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{ position: "relative", zIndex: 1, px: 1.5, pt: 1.5, pb: 3 }}>
        {themeId === "classic" ? (
          <>
            <Box sx={{ mb: 1.5 }}>
              <ReservCategoryTabs
                categories={SAMPLE_CATEGORIES}
                selectedId={selectedCategory}
                onSelect={setSelectedCategory}
                theme={palette}
              />
            </Box>
            <Box sx={{ display: "grid", gap: 1.1 }}>
              {items.map((item) => (
                <ReservProductCard
                  key={item.key}
                  name={item.name}
                  description={item.description}
                  price={item.price}
                  image={item.image}
                  quantity={actions.qtyOf(item.key)}
                  outOfStock={item.outOfStock}
                  theme={palette}
                  onAdd={() => actions.onAdd(item.key)}
                  onRemove={() => actions.onRemove(item.key)}
                  onOpen={() => {}}
                />
              ))}
            </Box>
          </>
        ) : (
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
            {...actions}
          />
        )}
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
