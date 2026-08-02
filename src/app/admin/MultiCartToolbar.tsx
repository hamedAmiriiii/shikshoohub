"use client";

import { Box, IconButton, Tooltip, Typography } from "@mui/material";
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
};

export default function MultiCartToolbar({
  cartCount,
  activeIndex,
  onSwitch,
  onAdd,
  onClearOrRemove,
  compact = false,
}: MultiCartToolbarProps) {
  const iconSize = compact ? 14 : 18;
  const tabSize = compact ? 22 : 28;
  const fontSize = compact ? "9px" : "12px";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: compact ? 0.5 : 1,
        width: "100%",
        direction: "ltr",
        px: compact ? 0.5 : 1,
        py: compact ? 0.4 : 0.75,
        borderRadius: compact ? "6px" : "10px",
        border: "1px solid var(--admin-border)",
        bgcolor: "var(--admin-surface)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: compact ? 0.25 : 0.5 }}>
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
              sx={{
                width: tabSize,
                height: tabSize,
                borderRadius: "6px",
                border: active
                  ? "1px solid var(--admin-accent)"
                  : "1px solid var(--admin-border)",
                bgcolor: active ? "var(--admin-accent)" : "var(--admin-surface-alt)",
                color: active ? "#fff" : "var(--admin-text)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                p: 0,
                minWidth: 0,
                fontFamily: "inherit",
                "&:hover": {
                  borderColor: "var(--admin-accent)",
                },
              }}
            >
              <Typography
                component="span"
                sx={{ fontSize, fontWeight: 700, lineHeight: 1, color: "inherit" }}
              >
                {index + 1}
              </Typography>
            </Box>
          );
        })}

        <Tooltip title={cartCount >= MAX_MULTI_CARTS ? "حداکثر ۴ سبد" : "سبد جدید"}>
          <span>
            <IconButton
              size="small"
              onClick={onAdd}
              disabled={cartCount >= MAX_MULTI_CARTS}
              aria-label="سبد جدید"
              sx={{ p: compact ? 0.25 : 0.5 }}
            >
              <AddIcon
                sx={{
                  fontSize: iconSize,
                  color:
                    cartCount >= MAX_MULTI_CARTS
                      ? "var(--admin-text-muted)"
                      : "var(--admin-accent)",
                }}
              />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Tooltip title={cartCount > 1 ? "حذف این سبد" : "پاک کردن سبد"}>
        <span>
          <IconButton
            size="small"
            onClick={onClearOrRemove}
            aria-label="پاک کردن سبد"
            sx={{ p: compact ? 0.25 : 0.5 }}
          >
            <DeleteOutlineIcon sx={{ fontSize: iconSize, color: "#e57373" }} />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}
