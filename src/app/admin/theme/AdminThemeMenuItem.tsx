"use client";

import { Box, Switch, Typography } from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useAdminTheme } from "./useAdminTheme";

/** سوئیچ تم روشن/تیره در فوتر منوی همبرگر */
export default function AdminThemeMenuItem() {
  const { mode, setMode } = useAdminTheme();
  const isLight = mode === "light";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row-reverse",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        mx: 0.75,
        mb: 0.25,
        px: 1,
        py: 0.6,
        borderRadius: "8px",
        "&:hover": {
          backgroundColor: "var(--admin-menu-hover)",
        },
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Box sx={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 1, minWidth: 0, flex: 1 }}>
        {isLight ? (
          <LightModeIcon sx={{ color: "var(--admin-accent)", fontSize: 18, flexShrink: 0 }} />
        ) : (
          <DarkModeIcon sx={{ color: "var(--admin-accent)", fontSize: 18, flexShrink: 0 }} />
        )}
        <Typography
          sx={{
            color: "var(--admin-text)",
            fontSize: "12px",
            fontWeight: 600,
            textAlign: "right",
            flex: 1,
          }}
        >
          {isLight ? "حالت روشن" : "حالت تیره"}
        </Typography>
      </Box>
      <Switch
        size="small"
        checked={isLight}
        onChange={(_, checked) => setMode(checked ? "light" : "dark")}
        inputProps={{ "aria-label": "تغییر تم روشن و تیره" }}
        sx={{
          flexShrink: 0,
          "& .MuiSwitch-switchBase.Mui-checked": {
            color: "var(--admin-accent)",
          },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
            backgroundColor: "var(--admin-accent)",
          },
        }}
      />
    </Box>
  );
}
