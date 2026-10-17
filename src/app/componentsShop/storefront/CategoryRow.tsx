"use client";

import { Box, Typography, Skeleton } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  getActiveRootCategories,
  getCategoryBackgroundColor,
  getCategoryImageUrl,
  type ShopCategory,
} from "@/app/lib/shopCategories";
import { resolveMediaUrl } from "@/app/lib/onlineStorefront";

type Props = {
  categories: ShopCategory[];
  loading?: boolean;
  shopPath: (path?: string) => string;
  primaryColor?: string;
};

export default function CategoryRow({
  categories,
  loading,
  shopPath,
  primaryColor = "#ef4056",
}: Props) {
  const router = useRouter();
  const roots = getActiveRootCategories(categories);

  if (loading) {
    return (
      <Box sx={{ display: "flex", gap: 2, overflowX: "auto", py: 1, px: 0.5 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Box key={i} sx={{ minWidth: 72, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Skeleton variant="circular" width={64} height={64} />
            <Skeleton width={48} height={14} />
          </Box>
        ))}
      </Box>
    );
  }

  if (!roots.length) return null;

  return (
    <Box
      sx={{
        display: "flex",
        gap: { xs: 1.5, md: 2.5 },
        overflowX: "auto",
        py: 1,
        px: 0.5,
        scrollbarWidth: "thin",
        "&::-webkit-scrollbar": { height: 4 },
      }}
    >
      {roots.map((cat, index) => {
        const img = resolveMediaUrl(getCategoryImageUrl(cat) || "") || "";
        const fallbackBg = getCategoryBackgroundColor(cat, index);
        return (
          <Box
            key={cat.id}
            onClick={() => router.push(shopPath(`/category/${cat.id}`))}
            sx={{
              minWidth: 72,
              maxWidth: 88,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.75,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                border: `2px solid ${primaryColor}22`,
                overflow: "hidden",
                bgcolor: img ? "#f5f5f5" : fallbackBg,
                position: "relative",
                transition: "transform 0.2s, border-color 0.2s",
                "&:hover": { transform: "scale(1.05)", borderColor: primaryColor },
              }}
            >
              {img ? (
                <Image src={img} alt={cat.name} fill sizes="64px" style={{ objectFit: "cover" }} unoptimized />
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 800,
                    color: primaryColor,
                  }}
                >
                  {cat.name.charAt(0)}
                </Box>
              )}
            </Box>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 600,
                color: "#424750",
                textAlign: "center",
                lineHeight: 1.3,
                maxWidth: 80,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
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
