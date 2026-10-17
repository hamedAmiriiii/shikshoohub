"use client";

import { Box, Grid, Skeleton, Typography } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  getCategoryBackgroundColor,
  getCategoryImageUrl,
  getHomepageCategorySections,
  type ShopCategory,
} from "@/app/lib/shopCategories";
import { resolveMediaUrl } from "@/app/lib/onlineStorefront";

type Props = {
  categories: ShopCategory[];
  loading?: boolean;
  shopPath: (path?: string) => string;
};

export default function CategoryBanners({ categories, loading, shopPath }: Props) {
  const router = useRouter();
  const { banners, cards } = getHomepageCategorySections(categories);

  if (loading) {
    return (
      <Box>
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 2, md: 3 } }}>
          {[1, 2].map((key) => (
            <Grid item xs={12} md={6} key={key}>
              <Skeleton variant="rounded" sx={{ borderRadius: "20px", height: { xs: 200, md: 280 } }} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((key) => (
            <Grid item xs={6} md={3} key={key}>
              <Skeleton variant="rounded" sx={{ borderRadius: "16px", height: { xs: 120, md: 150 } }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (!banners.length && !cards.length) return null;

  const navigate = (id: number) => router.push(shopPath(`/category/${id}`));

  return (
    <Box>
      {banners.length > 0 ? (
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: cards.length ? { xs: 2, md: 3 } : 0 }}>
          {banners.map((category, index) => (
            <Grid item xs={12} md={6} key={category.id}>
              <Box
                onClick={() => navigate(category.id)}
                sx={{
                  position: "relative",
                  borderRadius: "20px",
                  overflow: "hidden",
                  cursor: "pointer",
                  bgcolor: getCategoryBackgroundColor(category, index),
                  height: { xs: 200, sm: 240, md: 280 },
                  transition: "transform 0.25s, box-shadow 0.25s",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  },
                }}
              >
                <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
                  <Image
                    src={resolveMediaUrl(getCategoryImageUrl(category))}
                    alt={category.name}
                    fill
                    sizes="(max-width:900px) 100vw, 50vw"
                    style={{ objectFit: "contain", padding: 16 }}
                    unoptimized
                  />
                  <Typography
                    sx={{
                      position: "absolute",
                      bottom: { xs: 12, md: 16 },
                      right: { xs: 16, md: 20 },
                      fontSize: { xs: 18, md: 22 },
                      fontWeight: 800,
                      color: "#fff",
                      textShadow: "0 2px 8px rgba(0,0,0,0.45)",
                    }}
                  >
                    {category.name}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      ) : null}

      {cards.length > 0 ? (
        <Grid container spacing={{ xs: 1.5, md: 2 }}>
          {cards.map((category, index) => (
            <Grid item xs={6} md={3} key={category.id}>
              <Box
                onClick={() => navigate(category.id)}
                sx={{
                  position: "relative",
                  borderRadius: "16px",
                  overflow: "hidden",
                  cursor: "pointer",
                  bgcolor: getCategoryBackgroundColor(category, index + 2),
                  height: { xs: 120, sm: 140, md: 160 },
                  transition: "transform 0.25s, box-shadow 0.25s",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                  },
                }}
              >
                <Image
                  src={resolveMediaUrl(getCategoryImageUrl(category))}
                  alt={category.name}
                  fill
                  sizes="(max-width:600px) 50vw, 25vw"
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
                <Typography
                  sx={{
                    position: "absolute",
                    bottom: { xs: 6, md: 8 },
                    right: { xs: 8, md: 10 },
                    fontSize: { xs: 13, md: 15 },
                    fontWeight: 800,
                    color: "#fff",
                    textShadow: "0 2px 6px rgba(0,0,0,0.55)",
                    lineHeight: 1.2,
                  }}
                >
                  {category.name}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      ) : null}
    </Box>
  );
}
