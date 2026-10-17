"use client";

import { useEffect, useState } from "react";
import { Box, IconButton } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Image from "next/image";
import { resolveMediaUrl, type StorefrontBanner } from "@/app/lib/onlineStorefront";

type Props = {
  banners: StorefrontBanner[];
  primaryColor?: string;
};

export default function HeroSlider({ banners, primaryColor = "#ef4056" }: Props) {
  const [index, setIndex] = useState(0);
  const slides = banners.filter((b) => b.image_url);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (!slides.length) return null;

  const current = slides[index % slides.length];
  const href = current.link?.trim() || undefined;

  const content = (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: { xs: "16/7", md: "21/7" },
        borderRadius: { xs: 0, md: "12px" },
        overflow: "hidden",
        bgcolor: "#eee",
      }}
    >
      <Image
        src={resolveMediaUrl(current.image_url)}
        alt={current.title || "بنر"}
        fill
        priority
        sizes="100vw"
        style={{ objectFit: "cover" }}
        unoptimized
      />
      {slides.length > 1 ? (
        <>
          <IconButton
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIndex((i) => (i - 1 + slides.length) % slides.length);
            }}
            sx={{
              position: "absolute",
              top: "50%",
              right: 8,
              transform: "translateY(-50%)",
              bgcolor: "rgba(255,255,255,0.85)",
              "&:hover": { bgcolor: "#fff" },
            }}
            size="small"
          >
            <ChevronRightIcon />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIndex((i) => (i + 1) % slides.length);
            }}
            sx={{
              position: "absolute",
              top: "50%",
              left: 8,
              transform: "translateY(-50%)",
              bgcolor: "rgba(255,255,255,0.85)",
              "&:hover": { bgcolor: "#fff" },
            }}
            size="small"
          >
            <ChevronLeftIcon />
          </IconButton>
          <Box
            sx={{
              position: "absolute",
              bottom: 10,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              gap: 0.75,
            }}
          >
            {slides.map((_, i) => (
              <Box
                key={i}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIndex(i);
                }}
                sx={{
                  width: i === index % slides.length ? 18 : 8,
                  height: 8,
                  borderRadius: 4,
                  bgcolor: i === index % slides.length ? primaryColor : "rgba(255,255,255,0.7)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              />
            ))}
          </Box>
        </>
      ) : null}
    </Box>
  );

  if (href) {
    return (
      <Box
        component="a"
        href={href}
        sx={{ display: "block", textDecoration: "none", color: "inherit" }}
      >
        {content}
      </Box>
    );
  }

  return content;
}
