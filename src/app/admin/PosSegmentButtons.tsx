"use client";

import { Box, Button } from "@mui/material";
import type { ReactNode } from "react";

type Option<T extends string> = {
  value: T;
  label: string;
  show?: boolean;
};

type Props<T extends string> = {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  dense?: boolean;
  columns?: number;
  /** عنوان و دکمه‌ها در یک ردیف افقی */
  inlineLabel?: ReactNode;
};

export default function PosSegmentButtons<T extends string>({
  value,
  options,
  onChange,
  dense,
  columns = 3,
  inlineLabel,
}: Props<T>) {
  const visible = options.filter((o) => o.show !== false);

  const buttons = (
    <Box
      sx={{
        display: inlineLabel ? "flex" : "grid",
        ...(inlineLabel
          ? {
              flex: "1 1 auto",
              flexWrap: "nowrap",
              gap: dense ? 0.4 : 0.5,
              minWidth: 0,
              overflowX: "auto",
            }
          : {
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gap: dense ? 0.5 : 0.75,
              width: "100%",
            }),
      }}
    >
      {visible.map((opt) => {
        const selected = value === opt.value;
        return (
          <Button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            sx={{
              flex: inlineLabel ? "1 1 0" : undefined,
              minWidth: inlineLabel ? (dense ? 44 : 52) : 0,
              px: dense ? 0.35 : inlineLabel ? 0.5 : 0.75,
              py: dense ? 0.45 : inlineLabel ? 0.55 : 0.85,
              fontSize: dense
                ? "9px"
                : inlineLabel
                  ? { xs: "10px", md: "11px" }
                  : { xs: "11px", md: "13px" },
              fontWeight: 700,
              lineHeight: 1.15,
              whiteSpace: "nowrap",
              borderRadius: dense || inlineLabel ? "8px" : "10px",
              border: selected
                ? "1px solid var(--admin-accent)"
                : "1px solid var(--admin-border)",
              bgcolor: selected ? "var(--admin-accent)" : "var(--admin-surface-alt)",
              color: selected ? "#fff" : "var(--admin-text)",
              boxShadow: selected ? "0 0 0 1px rgba(120, 181, 104, 0.35)" : "none",
              "&:hover": {
                bgcolor: selected ? "var(--admin-accent-hover)" : "var(--admin-menu-hover)",
                borderColor: "var(--admin-accent)",
              },
            }}
          >
            {opt.label}
          </Button>
        );
      })}
    </Box>
  );

  if (!inlineLabel) return buttons;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: dense ? 0.5 : 0.75,
        width: "100%",
        minWidth: 0,
      }}
    >
      <Box
        component="span"
        sx={{
          flexShrink: 0,
          color: "var(--admin-text)",
          fontSize: dense ? "9px" : { xs: "11px", md: "12px" },
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {inlineLabel}
      </Box>
      {buttons}
    </Box>
  );
}

export function PosFieldLabel({ children }: { children: ReactNode }) {
  return (
    <Box
      component="span"
      sx={{
        display: "block",
        color: "var(--admin-text)",
        fontSize: { xs: "12px", md: "13px" },
        fontWeight: 600,
        mb: 0.75,
      }}
    >
      {children}
    </Box>
  );
}
