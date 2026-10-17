"use client";

import { Box, Grid, Skeleton } from "@mui/material";

export function HeroSkeleton() {
  return (
    <Skeleton
      variant="rounded"
      sx={{
        width: "100%",
        aspectRatio: { xs: "16/7", md: "21/7" },
        borderRadius: { xs: 0, md: "12px" },
      }}
    />
  );
}

export function CategoryRowSkeleton() {
  return (
    <Box sx={{ display: "flex", gap: 2, overflow: "hidden", py: 1 }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <Box key={i} sx={{ minWidth: 72, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
          <Skeleton variant="circular" width={64} height={64} />
          <Skeleton width={52} height={12} />
        </Box>
      ))}
    </Box>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <Grid container spacing={{ xs: 1.5, md: 2 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Grid item xs={6} sm={4} md={3} key={i}>
          <Skeleton variant="rounded" sx={{ aspectRatio: "1", borderRadius: "10px" }} />
          <Skeleton sx={{ mt: 1 }} height={16} />
          <Skeleton width="70%" height={14} sx={{ mt: 0.5 }} />
          <Skeleton width="50%" height={18} sx={{ mt: 1 }} />
        </Grid>
      ))}
    </Grid>
  );
}

export default function HomePageSkeleton() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 3 } }}>
      <HeroSkeleton />
      <CategoryRowSkeleton />
      <Skeleton variant="rounded" height={88} sx={{ borderRadius: "10px" }} />
      <Box>
        <Skeleton width={140} height={24} sx={{ mb: 1.5 }} />
        <Box sx={{ display: "flex", gap: 1.5, overflow: "hidden" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" width={160} height={240} sx={{ flexShrink: 0 }} />
          ))}
        </Box>
      </Box>
      <ProductGridSkeleton count={6} />
    </Box>
  );
}
