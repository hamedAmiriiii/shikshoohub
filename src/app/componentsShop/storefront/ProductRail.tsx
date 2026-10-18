"use client";

import { Box, Typography, Skeleton, IconButton } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useRef } from "react";
import type { ProductCardStyle } from "@/app/lib/onlineStorefront";
import ProductCard, { type ShopProduct } from "./ProductCard";

type Props = {
  title: string;
  products: ShopProduct[];
  loading?: boolean;
  shopPath: (path?: string) => string;
  primaryColor?: string;
  onCartChange?: () => void;
  cardStyle?: ProductCardStyle;
};

export default function ProductRail({
  title,
  products,
  loading,
  shopPath,
  primaryColor,
  onCartChange,
  cardStyle = "digikala",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * -280, behavior: "smooth" });
  };

  if (!loading && !products.length) return null;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <Typography sx={{ fontSize: { xs: 16, md: 18 }, fontWeight: 800, color: "#3f4064" }}>
          {title}
        </Typography>
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 0.5 }}>
          <IconButton size="small" onClick={() => scroll(1)} sx={{ border: "1px solid #e0e0e2" }}>
            <ChevronRightIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => scroll(-1)} sx={{ border: "1px solid #e0e0e2" }}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      <Box
        ref={ref}
        sx={{
          display: "flex",
          gap: 1.5,
          overflowX: "auto",
          pb: 1,
          scrollSnapType: "x mandatory",
          scrollbarWidth: "thin",
        }}
      >
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Box key={i} sx={{ minWidth: 160, width: 160, flexShrink: 0 }}>
                <Skeleton variant="rounded" height={160} />
                <Skeleton sx={{ mt: 1 }} height={18} />
                <Skeleton width="60%" height={16} />
              </Box>
            ))
          : products.map((p, i) => (
              <Box
                key={`${p.item_type || "p"}-${p.id}`}
                sx={{ minWidth: 160, width: { xs: 150, sm: 170 }, flexShrink: 0, scrollSnapAlign: "start" }}
              >
                <ProductCard
                  product={p}
                  shopPath={shopPath}
                  primaryColor={primaryColor}
                  onCartChange={onCartChange}
                  priority={i < 2}
                  compact
                  cardStyle={cardStyle}
                />
              </Box>
            ))}
      </Box>
    </Box>
  );
}
