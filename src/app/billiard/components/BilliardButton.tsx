"use client";

import type { ReactNode } from "react";
import Button, { type ButtonProps } from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "next/link";

export type BilliardButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type Props = Omit<ButtonProps, "variant" | "color" | "href"> & {
  variant?: BilliardButtonVariant;
  loading?: boolean;
  href?: string;
  children: ReactNode;
};

const baseSx = {
  gap: "8px",
  minHeight: 40,
  px: 2,
  py: 1,
  borderRadius: "10px",
  fontWeight: 600,
  fontSize: 13,
  textTransform: "none" as const,
  boxShadow: "none",
  fontFamily: "inherit",
  "& .MuiButton-startIcon": { margin: 0, marginInlineEnd: "8px" },
  "& .MuiButton-endIcon": { margin: 0, marginInlineStart: "8px" },
  "&.Mui-disabled": { opacity: 0.55 },
};

const variantSx: Record<BilliardButtonVariant, object> = {
  primary: {
    bgcolor: "var(--admin-accent, #7c3aed)",
    color: "var(--admin-on-accent, #fff)",
    backgroundImage: "linear-gradient(to left, #7c3aed, #c026d3)",
    "&:hover": {
      bgcolor: "var(--admin-accent-hover, #6d28d9)",
      backgroundImage: "linear-gradient(to left, #6d28d9, #a21caf)",
      boxShadow: "0 10px 24px -12px rgba(192, 38, 211, 0.55)",
    },
    "&.Mui-disabled": {
      bgcolor: "rgba(255,255,255,0.08)",
      color: "rgba(226,232,240,0.5)",
      backgroundImage: "none",
    },
  },
  secondary: {
    bgcolor: "rgba(255,255,255,0.05)",
    color: "#e2e8f0",
    border: "1px solid rgba(255,255,255,0.14)",
    "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
    "&.Mui-disabled": {
      bgcolor: "rgba(255,255,255,0.03)",
      color: "rgba(226,232,240,0.4)",
      borderColor: "rgba(255,255,255,0.08)",
    },
  },
  danger: {
    bgcolor: "var(--admin-action-delete, #dc2626)",
    color: "#fff",
    "&:hover": { bgcolor: "var(--admin-action-delete-hover, #b91c1c)" },
  },
  ghost: {
    bgcolor: "transparent",
    color: "#22d3ee",
    border: "1px solid transparent",
    "&:hover": { bgcolor: "rgba(34,211,238,0.08)", borderColor: "rgba(34,211,238,0.25)" },
  },
};

/**
 * دکمهٔ مشترک بیلیارد — الگوی حسابداری (MUI + لودینگ CircularProgress)
 */
export function BilliardButton({
  variant = "primary",
  loading = false,
  disabled,
  href,
  children,
  sx,
  type = "button",
  fullWidth,
  ...rest
}: Props) {
  const shared = {
    ...rest,
    type: href ? undefined : type,
    disabled: disabled || loading,
    fullWidth,
    disableElevation: true,
    sx: { ...baseSx, ...variantSx[variant], ...(sx as object) },
  };

  const content = loading ? (
    <CircularProgress size={18} color="inherit" thickness={5} />
  ) : (
    children
  );

  if (href) {
    return (
      <Button {...shared} component={Link} href={href}>
        {content}
      </Button>
    );
  }

  return <Button {...shared}>{content}</Button>;
}
