"use client";

import List from "@/app/coponent/grid/Grid";
import { useResponsive } from "@/app/coponent/useResponsive";
import { Box } from "@mui/material";
import type { ComponentProps, ReactNode } from "react";
import CustomerCard from "./customerCard";

type ListProps = ComponentProps<typeof List>;

/**
 * لیست مشتریان — بدون تغییر رفتار Grid مشترک.
 * تمام‌عرض دسکتاپ با filterComponent={null}؛ کارت فقط موبایل (بدون ستون عملیات محصول).
 */
export default function CustomersList(props: Omit<ListProps, "filterComponent" | "CartComponent">) {
  const isMobile = useResponsive("down", "md");

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        "& > .MuiGrid-root > .MuiGrid-item": {
          flexBasis: { lg: "100% !important", xl: "100% !important" },
          maxWidth: { lg: "100% !important", xl: "100% !important" },
        },
      }}
    >
      <List
        {...props}
        filterComponent={null as unknown as ReactNode}
        CartComponent={
          isMobile
            ? (cardProps: { data: unknown }) => <CustomerCard props={cardProps} />
            : undefined
        }
      />
    </Box>
  );
}
