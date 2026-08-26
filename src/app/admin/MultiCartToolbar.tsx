"use client";

import { Box, Button, IconButton, Tooltip, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";

export const MAX_MULTI_CARTS = 4;

export type MultiCartToolbarProps = {
  cartCount: number;
  activeIndex: number;
  onSwitch: (index: number) => void;
  onAdd: () => void;
  onClearOrRemove: () => void;
  compact?: boolean;
  /** اگر false باشد عرض را پر نمی‌کند (مثلاً کنار فیلدهای هدر کلاسیک) */
  fullWidth?: boolean;
};

export default function MultiCartToolbar({
  cartCount,
  activeIndex,
  onSwitch,
  onAdd,
  onClearOrRemove,
  compact = false,
  fullWidth = true,
}: MultiCartToolbarProps) {
  const canAdd = cartCount < MAX_MULTI_CARTS;
  const tabMinWidth = compact ? 34 : 40;
  const tabHeight = compact ? 28 : 32;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: fullWidth ? "space-between" : "flex-start",
        gap: compact ? 0.75 : 1,
        width: fullWidth ? "100%" : "auto",
        flexShrink: 0,
        direction: "rtl",
        px: compact ? 0.75 : 1,
        py: compact ? 0.5 : 0.75,
        borderRadius: compact ? "6px" : "10px",
        border: "1px solid var(--admin-border)",
        bgcolor: "var(--admin-surface)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: compact ? 0.5 : 0.75, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: compact ? "10px" : "12px",
            fontWeight: 700,
            color: "var(--admin-text-muted)",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          سبد فعال
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
          {Array.from({ length: cartCount }, (_, index) => {
            const active = index === activeIndex;
            return (
              <Box
                key={index}
                component="button"
                type="button"
                onClick={() => onSwitch(index)}
                aria-label={`سبد ${index + 1}`}
                aria-pressed={active}
                title={`سبد ${index + 1}`}
                sx={{
                  minWidth: tabMinWidth,
                  height: tabHeight,
                  px: 0.75,
                  borderRadius: "6px",
                  border: active
                    ? "2px solid var(--admin-accent)"
                    : "1px solid var(--admin-border)",
                  bgcolor: active ? "var(--admin-accent)" : "var(--admin-surface-alt)",
                  color: active ? "#fff" : "var(--admin-text)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.35,
                  p: 0,
                  fontFamily: "inherit",
                  boxShadow: active ? "0 0 0 2px rgba(120, 181, 104, 0.25)" : "none",
                  transition: "background-color 120ms ease, border-color 120ms ease",
                  "&:hover": {
                    borderColor: "var(--admin-accent)",
                    bgcolor: active ? "var(--admin-accent-hover)" : "var(--admin-menu-hover)",
                  },
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    fontSize: compact ? "11px" : "12px",
                    fontWeight: 800,
                    lineHeight: 1,
                    color: "inherit",
                  }}
                >
                  {index + 1}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Tooltip title={canAdd ? "یک سبد فاکتور جدید بساز" : "حداکثر ۴ سبد مجاز است"}>
          <span>
            <Button
              size="small"
              variant="outlined"
              onClick={onAdd}
              disabled={!canAdd}
              startIcon={<AddIcon sx={{ fontSize: compact ? 14 : 16 }} />}
              aria-label="سبد جدید"
              sx={{
                flexShrink: 0,
                minHeight: tabHeight,
                px: compact ? 0.9 : 1.1,
                borderRadius: "6px",
                fontSize: compact ? "10px" : "11px",
                fontWeight: 700,
                textTransform: "none",
                whiteSpace: "nowrap",
                borderColor: canAdd ? "var(--admin-accent)" : "var(--admin-border)",
                color: canAdd ? "var(--admin-accent)" : "var(--admin-text-muted)",
                bgcolor: "var(--admin-surface)",
                boxShadow: "none",
                "& .MuiButton-startIcon": {
                  marginInlineEnd: 0.35,
                  marginInlineStart: 0,
                },
                "&:hover": {
                  borderColor: "var(--admin-accent)",
                  bgcolor: "rgba(120, 181, 104, 0.1)",
                  boxShadow: "none",
                },
                "&.Mui-disabled": {
                  borderColor: "var(--admin-border)",
                  color: "var(--admin-text-muted)",
                },
              }}
            >
              سبد جدید
            </Button>
          </span>
        </Tooltip>
      </Box>

      <Tooltip title={cartCount > 1 ? "حذف سبد فعال" : "پاک کردن سبد فعال"}>
        <span>
          <IconButton
            size="small"
            onClick={onClearOrRemove}
            aria-label={cartCount > 1 ? "حذف سبد فعال" : "پاک کردن سبد فعال"}
            sx={{
              p: compact ? 0.4 : 0.55,
              border: "1px solid var(--admin-border)",
              borderRadius: "6px",
              "&:hover": {
                borderColor: "#e57373",
                bgcolor: "rgba(229, 115, 115, 0.08)",
              },
            }}
          >
            <DeleteOutlineIcon sx={{ fontSize: compact ? 16 : 18, color: "#e57373" }} />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}
